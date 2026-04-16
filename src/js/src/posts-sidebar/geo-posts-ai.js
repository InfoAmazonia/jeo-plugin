import { Button, CheckboxControl, ToggleControl, Spinner } from '@wordpress/components';
import { Fragment, useState, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './geo-posts.css';

export function JeoGeocodePostsAI ({ aiSuggestedLocations, onCancel, saveAiLocations, toggleAiLocation, changeRelevance }) {
	const [ mapInstance, setMapInstance ] = useState( null );
	const [ mapReady, setMapReady ] = useState( false );
	const [ enriching, setEnriching ] = useState( {} ); // Track which items are being enriched

	// Handle map creation
	const mapCreated = ( map ) => {
		setMapInstance( map );
	};

	// Handle map loaded to fit bounds
	const mapLoaded = () => {
		setMapReady( true );
	};

	// Function to enrich data via reverse geocode
	const handleEnrich = async ( index, lat, lng ) => {
		setEnriching( prev => ( { ...prev, [ index ]: true } ) );
		
		try {
			const response = await window.fetch(
				globalThis.jeo?.ajax_url + '?action=jeo_reverse_geocode&lat=' + lat + '&lng=' + lng
			);
			const result = await response.json();

			if ( result && ! result.raw?.error ) {
				// Format a pretty full address string with more details
				let displayAddress = result.full_address || aiSuggestedLocations[ index ]._geocode_full_address;
				
				// Build structured detail parts
				const parts = [];
				if ( result.address ) {
					parts.push( result.address + ( result.address_number ? ', ' + result.address_number : '' ) );
				}
				if ( result.city_level_1 ) parts.push( result.city_level_1 );
				if ( result.city ) parts.push( result.city );
				if ( result.region_level_2 ) parts.push( result.region_level_2 );
				if ( result.postcode ) parts.push( result.postcode );
				if ( result.country ) parts.push( result.country );

				if ( parts.length > 0 ) {
					displayAddress = parts.join( ' - ' );
				}

				const enrichedData = {
					_geocode_full_address: displayAddress,
					_geocode_country: result.country || '',
					_geocode_country_code: result.country_code || '',
					_geocode_region_level_1: result.region_level_1 || '',
					_geocode_region_level_2: result.region_level_2 || '',
					_geocode_region_level_3: result.region_level_3 || '',
					_geocode_city: result.city || '',
					_geocode_city_level_1: result.city_level_1 || '',
					_geocode_address: result.address || '',
					_geocode_address_number: result.address_number || '',
					_geocode_postcode: result.postcode || '',
					_is_enriched: true
				};
				
				// Using a trick: changeRelevance now accepts an object for enrichment
				changeRelevance( index, aiSuggestedLocations[ index ].relevance, enrichedData );
			}
		} catch ( error ) {
			console.error( 'JEO: Enrichment failed', error );
		} finally {
			setEnriching( prev => ( { ...prev, [ index ]: false } ) );
		}
	};

	// Fit map bounds when map is ready and locations exist
	useEffect( () => {
		if ( mapInstance && mapReady && aiSuggestedLocations.length > 0 ) {
			const selectedLocations = aiSuggestedLocations.filter( loc => loc._selected );
			if ( selectedLocations.length > 0 ) {
				const coords = selectedLocations
					.map( ( loc ) => {
						const lat = parseFloat( loc._geocode_lat );
						const lng = parseFloat( loc._geocode_lng );
						return ( isNaN( lat ) || isNaN( lng ) ) ? null : [ lat, lng ];
					} )
					.filter( c => c !== null );

				if ( coords.length === 1 ) {
					mapInstance.setZoom( 6 );
					mapInstance.panTo( coords[ 0 ] );
				} else if ( coords.length > 1 ) {
					mapInstance.fitBounds( coords );
				}
			}
		}
	}, [ mapInstance, mapReady, aiSuggestedLocations ] );

	// Create marker icon
	const createMarkerIcon = ( isSelected ) => {
		return new L.Icon( {
			iconUrl: isSelected
				? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
				: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
			iconSize: [ 25, 41 ],
			iconAnchor: [ 12, 41 ],
		} );
	};

	// Handle marker click to fly to location
	const handleMarkerClick = ( lat, lon ) => {
		const latitude = parseFloat( lat );
		const longitude = parseFloat( lon );
		if ( mapInstance && ! isNaN( latitude ) && ! isNaN( longitude ) ) {
			mapInstance.flyTo( [ latitude, longitude ], 10 );
		}
	};

	return (
		<Fragment>
			<div style={ { marginBottom: '20px' } }>
				<p style={ { fontSize: '14px', color: '#1e1e1e', margin: '0 0 10px 0' } }>
					{ __( 'I identified these locations in your text. Review and select which ones to add to the map:', 'jeo' ) }
				</p>
			</div>

			<div style={ { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '20px', width: '100%', marginBottom: '20px', alignItems: 'flex-start', boxSizing: 'border-box', minWidth: '700px' } }>
				{/* Left column - Location list */}
				<div style={ { flex: '1', minWidth: '350px', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }>
					<div style={ {
						maxHeight: '450px',
						overflowY: 'auto',
						padding: '4px',
						display: 'flex',
						flexDirection: 'column',
						gap: '12px'
					} }>
						{ aiSuggestedLocations.map( ( loc, index ) => {
							const confidenceColor = loc.confidence >= 80 ? '#46b450' : (loc.confidence >= 50 ? '#ffb900' : '#d63638');
							const isPrimary = loc.relevance === 'primary';
							
							return (
								<div key={ index } style={ {
									background: loc._disabled ? '#f6f7f7' : '#fff',
									border: '1px solid #e0e0e0',
									borderRadius: '8px',
									padding: '16px',
									boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
									transition: 'border-color 0.2s ease',
									borderColor: loc._selected ? '#007cba' : '#e0e0e0',
									cursor: 'pointer',
									opacity: loc._disabled ? 0.7 : 1
								} }
								onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lng ) }
								>
									<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' } }>
										<div style={ { display: 'flex', alignItems: 'center' } }>
											<CheckboxControl
												checked={ loc._selected }
												onChange={ () => toggleAiLocation( index ) }
												disabled={ loc._disabled }
											/>
											<span style={ { fontSize: '15px', fontWeight: '600', color: '#1e1e1e', marginLeft: '8px' } }>
												{ loc._geocode_full_address }
												{ loc._is_enriched && <span title={ __( 'Enriched via Geocoder', 'jeo' ) } style={ { marginLeft: '5px', fontSize: '12px' } }>✅</span> }
											</span>
										</div>
										<div style={ { 
											background: confidenceColor, 
											color: '#fff', 
											padding: '2px 8px', 
											borderRadius: '12px', 
											fontSize: '11px', 
											fontWeight: 'bold' 
										} }>
											{ loc.confidence }% { __( 'confidence', 'jeo' ) }
										</div>
									</div>

									<div style={ { marginLeft: '32px' } }>
										<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '12px' } }>
											<p style={ { fontSize: '11px', color: '#757575', margin: 0, fontFamily: 'monospace' } }>
												{ `LAT: ${ Number.parseFloat(loc._geocode_lat).toFixed(4) } | LNG: ${ Number.parseFloat(loc._geocode_lng).toFixed(4) }` }
											</p>
											
											<div style={ { display: 'flex', alignItems: 'center', gap: '20px' } }>
												<Button
													variant="secondary"
													isSmall
													onClick={ ( e ) => { e.stopPropagation(); handleEnrich( index, loc._geocode_lat, loc._geocode_lng ); } }
													disabled={ enriching[ index ] || loc._disabled || !loc._selected }
												>
													{ enriching[ index ] ? <Spinner /> : __( 'Enrich Data', 'jeo' ) }
												</Button>

												<div onClick={ (e) => e.stopPropagation() }>
													<ToggleControl
														label={ isPrimary ? __( 'Primary', 'jeo' ) : __( 'Secondary', 'jeo' ) }
														checked={ isPrimary }
														disabled={ loc._disabled || !loc._selected }
														onChange={ () => changeRelevance( index, isPrimary ? 'secondary' : 'primary' ) }
														__nextHasNoMarginBottom
													/>
												</div>
											</div>
										</div>

										{ loc._ai_quote ? (
											<div style={ {
												padding: '10px 14px',
												borderLeft: '4px solid #007cba',
												background: '#f0f7ff',
												borderRadius: '0 4px 4px 0',
												fontSize: '13px',
												lineHeight: '1.5',
												fontStyle: 'italic',
												color: '#2c3338',
												marginBottom: loc._is_enriched ? '10px' : '0'
											} }>
												<strong>{ __( 'AI Context:', 'jeo' ) }</strong> "{ loc._ai_quote }"
											</div>
										) : (
											<div style={ { fontSize: '12px', color: '#a7aaad', fontStyle: 'italic', marginBottom: loc._is_enriched ? '10px' : '0' } }>
												{ __( '(No context snippet found for this location)', 'jeo' ) }
											</div>
										) }

										{ loc._is_enriched && (
											<div style={ {
												padding: '10px 14px',
												borderLeft: '4px solid #46b450',
												background: '#f0fbf0',
												borderRadius: '0 4px 4px 0',
												fontSize: '13px',
												lineHeight: '1.5',
												color: '#1e4620'
											} }>
												<strong>{ __( 'Verified Address:', 'jeo' ) }</strong> { loc._geocode_full_address }
											</div>
										) }
										
										{ loc._disabled && (
											<p style={ { color: '#d63638', fontSize: '11px', marginTop: '8px', fontWeight: '500' } }>
												{ __( 'Score too low for reliable mapping.', 'jeo' ) }
											</p>
										) }
									</div>
								</div>
							);
						} ) }
					</div>
				</div>

				{/* Right column - Map */}
				<div style={ { flex: '1', minWidth: '280px', overflow: 'hidden', display: 'flex', flexDirection: 'column' } }>
					<div id="geocode-map-container" style={ { display: 'block', height: '450px', width: '100%' } }>
						<MapContainer
							center={ [ 0, 0 ] }
							zoom={ 1 }
							whenCreated={ mapCreated }
							whenReady={ mapLoaded }
							style={ { height: '100%', width: '100%' } }
						>
							<TileLayer
								attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
							/>
							{ aiSuggestedLocations.map( ( loc, index ) => {
								const lat = parseFloat( loc._geocode_lat );
								const lng = parseFloat( loc._geocode_lng );
								if ( isNaN( lat ) || isNaN( lng ) ) return null;

								return (
									<Marker
										key={ index }
										icon={ createMarkerIcon( loc._selected ) }
										position={ [ lat, lng ] }
										opacity={ loc._selected ? 1 : 0.3 }
										onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lng ) }
									/>
								);
							} ) }
						</MapContainer>
					</div>
				</div>
			</div>

			<div style={ {
				display: 'flex',
				gap: '12px',
				justifyContent: 'flex-end',
				marginTop: '24px',
				borderTop: '1px solid #e0e0e0',
				paddingTop: '20px'
			} }>
				<Button
					variant="tertiary"
					onClick={ onCancel }
					style={ { color: '#cc1818' } }
				>
					{ __( 'Discard All', 'jeo' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ saveAiLocations }
					disabled={ ! aiSuggestedLocations.some( l => l._selected ) }
					style={ { height: '40px', padding: '0 24px' } }
				>
					{ __( 'Add to Map', 'jeo' ) }
				</Button>
			</div>
		</Fragment>
	);
}
