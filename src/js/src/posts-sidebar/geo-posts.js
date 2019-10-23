import React from 'react';
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet';
import JeoGeoAutoComplete from './geo-auto-complete';
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import './geo-posts.css';

class JeoGeocodePosts extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select('core/editor').getCurrentPost().meta;
console.log(metadata);
		const lat = this.getProperty(metadata,'_geocode_lat') ? this.getProperty(metadata,'_geocode_lat') : 0;
		const lon = this.getProperty(metadata,'_geocode_lon') ? this.getProperty(metadata,'_geocode_lon') : 0;

		this.state = {
			currentLocation: {
				lat: lat,
				lon: lon,
				full_address: this.getProperty(metadata, '_geocode_full_address'),
				country: this.getProperty(metadata, '_geocode_country'),
				country_code: this.getProperty(metadata, '_geocode_country_code'),
				region_level_1: this.getProperty(metadata, '_geocode_region_level_1'),
				region_level_2: this.getProperty(metadata, '_geocode_region_level_2'),
				region_level_3: this.getProperty(metadata, '_geocode_region_level_3'),
				city: this.getProperty(metadata, '_geocode_city'),
				city_level_1: this.getProperty(metadata, '_geocode_city_level_1'),
			},
			zoom: 1,
		}

		this.onLocationFound = this.onLocationFound.bind(this);
		this.onMarkerDragged = this.onMarkerDragged.bind(this);
		this.getProperty = this.getProperty.bind(this);
		this.save = this.save.bind(this);

		this.markerRef = React.createRef();

	};

	getProperty(object, property) {
		if ( undefined !== typeof(object[property]) ) {
			return object[property];
		} else {
			return null;
		}
	}

	onLocationFound(location) {
		console.log(location);
		this.setState({
			currentLocation: {
				lat: this.getProperty(location,'lat'),
				lon: this.getProperty(location,'lon'),
				full_address: this.getProperty(location, 'full_address'),
				country: this.getProperty(location, 'country'),
				country_code: this.getProperty(location, 'country_code'),
				region_level_1: this.getProperty(location, 'region_level_1'),
				region_level_2: this.getProperty(location, 'region_level_2'),
				region_level_3: this.getProperty(location, 'region_level_3'),
				city: this.getProperty(location, 'city'),
				city_level_1: this.getProperty(location, 'city_level_1'),
			},
			zoom: 6
		});
	};

	onMarkerDragged() {
		const marker = this.markerRef.current;
		const latLng = marker.leafletElement.getLatLng();
		this.setState({
			currentLocation: {
				...this.state.currentLocation,
				lat: latLng.lat,
				lon: latLng.lng
			}
		});

	}

	save() {

		wp.data.dispatch('core/editor').editPost({meta: {
			_geocode_lat: this.getProperty(this.state.currentLocation,'lat'),
			_geocode_lon: this.getProperty(this.state.currentLocation,'lon'),
			_geocode_full_address: this.getProperty(this.state.currentLocation, 'full_address'),
			_geocode_country: this.getProperty(this.state.currentLocation, 'country'),
			_geocode_country_code: this.getProperty(this.state.currentLocation, 'country_code'),
			_geocode_region_level_1: this.getProperty(this.state.currentLocation, 'region_level_1'),
			_geocode_region_level_2: this.getProperty(this.state.currentLocation, 'region_level_2'),
			_geocode_region_level_3: this.getProperty(this.state.currentLocation, 'region_level_3'),
			_geocode_city: this.getProperty(this.state.currentLocation, 'city'),
			_geocode_city_level_1: this.getProperty(this.state.currentLocation, 'city_level_1'),
		}});
		console.log(this.getProperty(this.state.currentLocation, 'country'));
		//this.props.onSaveLocation();
	}

	render() {
		const position = [this.state.currentLocation.lat, this.state.currentLocation.lon];
		return (
			<>
				<p>{__('Search your location', 'jeo')}</p>
				<JeoGeoAutoComplete onSelect={this.onLocationFound} />
				<div id="geocode-map-container">
					<LeafletMap center={position} zoom={this.state.zoom}>
						<TileLayer
								attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
								url='https://{s}.tile.osm.org/{z}/{x}/{y}.png'
								/>
						{this.getProperty(this.state.currentLocation, 'lat') && (

							<Marker
									draggable={true}
									onDragend={this.onMarkerDragged}
									position={[this.state.currentLocation.lat, this.state.currentLocation.lon]}
									ref={this.markerRef}
									>
							</Marker>

						)}

					</LeafletMap>

					<Button isDefault onClick={ this.save() }>
						{__('Save', 'jeo')}
					</Button>

					<Button onClick={ this.props.onCancel }>
						{__('Cancel', 'jeo')}
					</Button>

				</div>

			</>
		);

	}
}

export default JeoGeocodePosts;
