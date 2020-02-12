import React from 'react';
import { Map as LeafletMap, Marker, TileLayer } from 'react-leaflet';
import classNames from 'classnames';
import JeoGeoAutoComplete from './geo-auto-complete';
import { Button, RadioControl, TabPanel } from "@wordpress/components";
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
		this.clickMarkerMap = this.clickMarkerMap.bind(this);
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
	 * @param {number} point The Marker Index
	 * @param {Object} data the new data. Only attributes that change
	 */
	updatePoint( point, data ) {
		this.setState( {
			...this.state,
			points: this.state.points.map( ( value, i ) => {
				if ( i == point ) {
					return { ...value, ...data };
				}
				return value;
			} ),
		} );
	}

	updateCurrentPoint(data) {
		const marker_id = this.state.currentMarkerIndex;
		this.updatePoint( marker_id, data );
	}

	clickMarkerMap( e ) {
		this.setState( {
			currentMarkerIndex: e.target.options.id,
		} );
	}

	clickMarkerList( e ) {
		this.setState( {
			currentMarkerIndex: e.target.id,
		} );
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
				parseFloat(e._geocode_lat),
				parseFloat(e._geocode_lon)
			]
		} );

		const map = e.target;

		if ( coords.length == 1 ) {
			map.setZoom(6);
			map.panTo(coords[0]);
		} else if ( coords.length > 1 ) {
			map.fitBounds(coords);
		}

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
			<div className="jeo-geocode-posts">
				<div className="jeo-geocode-posts__column">
					<h2>{ __( 'Current points', 'jeo' ) }</h2>
					<TabPanel className="jeo-geocode-posts__tab-panel"
						activeClass="active-tab"
						tabs={ [
							{
								name: 'map',
								title: 'Map',
							},
							{
								name: 'list',
								title: 'List',
							},
						] }>
						{
							( tab ) => (
								<>
									{
										tab.name === 'list' && (
											this.state.points.length === 0 ?
												(
													__( 'No points', 'jeo' )
												) :
												(
													<ul>
														{ this.state.points.map( ( point, i ) => (
															<li
																id={ i }
																onClick={ this.clickMarkerList }
																className={ classNames([
																	'jeo-geocode-posts__post',
																	point && point.relevance || 'primary',
																	this.state.currentMarkerIndex == i && 'active'
																]) }
															>
																{ point._geocode_full_address }
																{ ' ' }
																<Button
																	isLink
																	onClick={ this.deletePoint }
																	marker_index={ i }
																>
																	{ __( 'Delete', 'jeo' ) }
																</Button>
															</li>
														) ) }
													</ul>
												)
										)
									}
									<div id="geocode-map-container" style={ { display: tab.name === 'map' ? 'block' : 'none ' } }>
										<LeafletMap
											center={ [ 0, 0 ] }
											zoom={ this.state.zoom }
											whenReady={ this.mapLoaded }
											ref={ this.refMap }
										>
											<TileLayer
												attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
												url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
											/>
											{ this.state.points.map( ( point, i ) => (
												<Marker
													draggable={ this.state.currentMarkerIndex == i }
													onDragend={ this.onMarkerDragged }
													onClick={ this.clickMarkerMap }
													position={ [ parseFloat( point._geocode_lat ), parseFloat( point._geocode_lon ) ] }
													id={ i }
													opacity={ this.state.currentMarkerIndex == i ? 1 : 0.6 }
												/>
											) ) }

										</LeafletMap>
									</div>
								</>
							)
						}
					</TabPanel>

					<div className="jeo-geocode-posts__buttons-list">
						<Button isPrimary onClick={ this.newPoint }>
							{ __( 'Add new point', 'jeo' ) }
						</Button>
					</div>
				</div>

				<div className="jeo-geocode-posts__column">
					{ this.state.points.length > 0 && (
						<div>
							<h2>{ __( 'Search your location', 'jeo' ) }</h2>
							<JeoGeoAutoComplete onSelect={ this.onLocationFound } />
							<RadioControl
									label={ __( 'Relevance', 'jeo' ) }
									//help="The type of the current user"
									selected={ this.state.points.length ? this.state.points[ this.state.currentMarkerIndex ].relevance || 'primary' : 'primary' }
									options={ [
										{ label: __( 'Primary', 'jeo' ), value: 'primary' },
										{ label: __( 'Secondary', 'jeo' ), value: 'secondary' },
									] }
									onChange={ this.relevanceClick }
									/>
						</div>
					) /* this.state.points.length */ }
				</div>

				<div className="jeo-geocode-posts__row">
					<div className="jeo-geocode-posts__buttons-list">
						<Button isDefault onClick={ this.props.onCancel }>
							{ __( 'Cancel', 'jeo' ) }
						</Button>

						<Button isPrimary onClick={ () => this.save() }>
							{ __( 'Save', 'jeo' ) }
						</Button>
					</div>
				</div>
			</div>
		);

	}
}

export default JeoGeocodePosts;
