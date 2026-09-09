import { useBlockProps } from '@wordpress/block-editor';
import { Button, Spinner } from '@wordpress/components';
import { select, useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
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
	center_lon: jeo_settings.map_defaults.lon,
	min_zoom: 0,
	max_zoom: 20,
};

export default function MapEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [] ) || {};
	const postId = useSelect( ( select ) =>
		select( 'core/editor' ).getCurrentPostId(), [] );
	const isSavingPost = useSelect( ( select ) =>
		select( 'core/editor' ).isSavingPost(), [] );
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
	const composedPayload = useMemo( () => ( {
		scope: 'preview',
		kind: 'map-preview',
		postId,
		layers: postMeta.layers || [],
	} ), [ postId, layerSettingsKey ] );
	const composedPreview = useComposedPayloadPreviewStyle( {
		enabled: hasMapboxLayers,
		payload: composedPayload,
		refreshKey: `${ layerSettingsKey }:${ isSavingPost ? 'saving' : 'idle' }`,
	} );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	const isPreparingLayerPreview = Boolean(
		layerIds.length > 0 && ( loadingLayers || ! hasResolvedLayers )
	);
	const isPreparingComposedPreview = Boolean(
		! isPreparingLayerPreview &&
			hasMapboxLayers &&
			! composedPreview.style &&
			! composedPreview.error
	);
	const shouldRenderMap = ! isPreparingLayerPreview && ! isPreparingComposedPreview;
	const transformRequest = useEditorMapboxTransformRequest( loadedLayers );

	const applyComposedVisibility = useCallback( () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSettings(
				mapRef.current,
				composedPreview.manifest,
				postMeta.layers || []
			);
		}
	}, [
		composedPreview.manifest,
		postMeta.layers,
		useComposedPreview,
	] );

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
				<div className="zoom-buttons-div">
					<div
						className="button-group-div"
						role="group"
						aria-label={ __( 'Preview zoom controls', 'jeowp' ) }
					>
						<Button
							style={ buttonStyle( zoomState === 'initial_zoom' ) }
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
				{ ! shouldRenderMap && <Spinner /> }
				{ shouldRenderMap && (
					<Map
						key={ `${ zoomState }:${ layerSettingsKey }:${ composedPreview.metadata?.hash || 'default' }` }
						ref={ mapRef }
						mapStyle={ useComposedPreview ? composedPreview.style : undefined }
						style={ { height: '500px', width: '100%' } }
						transformRequest={ transformRequest }
						latitude={ centerLat || 0 }
						longitude={ centerLon || 0 }
						zoom={ currentZoom || initialZoom || 11 }
						onError={ handleEditorMapPreviewError }
						onStyleData={ applyComposedVisibility }
						onMove={ ( { viewState } ) => {
							setPostMeta( {
								center_lat: viewState.latitude,
								center_lon: viewState.longitude,
							} );
						} }
						onZoom={ ( { viewState } ) => {
							let zoom = Math.round( viewState.zoom * 10 ) / 10;
							setPostMeta( { [ zoomState ]: zoom } );
						} }
					>
						{ ! useComposedPreview && loadedLayers &&
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
				) }
			</div>
		</div>
	);
}
