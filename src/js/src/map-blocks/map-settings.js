import ReactMapboxGl from 'react-mapbox-gl';
import { TextControl, RangeControl, CheckboxControl } from '@wordpress/components';
import { Fragment, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MapboxAPIKey = window.jeo_settings.mapbox_key;

const Map = ReactMapboxGl( { accessToken: MapboxAPIKey } );

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
	disable_scroll_zoom: jeo_settings.map_defaults.disable_scroll_zoom,
	disable_drag_rotate: jeo_settings.map_defaults.disable_drag_rotate,
};

function parseNumber( value ) {
	if ( value === '' ) {
		return '';
	}

	const numValue = Number( value );
	return isNaN( numValue ) ? value : numValue;
}

export default ( { attributes, setAttributes } ) => {
	let {
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
							setTimeout( () => editingMap.current = false, 50 );
							return attributeUpdater( 'center_lat' )( parseNumber( value ) );
						} }
					/>
					<TextControl
						type="number"
						label={ __( 'Longitude' ) }
						value={ centerLon }
						onChange={ ( value ) => {
							editingMap.current = true;
							setTimeout( () => editingMap.current = false, 50 );
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
						onChange={ attributeUpdater( 'initial_zoom' ) }
					/>
					<RangeControl
						label={ __( 'Min zoom' ) }
						initialPosition={ 0 }
						min={ 0 }
						max={ 20 }
						step={ 0.1 }
						value={ minZoom }
						onChange={ attributeUpdater( 'min_zoom' ) }
					/>
					<RangeControl
						label={ __( 'Max zoom' ) }
						initialPosition={ 20 }
						min={ 0 }
						max={ 20 }
						step={ 0.1 }
						value={ maxZoom }
						onChange={ attributeUpdater( 'max_zoom' ) }
					/>
					<CheckboxControl
						label={ __( 'Disable Zoom on Post' ) }
						checked={ attributes.disable_scroll_zoom }
						onChange={ () => {
							attributeUpdater( 'disable_scroll_zoom' )( ! attributes.disable_scroll_zoom );
						} }
					/>
					<CheckboxControl
						label={ __( 'Disable Drag Rotation' ) }
						checked={ attributes.disable_drag_rotate }
						onChange={ () => {
							attributeUpdater( 'disable_drag_rotate' )( ! attributes.disable_drag_rotate );
						} }
					/>
				</section>
			</form>
		</Fragment>
	);
};
