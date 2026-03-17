import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
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
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function OnetimeMapEditor ( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
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
		setKey( key + 1 );
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

	const { records: loadedLayers = [], isLoading: loadingLayers } = useRecordsByIds( {
		path: '/wp/v2/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

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
				<Map
					key={ currentZoom }
					ref={ mapRef }
					style={ { height: '50vh' } }
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

							return renderLayer( { layer: layerRecord.meta, instance: layer } );
						} ) }
				</Map>
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeo' ) }
				</Button>
			</div>
		</div>
	);
};
