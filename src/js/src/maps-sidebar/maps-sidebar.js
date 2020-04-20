import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment, useCallback, useState, useEffect } from '@wordpress/element';
import { Button, Dashicon, ButtonGroup } from '@wordpress/components';
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

	const [ key, setKey ] = useState( 0 );
	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const currentZoom = postMeta[ zoomState ];

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
					<div className="zoom-buttons-div">
						<ButtonGroup
							className="button-group-div"
						>
							<Button
								style={ initialButtonStyle }
								className="zoom-button"
								isPrimary
								isLarge
								onClick={ () => {
									setZoomState( 'initial_zoom' );
									setInitialButtonSelected( true );
									setMinButtonSelected( false );
									setMaxButtonSelected( false );
									setKey( key + 1 );
								} }
							>
								{ __( 'Initial Zoom' ) }
							</Button>
							<Button
								style={ minButtonStyle }
								className="zoom-button"
								isPrimary
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
								{ __( 'Min Zoom' ) }
							</Button>
							<Button
								style={ maxButtonStyle }
								className="zoom-button"
								isPrimary
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
								{ __( 'Max Zoom' ) }
							</Button>
						</ButtonGroup>
					</div>
					<Map
						onStyleLoad={ ( map ) => {
							map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
						} }
						key={ key }
						style="mapbox://styles/mapbox/streets-v11"
						containerStyle={ { height: '500px', width: '100%' } }
						zoom={ [ currentZoom || initialZoom ] }
						center={ [ centerLon || 0, centerLat || 0 ] }
						animationOptions={ animationOptions }
						onMoveEnd={ ( map ) => {
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
						{ loadedLayers && postMeta.layers.map( ( layer ) => {
							const layerOptions = loadedLayers.find( ( { id } ) => id === layer.id ).meta;
							return renderLayer( layerOptions, layer );
						} ) }
					</Map>
					<Button
						isLarge
						isLink
						onClick={ () => {
							const increment = 0.5;
							let newValue = postMeta[ zoomState ] + increment;
							if ( newValue > 20 ) {
								newValue = 20;
							}

							if ( zoomState === 'initial_zoom' ) {
								setPostMeta( {
									initial_zoom: newValue,
								} );
							} else if ( zoomState === 'min_zoom' ) {
								setPostMeta( {
									min_zoom: newValue,
								} );
							} else if ( zoomState === 'max_zoom' ) {
								setPostMeta( {
									max_zoom: newValue,
								} );
							}
						} }
					>
						<Dashicon icon="plus" />
					</Button>
					<Button
						isLarge
						isLink
						onClick={ () => {
							const decrement = 0.5;
							let newValue = postMeta[ zoomState ] - decrement;
							if ( newValue <= 0 ) {
								newValue = 0.1;
							}

							if ( zoomState === 'initial_zoom' ) {
								setPostMeta( {
									initial_zoom: newValue,
								} );
							} else if ( zoomState === 'min_zoom' ) {
								setPostMeta( {
									min_zoom: newValue,
								} );
							} else if ( zoomState === 'max_zoom' ) {
								setPostMeta( {
									max_zoom: newValue,
								} );
							}
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
