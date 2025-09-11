import { Button, Spinner } from '@wordpress/components';
import { useEntityRecord, useEntityRecords } from '@wordpress/core-data';
import { useEffect, useId, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import './map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function MapEditor ( {attributes, setAttributes } ) {
	const instanceId = useId();
	console.log({ instanceId });
	const [ key, setKey ] = useState( 0 );
	useEffect( () => {
		setKey( key + 1 );
	}, [ attributes.align, window.screen.width ] );

	const decodeHtmlEntity = function ( str ) {
		return str.replace( /&#(\d+);/g, function ( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	const mapRef = useRef( undefined );

	const { record: loadedMap, isResolving: loadingMap } = useEntityRecord( 'postType', 'map', attributes.map_id, {
		enabled: Boolean( attributes.map_id ),
	} );

	const layerIds = useMemo( () => {
		if ( ! loadedMap?.meta.layers ) {
			return [];
		}
		return loadedMap.meta.layers.map( ( layer ) => layer.id );
	}, [ loadedMap?.meta.layers ] );

	const { records: loadedLayers } = useEntityRecords( 'postType', 'map-layer', {
		include: layerIds,
		per_page: -1,
	}, { enabled: layerIds.length > 0 } );

	if ( attributes.map_id && !loadedMap ) {
		return null;
	}

	return (
		<div className="jeo-mapblock">
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && ! loadingMap && (
				<>
					<div className="jeo-preview-area">
						<Map
							key={ key }
							ref={ mapRef }
							onStyleData={ () => {
								const { current: map } = mapRef;
								if ( map ) {
									if ( loadedMap.meta.disable_scroll_zoom ) {
										map.scrollZoom?.disable();
									}

									if ( loadedMap.meta.disable_drag_pan ) {
										map.dragPan.disable();
										map.touchZoomRotate?.disable();
									}

									if ( loadedMap.meta.disable_drag_rotate ) {
										map.dragRotate?.disable();
									}
								}
							} }
							style={ { height: '50vh' } }
							latitude={ loadedMap.meta.center_lat || mapDefaults.lat }
							longitude={ loadedMap.meta.center_lon || mapDefaults.lng }
							zoom={ loadedMap.meta.initial_zoom || mapDefaults.zoom }
						>
							{ loadedLayers &&
								loadedMap.meta.layers.map( ( layer ) => {
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
					<div className="jeo-preview-controls">
						<p>
							<strong>{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong>
						</p>
						<Button
							className="select-another-map"
							variant="secondary"
							isLarge
							onClick={ () => {
								const previous_map = attributes.map_id;
								setAttributes( {
									...attributes,
									map_id: undefined,
									previous_map,
								} );
							} }
						>
							<em>{ __( '(Select another map)', 'jeo' ) }</em>
						</Button>
					</div>
				</>
			) }
			{ ! attributes.map_id && (
				<>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library', 'jeo' ) + ':' }
					</label>
					<JeoAutosuggest
						inputProps={ {
							placeholder: __( 'Type a map name', 'jeo' ),
							id: `jeo-map-autosuggest-${ instanceId }`,
						} }
						postType="map"
						onSuggestionSelected={ ( e, { suggestion } ) =>
							setAttributes( { ...attributes, map_id: suggestion.id } )
						}
					/>
					{ attributes.previous_map && (
						<Button
							className="select-another-map"
							isLarge
							variant="primary"
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel', 'jeo' ) }
						</Button>
					) }
				</>
			) }
		</div>
	);
};
