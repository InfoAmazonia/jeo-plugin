import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment, useCallback, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersPanel from '../map-blocks/layers-panel';
import MapEditorModal from '../map-blocks/map-editor-modal';
import MapPanel from '../map-blocks/map-panel';
import PostsSelector from '../posts-selector';
import { layerLoader } from '../map-blocks/utils';

import ReactMapboxGl from 'react-mapbox-gl';
import { createPortal } from '@wordpress/element';

const MapboxAPIKey = window.jeo_settings.mapbox_key;

const Map = ReactMapboxGl( { accessToken: MapboxAPIKey } );

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
	postMeta,
	relatedPosts,
	setPostMeta,
	setRelatedPosts,
} ) {
	const [ modal, setModal ] = useState( false );

	const loadLayer = useCallback( layerLoader( loadedLayers ), [ loadedLayers ] );

	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom
	} = { ...mapDefaults, ...postMeta };


	const animationOptions = {
		animate: false,
	};

	const editingMap = useRef( false );

	return (
		<Fragment>
			{ modal && (
				<MapEditorModal
					modal={ modal }
					setModal={ setModal }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			<MapPanel
				attributes={ postMeta }
				setModal={ setModal }
				setAttributes={ setPostMeta }
				panel={ PluginDocumentSettingPanel }
			/>

			{ MapboxAPIKey && (
					createPortal(<Map
						style="mapbox://styles/mapbox/streets-v11"
						containerStyle={ { height: '500px', width: '1000px' } }
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
						/>, document.getElementById('map-preview')
					)
				)
			}

			<LayersPanel
				attributes={ postMeta }
				setModal={ setModal }
				loadLayer={ loadLayer }
				loadingLayers={ loadingLayers }
				panel={ PluginDocumentSettingPanel }
			/>

			<PluginDocumentSettingPanel title={ __( 'Related posts', 'jeo' ) }>
				<PostsSelector
					relatedPosts={ relatedPosts }
					setRelatedPosts={ setRelatedPosts }
					panel={ PluginDocumentSettingPanel }
				/>
			</PluginDocumentSettingPanel>
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
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).related_posts,
	} )
)( MapsSidebar ) );
