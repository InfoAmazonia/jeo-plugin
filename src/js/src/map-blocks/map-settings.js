import { TextControl, RangeControl, CheckboxControl, Button, ButtonGroup } from '@wordpress/components';
import { Fragment, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import './map-settings.css';

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

export default ( { attributes, setAttributes, setZoomState } ) => {
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

	const [ initialButtonColor, setInitialButtonColor ] = useState( [ '#000', '#fff' ] );
	const [ minButtonColor, setMinButtonColor ] = useState( [ '#000', '#fff' ] );
	const [ maxButtonColor, setMaxButtonColor ] = useState( [ '#000', '#fff' ] );

	const [ initialButtonMargin, setInitialButtonMargin ] = useState( 0 );
	const [ minButtonMargin, setMinButtonMargin ] = useState( 0 );
	const [ maxButtonMargin, setMaxButtonMargin ] = useState( 0 );

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

					<div className="zoom-buttons-div">
						<h3>{ __( 'Zoom preview' ) }</h3>
						<ButtonGroup
							className="button-group-div"
						>
							<Button
								autoFocus
								style={ {
									color: initialButtonColor[ 0 ],
									backgroundColor: initialButtonColor[ 1 ],
									margin: initialButtonMargin,
									border: 0,
								} }
								onFocus={ () => {
									setInitialButtonColor( [ '#fff', '#007cba' ] );
									setInitialButtonMargin( 1 );
								} }
								onBlur={ () => {
									setInitialButtonColor( [ '#000', '#fff' ] );
									setInitialButtonMargin( 0 );
								} }
								className="zoom-button"
								isPrimary
								isLarge
								onClick={ () => {
									setZoomState( 'initial_zoom' );
								} }>
								{ __( 'Initial Zoom' ) }
							</Button>
							<Button
								style={ {
									color: minButtonColor[ 0 ],
									backgroundColor: minButtonColor[ 1 ],
									margin: minButtonMargin,
									border: 0,
								} }
								onFocus={ () => {
									setMinButtonColor( [ '#fff', '#007cba' ] );
									setMinButtonMargin( 1 );
								} }
								onBlur={ () => {
									setMinButtonColor( [ '#000', '#fff' ] );
									setMinButtonMargin( 0 );
								} }
								className="zoom-button"
								isPrimary
								isLarge
								onClick={ () => {
									if ( minZoom === 0 ) {
										attributeUpdater( 'min_zoom' )( 0.1 );
									}
									setZoomState( 'min_zoom' );
								} }>
								{ __( 'Min Zoom' ) }
							</Button>
							<Button
								style={ {
									color: maxButtonColor[ 0 ],
									backgroundColor: maxButtonColor[ 1 ],
									margin: maxButtonMargin,
									border: 0,
								} }
								onFocus={ () => {
									setMaxButtonColor( [ '#fff', '#007cba' ] );
									setMaxButtonMargin( 1 );
								} }
								onBlur={ () => {
									setMaxButtonColor( [ '#000', '#fff' ] );
									setMaxButtonMargin( 0 );
								} }
								className="zoom-button"
								isPrimary
								isLarge
								onClick={ () => {
									if ( maxZoom === 0 ) {
										attributeUpdater( 'max_zoom' )( 0.1 );
									}
									setZoomState( 'max_zoom' );
								} }>
								{ __( 'Max Zoom' ) }
							</Button>
						</ButtonGroup>
					</div>

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
