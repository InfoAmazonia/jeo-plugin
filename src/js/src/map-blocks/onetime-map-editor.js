import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import LayersSettingsModal from './layers-settings-modal';
import { renderLayer } from './map-preview-layer';
import { coerceOnetimeMapAttributes } from './onetime-map-config';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import PostsSelector from '../posts-selector';
import { useRecordsByIds } from '../shared/rest-records';
import {
	applyComposedVisibilityFromSettings,
	handleEditorMapPreviewError,
	hasMapboxStyleLayers,
	useComposedPayloadPreviewStyle,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function OnetimeMapEditor ( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const postId = useSelect( ( select ) =>
		select( 'core/editor' ).getCurrentPostId(), [] );
	const [ modal, setModal ] = useState( false );
	const [ key, setKey ] = useState( 0 );
	const normalizedAttributes = useMemo( () => {
		return coerceOnetimeMapAttributes( attributes, {
			center_lat: mapDefaults.lat,
			center_lon: mapDefaults.lng,
			initial_zoom: mapDefaults.zoom,
			min_zoom: 0,
			max_zoom: 20,
		} );
	}, [ attributes ] );

	useEffect( () => {
		setKey( ( currentKey ) => currentKey + 1 );
	}, [ attributes.align, window.screen.width ] );

	const setRelatedPosts = useCallback(
		( relatedPosts ) => {
			setAttributes( { ...attributes, related_posts: relatedPosts } );
		},
		[ setAttributes ]
	);

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );

	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const currentZoom = normalizedAttributes[ zoomState ];

	const mapRef = useRef( undefined );

	const layerIds = useMemo( () => {
		return normalizedAttributes.layers.map( ( layer ) => layer.id );
	}, [ normalizedAttributes.layers ] );
	const layerSettingsKey = useMemo(
		() => JSON.stringify( normalizedAttributes.layers || [] ),
		[ normalizedAttributes.layers ]
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
		kind: 'onetime-map',
		postId,
		blockId: clientId,
		layers: normalizedAttributes.layers || [],
	} ), [ postId, clientId, layerSettingsKey ] );
	const composedPreview = useComposedPayloadPreviewStyle( {
		enabled: hasMapboxLayers,
		payload: composedPayload,
		refreshKey: layerSettingsKey,
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
	const transformRequest = useEditorMapboxTransformRequest( loadedLayers );
	const applyComposedVisibility = useCallback( () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSettings(
				mapRef.current,
				composedPreview.manifest,
				normalizedAttributes.layers || []
			);
		}
	}, [
		composedPreview.manifest,
		layerSettingsKey,
		useComposedPreview,
	] );

	useEffect( () => {
		applyComposedVisibility();
	}, [ applyComposedVisibility ] );

	const setPanLimitsFromMap = () => {
		const { current: map } = mapRef;
		if ( map ) {
			const bounds = map.getBounds();
			const northEast = bounds.getNorthEast();
			const southWest = bounds.getSouthWest();
			setAttributes(
				{	...attributes,
					'pan_limits': {
						east: northEast.lng,
						north: northEast.lat,
						south: southWest.lat,
						west: southWest.lng,
					}
				} )
		}
	}

	return (
		<div { ...blockProps }>
			{ modal && (
				<LayersSettingsModal
					closeModal={ closeModal }
					attributes={ attributes }
					setAttributes={ setAttributes }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			<InspectorControls>
				<MapPanel
					attributes={ normalizedAttributes }
					setAttributes={ setAttributes }
					renderPanel={ PanelBody }
					setZoomState={ setZoomState }
					setPanLimitsFromMap={ setPanLimitsFromMap }
				/>
				<LayersPanel
					attributes={ normalizedAttributes }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
					openModal={ openModal }
					renderPanel={ PanelBody }
				/>
				<PostsSelector
					relatedPosts={ attributes.related_posts }
					setRelatedPosts={ setRelatedPosts }
					renderPanel={ PanelBody }
				/>
			</InspectorControls>

			<div className="jeo-preview-area">
				{ ( isPreparingLayerPreview || isPreparingComposedPreview ) && <Spinner /> }
				{ ! isPreparingLayerPreview && ! isPreparingComposedPreview && (
					<Map
						key={ `${ key }:${ currentZoom }:${ layerSettingsKey }:${ composedPreview.metadata?.hash || 'default' }` }
						ref={ mapRef }
						mapStyle={ useComposedPreview ? composedPreview.style : undefined }
						transformRequest={ transformRequest }
						onError={ handleEditorMapPreviewError }
						onStyleData={ applyComposedVisibility }
						style={ { height: '100%', width: '100%' } }
						latitude={ normalizedAttributes.center_lat }
						longitude={ normalizedAttributes.center_lon }
						zoom={ currentZoom || mapDefaults.zoom }
						onMove={ ( { viewState } ) => {
							setAttributes( {
								center_lat: viewState.latitude,
								center_lon: viewState.longitude,
							} );
						} }
						onZoom={ ( { viewState } ) => {
							const zoom = Math.round( viewState.zoom * 10 ) / 10;
							setAttributes( { [ zoomState ]: zoom } );
						} }
					>
						{ loadedLayers &&
							normalizedAttributes.layers.map( ( layer ) => {
								const layerRecord = loadedLayers.find(
									( { id } ) => id === layer.id
								);

								if ( ! layerRecord?.meta ) {
									return null;
								}

								if ( useComposedPreview ) {
									return null;
								}

								if ( hasMapboxLayers && layerRecord.meta.type === 'mapbox' ) {
									return null;
								}

								return renderLayer( { layer: layerRecord.meta, instance: layer } );
							} ) }
					</Map>
				) }
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeowp' ) }
				</Button>
			</div>
		</div>
	);
};
