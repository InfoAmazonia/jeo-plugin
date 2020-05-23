import { Fragment, useRef, useState, useEffect } from '@wordpress/element';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { withDispatch, withSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import LayerSettings from './layer-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import LayerPreviewPortal from './layer-preview-portal';
import Map, { MapboxAPIKey } from '../map-blocks/map';
import { renderLayer } from '../map-blocks/map-preview-layer';
import { useDebounce } from '../map-blocks/utils';
import isEqual from 'lodash.isequal';

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
	sendNotice,
	removeNotice,
	lockPostSaving,
	unlockPostSaving,
} ) {
	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

	const animationOptions = {
		animate: false,
	};

	const [ key, setKey ] = useState( 0 );

	const [ hasError, setHasError ] = useState( false );
	const debouncedPostMeta = useDebounce( postMeta, 1500 );
	useEffect( () => {
		if ( hasError ) {
			sendNotice( 'error', __( 'Error loading your layer. Please check your settings.', 'jeo' ), {
				id: 'error_loading_layer',
				isDismissible: false,
			} );
			lockPostSaving();
		} else {
			setHasError( false );
			removeNotice( 'error_loading_layer' );
			unlockPostSaving();
		}
	}, [ hasError ] );

	const editingMap = useRef( false );
	const oldPostMeta = useRef( debouncedPostMeta );

	useEffect( () => {
		let anyEmpty = false;
		for ( const k in debouncedPostMeta.layer_type_options ) {
			const v = debouncedPostMeta.layer_type_options[ k ];
			if ( ! v || ! v.trim().length > 0 ) {
				anyEmpty = true;
			}
		}

		if ( ! isEqual( oldPostMeta.current.layer_type_options, debouncedPostMeta.layer_type_options ) && ! anyEmpty ) {
			oldPostMeta.current = debouncedPostMeta;
			setHasError( false );
			setKey( key + 1 );
		}
	}, [ debouncedPostMeta ] );

	const origOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function() {
		this.addEventListener( 'load', function() {
			if ( this.status >= 400 ) {
				setHasError( true );
			}
		} );
		origOpen.apply( this, arguments );
	};

	return (
		<Fragment>
			{ MapboxAPIKey && (
				<LayerPreviewPortal>
					<Map
						key={ key }
						onError={ ( ) => {
							if ( ! hasError ) {
								setHasError( true );
							}
						} }
						onStyleLoad={ ( map ) => {
							map.addControl( new mapboxgl.NavigationControl( { showCompass: false } ), 'top-left' );
							map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
						} }
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
						{ renderLayer( debouncedPostMeta, {
							id: 1,
							use: 'fixed',
						} ) }
					</Map>
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
		sendNotice: ( type, message, options ) => {
			dispatch( 'core/notices' ).createNotice( type, message, options );
		},
		removeNotice: ( id ) => {
			dispatch( 'core/notices' ).removeNotice( id );
		},
		lockPostSaving: () => {
			dispatch( 'core/editor' ).lockPostSaving( );
		},
		unlockPostSaving: () => {
			dispatch( 'core/editor' ).unlockPostSaving( );
		},
	} )
)( withSelect(
	( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} )
)( LayersSidebar ) );
