import React from 'react';
import { Map as LeafletMap, Marker, Popup, TileLayer } from 'react-leaflet';
import JeoGeoAutoComplete from './geo-auto-complete';
import { Button, RadioControl } from "@wordpress/components";
import { __ } from "@wordpress/i18n";
import './geo-posts.css';

class JeoGeocodePosts extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select('core/editor').getCurrentPost().meta;

		this.state = {
			zoom: 1,
			points: metadata._related_point,
			currentMarkerIndex: 0
		}

		this.onLocationFound = this.onLocationFound.bind(this);
		this.onMarkerDragged = this.onMarkerDragged.bind(this);
		this.getProperty = this.getProperty.bind(this);
		this.save = this.save.bind(this);
		this.clickMarkerList = this.clickMarkerList.bind(this);
		this.mapLoaded = this.mapLoaded.bind(this);
		this.relevanceClick = this.relevanceClick.bind(this);
		this.updatePoint = this.updatePoint.bind(this);
		this.updateCurrentPoint = this.updateCurrentPoint.bind(this);
		this.newPoint = this.newPoint.bind(this);
		this.deletePoint = this.deletePoint.bind(this);

		this.refMap = React.createRef();

	};

	/**
	 * Immutably updates info in the point object, inside the array of related points
	 *
	 * @param {int} point The Marker Index
	 * @param {object} data the new data. Only attributes that change
	 */
	updatePoint(point, data) {
		this.setState({
			...this.state,
			points: [
				...this.state.points.slice(0, point),
				{
					...this.state.points[point],
					...data
				},
				...this.state.points.slice(point + 1),
			]
		});
	}

	updateCurrentPoint(data) {
		const marker_id = this.state.currentMarkerIndex;
		this.updatePoint( marker_id, data );
	}

	clickMarkerList(e) {
		this.setState({
			currentMarkerIndex: e.target.id
		})
	}

	relevanceClick(option) {
		this.updateCurrentPoint( {relevance: option} );
	}

	newPoint() {

		const center = this.refMap.current.leafletElement.getCenter();

		this.setState({
			...this.state,
			points: [
				...this.state.points,
				{
					_geocode_lat: center.lat,
					_geocode_lon: center.lng,
					_geocode_full_address: __('Unknown location', 'jeo')
				}
			],
			currentMarkerIndex: this.state.points.length // sets new marker as current
		});
	}

	deletePoint(e) {
		e.preventDefault();
		e.stopPropagation();

		const index = e.target.attributes.marker_index.value;


		this.setState({
			...this.state,
			points: this.state.points.filter( (el, i) => i != index ),
			currentMarkerIndex: 0
		});
	}

	getProperty(object, property) {
		if ( undefined !== typeof(object[property]) ) {
			return object[property];
		} else {
			return null;
		}
	}


	onLocationFound(location) {

		this.updateCurrentPoint( {
			_geocode_lat: this.getProperty(location, 'lat'),
			_geocode_lon: this.getProperty(location, 'lon'),
			_geocode_full_address: this.getProperty(location, 'full_address'),
			_geocode_country: this.getProperty(location, 'country'),
			_geocode_country_code: this.getProperty(location, 'country_code'),
			_geocode_region_level_1: this.getProperty(location, 'region_level_1'),
			_geocode_region_level_2: this.getProperty(location, 'region_level_2'),
			_geocode_region_level_3: this.getProperty(location, 'region_level_3'),
			_geocode_city: this.getProperty(location, 'city'),
			_geocode_city_level_1: this.getProperty(location, 'city_level_1')
		} );

		this.refMap.current.leafletElement.flyTo([
			this.getProperty(location, 'lat'),
			this.getProperty(location, 'lon')
		]);

	};


	mapLoaded(e) {

		const coords = this.state.points.map( e => {
			return [
				e._geocode_lat,
				e._geocode_lon
			]
		} );

		const map = e.target;

		map.fitBounds(coords);

	}

	onMarkerDragged(e) {
		const marker = e.target;
		const latLng = marker.getLatLng();

		this.updateCurrentPoint( {
			_geocode_lat: latLng.lat,
			_geocode_lon: latLng.lng
		} );

		fetch(jeo.ajax_url + '?action=jeo_reverse_geocode&lat=' + latLng.lat + '&lon=' + latLng.lng)
			.then( response => {
				return response.json();
			} )
			.then( result => {

				this.updateCurrentPoint( {
					_geocode_full_address: this.getProperty(result, 'full_address'),
					_geocode_country: this.getProperty(result, 'country'),
					_geocode_country_code: this.getProperty(result, 'country_code'),
					_geocode_region_level_1: this.getProperty(result, 'region_level_1'),
					_geocode_region_level_2: this.getProperty(result, 'region_level_2'),
					_geocode_region_level_3: this.getProperty(result, 'region_level_3'),
					_geocode_city: this.getProperty(result, 'city'),
					_geocode_city_level_1: this.getProperty(result, 'city_level_1')
				} );

			} );

	}

	save() {
		wp.data.dispatch('core/editor').editPost({meta: {
			_related_point: this.state.points.filter( (el, i) => {
				console.log(el._geocode_full_address != __('Unknown location', 'jeo'));
				return el._geocode_full_address != __('Unknown location', 'jeo');
			})

		}}).then(() => {
			this.props.onSaveLocation()
		});

	}

	render() {
		return (
			<>
				<div>
					{__('Current points', 'jeo')}
					<ul>
						{this.state.points.map( (p, i) => (
							<li
									id={i}
									onClick={this.clickMarkerList}
									className={ this.state.currentMarkerIndex == i ? 'active' : ''}
									>
								{p._geocode_full_address}
								(
									<a
											onClick={this.deletePoint}
											marker_index={i}
											>
										{__('delete', 'jeo')}
									</a>
								)
							</li>
						))}
						<li
								onClick={this.newPoint}
								>
							{__('Add new point', 'jeo')}
						</li>
					</ul>
				</div>
				<p>{__('Search your location', 'jeo')}</p>
				<JeoGeoAutoComplete onSelect={this.onLocationFound} />

				<RadioControl
						label={ __('Relevance', 'jeo') }
						//help="The type of the current user"
						selected={ this.state.points[ this.state.currentMarkerIndex ].relevance || 'primary' }
						options={ [
							{ label: __('Primary', 'jeo'), value: 'primary' },
							{ label: __('Secondary', 'jeo'), value: 'secondary' },
						] }
						onChange={ this.relevanceClick }
						/>

				<div id="geocode-map-container">
					<LeafletMap
							center={[0,0]}
							zoom={this.state.zoom}
							whenReady={this.mapLoaded}
							ref={this.refMap}
							>
						<TileLayer
								attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
								url='https://{s}.tile.osm.org/{z}/{x}/{y}.png'
								/>
						{this.state.points.map( (p, i) => (

							<Marker
									draggable={ this.state.currentMarkerIndex == i ? true : false }
									onDragend={this.onMarkerDragged}
									position={[p._geocode_lat, p._geocode_lon]}
									id={i}
									opacity={ this.state.currentMarkerIndex == i ? 1 : 0.6 }
									>
							</Marker>

						))}

					</LeafletMap>

					<Button isDefault onClick={ () => this.save() }>
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
