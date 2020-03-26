import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment, useCallback, useState, useRef } from '@wordpress/element';
import { Button, Dashicon } from '@wordpress/components';

import LayersPanel from '../map-blocks/layers-panel';
import LayersSettingsModal from '../map-blocks/layers-settings-modal';
import Map, { MapboxAPIKey } from '../map-blocks/map';
import MapPanel from '../map-blocks/map-panel';
import MapEmbedUrl from './map-embed-url';
import MapPreviewPortal from './map-preview-portal';
import PostsSelector from '../posts-selector';
import { layerLoader } from '../map-blocks/utils';
import { renderLayer } from '../map-blocks/map-preview-layer';

import './maps-sidebar.css';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

function MapsSidebar( {
	loadedLayers,
	loadingLayers,
	postId,
	postMeta,
	relatedPosts,
	setPostMeta,
	setRelatedPosts,
} ) {
	const [ modal, setModal ] = useState( false );

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );

	const loadLayer = useCallback( layerLoader( loadedLayers ), [ loadedLayers ] );

	const embedUrl = postId && `${ jeo_settings.site_url }/embed/?map_id=${ postId }`;

	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

	const animationOptions = {
		animate: false,
	};

	const editingMap = useRef( false );

	return (
		<Fragment>
			{ modal && (
				<LayersSettingsModal
					closeModal={ closeModal }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			{ embedUrl && (
				<MapEmbedUrl url={ embedUrl } />
			) }

			<MapPanel
				attributes={ postMeta }
				setAttributes={ setPostMeta }
				renderPanel={ PluginDocumentSettingPanel }
			/>
			{ MapboxAPIKey && (
				<MapPreviewPortal>
					<Map
						style="mapbox://styles/mapbox/streets-v11"
						containerStyle={ { height: '500px', width: '100%' } }
						zoom={ [ initialZoom || 11 ] }
						center={ [ centerLon || 0, centerLat || 0 ] }
						animationOptions={ animationOptions }
						onMoveEnd={ ( map ) => {
							if ( ! editingMap.current ) {
								const center = map.getCenter();
								const zoom = Math.round( map.getZoom() * 10 ) / 10;

								setPostMeta( {
									center_lat: center.lat,
									center_lon: center.lng,
									initial_zoom: zoom,
								} );
							}
						} }
					>
						{ loadedLayers && postMeta.layers.map( ( layer ) => {
							const layerOptions = loadedLayers.find( ( { id } ) => id === layer.id ).meta;
							return renderLayer( layerOptions, layer );
						} ) }
					</Map>
					<Button
						isLarge
						isLink
						onClick={ () => {
							let increment = 0.5;
							if ( initialZoom + 0.5 > 20 ) {
								increment = initialZoom - 20;
							}

							setPostMeta( {
								initial_zoom: initialZoom + increment,
							} );
						} }
					>
						<Dashicon icon="plus" />
					</Button>
					<Button
						isLarge
						isLink
						onClick={ () => {
							let decrement = 0.5;
							if ( initialZoom - 0.5 <= 0 ) {
								decrement = 0;
							}

							setPostMeta( {
								initial_zoom: initialZoom - decrement,
							} );
						} }
					>
						<Dashicon icon="minus" />
					</Button>
				</MapPreviewPortal>
			) }

			<LayersPanel
				attributes={ postMeta }
				openModal={ openModal }
				loadLayer={ loadLayer }
				loadingLayers={ loadingLayers }
				renderPanel={ PluginDocumentSettingPanel }
			/>

			<PostsSelector
				relatedPosts={ relatedPosts }
				setRelatedPosts={ setRelatedPosts }
				renderPanel={ PluginDocumentSettingPanel }
			/>
		</Fragment>
	);
}

export default withDispatch(
	( dispatch ) => ( {
		setPostMeta: ( meta ) => {
			dispatch( 'core/editor' ).editPost( { meta } );
		},
		setRelatedPosts: ( value ) => {
			dispatch( 'core/editor' ).editPost( { meta: { related_posts: value } } );
		},
	} )
)( withSelect(
	( select ) => ( {
		loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer' ),
		loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'postType',
			'map-layer',
		] ),
		postId: select( 'core/editor' ).getCurrentPostId(),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).related_posts,
	} )
)( MapsSidebar ) );
