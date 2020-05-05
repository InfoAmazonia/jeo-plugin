import { Button, RadioControl } from '@wordpress/components';
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Map as LeafletMap, Marker, TileLayer } from 'react-leaflet';

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
		this.isFormDisabled = this.isFormDisabled.bind( this );
		this.fetchReverseGeocode = this.fetchReverseGeocode.bind( this );
		this.flyToLocation = this.flyToLocation.bind( this );

		this.refMap = createRef();
	}

	isFormDisabled() {
		const { searchValue } = this.state;
		return ! searchValue.replace( /\s/g, '' ).length;
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
				if ( i == point ) {
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
		this.setState( {
			currentMarkerIndex: e.target.options.id,
		} );
	}

	clickMarkerList( e ) {
		e.preventDefault();
		e.stopPropagation();
		const { formMode, currentMarkerIndex, points } = this.state;
		if ( formMode == 'view' ) {
			this.setState(
				{
					currentMarkerIndex: e.target.id,
				},
				() => {
					const point = points[ currentMarkerIndex ];
					this.flyToLocation( point._geocode_lat, point._geocode_lon );
				}
			);
		}
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
			},
			() => this.save()
		);
	}

	onClickDelete( e ) {
		e.preventDefault();
		e.stopPropagation();

		const index = e.target.attributes.marker_index.value;
		const { points } = this.state;
		this.setState(
			{
				...this.state,
				points: points.filter( ( el, i ) => i != index ),
				currentMarkerIndex: 0,
			},
			() => this.save()
		);
	}

	onClickEdit( e ) {
		e.preventDefault();
		e.stopPropagation();
		const { points } = this.state;
		const index = e.target.attributes.marker_index.value;
		const point = points[ index ];
		this.setState(
			{
				pointsCheckpoint: points,
				currentMarkerIndex: index,
				searchValue: point._geocode_full_address,
				formMode: 'edit',
			},
			() => {
				this.flyToLocation( point._geocode_lat, point._geocode_lon );
			}
		);
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
			} );

			const { formMode, points } = this.state;
			if ( formMode === 'view' ) {
				this.setState( {
					formMode: 'new',
					pointsCheckpoint: points,
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

	render() {
		const {
			currentMarkerIndex,
			points,
			searchValue,
			formMode,
			zoom,
		} = this.state;
		const selectedPoint = points[ currentMarkerIndex ];

		return (
			<div className="jeo-geocode-posts">
				<div className="jeo-geocode-posts__column">
					<div className="jeo-geocode-posts__row">
						<h2>{ __( 'Add a point', 'jeo' ) }</h2>
					</div>
					<div>
						<JeoGeoAutoComplete
							onSelect={ this.onLocationFound }
							value={ searchValue }
							onChange={ this.handleSearchValue }
						/>
						<span className="jeo-geocode-text">
							{ __(
								'Edit a point or search to create a new. You can also drag it once it was selected.',
								'jeo'
							) }
						</span>
						{ formMode != 'view' && (
							<div>
								{ ! this.isFormDisabled() ? (
									<RadioControl
										label={ __( 'Relevance', 'jeo' ) }
										selected={
											points.length ?
												selectedPoint.relevance || 'primary' :
												'primary'
										}
										options={ [
											{ label: __( 'Primary', 'jeo' ), value: 'primary' },
											{ label: __( 'Secondary', 'jeo' ), value: 'secondary' },
										] }
										onChange={ this.relevanceClick }
									/>
								) : (
									false
								) }
								<div className="jeo-geocode-posts__row">
									<div className="jeo-geocode-posts__buttons-list">
										<Button
											isSecondary
											onClick={ this.resetForm }
											disabled={ this.isFormDisabled() }
										>
											{ __( 'Cancel', 'jeo' ) }
										</Button>
										<Button
											isPrimary
											onClick={ this.handleClickSave }
											disabled={ this.isFormDisabled() }
										>
											{ formMode == 'edit' ?
												__( 'Update selected point', 'jeo' ) :
												__( 'Save new point', 'jeo' ) }
										</Button>
									</div>
								</div>
							</div>
						) }
					</div>
					<div>
						<h2>{ __( 'Current points', 'jeo' ) }</h2>
						{ points.length === 0 ? (
							__( 'No points', 'jeo' )
						) : (
							<ul>
								{ points.map( ( point, i ) => (
									<li
										id={ i }
										onClick={ this.clickMarkerList }
										className={ classNames( [
											'jeo-geocode-posts__post',
											( point && point.relevance ) || 'primary',
											currentMarkerIndex == i && 'active',
										] ) }
									>
										{ point._geocode_full_address }{ ' ' }
										{ formMode == 'view' ? (
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
										) : null }
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
							{ points.map( ( point, i ) => (
								<Marker
									draggable={ currentMarkerIndex == i && formMode != 'view' }
									onDragend={ this.onMarkerDragged }
									onClick={ formMode == 'view' ? this.clickMarkerMap : null }
									position={ [
										parseFloat( point._geocode_lat ),
										parseFloat( point._geocode_lon ),
									] }
									id={ i }
									opacity={ currentMarkerIndex == i ? 1 : 0.6 }
								/>
							) ) }
						</LeafletMap>
					</div>
				</div>
			</div>
		);
	}
}

export default JeoGeocodePosts;
