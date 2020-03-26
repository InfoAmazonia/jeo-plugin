import { Fragment, useRef } from '@wordpress/element';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Dashicon, Button } from '@wordpress/components';

import LayerSettings from './layer-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import LayerPreviewPortal from './layer-preview-portal';
import Map, { MapboxAPIKey } from '../map-blocks/map';
import { renderLayer } from '../map-blocks/map-preview-layer';

import './layers-sidebar.css';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

function LayersSidebar( {
	postMeta,
	setPostMeta,
} ) {
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
			{ MapboxAPIKey && (
				<LayerPreviewPortal>
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
						{ renderLayer( postMeta, {
							id: 1,
							use: 'fixed',
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
				</LayerPreviewPortal>
			) }

			<PluginDocumentSettingPanel name="layer-settings" title={ __( 'Settings' ) }>
				<LayerSettings />
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel name="legend-settings" title={ __( 'Legend' ) }>
				<LegendsEditor />
			</PluginDocumentSettingPanel>
		</Fragment>
	);
}

export default withDispatch(
	( dispatch ) => ( {
		setPostMeta: ( meta ) => {
			dispatch( 'core/editor' ).editPost( { meta } );
		},
	} )
)( withSelect(
	( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} )
)( LayersSidebar ) );
