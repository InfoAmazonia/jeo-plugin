import { useEntityRecords } from '@wordpress/core-data';
import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { Button, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import LayersPanel from '../map-blocks/layers-panel';
import LayersSettingsModal from '../map-blocks/layers-settings-modal';
import { Map } from '../lib/mapgl-react';
import MapPanel from '../map-blocks/map-panel';
import MapEmbedUrl from './map-embed-url';
import MapPreviewPortal from './map-preview-portal';
import PostsSelector from '../posts-selector';
import { renderLayer } from '../map-blocks/map-preview-layer';

import './maps-sidebar.scss';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lng: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

function MapsSidebar( {
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

	const mapRef = useRef( undefined );

	const layerIds = useMemo( () => {
		return postMeta.layers.map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

	const { records: loadedLayers, isResolving: loadingLayers } = useEntityRecords( 'postType', 'map-layer', {
		include: layerIds,
		per_page: -1,
	}, { enabled: layerIds.length > 0 } );

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

	const embedUrl =
		postId && `${ jeo_settings.site_url }/embed/?map_id=${ postId }`;

	const {
		center_lat: centerLat,
		center_lng: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

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
					style={ { height: '500px', width: '100%' } }
					latitude={ centerLat || 0 }
					longitude={ centerLon || 0 }
					zoom={ currentZoom || initialZoom || 11 }
					onMove={ ( { viewState } ) => {
						setPostMeta( {
							center_lat: viewState.latitude,
							center_lng: viewState.longitude,
						} );
					} }
					onZoom={ ( { viewState } ) => {
						let zoom = Math.round( viewState.zoom * 10 ) / 10;

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

						setPostMeta( { [ zoomState ]: zoom } );
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

			<LayersPanel
				attributes={ postMeta }
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				openModal={ openModal }
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
} ) )(
	withSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' )
			.related_posts,
	} ) )( MapsSidebar )
);
