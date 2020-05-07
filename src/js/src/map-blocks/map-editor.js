import { Button, Spinner } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Map from './map';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import './map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

const MapEditor = ( {
	attributes,
	setAttributes,
	instanceId,
	loadedLayers,
	loadedMap,
	loadingMap,
} ) => {
	const [ key, setKey ] = useState( 0 );

	useEffect( () => {
		setKey( key + 1 );
	}, [ attributes.align, window.screen.width ] );

	const decodeHtmlEntity = function( str ) {
		return str.replace( /&#(\d+);/g, function( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	return (
		<Fragment>
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && ! loadingMap && (
				<Fragment>
					<div className="jeo-preview-area">
						<Map
							onStyleLoad={ ( map ) => {
								map.addControl( new mapboxgl.NavigationControl( { showCompass: false } ), 'top-left' );

								if ( loadedMap.meta.enable_fullscreen ) {
									map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
								}

								if ( loadedMap.meta.disable_scroll_zoom ) {
									map.scrollZoom.disable();
								}

								if ( loadedMap.meta.disable_drag_pan ) {
									map.dragPan.disable();
								}

								if ( loadedMap.meta.disable_drag_rotate ) {
									map.dragRotate.disable();
								}
							} }
							key={ key }
							style="mapbox://styles/mapbox/streets-v11"
							zoom={ [ loadedMap.meta.initial_zoom || mapDefaults.zoom ] }
							center={ [
								loadedMap.meta.center_lon || mapDefaults.lng,
								loadedMap.meta.center_lat || mapDefaults.lat,
							] }
							containerStyle={ { height: '50vh' } }
						>
							{ loadedLayers && loadedMap.meta.layers.map( ( layer ) => {
								const layerOptions = loadedLayers.find( ( { id } ) => id === layer.id ).meta;
								return renderLayer( layerOptions, layer );
							} ) }
						</Map>
					</div>

					<div className="jeo-preview-controls">
						<p><strong>{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong></p>
						<Button
							className="select-another-map"
							isLink
							isLarge
							onClick={ () => {
								const previous_map = attributes.map_id;
								setAttributes( { ...attributes, map_id: undefined, previous_map } );
							} }
						>
							<em>{ __( '(Select another map)' ) }</em>
						</Button>
					</div>
				</Fragment>
			) }
			{ ! attributes.map_id && (
				<Fragment>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library' ) + ':' }
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
							isPrimary
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel' ) }
						</Button>
					) }
				</Fragment>
			) }
		</Fragment>
	);
};

const applyWithSelect = withSelect( ( select, { attributes } ) => ( {
	loadedMap:
		attributes.map_id &&
		select( 'core' ).getEntityRecord( 'postType', 'map', attributes.map_id ),
	loadingMap:
		attributes.map_id &&
		select( 'core/data' ).isResolving( 'core', 'getEntityRecord', [
			'postType',
			'map',
			attributes.map_id,
		] ),
	loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer' ),
	loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
		'postType',
		'map-layer',
	] ),
} ) );

export default compose( withInstanceId, applyWithSelect )( MapEditor );
