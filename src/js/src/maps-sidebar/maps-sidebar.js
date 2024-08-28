import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { Button, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
	sendNotice,
	lockPostSaving,
	lockPostAutoSaving,
} ) {
	const [ modal, setModal ] = useState( false );

	const [ initialButtonSelected, setInitialButtonSelected ] = useState( true );
	const [ minButtonSelected, setMinButtonSelected ] = useState( false );
	const [ maxButtonSelected, setMaxButtonSelected ] = useState( false );

	const [ initialButtonStyle, setInitialButtonStyle ] = useState( {
		color: '#fff',
		backgroundColor: '#007cba',
		border: 0,
	} );
	const [ minButtonStyle, setMinButtonStyle ] = useState( {
		color: '#000',
		backgroundColor: '#fff',
		border: 0,
	} );
	const [ maxButtonStyle, setMaxButtonStyle ] = useState( {
		color: '#000',
		backgroundColor: '#fff',
		border: 0,
	} );

	const mapRef = useRef();

	const setPanLimitsFromMap = () => {
		const { current: map } = mapRef;
		if ( map ) {
			const boundries = map.getBounds();
			setPostMeta( {	...postMeta,
				'pan_limits': {
					east: boundries._ne.lat,
					north: boundries._ne.lng,
					south: boundries._sw.lng,
					west: boundries._sw.lat,
				}
			} );
		}
	}

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );

	const loadLayer = useCallback( layerLoader( loadedLayers ), [
		loadedLayers,
	] );

	const embedUrl =
		postId && `${ jeo_settings.site_url }/embed/?map_id=${ postId }`;

	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

	const [ key, setKey ] = useState( 0 );
	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );

	const createNotice = useCallback( ( type, message, options = {} ) => {
		sendNotice( type, message, { id: 'layer_notices_no_api_key', isDismissible: true, ...options } );
	}, [ sendNotice ] );

	useEffect( () => {
		if ( ! MapboxAPIKey ) {
			createNotice( 'warning', __( "There's no API Key found in your JEO Settings.", 'jeo' ), {
				actions: [
					{
						url: '/wp-admin/admin.php?page=jeo-settings',
						label: __( 'Please, check your settings.', 'jeo' ),
					},
				],
			} );
			lockPostSaving();
			lockPostAutoSaving();
		} else {
			async function verifyAPIKey() {
				const response = await fetch(
					`https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=${ MapboxAPIKey }`
				);
				if ( response.status >= 400 ) {
					createNotice( 'warning', __( '1 - Your Mapbox access token may be invalid.', 'jeo' ) );
					lockPostSaving();
					lockPostAutoSaving();
				}
			}

			verifyAPIKey();
		}
	}, [] );

	useEffect( () => {
		if ( initialButtonSelected ) {
			setInitialButtonStyle( {
				color: '#fff',
				backgroundColor: '#007cba',
				border: 0,
			} );
		} else {
			setInitialButtonStyle( {
				color: '#000',
				backgroundColor: '#fff',
				border: 0,
			} );
		}
	}, [ initialButtonSelected ] );

	useEffect( () => {
		if ( minButtonSelected ) {
			setMinButtonStyle( {
				color: '#fff',
				backgroundColor: '#007cba',
				border: 0,
			} );
		} else {
			setMinButtonStyle( {
				color: '#000',
				backgroundColor: '#fff',
				border: 0,
			} );
		}
	}, [ minButtonSelected ] );

	useEffect( () => {
		if ( maxButtonSelected ) {
			setMaxButtonStyle( {
				color: '#fff',
				backgroundColor: '#007cba',
				border: 0,
			} );
		} else {
			setMaxButtonStyle( {
				color: '#000',
				backgroundColor: '#fff',
				border: 0,
			} );
		}
	}, [ maxButtonSelected ] );


	return (
		<>
			{ modal && (
				<LayersSettingsModal
					closeModal={ closeModal }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			{ embedUrl && !postMeta.disable_embed && <MapEmbedUrl url={ embedUrl } /> }

			<MapPanel
				attributes={ postMeta }
				setAttributes={ setPostMeta }
				renderPanel={ PluginDocumentSettingPanel }
				setPanLimitsFromMap={ setPanLimitsFromMap }
			/>
			{ MapboxAPIKey && (
				<MapPreviewPortal>
					<div className="zoom-buttons-div">
						<ButtonGroup className="button-group-div">
							<Button
								style={ initialButtonStyle }
								className="zoom-button"
								variant="primary"
								isLarge
								onClick={ () => {
									setZoomState( 'initial_zoom' );
									setInitialButtonSelected( true );
									setMinButtonSelected( false );
									setMaxButtonSelected( false );
									setKey( key + 1 );
								} }
							>
								{ __( 'Initial Zoom', 'jeo' ) }
							</Button>
							<Button
								style={ minButtonStyle }
								className="zoom-button"
								variant="primary"
								isLarge
								onClick={ () => {
									if ( postMeta.min_zoom <= 0 ) {
										setPostMeta( {
											min_zoom: 0.1,
										} );
									}
									setZoomState( 'min_zoom' );
									setInitialButtonSelected( false );
									setMinButtonSelected( true );
									setMaxButtonSelected( false );
									setKey( key + 1 );
								} }
							>
								{ __( 'Min Zoom', 'jeo' ) }
							</Button>
							<Button
								style={ maxButtonStyle }
								className="zoom-button"
								variant="primary"
								isLarge
								onClick={ () => {
									if ( postMeta.max_zoom <= 0 ) {
										setPostMeta( {
											max_zoom: 0.1,
										} );
									}
									setZoomState( 'max_zoom' );
									setInitialButtonSelected( false );
									setMinButtonSelected( false );
									setMaxButtonSelected( true );
									setKey( key + 1 );
								} }
							>
								{ __( 'Max Zoom', 'jeo' ) }
							</Button>
						</ButtonGroup>
					</div>
					<Map
						key={ key }
						ref={ mapRef }
						onStyleData={ ( { target: map } ) => {
							map.addControl(
								new mapboxgl.NavigationControl( { showCompass: false } ),
								'top-left'
							);
							map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
						} }
						style={ { height: '500px', width: '100%' } }
						initialViewState={ {
							latitude: centerLat || 0,
							longitude: centerLon || 0,
							zoom: initialZoom || 11,
						} }
						onMoveEnd={ ( { target: map } ) => {
							const center = map.getCenter();
							let zoom = Math.round( map.getZoom() * 10 ) / 10;

							if ( zoomState === 'initial_zoom' ) {
								if ( window.max_zoom && zoom > window.max_zoom ) {
									zoom = window.max_zoom;
								} else if ( window.min_zoom && zoom < window.min_zoom ) {
									zoom = window.min_zoom;
								}
							}

							if ( zoomState === 'min_zoom' && window.initial_zoom ) {
								if ( zoom > window.initial_zoom ) {
									zoom = window.initial_zoom;
								}
							}

							if ( zoomState === 'max_zoom' && window.initial_zoom ) {
								if ( zoom < window.initial_zoom ) {
									zoom = window.initialZoom;
								}
							}

							setPostMeta( {
								center_lat: center.lat,
								center_lon: center.lng,
								[ zoomState ]: zoom,
							} );
							window[ zoomState ] = zoom;
						} }
					>
						{ loadedLayers &&
							postMeta.layers.map( ( layer ) => {
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
		</>
	);
}

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
	},
	setRelatedPosts: ( value ) => {
		dispatch( 'core/editor' ).editPost( { meta: { related_posts: value } } );
	},
	sendNotice: ( type, message, options ) => {
		dispatch( 'core/notices' ).createNotice( type, message, options );
	},
	lockPostSaving: () => {
		dispatch( 'core/editor' ).lockPostSaving();
	},
	lockPostAutoSaving: ( key ) => {
		dispatch( 'core/editor' ).lockPostAutosaving( key );
	},
} ) )(
	withSelect( ( select ) => ( {
		loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer', { per_page: -1, order: 'asc', orderby: 'menu_order' } ),
		loadingLayers: select( 'core/data' ).isResolving(
			'core',
			'getEntityRecords',
			[ 'postType', 'map-layer' ]
		),
		postId: select( 'core/editor' ).getCurrentPostId(),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' )
			.related_posts,
	} ) )( MapsSidebar )
);
