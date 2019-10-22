import React from 'react';
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet';
import JeoGeoAutoComplete from './geo-auto-complete';
import { Button } from "@wordpress/components";
import { __ } from "@wordpress/i18n";

class JeoGeocodePosts extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select('core/editor').getCurrentPost().meta;
		// console.log(metadata);
		const marker = metadata._geocode_lat && metadata._geocode_lon ? [ metadata._geocode_lat, metadata._geocode_lon ] : false;
		this.state = {
			lat: metadata._geocode_lat,
			lng: metadata._geocode_lon,
			zoom: 13,
			marker: marker
		}

		this.onLocationFound = this.onLocationFound.bind(this);
		this.onMarkerDragged = this.onMarkerDragged.bind(this);
		this.save = this.save.bind(this);

		this.markerRef = React.createRef();

	};

	onLocationFound(location) {
		console.log(location);
		this.setState({
			marker: [
				location.lat,
				location.lon
			],
			lat: location.lat,
			lng: location.lon,
		});
	};

	onMarkerDragged() {
		const marker = this.markerRef.current;
		const latLng = marker.leafletElement.getLatLng();
		this.setState({
			marker: [
				latLng.lat,
				latLng.lng
			],
			lat: latLng.lat,
			lng: latLng.lng,
		});

	}

	save() {
		const lat = this.state.marker[0];
		const lon = this.state.marker[1];

		wp.data.dispatch('core/editor').editPost({meta: {
			_geocode_lat: lat,
			_geocode_lon: lon,
		}});

		//this.props.onSaveLocation();
	}

	render() {
		const position = [this.state.lat, this.state.lng];
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
						{this.state.marker && (

							<Marker
									draggable={true}
									onDragend={this.onMarkerDragged}
									position={[this.state.marker[0], this.state.marker[1]]}
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
