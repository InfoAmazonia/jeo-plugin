import { useBlockProps } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { useDebounce } from 'use-debounce';

import { Map } from '../lib/mapgl-react';
import { MemoizedRenderLayer } from './map-preview-layer';
import { getEditorLayerTypeSchema } from '../layers-sidebar/layer-type-definitions';
import {
	getMapboxStyleUrl,
	handleEditorMapPreviewError,
	useMapboxStylePreview,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lon,
	min_zoom: 0,
	max_zoom: 20,
};

const NOTICE_ID = 'layer_notices';

export default function LayerEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [] );
	const [ viewState, setViewState ] = useState( {
		latitude: mapDefaults.center_lat,
		longitude: mapDefaults.center_lon,
		zoom: mapDefaults.initial_zoom,
	} );

	const loadedRef = useRef( false );
	const [ renderControl, setRenderControl ] = useState( { status: 'incomplete_form' } );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );
	const prevPostMeta = useRef( {} );
	const mapboxStyleUrl =
		debouncedPostMeta?.type === 'mapbox' &&
		[ 'ready', 'loaded' ].includes( renderControl.status )
			? getMapboxStyleUrl( debouncedPostMeta.layer_type_options )
			: null;
	const mapboxStylePreview = useMapboxStylePreview( mapboxStyleUrl );
	const transformRequest = useEditorMapboxTransformRequest( [
		{ meta: debouncedPostMeta },
	] );
	const shouldRenderMap =
		debouncedPostMeta?.type !== 'mapbox' ||
		Boolean( mapboxStylePreview.style ) ||
		Boolean( mapboxStylePreview.error );

	useEffect( () => {
		if ( mapboxStylePreview.viewState ) {
			setViewState( ( currentViewState ) => ( {
				...currentViewState,
				...mapboxStylePreview.viewState,
			} ) );
		}
	}, [ mapboxStylePreview.viewState ] );

	const { createNotice, removeNotice } = useDispatch( 'core/notices' );
	const {
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( 'core/editor' );

	useEffect( () => {
		switch ( renderControl.status ) {
			case 'incomplete_form':
				createNotice(
					'warning',
					__( 'Please fill all required fields, you will not be able to publish or update until that.', 'jeowp' ),
					{ id: NOTICE_ID, isDismissible: false }
				);
				lockPostSaving( 'layer_lock_key' );
				lockPostAutosaving( 'layer_lock_key' );
				break;
			case 'request_error':
				switch ( renderControl.statusCode ) {
					case 401:
						createNotice(
							'error',
							__( 'Your Mapbox access token may be invalid. You will not be able to publish or update. Please check your settings.', 'jeowp' ),
							{ id: NOTICE_ID, isDismissible: false }
						);
						break;
					case 404:
						createNotice(
							'error',
							__( 'Your layer was not found. You will not be able to publish or update. Please check your settings.', 'jeowp' ),
							{ id: NOTICE_ID, isDismissible: false }
						);
						break;
					default:
						createNotice(
							'error',
							__( 'Error loading your layer, you will not be able to publish or update. Please check your settings.', 'jeowp' ),
							{ id: NOTICE_ID, isDismissible: false }
						);
						break;
				}
				lockPostSaving( 'layer_lock_key' );
				lockPostAutosaving( 'layer_lock_key' );
				break;
			case 'ready':
			case 'loaded':
				removeNotice( NOTICE_ID );
				unlockPostSaving( 'layer_lock_key' );
				unlockPostAutosaving( 'layer_lock_key' );
				break;
		}
	}, [ renderControl.status ] );

	useEffect( () => {
		if ( ! postMeta.type ) {
			return;
		}
		const schema = getEditorLayerTypeSchema( postMeta );
		if ( ! schema || ! schema.properties ) {
			return;
		}

		const opts = debouncedPostMeta.layer_type_options || {};
		const prevOpts = prevPostMeta.current.layer_type_options;
		const optionsKeys = Object.keys( schema.properties );
		let anyEmpty = false;

		optionsKeys.some( ( k ) => {
			const val = opts[ k ];
			if (
				( val === undefined || val === null || val === '' ) &&
				schema.required?.includes( k )
			) {
				anyEmpty = true;
				setRenderControl( { status: 'incomplete_form' } );
				return true;
			}
			return false;
		} );

		if ( ! anyEmpty && JSON.stringify( opts ) !== JSON.stringify( prevOpts ) ) {
			loadedRef.current = false;
			setRenderControl( { status: 'ready' } );
		}
		prevPostMeta.current = debouncedPostMeta;
	}, [ debouncedPostMeta.layer_type_options, postMeta.type ] );

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
				{ ! shouldRenderMap && <Spinner /> }
				{ shouldRenderMap && (
					<Map
						key={ `${ key }:${ mapboxStyleUrl || 'default' }` }
						mapStyle={ mapboxStylePreview.style || undefined }
						transformRequest={ transformRequest }
						onError={ ( error ) => {
							handleEditorMapPreviewError( error );
							if ( debouncedPostMeta?.type !== 'mapbox' ) {
								setRenderControl( { status: 'request_error', statusCode: 400 } );
							}
						} }
						onSourceData={ () => {
							setRenderControl( { status: 'loaded' } );
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
						{ [ 'ready', 'loaded' ].includes( renderControl.status ) &&
							debouncedPostMeta?.type !== 'mapbox' && (
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
