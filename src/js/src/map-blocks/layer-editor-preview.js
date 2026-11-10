import { useBlockProps } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useDebounce } from 'use-debounce';

import { Map } from '../lib/mapgl-react';
import { MemoizedRenderLayer } from './map-preview-layer';
import PreviewErrorState, { buildPreviewErrorInfo } from './preview-error';
import { isStyleLayerType } from '../shared/style-layer-types';
import { validateLayerFormData } from '../layers-sidebar/form-validation';
import {
	getMapboxStyleUrl,
	handleEditorMapPreviewError,
	useMapboxStylePreview,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';
import { getStyleJsonStyle } from './use-style-layer';
import { __ } from '@wordpress/i18n';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

// The editor preview renders the layer with `instance: { id: 1 }`, so its GL
// source id is deterministic (see map-preview-layer.js).
const LAYER_PREVIEW_SOURCE_ID = 'source_1';

function getInlineStyleJsonError( options = {} ) {
	const raw = ( options.inline_style || '' ).trim();
	if ( ! raw ) {
		return null;
	}

	try {
		const parsed = JSON.parse( raw );
		return parsed && typeof parsed === 'object' ? null : 'not-object';
	} catch ( error ) {
		return error;
	}
}

export default function LayerEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect(
		( select ) => select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		[]
	);
	const [ viewState, setViewState ] = useState( {
		latitude: mapDefaults.center_lat,
		longitude: mapDefaults.center_lon,
		zoom: mapDefaults.initial_zoom,
	} );

	// Single source of truth for "the form is incomplete" — derived from the
	// post meta and the layer type schema only (never from render success).
	// The publish lock/notice lives in the layers-sidebar plugin so it also
	// applies while this block is not mounted (e.g. before the first save).
	const formValidation = useMemo(
		() => validateLayerFormData( postMeta || {} ),
		[ postMeta ]
	);

	const loadedRef = useRef( false );
	// RISK-01: only set once the layer's own source has produced real
	// content. Errors from the layer source are fatal until then — the base
	// style loading first must not turn a dead source into a courtesy map.
	const layerContentRef = useRef( false );
	const [ key, setKey ] = useState( 0 );
	const [ retryCount, setRetryCount ] = useState( 0 );
	const [ previewError, setPreviewError ] = useState( null );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );
	const prevPostMeta = useRef( {} );

	const isStyleType = isStyleLayerType( debouncedPostMeta?.type );
	const mapboxStyleUrl =
		debouncedPostMeta?.type === 'mapbox' && formValidation.complete
			? getMapboxStyleUrl( debouncedPostMeta.layer_type_options )
			: null;
	const styleJsonStyle =
		debouncedPostMeta?.type === 'style-json' && formValidation.complete
			? getStyleJsonStyle( debouncedPostMeta.layer_type_options )
			: null;
	const inlineStyleError = useMemo(
		() =>
			debouncedPostMeta?.type === 'style-json' && formValidation.complete
				? getInlineStyleJsonError(
						debouncedPostMeta.layer_type_options
				  )
				: null,
		[ debouncedPostMeta, formValidation.complete ]
	);
	const mapboxStylePreview = useMapboxStylePreview(
		mapboxStyleUrl,
		retryCount
	);
	const transformRequest = useEditorMapboxTransformRequest( [
		{ meta: debouncedPostMeta },
	] );

	// Surface style fetch failures as the error state — never fall back to
	// the default base map ("courtesy map") when the source failed.
	useEffect( () => {
		if ( mapboxStylePreview.error ) {
			setPreviewError( {
				error: mapboxStylePreview.error,
				kind: 'style',
			} );
		}
	}, [ mapboxStylePreview.error ] );

	useEffect( () => {
		if ( inlineStyleError ) {
			setPreviewError( {
				info: buildPreviewErrorInfo(
					__(
						'The preview could not be loaded: the inline style is not valid JSON.',
						'jeowp'
					),
					inlineStyleError === 'not-object'
						? __(
								'The inline style must be a JSON object.',
								'jeowp'
						  )
						: String(
								inlineStyleError?.message || inlineStyleError
						  )
				),
				kind: 'style',
			} );
		}
	}, [ inlineStyleError ] );

	// New form data means a new attempt: clear the error state.
	useEffect( () => {
		setPreviewError( null );
		loadedRef.current = false;
		layerContentRef.current = false;
	}, [
		debouncedPostMeta.layer_type_options,
		debouncedPostMeta.type,
		retryCount,
	] );

	useEffect( () => {
		if ( mapboxStylePreview.viewState ) {
			setViewState( ( currentViewState ) => ( {
				...currentViewState,
				...mapboxStylePreview.viewState,
			} ) );
		}
	}, [ mapboxStylePreview.viewState ] );

	// Bump the map key when the (debounced) options actually change, so the
	// preview re-renders the new configuration.
	useEffect( () => {
		const opts = debouncedPostMeta.layer_type_options || {};
		const prevOpts = prevPostMeta.current.layer_type_options;
		if ( JSON.stringify( opts ) !== JSON.stringify( prevOpts ) ) {
			setKey( ( prev ) => prev + 1 );
		}
		prevPostMeta.current = debouncedPostMeta;
	}, [ debouncedPostMeta.layer_type_options ] );

	const retry = useCallback( () => {
		setPreviewError( null );
		loadedRef.current = false;
		layerContentRef.current = false;
		setRetryCount( ( count ) => count + 1 );
		setKey( ( prev ) => prev + 1 );
	}, [] );

	const shouldRenderMap =
		formValidation.complete &&
		! previewError &&
		( ! isStyleType ||
			Boolean( mapboxStylePreview.style ) ||
			Boolean( styleJsonStyle ) );
	const isPreparingPreview =
		formValidation.complete &&
		! previewError &&
		isStyleType &&
		! mapboxStylePreview.style &&
		! styleJsonStyle &&
		! mapboxStylePreview.error &&
		! inlineStyleError;

	// Stop mouse events from propagating to the block editor's selection
	// handler so the map remains draggable inside the block.
	const stopPropagation = useCallback( ( e ) => e.stopPropagation(), [] );

	return (
		<div { ...blockProps }>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div
				className="jeo-preview-area"
				onPointerDown={ stopPropagation }
				onMouseDown={ stopPropagation }
				onTouchStart={ stopPropagation }
			>
				{ previewError && (
					<PreviewErrorState
						error={ previewError.error }
						info={ previewError.info }
						kind={ previewError.kind }
						onRetry={ retry }
					/>
				) }
				{ ! formValidation.complete && (
					<div className="jeo-preview-error jeo-preview-error--idle">
						<p className="jeo-preview-error__message">
							{ __(
								'Fill the required fields to load the layer preview.',
								'jeowp'
							) }
						</p>
					</div>
				) }
				{ isPreparingPreview && <Spinner /> }
				{ shouldRenderMap && (
					<Map
						key={ `${ key }:${
							mapboxStyleUrl || styleJsonStyle || 'default'
						}` }
						mapStyle={
							mapboxStylePreview.style ||
							styleJsonStyle ||
							undefined
						}
						transformRequest={ transformRequest }
						onError={ ( error ) => {
							handleEditorMapPreviewError( error );
							// A failure of the layer's own source is fatal until
							// that source has produced real content — even when the
							// base style loaded first (RISK-01). After content,
							// errors (e.g. a single failing tile while panning) are
							// incidental and the live map stays. For style types the
							// base style IS the layer: any pre-load error is fatal.
							const sourceId =
								error?.sourceId ?? error?.error?.sourceId;
							const isLayerSourceFailure =
								! isStyleType &&
								sourceId === LAYER_PREVIEW_SOURCE_ID;
							if (
								isLayerSourceFailure
									? ! layerContentRef.current
									: ! loadedRef.current
							) {
								setPreviewError( {
									error: error?.error || error,
									kind: isStyleType ? 'style' : 'source',
								} );
							}
						} }
						onSourceData={ ( event ) => {
							// Style types: the base style is the layer itself.
							if ( isStyleType ) {
								loadedRef.current = true;
								return;
							}
							// Non-style layers: only the layer's own source marks
							// the preview as loaded — base style events must not
							// shield a dead source (RISK-01).
							if ( event?.sourceId === LAYER_PREVIEW_SOURCE_ID ) {
								loadedRef.current = true;
								if ( event.sourceDataType === 'content' ) {
									layerContentRef.current = true;
								}
							}
						} }
						style={ { height: '500px', width: '100%' } }
						latitude={ viewState.latitude || 0 }
						longitude={ viewState.longitude || 0 }
						zoom={ viewState.zoom || 0 }
						onMove={ ( { viewState } ) => {
							setViewState( {
								latitude: viewState.latitude,
								longitude: viewState.longitude,
								zoom: Math.round( viewState.zoom * 10 ) / 10,
							} );
						} }
					>
						{ formValidation.complete && ! isStyleType && (
							<MemoizedRenderLayer
								layer={ debouncedPostMeta }
								instance={ { id: 1, use: 'fixed' } }
							/>
						) }
					</Map>
				) }
			</div>
		</div>
	);
}
