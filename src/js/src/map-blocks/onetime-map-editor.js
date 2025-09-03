import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import LayersSettingsModal from './layers-settings-modal';
import { renderLayer } from './map-preview-layer';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import PostsSelector from '../posts-selector';
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function OnetimeMapEditor ( { attributes, setAttributes } ) {
	const [ modal, setModal ] = useState( false );
	const [ key, setKey ] = useState( 0 );

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
	const currentZoom = attributes[ zoomState ];

	const mapRef = useRef( undefined );

	const layerIds = useMemo( () => {
		return attributes.layers.map( ( layer ) => layer.id );
	}, [ attributes.layers ] );

	const { records: loadedLayers, isResolving: loadingLayers } = useEntityRecords( 'postType', 'map-layer', {
		include: layerIds,
		per_page: -1,
	} );

	const setPanLimitsFromMap = () => {
		const { current: map } = mapRef;
		if ( map ) {
			const boundries = map.getBounds();
			setAttributes(
				{	...attributes,
					'pan_limits': {
						east: boundries._ne.lat,
						north: boundries._ne.lng,
						south: boundries._sw.lng,
						west: boundries._sw.lat,
					}
				} )
		}
	}

	return (
		<>
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
					attributes={ attributes }
					setAttributes={ setAttributes }
					renderPanel={ PanelBody }
					setZoomState={ setZoomState }
					setPanLimitsFromMap={ setPanLimitsFromMap }
				/>
				<LayersPanel
					attributes={ attributes }
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
					latitude={ attributes.center_lat || mapDefaults.lat }
					longitude={ attributes.center_lon || mapDefaults.lng }
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
						attributes.layers.map( ( layer ) => {
							const layerOptions = loadedLayers.find(
								( { id } ) => id === layer.id
							).meta;
							return renderLayer( { layer: layerOptions, instance: layer } );
						} ) }
				</Map>
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeo' ) }
				</Button>
			</div>
		</>
	);
};
