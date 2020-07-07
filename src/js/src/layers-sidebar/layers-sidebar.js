import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import AttributionSettings from './attribution-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Map, { MapboxAPIKey } from '../map-blocks/map';
import { MemoizedRenderLayer } from '../map-blocks/map-preview-layer';
import { isEmpty, isEqual } from 'lodash-es';
import { useDebounce } from 'use-debounce';
import LayerPreviewPortal from './layer-preview-portal';
import LayerSettings from './layer-settings';
import './layers-sidebar.css';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

const LayersSidebar = ( {
	postMeta,
	setPostMeta,
	sendNotice,
	removeNotice,
	lockPostAutoSaving,
	lockPostSaving,
	unlockPostSaving,
} ) => {
	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };
	const [ layerTypeSchema, setLayerTypeSchema ] = useState( {} );

	const [ key, setKey ] = useState( 0 );
	const [ renderControl, setRenderControl ] = useState( {
		status: 'incomplete_form',
	} );
	const editingMap = useRef( false );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );
	const prevPostMeta = useRef( {} );

	const animationOptions = {
		animate: false,
	};

	useEffect( () => {
		if ( ! MapboxAPIKey ) {
			setRenderControl( { status: 'incomplete_settings' } );
		}
	}, [] );

	useEffect( () => {
		if ( postMeta.type ) {
			window.JeoLayerTypes.getLayerTypeSchema( postMeta ).then( ( schema ) => {
				setLayerTypeSchema( schema );
			} );
		}
		if ( MapboxAPIKey ) {
			setRenderControl( { status: 'incomplete_form' } );
		}
	}, [ postMeta.type ] );

	useEffect( () => {
		switch ( renderControl.status ) {
			case 'incomplete_form':
				sendNotice(
					'warning',
					__(
						'Please fill all required fields, you will not be able to publish or update until that.',
						'jeo'
					),
					{
						id: 'layer_notices',
						isDismissible: false,
					}
				);
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'request_error':
				switch ( renderControl.statusCode ) {
					case 401:
						sendNotice(
							'error',
							__(
								'Your Mapbox access token may be invalid. You will not be able to publish or update. Please check your settings',
								'jeo'
							),
							{
								id: 'layer_notices',
								isDismissible: false,
							}
						);
						break;
					case 404:
						sendNotice(
							'error',
							__(
								'Your layer was not found. You will not be able to publish or update. Please check your settings',
								'jeo'
							),
							{
								id: 'layer_notices',
								isDismissible: false,
							}
						);
						break;
					default:
						sendNotice(
							'error',
							__(
								'Error loading your layer, you will not be able to publish or update. Please check your settings.',
								'jeo'
							),
							{
								id: 'layer_notices',
								isDismissible: false,
							}
						);
						break;
				}
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'incomplete_settings':
				sendNotice(
					'warning',
					__(
						'Your Mapbox API Key was not found in your JEO Settings. You will not be able to publish or update.',
						'jeo'
					),
					{
						id: 'layer_notices',
						isDismissible: false,
						actions: [
							{
								url: '/wp-admin/admin.php?page=jeo-settings',
								label: 'Please, check your settings.',
							},
						],
					}
				);
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'ready':
				removeNotice( 'layer_notices' );
				break;
		}
	}, [ renderControl.status ] );

	useEffect( () => {
		const debouncedLayerTypeOptions = debouncedPostMeta.layer_type_options;
		const prevLayerTypeOptions = prevPostMeta.current.layer_type_options;
		if (
			Object.keys( debouncedLayerTypeOptions ).length &&
			Object.keys( layerTypeSchema ).length &&
			MapboxAPIKey
		) {
			const optionsKeys = Object.keys( layerTypeSchema.properties );
			let anyEmpty = false;
			optionsKeys.some( ( k ) => {
				if (
					isEmpty( debouncedLayerTypeOptions[ k ] ) &&
					layerTypeSchema.required.includes( k )
				) {
					anyEmpty = true;
					setRenderControl( {
						status: 'incomplete_form',
					} );
					return anyEmpty;
				}
				return false;
			} );
			if (
				! anyEmpty &&
				renderControl != 'ready' &&
				! isEqual( debouncedLayerTypeOptions, prevLayerTypeOptions )
			) {
				setRenderControl( {
					status: 'ready',
				} );
				setKey( key + 1 );
			}
			prevPostMeta.current = debouncedPostMeta;
		}
	}, [ debouncedPostMeta.layer_type_options, layerTypeSchema ] );

	const origOpen = XMLHttpRequest.prototype.open;
	XMLHttpRequest.prototype.open = function () {
		this.addEventListener( 'load', function () {
			if ( this.status >= 400 ) {
				setRenderControl( {
					status: 'request_error',
					statusCode: this.status,
				} );
			}
		} );
		origOpen.apply( this, arguments );
	};

	return (
		<Fragment>
			{ MapboxAPIKey && (
				<>
					<LayerPreviewPortal>
						<Map
							key={ key }
							onError={ ( map, e ) => {
								try {
									const layer = map.getLayer( 'layer_1' );
									if ( layer ) {
										map.removeLayer( 'layer_1' );
									}
									setRenderControl( {
										status: 'request_error',
										statusCode: 400,
									} );
								} catch ( e ) {
									setRenderControl( {
										status: 'request_error',
										statusCode: 400,
									} );
								}
							} }
							onStyleLoad={ ( map ) => {
								map.addControl(
									new mapboxgl.NavigationControl( { showCompass: false } ),
									'top-left'
								);
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
							{ [ 'ready', 'loaded' ].includes( renderControl.status ) && (
								<MemoizedRenderLayer
									layer={ debouncedPostMeta }
									instance={ { id: 1, use: 'fixed' } }
									onSourceLoadedCallback={ () => {
										setRenderControl( { status: 'loaded' } );
										unlockPostSaving( 'layer_lock_key' );
									} }
								/>
							) }
						</Map>
					</LayerPreviewPortal>

					<PluginDocumentSettingPanel
						name="settings"
						title={ __( 'Settings' ) }
					>
						<LayerSettings />
					</PluginDocumentSettingPanel>

					<PluginDocumentSettingPanel
						name="attribution-settings"
						title={ __( 'Attributions' ) }
					>
						<AttributionSettings />
					</PluginDocumentSettingPanel>

					<PluginDocumentSettingPanel
						name="legend-settings"
						title={ __( 'Legend' ) }
					>
						<LegendsEditor />
					</PluginDocumentSettingPanel>
				</>
			) }
		</Fragment>
	);
};
export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
	},
	sendNotice: ( type, message, options ) => {
		dispatch( 'core/notices' ).createNotice( type, message, options );
	},
	removeNotice: ( id ) => {
		dispatch( 'core/notices' ).removeNotice( id );
	},
	lockPostSaving: ( key ) => {
		dispatch( 'core/editor' ).lockPostSaving( key );
	},
	lockPostAutoSaving: ( key ) => {
		dispatch( 'core/editor' ).lockPostAutosaving( key );
	},
	unlockPostSaving: ( key ) => {
		dispatch( 'core/editor' ).unlockPostSaving( key );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( LayersSidebar )
);
