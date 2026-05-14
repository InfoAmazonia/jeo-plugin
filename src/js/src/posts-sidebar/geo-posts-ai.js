import { Button, CheckboxControl, ToggleControl, Spinner } from '@wordpress/components';
import { Fragment, useState, useEffect, useRef } from '@wordpress/element';
import { useDraggable } from './use-draggable';
import { __, sprintf } from '@wordpress/i18n';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './geo-posts.css';

export function JeoGeocodePostsAI ({ aiSuggestedLocations, isAIProcessing, onCancel, saveAiLocations, toggleAiLocation, changeRelevance, onRetry }) {
	const [ mapInstance, setMapInstance ] = useState( null );
	const [ mapReady, setMapReady ] = useState( false );
	const [ enriching, setEnriching ] = useState( {} ); // Track which items are being enriched
	const [ isMinimized, setIsMinimized ] = useState( false );
	const { position: panelPos, bindDrag: panelDrag } = useDraggable();

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
				globalThis.jeo?.ajax_url + '?action=jeo_reverse_geocode&lat=' + lat + '&lon=' + lng
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
			const coords = aiSuggestedLocations
				.map( ( loc ) => {
					const lat = parseFloat( loc._geocode_lat );
					const lng = parseFloat( loc._geocode_lon );
					return ( isNaN( lat ) || isNaN( lng ) ) ? null : [ lat, lng ];
				} )
				.filter( c => c !== null );

			if ( coords.length === 1 ) {
				mapInstance.setZoom( 10 );
				mapInstance.panTo( coords[ 0 ] );
			} else if ( coords.length > 1 ) {
				mapInstance.fitBounds( coords );
			}
		}
	}, [ mapInstance, mapReady, aiSuggestedLocations ] );

	// Create marker icon
	const pinUrls = window.jeo?.pin_urls || {
		primary: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-blue.png',
		secondary: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-grey.png',
	};
	const createMarkerIcon = ( isSelected ) => {
		return new L.Icon( {
			iconUrl: isSelected ? pinUrls.primary : pinUrls.secondary,
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

	const selectedCount = aiSuggestedLocations.filter( l => l._selected ).length;

	return (
		<Fragment>
			<div className="jeo-geocode-modal__container">
				{/* Fullscreen map */}
				<div className="jeo-geocode-modal__map">
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
							const lng = parseFloat( loc._geocode_lon );
							if ( isNaN( lat ) || isNaN( lng ) ) return null;

							return (
								<Marker
									key={ index }
									icon={ createMarkerIcon( loc._selected ) }
									position={ [ lat, lng ] }
									opacity={ loc._selected ? 1 : 0.3 }
									onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lon ) }
								/>
							);
						} ) }
					</MapContainer>
				</div>

				{/* Floating overlay panel */}
				<div
					className={ `jeo-geocode-modal__panel ${ isMinimized ? 'is-collapsed' : '' }` }
					style={ { transform: `translate(${ panelPos.x }px, ${ panelPos.y }px)` } }
				>
					<div
						className="jeo-geocode-modal__panel-header"
					>
						<h3
							{ ...panelDrag }
							style={ { userSelect: 'none' } }
						>
							{ isMinimized
								? sprintf( __( 'AI Suggestions (%d selected)', 'jeo' ), selectedCount )
								: __( 'Review AI Suggestions', 'jeo' )
							}
						</h3>
						<button
							className="jeo-geocode-modal__panel-toggle"
							onClick={ ( e ) => { e.stopPropagation(); setIsMinimized( ! isMinimized ); } }
							type="button"
							aria-label={ isMinimized ? __( 'Expand panel', 'jeo' ) : __( 'Minimize panel', 'jeo' ) }
						>
							{ isMinimized ? '▶' : '◀' }
						</button>
					</div>

					{ ! isMinimized && (
						<div className="jeo-geocode-modal__panel-content">
							<p style={ { fontSize: '13px', color: '#50575e', margin: '0 0 12px 0' } }>
								{ __( 'Select locations to add to the map:', 'jeo' ) }
							</p>
							<div style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: '10px'
							} }>
								{ aiSuggestedLocations.map( ( loc, index ) => {
									const confidenceColor = loc.confidence >= 80 ? '#46b450' : (loc.confidence >= 50 ? '#ffb900' : '#d63638');
									const isPrimary = loc.relevance === 'primary';
									
									return (
										<div key={ index } style={ {
											background: loc._disabled ? '#f6f7f7' : '#fff',
											border: '1px solid #e0e0e0',
											borderRadius: '8px',
											padding: '12px',
											boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
											transition: 'border-color 0.2s ease',
											borderColor: loc._selected ? '#007cba' : '#e0e0e0',
											cursor: 'pointer',
											opacity: loc._disabled ? 0.7 : 1
										} }
										onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lon ) }
										>
											<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } }>
												<div style={ { display: 'flex', alignItems: 'center', gap: '6px' } }>
													<CheckboxControl
														checked={ loc._selected }
														onChange={ () => toggleAiLocation( index ) }
														disabled={ loc._disabled }
													/>
													<span style={ { fontSize: '14px', fontWeight: '600', color: '#1e1e1e' } }>
														{ loc._geocode_full_address }
														{ loc._is_enriched && <span title={ __( 'Enriched via Geocoder', 'jeo' ) } style={ { marginLeft: '4px', fontSize: '12px' } }>✅</span> }
														{ isPrimary && <span title={ __( 'AI flagged this as primary location', 'jeo' ) } style={ { marginLeft: '4px', fontSize: '11px', background: '#e0f0fa', color: '#005a9e', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' } }>★ { __( 'Primary', 'jeo' ) }</span> }
													</span>
												</div>
												<div style={ { 
													background: confidenceColor, 
													color: '#fff', 
													padding: '1px 6px', 
													borderRadius: '10px', 
													fontSize: '10px', 
													fontWeight: 'bold' 
												} }>
													{ loc.confidence }%
												</div>
											</div>

											<div style={ { marginLeft: '28px' } }>
												<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' } }>
													<p style={ { fontSize: '10px', color: '#757575', margin: 0, fontFamily: 'monospace' } }>
														{ `${ Number.parseFloat(loc._geocode_lat).toFixed(4) }, ${ Number.parseFloat(loc._geocode_lon).toFixed(4) }` }
													</p>
													
													<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
														<Button
															variant="secondary"
															isSmall
															onClick={ ( e ) => { e.stopPropagation(); handleEnrich( index, loc._geocode_lat, loc._geocode_lon ); } }
															disabled={ enriching[ index ] || loc._disabled || !loc._selected }
														>
															{ enriching[ index ] ? <Spinner /> : __( 'Enrich', 'jeo' ) }
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
														padding: '8px 10px',
														borderLeft: '3px solid #007cba',
														background: '#f0f7ff',
														borderRadius: '0 4px 4px 0',
														fontSize: '12px',
														lineHeight: '1.4',
														fontStyle: 'italic',
														color: '#2c3338',
														marginBottom: loc._is_enriched ? '8px' : '0'
													} }>
														<strong>{ __( 'Context:', 'jeo' ) }</strong> "{ loc._ai_quote }"
													</div>
												) : null }

												{ loc._is_enriched && (
													<div style={ {
														padding: '8px 10px',
														borderLeft: '3px solid #46b450',
														background: '#f0fbf0',
														borderRadius: '0 4px 4px 0',
														fontSize: '12px',
														lineHeight: '1.4',
														color: '#1e4620'
													} }>
														<strong>{ __( 'Verified:', 'jeo' ) }</strong> { loc._geocode_full_address }
													</div>
												) }
												
												{ loc._disabled && (
													<p style={ { color: '#d63638', fontSize: '11px', marginTop: '6px', fontWeight: '500' } }>
														{ __( 'Score too low for reliable mapping.', 'jeo' ) }
													</p>
												) }
											</div>
										</div>
									);
								} ) }
								<div style={ { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' } }>
									<Button
										variant="tertiary"
										onClick={ onCancel }
										style={ { color: '#cc1818' } }
									>
										{ __( 'Discard All', 'jeo' ) }
									</Button>
									<Button
										variant="secondary"
										isBusy={ isAIProcessing }
										disabled={ isAIProcessing }
										onClick={ onRetry }
										style={ { height: '36px' } }
									>
										{ isAIProcessing ? __( 'Retrying...', 'jeo' ) : __( 'Retry AI', 'jeo' ) }
									</Button>
									<Button
										variant="primary"
										onClick={ saveAiLocations }
										disabled={ ! aiSuggestedLocations.some( l => l._selected ) || isAIProcessing }
										style={ { height: '36px', padding: '0 20px' } }
									>
										{ __( 'Add to Map', 'jeo' ) }
									</Button>
								</div>
							</div>
						</div>
					) }
				</div>
			</div>
		</Fragment>
	);
}
