import {
	TextControl,
	RangeControl,
	CheckboxControl,
	Button,
	ButtonGroup,
} from '@wordpress/components';
import { Fragment, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
	disable_scroll_zoom: jeo_settings.map_defaults.disable_scroll_zoom,
	disable_drag_pan: jeo_settings.map_defaults.disable_drag_pan,
	disable_drag_rotate: jeo_settings.map_defaults.disable_drag_rotate,
	enable_fullscreen: jeo_settings.map_defaults.enable_fullscreen,
};

function parseNumber( value ) {
	if ( value === '' ) {
		return '';
	}

	const numValue = Number( value );
	return isNaN( numValue ) ? value : numValue;
}

export default ( { attributes, setAttributes } ) => {
	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
		min_zoom: minZoom,
		max_zoom: maxZoom,
	} = { ...mapDefaults, ...attributes };

	const attributeUpdater = ( attribute ) => ( value ) => {
		setAttributes( { ...attributes, [ attribute ]: value } );
	};

	const editingMap = useRef( false );

	window.initial_zoom = initialZoom;
	window.min_zoom = minZoom;
	window.max_zoom = maxZoom;

	return (
		<Fragment>
			<form className="jeo-map-settings">
				<section className="center">
					<h3>{ __( 'Center' ) }</h3>
					<TextControl
						type="number"
						label={ __( 'Latitude' ) }
						value={ centerLat }
						onChange={ ( value ) => {
							editingMap.current = true;
							setTimeout( () => ( editingMap.current = false ), 50 );
							return attributeUpdater( 'center_lat' )( parseNumber( value ) );
						} }
					/>
					<TextControl
						type="number"
						label={ __( 'Longitude' ) }
						value={ centerLon }
						onChange={ ( value ) => {
							editingMap.current = true;
							setTimeout( () => ( editingMap.current = false ), 50 );
							return attributeUpdater( 'center_lon' )( parseNumber( value ) );
						} }
					/>
				</section>
				<section className="zoom">
					<h3>{ __( 'Zoom' ) }</h3>
					<RangeControl
						label={ __( 'Initial zoom' ) }
						initialPosition={ 11 }
						min={ minZoom }
						max={ maxZoom }
						step={ 0.1 }
						value={ initialZoom }
						onChange={ ( value ) => {
							let newValue = value;
							if ( ! newValue ) {
								newValue = minZoom
							}

							window.initial_zoom = newValue;
							attributeUpdater( 'initial_zoom' )( newValue );
						} }
					/>
					<RangeControl
						label={ __( 'Min zoom' ) }
						initialPosition={ 0 }
						min={ 0 }
						max={ initialZoom }
						step={ 0.1 }
						value={ minZoom }
						onChange={ ( value ) => {
							let newValue = value;
							if ( ! newValue ) {
								newValue = 0;
							}

							window.min_zoom = newValue;
							attributeUpdater( 'min_zoom' )( newValue );
						} }
					/>
					<RangeControl
						label={ __( 'Max zoom' ) }
						initialPosition={ 20 }
						min={ initialZoom }
						max={ 20 }
						step={ 0.1 }
						value={ maxZoom }
						onChange={ ( value ) => {
							let newValue = value;
							if ( ! newValue ) {
								newValue = initialZoom;
							}
							
							window.max_zoom = newValue;
							attributeUpdater( 'max_zoom' )( newValue );
						} }
					/>
					<CheckboxControl
						label={ __( 'Scroll zoom on post' ) }
						checked={ ! attributes.disable_scroll_zoom }
						onChange={ () => {
							attributeUpdater( 'disable_scroll_zoom' )(
								! attributes.disable_scroll_zoom
							);
						} }
					/>
					<CheckboxControl
						label={ __( 'Drag rotation on post' ) }
						checked={ ! attributes.disable_drag_rotate }
						onChange={ () => {
							attributeUpdater( 'disable_drag_rotate' )(
								! attributes.disable_drag_rotate
							);
						} }
					/>
					<CheckboxControl
						label={ __( 'Map navigation on post' ) }
						checked={ ! attributes.disable_drag_pan }
						onChange={ () => {
							attributeUpdater( 'disable_drag_pan' )(
								! attributes.disable_drag_pan
							);
						} }
					/>
					<CheckboxControl
						label={ __( 'Fullscreen button on post' ) }
						checked={ attributes.enable_fullscreen }
						onChange={ () => {
							attributeUpdater( 'enable_fullscreen' )(
								! attributes.enable_fullscreen
							);
						} }
					/>
				</section>
			</form>
		</Fragment>
	);
};
