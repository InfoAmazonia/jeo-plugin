import { Button, RadioControl } from '@wordpress/components';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Map as LeafletMap, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import JeoGeoAutoComplete from './geo-auto-complete';
import './geo-posts.css';

class JeoGeocodePosts extends Component {
	constructor() {
		super();
		const metadata = wp.data
			.select( 'core/editor' )
			.getEditedPostAttribute( 'meta' );

		this.state = {
			pointsCheckpoint: [],
			formMode: 'view',
			searchValue: '',
			zoom: 1,
			points: metadata._related_point,
			currentMarkerIndex: 0,
			loadStatus: 'pending',
		};

		this.onLocationFound = this.onLocationFound.bind( this );
		this.onMarkerDragged = this.onMarkerDragged.bind( this );
		this.getProperty = this.getProperty.bind( this );
		this.save = this.save.bind( this );
		this.clickMarkerMap = this.clickMarkerMap.bind( this );
		this.clickMarkerList = this.clickMarkerList.bind( this );
		this.mapLoaded = this.mapLoaded.bind( this );
		this.relevanceClick = this.relevanceClick.bind( this );
		this.updatePoint = this.updatePoint.bind( this );
		this.updateCurrentPoint = this.updateCurrentPoint.bind( this );
		this.handleClickSave = this.handleClickSave.bind( this );
		this.onClickDelete = this.onClickDelete.bind( this );
		this.onClickEdit = this.onClickEdit.bind( this );
		this.handleSearchValue = this.handleSearchValue.bind( this );
		this.resetForm = this.resetForm.bind( this );
		this.fetchReverseGeocode = this.fetchReverseGeocode.bind( this );
		this.flyToLocation = this.flyToLocation.bind( this );
		this.renderForm = this.renderForm.bind( this );
		this.onClickNewPoint = this.onClickNewPoint.bind( this );
		this.onClickCancel = this.onClickCancel.bind( this );

		this.refMap = createRef();
	}

	onClickCancel( e ) {
		e.preventDefault();
		e.stopPropagation();
		this.resetForm();
	}

	resetForm() {
		this.setState( {
			formMode: 'view',
			searchValue: '',
		} );

		const { pointsCheckpoint } = this.state;
		this.setState(
			{
				points: pointsCheckpoint,
				pointsCheckpoint: [],
				currentMarkerIndex: 0,
			},
			() => {
				const { points, currentMarkerIndex } = this.state;
				if ( points.length > 0 ) {
					const activePoint = points[ currentMarkerIndex ];
					if ( activePoint ) {
						this.flyToLocation(
							activePoint._geocode_lat,
							activePoint._geocode_lon
						);
					}
				}
				this.save();
			}
		);
	}

	handleSearchValue( newValue ) {
		this.setState( {
			searchValue: newValue,
			loadStatus: 'pending',
		} );
	}

	/**
	 * Immutably updates info in the point object, inside the array of related points
	 *
	 * @param {number} point The Marker Index
	 * @param {Object} data the new data. Only attributes that change
	 */
	updatePoint( point, data ) {
		const { points } = this.state;
		this.setState( {
			...this.state,
			points: points.map( ( value, i ) => {
				if ( i === point ) {
					return { ...value, ...data };
				}
				return value;
			} ),
		} );
	}

	updateCurrentPoint( data ) {
		const { currentMarkerIndex } = this.state;
		this.updatePoint( currentMarkerIndex, data );
	}

	clickMarkerMap( e ) {
		const index = parseInt( e.target.options.id );
		this.setState(
			{
				currentMarkerIndex: index,
			},
			() => {
				const { currentMarkerIndex, points } = this.state;
				const currentPoint = points[ currentMarkerIndex ];
				this.flyToLocation(
					currentPoint._geocode_lat,
					currentPoint._geocode_lon
				);
			}
		);
	}

	clickMarkerList( e ) {
		const index = parseInt( e.target.id );
		this.setState(
			{
				currentMarkerIndex: index,
			},
			() => {
				const { currentMarkerIndex, points } = this.state;
				const currentPoint = points[ currentMarkerIndex ];
				this.flyToLocation(
					currentPoint._geocode_lat,
					currentPoint._geocode_lon
				);
			}
		);
	}

	relevanceClick( option ) {
		this.updateCurrentPoint( { relevance: option } );
	}

	fetchReverseGeocode( lat, lng ) {
		const response = window
			.fetch(
				jeo.ajax_url + '?action=jeo_reverse_geocode&lat=' + lat + '&lon=' + lng
			)
			.then( ( response ) => {
				return response.json();
			} );
		return response;
	}

	handleClickSave() {
		this.setState(
			{
				formMode: 'view',
				searchValue: '',
				pointsCheckpoint: [],
				loadStatus: 'pending',
			},
			() => this.save()
		);
	}

	onClickDelete( e ) {
		e.preventDefault();
		e.stopPropagation();

		const index = parseInt( e.target.attributes.marker_index.value );
		const { points } = this.state;
		this.setState(
			{
				...this.state,
				points: points.filter( ( el, i ) => i !== index ),
				currentMarkerIndex: 0,
			},
			() => this.save()
		);
	}

	onClickEdit( e ) {
		e.preventDefault();
		e.stopPropagation();

		const { points } = this.state;
		const index = parseInt( e.target.attributes.marker_index.value );
		const point = points[ index ];
		this.setState(
			{
				pointsCheckpoint: points,
				currentMarkerIndex: index,
				searchValue: point._geocode_full_address,
				formMode: 'edit',
				loadStatus: 'resolved',
			},
			() => {
				this.flyToLocation( point._geocode_lat, point._geocode_lon );
			}
		);
	}

	onClickNewPoint() {
		const { points } = this.state;

		this.setState( {
			formMode: 'new',
			pointsCheckpoint: points,
			loadStatus: 'pending',
		} );
	}

	getProperty( object, property ) {
		if ( undefined !== typeof object[ property ] ) {
			return object[ property ];
		}
		return null;
	}

	onLocationFound( location ) {
		this.flyToLocation( location.lat, location.lon );
		this.fetchReverseGeocode( location.lat, location.lon ).then( ( result ) => {
			if ( result.raw.error ) {
				return this.resetForm();
			}

			const foundPoint = {
				_geocode_lat: this.getProperty( result, 'lat' ),
				_geocode_lon: this.getProperty( result, 'lon' ),
				_geocode_full_address: this.getProperty( result, 'full_address' ),
				_geocode_country: this.getProperty( result, 'country' ),
				_geocode_country_code: this.getProperty( result, 'country_code' ),
				_geocode_region_level_1: this.getProperty( result, 'region_level_1' ),
				_geocode_region_level_2: this.getProperty( result, 'region_level_2' ),
				_geocode_region_level_3: this.getProperty( result, 'region_level_3' ),
				_geocode_city: this.getProperty( result, 'city' ),
				_geocode_city_level_1: this.getProperty( result, 'city_level_1' ),
			};

			this.setState( {
				searchValue: foundPoint._geocode_full_address,
				loadStatus: 'resolved',
			} );

			const { formMode, points, pointsCheckpoint } = this.state;
			if ( formMode === 'new' && points.length === pointsCheckpoint.length ) {
				this.setState( {
					points: [ ...points, foundPoint ],
					currentMarkerIndex: points.length,
				} );
			} else {
				this.updateCurrentPoint( foundPoint );
			}
		} );
	}

	flyToLocation( lat, lon ) {
		this.refMap.current.leafletElement.flyTo( [
			parseFloat( lat ),
			parseFloat( lon ),
		] );
	}

	mapLoaded( e ) {
		const { points } = this.state;

		const coords = points.map( ( point ) => {
			return [ parseFloat( point._geocode_lat ), parseFloat( point._geocode_lon ) ];
		} );

		const map = e.target;

		if ( coords.length === 1 ) {
			map.setZoom( 6 );
			map.panTo( coords[ 0 ] );
		} else if ( coords.length > 1 ) {
			map.fitBounds( coords );
		}
	}

	onMarkerDragged( e ) {
		const marker = e.target;
		const latLng = marker.getLatLng();
		this.onLocationFound( { lat: latLng.lat, lon: latLng.lng } );
		this.setState( { loadStatus: 'pending' } );
	}

	save() {
		const { points } = this.state;
		wp.data.dispatch( 'core/editor' ).editPost( {
			meta: {
				_related_point: points.filter( ( el ) => {
					return el._geocode_full_address !== null;
				} ),
			},
		} );
	}

	componentDidUpdate(prevProps, prevState){
		if ( ( prevState.searchValue !== this.state.searchValue ) 
			&& this.state.loadStatus !== 'resolved' ) {
				this.setState( { loadStatus: 'pending' } );
		}
	}

	renderForm() {
		const { currentMarkerIndex, points, searchValue, formMode, loadStatus } = this.state;
		let isDisabled = ! ( loadStatus === 'resolved' && 
			searchValue.replace( /\s/g, '' ).length );

		const selectedPoint = points[ currentMarkerIndex ];
		return (
			<div>
				<div>
					<JeoGeoAutoComplete
						onSelect={ this.onLocationFound }
						value={ searchValue }
						onChange={ this.handleSearchValue }
					/>
					<span className="jeo-geocode-search__hint">
						{ __( 'You can also drag the marker across the map.', 'jeo' ) }
					</span>
				</div>
				<div>
					{ ! isDisabled && (
						<RadioControl
							label={ __( 'Relevance', 'jeo' ) }
							selected={
								points.length ? selectedPoint.relevance || 'primary' : 'primary'
							}
							options={ [
								{ label: __( 'Primary', 'jeo' ), value: 'primary' },
								{ label: __( 'Secondary', 'jeo' ), value: 'secondary' },
							] }
							onChange={ this.relevanceClick }
						/>
					)  }
					<div className="jeo-geocode-posts__row">
						<div className="jeo-geocode-posts__buttons-list">
							<Button isSecondary onClick={ this.onClickCancel }>
								{ __( 'Cancel', 'jeo' ) }
							</Button>
							<Button
								isPrimary
								onClick={ this.handleClickSave }
								disabled={ isDisabled }
							>
								{ formMode === 'edit' ?
									__( 'Update selected point', 'jeo' ) :
									__( 'Save new point', 'jeo' ) }
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		const { currentMarkerIndex, formMode, zoom } = this.state;
		const pointsList = formMode !== 'new' ? this.state.points : this.state.pointsCheckpoint;
		const pointsMap = this.state.points;

		return (
			<div className="jeo-geocode-posts">
				<div className="jeo-geocode-posts__column">
					<div className="jeo-geocode-title__row">
						<h2>{ __( 'Geolocated points', 'jeo' ) }</h2>
						<div>
							{ formMode === 'view' && (
								<Button isPrimary onClick={ this.onClickNewPoint }>
									{ __( 'Add new point', 'jeo' ) }
								</Button>
							) }
						</div>
					</div>
					{ formMode === 'new' && (
						<Fragment>
							<h2>{ __( 'Add new point', 'jeo' ) }</h2>
							{ this.renderForm() }
						</Fragment>
					) }
					<div>
						<h2>{ __( 'Current points', 'jeo' ) }</h2>
						{ pointsList.length === 0 ? (
							__( 'No points', 'jeo' )
						) : (
							<ul>
								{ pointsList.map( ( point, i ) => (
									<li
										id={ i }
										onClick={ formMode === 'view' ? this.clickMarkerList : null }
										className={ classNames( [
											'jeo-geocode-posts__post',
											( point && point.relevance ) || 'primary',
											currentMarkerIndex === i && 'active',
										] ) }
									>
										{ point._geocode_full_address }{ ' ' }
										{ formMode === 'view' ? (
											<Fragment>
												<Button
													isLink
													onClick={ this.onClickDelete }
													marker_index={ i }
												>
													{ __( 'Delete', 'jeo' ) }
												</Button>
												<span> | </span>
												<Button
													isLink
													onClick={ this.onClickEdit }
													marker_index={ i }
												>
													{ __( 'Edit', 'jeo' ) }
												</Button>
											</Fragment>
										) : (
											formMode === 'edit' &&
											currentMarkerIndex === i &&
											this.renderForm()
										) }
									</li>
								) ) }
							</ul>
						) }
					</div>
				</div>

				<div className="jeo-geocode-posts__column">
					<div id="geocode-map-container" style={ { display: 'block' } }>
						<LeafletMap
							center={ [ 0, 0 ] }
							zoom={ zoom }
							whenReady={ this.mapLoaded }
							ref={ this.refMap }
						>
							<TileLayer
								attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
							/>
							{ pointsMap.map( ( point, i ) => {
								let icon;

								if ( ! point.relevance || point.relevance === 'primary' ) {
									icon = new L.Icon({
										iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
										iconSize:     [25, 41],
										iconAnchor:   [12, 41],
									})
								} else {
									icon = new L.Icon({
										iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
										iconSize:     [25, 41],
										iconAnchor:   [12, 41],
									})
								}

								return (
									<Marker
										icon={ icon }
										draggable={ currentMarkerIndex === i && formMode !== 'view' }
										onDragend={ this.onMarkerDragged }
										onClick={ formMode === 'view' ? this.clickMarkerMap : null }
										position={ [
											parseFloat( point._geocode_lat ),
											parseFloat( point._geocode_lon ),
										] }
										id={ i }
										opacity={ currentMarkerIndex === i ? 1 : 0.6 }
									/>
								)
							} ) }
						</LeafletMap>
					</div>
				</div>
			</div>
		);
	}
}

export default JeoGeocodePosts;
