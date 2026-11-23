import { useBlockProps } from '@wordpress/block-editor';
import { Button, Spinner } from '@wordpress/components';
import { select, useSelect, useDispatch } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import PreviewErrorState, { PreviewErrorBoundary } from './preview-error';
import {
	getTileLayerPreflightUrls,
	useTileLayerPreflight,
} from './tile-preflight';
import { useRecordsByIds } from '../shared/rest-records';
import {
	applyComposedVisibilityFromSettings,
	handleEditorMapPreviewError,
	hasMapboxStyleLayers,
	useComposedPayloadPreviewStyle,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

export default function MapEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta =
		useSelect(
			( select ) =>
				select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
			[]
		) || {};
	const postId = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostId(),
		[]
	);
	const isSavingPost = useSelect(
		( select ) => select( 'core/editor' ).isSavingPost(),
		[]
	);
	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = useCallback(
		( meta ) => {
			const currentMeta =
				select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
			editPost( { meta: { ...currentMeta, ...meta } } );
		},
		[ editPost ]
	);

	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const mapRef = useRef( undefined );
	const mapLoadedRef = useRef( false );
	// RISK-01: per-source content tracking — an error from a JEO layer
	// source (source_{id}, see map-preview-layer.js) is fatal until that
	// source has produced real content, even when the base style loaded
	// first. After content, errors are incidental and the live map stays.
	const layerContentRef = useRef( new Set() );
	const [ previewError, setPreviewError ] = useState( null );
	const [ retryCount, setRetryCount ] = useState( 0 );

	// Bridge pan-limits to the sidebar (parent document) via parent window.
	useEffect( () => {
		const fn = () => {
			const { current: map } = mapRef;
			if ( map ) {
				const bounds = map.getBounds();
				const northEast = bounds.getNorthEast();
				const southWest = bounds.getSouthWest();
				setPostMeta( {
					pan_limits: {
						east: northEast.lng,
						north: northEast.lat,
						south: southWest.lat,
						west: southWest.lng,
					},
				} );
			}
		};
		try {
			window.parent.__jeoSetPanLimitsFromMap = fn;
			return () => {
				delete window.parent.__jeoSetPanLimitsFromMap;
			};
		} catch ( e ) {
			window.__jeoSetPanLimitsFromMap = fn;
			return () => {
				delete window.__jeoSetPanLimitsFromMap;
			};
		}
	}, [ setPostMeta ] );

	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

	const currentZoom = postMeta[ zoomState ];

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );
	const layerSettingsKey = useMemo(
		() => JSON.stringify( postMeta.layers || [] ),
		[ postMeta.layers ]
	);

	const {
		records: loadedLayers = [],
		isLoading: loadingLayers,
		hasResolved: hasResolvedLayers,
	} = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );
	const hasMapboxLayers = hasMapboxStyleLayers( loadedLayers );
	const composedPayload = useMemo(
		() => ( {
			scope: 'preview',
			kind: 'map-preview',
			postId,
			layers: postMeta.layers || [],
		} ),
		[ postId, layerSettingsKey ]
	);
	const composedPreview = useComposedPayloadPreviewStyle( {
		enabled: hasMapboxLayers,
		payload: composedPayload,
		refreshKey: `${ layerSettingsKey }:${
			isSavingPost ? 'saving' : 'idle'
		}:${ retryCount }`,
	} );

	// A failed composed-style load means the layer source failed: show the
	// error state in the preview area instead of the courtesy base map.
	useEffect( () => {
		if ( composedPreview.error ) {
			setPreviewError( composedPreview.error );
		}
	}, [ composedPreview.error ] );

	// New layer configuration (or a retry) means a new attempt: clear the
	// error state and let the map prove itself again.
	useEffect( () => {
		setPreviewError( null );
		mapLoadedRef.current = false;
		layerContentRef.current.clear();
	}, [ layerSettingsKey, retryCount ] );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	// R3-G1: tile-based direct layers (tilelayer/MVT) cannot rely on GL
	// error events alone (MapLibre swallows 404 tiles and errored tiles
	// still emit `sourcedata` content events). Preflight the concrete tile
	// URLs so a dead source becomes the error state, never a courtesy map.
	const tilePreflightUrls = useMemo(
		() =>
			useComposedPreview
				? []
				: loadedLayers.flatMap( ( record ) =>
						getTileLayerPreflightUrls( record?.meta || {} )
				  ),
		[ loadedLayers, useComposedPreview ]
	);
	const tilePreflight = useTileLayerPreflight( tilePreflightUrls, retryCount );
	useEffect( () => {
		if ( tilePreflight.error ) {
			setPreviewError( tilePreflight.error );
		}
	}, [ tilePreflight.error ] );
	const isPreparingLayerPreview = Boolean(
		layerIds.length > 0 && ( loadingLayers || ! hasResolvedLayers )
	);
	const isPreparingComposedPreview = Boolean(
		! isPreparingLayerPreview &&
			hasMapboxLayers &&
			! composedPreview.style &&
			! composedPreview.error
	);
	const shouldRenderMap =
		! isPreparingLayerPreview &&
		! isPreparingComposedPreview &&
		! previewError &&
		! tilePreflight.checking;
	const transformRequest = useEditorMapboxTransformRequest( loadedLayers );

	const applyComposedVisibility = useCallback( () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSettings(
				mapRef.current,
				composedPreview.manifest,
				postMeta.layers || []
			);
		}
	}, [ composedPreview.manifest, postMeta.layers, useComposedPreview ] );

	useEffect( () => {
		applyComposedVisibility();
	}, [ applyComposedVisibility, layerSettingsKey ] );

	const buttonStyle = ( selected ) => ( {
		color: selected ? '#fff' : '#000',
		backgroundColor: selected ? '#007cba' : '#fff',
		border: 0,
	} );

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
				{ /* Zoom controls switch the zoom target of the live map —
				     with no map rendered (error state) they are inert, so they
				     are hidden instead of floating over the error panel
				     (Gate 2 — G3 UI). */ }
				{ ! previewError && (
				<div className="zoom-buttons-div">
					<div
						className="button-group-div"
						role="group"
						aria-label={ __( 'Preview zoom controls', 'jeowp' ) }
					>
						<Button
							style={ buttonStyle(
								zoomState === 'initial_zoom'
							) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => setZoomState( 'initial_zoom' ) }
						>
							{ __( 'Initial Zoom', 'jeowp' ) }
						</Button>
						<Button
							style={ buttonStyle( zoomState === 'min_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => {
								if ( postMeta.min_zoom <= 0 ) {
									setPostMeta( { min_zoom: 0.1 } );
								}
								setZoomState( 'min_zoom' );
							} }
						>
							{ __( 'Min Zoom', 'jeowp' ) }
						</Button>
						<Button
							style={ buttonStyle( zoomState === 'max_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => {
								if ( postMeta.max_zoom <= 0 ) {
									setPostMeta( { max_zoom: 0.1 } );
								}
								setZoomState( 'max_zoom' );
							} }
						>
							{ __( 'Max Zoom', 'jeowp' ) }
						</Button>
					</div>
				</div>
				) }
				{ previewError && (
					<PreviewErrorState
						error={ previewError }
						onRetry={ () =>
							setRetryCount( ( count ) => count + 1 )
						}
					/>
				) }
				{ ! previewError && ! shouldRenderMap && <Spinner /> }
				{ shouldRenderMap && (
					<PreviewErrorBoundary
						onCatch={ ( error ) => setPreviewError( error ) }
					>
					<Map
						key={ `${ zoomState }:${ layerSettingsKey }:${
							composedPreview.metadata?.hash || 'default'
						}:${ retryCount }` }
						ref={ mapRef }
						mapStyle={
							useComposedPreview
								? composedPreview.style
								: undefined
						}
						style={ { height: '500px', width: '100%' } }
						transformRequest={ transformRequest }
						latitude={ centerLat || 0 }
						longitude={ centerLon || 0 }
						zoom={ currentZoom || initialZoom || 11 }
						onLoad={ () => {
							mapLoadedRef.current = true;
						} }
						onSourceData={ ( event ) => {
							if (
								event?.sourceId &&
								event.sourceDataType === 'content'
							) {
								layerContentRef.current.add( event.sourceId );
							}
						} }
						onError={ ( error ) => {
							handleEditorMapPreviewError( error );
							// After the first successful load, errors are incidental
							// (e.g. a single failing tile); before it, the source
							// itself failed — replace the preview with the error state.
							// Errors from a JEO layer source stay fatal until that
							// source has produced content, even when the base style
							// loaded first (RISK-01 — no courtesy map).
							const sourceId =
								error?.sourceId ?? error?.error?.sourceId;
							const isJeoLayerSource =
								typeof sourceId === 'string' &&
								sourceId.startsWith( 'source_' );
							if (
								isJeoLayerSource
									? ! layerContentRef.current.has( sourceId )
									: ! mapLoadedRef.current
							) {
								setPreviewError( error?.error || error );
							}
						} }
						onStyleData={ applyComposedVisibility }
						onMove={ ( { viewState } ) => {
							setPostMeta( {
								center_lat: viewState.latitude,
								center_lon: viewState.longitude,
							} );
						} }
						onZoom={ ( { viewState } ) => {
							const zoom = Math.round( viewState.zoom * 10 ) / 10;
							setPostMeta( { [ zoomState ]: zoom } );
						} }
					>
						{ ! useComposedPreview &&
							loadedLayers &&
							( postMeta.layers || [] ).map( ( layer ) => {
								const layerOptions = loadedLayers.find(
									( { id } ) => id === layer.id
								);
								if ( layerOptions ) {
									return renderLayer( {
										layer: layerOptions.meta,
										instance: layer,
									} );
								}
							} ) }
					</Map>
					</PreviewErrorBoundary>
				) }
			</div>
		</div>
	);
}
