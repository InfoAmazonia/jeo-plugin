import { withSelect } from '@wordpress/data';
import { Fragment, useCallback, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, PanelBody } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

import Map from './map';
import LayersModal from './layers-modal';
import { renderLayer } from './map-preview-layer';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import PostsSelector from '../posts-selector';
import { layerLoader } from './utils';
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

const OnetimeMapEditor = ( {
	attributes,
	setAttributes,
	loadedLayers,
	loadingLayers,
} ) => {
	const [ modal, setModal ] = useState( false );
	const [ key, setKey ] = useState( 0 );
	const loadLayer = layerLoader( loadedLayers );

	const setRelatedPosts = useCallback(
		( relatedPosts ) => {
			setAttributes( { ...attributes, related_posts: relatedPosts } );
		},
		[ setAttributes ]
	);

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );

	const editingMap = useRef( false );

	const animationOptions = {
		animate: false,
	};

	return (
		<Fragment>
			{ modal && (
				<LayersModal
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
					panel={ PanelBody }
				/>
				<LayersPanel
					attributes={ attributes }
					openModal={ openModal }
					loadLayer={ loadLayer }
					loadingLayers={ loadingLayers }
					panel={ PanelBody }
				/>
				<PanelBody title={ __( 'Related posts', 'jeo' ) }>
					<PostsSelector
						relatedPosts={ attributes.related_posts }
						setRelatedPosts={ setRelatedPosts }
						panel={ PanelBody }
					/>
				</PanelBody>
			</InspectorControls>

			<div className="jeo-preview-area">
				<Map
					key={ key }
					style="mapbox://styles/mapbox/streets-v11"
					zoom={ [ attributes.initial_zoom || mapDefaults.zoom ] }
					center={ [
						attributes.center_lon || mapDefaults.lng,
						attributes.center_lat || mapDefaults.lat,
					] }
					containerStyle={ { height: '50vh' } }

					animationOptions={ animationOptions }

					onMoveEnd={ ( map ) => {
						if ( ! editingMap.current ) {
							const center = map.getCenter();
							const zoom = Math.round( map.getZoom() * 10 ) / 10;

							setAttributes( {
								center_lat: center.lat,
								center_lon: center.lng,
								initial_zoom: zoom,
							} );
						}
					} }
				>
					{ loadedLayers && attributes.layers.map( ( layer ) => {
						const layerOptions = loadedLayers.find( ( { id } ) => id === layer.id ).meta;
						return renderLayer( layerOptions, layer );
					} ) }
				</Map>
			</div>

			<div className="jeo-preview-controls">
				<Button isPrimary isLarge onClick={ openModal }>
					{ __( 'Edit layers settings' ) }
				</Button>

				<Button
					isPrimary
					isLarge
					onClick={ () => {
						setKey( key + 1 );
					} }
				>
					{ __( 'Refresh map' ) }
				</Button>
			</div>
		</Fragment>
	);
};

export default withSelect( ( select, { attributes } ) => {
	const query = { include: attributes.layers.map( ( layer ) => layer.id ) };
	return {
		loadedLayers: select( 'core' ).getEntityRecords(
			'postType',
			'map-layer',
			query
		),
		loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'postType',
			'map-layer',
			query,
		] ),
	};
} )( OnetimeMapEditor );
