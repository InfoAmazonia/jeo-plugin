import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import { useRecordsByIds } from '../shared/rest-records';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

export default function MapEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [] );
	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = useCallback( ( meta ) => editPost( { meta } ), [ editPost ] );

	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const [ key, setKey ] = useState( 0 );
	const mapRef = useRef( undefined );

	// Expose setPanLimitsFromMap for the sidebar MapSettings button.
	// Since the block runs inside the iframe and the sidebar in the parent,
	// we use the editor data store to bridge them: MapSettings dispatches
	// a custom action, and this block listens via a window message (future).
	// For now, store the function on the iframe window so MapPanel can
	// call it via cross-frame messaging if needed.
	useEffect( () => {
		window.__jeoSetPanLimitsFromMap = () => {
			const { current: map } = mapRef;
			if ( map ) {
				const bounds = map.getBounds();
				const northEast = bounds.getNorthEast();
				const southWest = bounds.getSouthWest();
				setPostMeta( {
					pan_limits: {
						east: northEast.lng,
						north: northEast.lat,
						south: southWest.lat,
						west: southWest.lng,
					},
				} );
			}
		};
		return () => {
			delete window.__jeoSetPanLimitsFromMap;
		};
	}, [ setPostMeta ] );

	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };

	const currentZoom = postMeta[ zoomState ];

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );
	const layerSettingsKey = useMemo(
		() => JSON.stringify( postMeta.layers || [] ),
		[ postMeta.layers ]
	);

	const { records: loadedLayers = [] } = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

	const buttonStyle = ( selected ) => ( {
		color: selected ? '#fff' : '#000',
		backgroundColor: selected ? '#007cba' : '#fff',
		border: 0,
	} );

	// Stop mouse events from propagating to the block editor's selection
	// handler so the map remains draggable inside the block.
	const stopPropagation = useCallback( ( e ) => e.stopPropagation(), [] );

	return (
		<div { ...blockProps }>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */ }
			<div
				className="jeo-preview-area"
				onPointerDown={ stopPropagation }
				onMouseDown={ stopPropagation }
				onTouchStart={ stopPropagation }
			>
				<div className="zoom-buttons-div">
					<div
						className="button-group-div"
						role="group"
						aria-label={ __( 'Preview zoom controls', 'jeo' ) }
					>
						<Button
							style={ buttonStyle( zoomState === 'initial_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => {
								setZoomState( 'initial_zoom' );
								setKey( ( currentKey ) => currentKey + 1 );
							} }
						>
							{ __( 'Initial Zoom', 'jeo' ) }
						</Button>
						<Button
							style={ buttonStyle( zoomState === 'min_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => {
								if ( postMeta.min_zoom <= 0 ) {
									setPostMeta( { min_zoom: 0.1 } );
								}
								setZoomState( 'min_zoom' );
								setKey( ( currentKey ) => currentKey + 1 );
							} }
						>
							{ __( 'Min Zoom', 'jeo' ) }
						</Button>
						<Button
							style={ buttonStyle( zoomState === 'max_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => {
								if ( postMeta.max_zoom <= 0 ) {
									setPostMeta( { max_zoom: 0.1 } );
								}
								setZoomState( 'max_zoom' );
								setKey( ( currentKey ) => currentKey + 1 );
							} }
						>
							{ __( 'Max Zoom', 'jeo' ) }
						</Button>
					</div>
				</div>
				<Map
					key={ `${ key }:${ zoomState }:${ layerSettingsKey }` }
					ref={ mapRef }
					style={ { height: '500px', width: '100%' } }
					latitude={ centerLat || 0 }
					longitude={ centerLon || 0 }
					zoom={ currentZoom || initialZoom || 11 }
					onMove={ ( { viewState } ) => {
						setPostMeta( {
							center_lat: viewState.latitude,
							center_lon: viewState.longitude,
						} );
					} }
					onZoom={ ( { viewState } ) => {
						let zoom = Math.round( viewState.zoom * 10 ) / 10;
						setPostMeta( { [ zoomState ]: zoom } );
					} }
				>
					{ loadedLayers &&
						( postMeta.layers || [] ).map( ( layer ) => {
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
			</div>
		</div>
	);
}
