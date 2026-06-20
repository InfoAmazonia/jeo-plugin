import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { select, useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import { useRecordsByIds } from '../shared/rest-records';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lon,
	min_zoom: 0,
	max_zoom: 20,
};

export default function MapEditorPreview() {
	const blockProps = useBlockProps();

	const postMeta = useSelect( ( selectFn ) =>
		selectFn( 'core/editor' ).getEditedPostAttribute( 'meta' ), [] ) || {};
	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = useCallback(
		( meta ) => {
			const currentMeta =
				select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
			editPost( { meta: { ...currentMeta, ...meta } } );
		},
		[ editPost ]
	);

	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const mapRef = useRef( undefined );

	const [ viewState, setViewState ] = useState( {
		latitude: postMeta.center_lat || mapDefaults.center_lat,
		longitude: postMeta.center_lon || mapDefaults.center_lon,
		zoom: postMeta.initial_zoom || mapDefaults.initial_zoom,
	} );

	// Sync zoom from store when zoom mode changes (e.g. clicking "Min Zoom").
	// Deliberately does NOT re-run on every postMeta change — only on mode switch.
	useEffect( () => {
		const targetZoom =
			postMeta[ zoomState ] || postMeta.initial_zoom || mapDefaults.initial_zoom;
		setViewState( ( prev ) => ( { ...prev, zoom: targetZoom } ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ zoomState ] );

	// Bridge pan-limits to the sidebar (parent document) via parent window.
	useEffect( () => {
		const fn = () => {
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
		try {
			window.parent.__jeoSetPanLimitsFromMap = fn;
			return () => {
				delete window.parent.__jeoSetPanLimitsFromMap;
			};
		} catch ( e ) {
			window.__jeoSetPanLimitsFromMap = fn;
			return () => {
				delete window.__jeoSetPanLimitsFromMap;
			};
		}
	}, [ setPostMeta ] );

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

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
						aria-label={ __( 'Preview zoom controls', 'jeowp' ) }
					>
						<Button
							style={ buttonStyle( zoomState === 'initial_zoom' ) }
							className="zoom-button"
							variant="primary"
							isLarge
							onClick={ () => setZoomState( 'initial_zoom' ) }
						>
							{ __( 'Initial Zoom', 'jeowp' ) }
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
							} }
						>
							{ __( 'Min Zoom', 'jeowp' ) }
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
							} }
						>
							{ __( 'Max Zoom', 'jeowp' ) }
						</Button>
					</div>
				</div>
				<Map
					ref={ mapRef }
					style={ { height: '500px', width: '100%' } }
					latitude={ viewState.latitude }
					longitude={ viewState.longitude }
					zoom={ viewState.zoom }
					onMove={ ( { viewState: vs } ) => {
						setViewState( {
							latitude: vs.latitude,
							longitude: vs.longitude,
							zoom: vs.zoom,
						} );
					} }
					onMoveEnd={ ( { viewState: vs } ) => {
						setPostMeta( {
							center_lat: vs.latitude,
							center_lon: vs.longitude,
						} );
					} }
					onZoomEnd={ () => {
						const map = mapRef.current;
						if ( ! map ) return;
						const zoom = Math.round( map.getZoom() * 10 ) / 10;
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
