import { Button, CheckboxControl, SelectControl } from '@wordpress/components';
import { Fragment, useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './geo-posts.css';

export function JeoGeocodePostsAI ({ aiSuggestedLocations, onCancel, saveAiLocations, toggleAiLocation, changeRelevance }) {
	const [ mapInstance, setMapInstance ] = useState( null );
	const [ mapReady, setMapReady ] = useState( false );

	// Handle map creation
	const mapCreated = ( map ) => {
		setMapInstance( map );
	};

	// Handle map loaded to fit bounds
	const mapLoaded = () => {
		setMapReady( true );
	};

	// Fit map bounds when map is ready and locations exist
	useEffect( () => {
		if ( mapInstance && mapReady && aiSuggestedLocations.length > 0 ) {
			const selectedLocations = aiSuggestedLocations.filter( loc => loc._selected );
			if ( selectedLocations.length > 0 ) {
				const coords = selectedLocations.map( ( loc ) => {
					return [
						parseFloat( loc._geocode_lat ),
						parseFloat( loc._geocode_lon ),
					];
				} );

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
		if ( mapInstance ) {
			mapInstance.flyTo( [ parseFloat( lat ), parseFloat( lon ) ], 10 );
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
								onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lon ) }
								>
									<div style={ { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' } }>
										<div style={ { display: 'flex', alignItems: 'center' } }>
											<CheckboxControl
												checked={ loc._selected }
												onChange={ () => toggleAiLocation( index ) }
												disabled={ loc._disabled }
											/>
											<span style={ { fontSize: '15px', fontWeight: '600', color: '#1e1e1e', marginLeft: '8px' } }>{ loc._geocode_full_address }</span>
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
										<div style={ { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' } }>
											<p style={ { fontSize: '11px', color: '#757575', margin: 0, fontFamily: 'monospace' } }>
												{ `LAT: ${ Number.parseFloat(loc._geocode_lat).toFixed(4) } | LNG: ${ Number.parseFloat(loc._geocode_lon).toFixed(4) }` }
											</p>
											
											<div style={ { width: '130px' } } onClick={ (e) => e.stopPropagation() }>
												<SelectControl
													label={ __( 'Relevance', 'jeo' ) }
													hideLabelFromVision={ true }
													value={ loc.relevance }
													disabled={ loc._disabled || !loc._selected }
													options={ [
														{ label: __( 'Primary', 'jeo' ), value: 'primary' },
														{ label: __( 'Secondary', 'jeo' ), value: 'secondary' },
													] }
													onChange={ ( val ) => changeRelevance( index, val ) }
													__nextHasNoMarginBottom
												/>
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
												color: '#2c3338'
											} }>
												"{ loc._ai_quote }"
											</div>
										) : (
											<div style={ { fontSize: '12px', color: '#a7aaad', fontStyle: 'italic' } }>
												{ __( '(No context snippet found for this location)', 'jeo' ) }
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
							{ aiSuggestedLocations.map( ( loc, index ) => (
								<Marker
									key={ index }
									icon={ createMarkerIcon( loc._selected ) }
									position={ [
										parseFloat( loc._geocode_lat ),
										parseFloat( loc._geocode_lon ),
									] }
									opacity={ loc._selected ? 1 : 0.3 }
									onClick={ () => handleMarkerClick( loc._geocode_lat, loc._geocode_lon ) }
								/>
							) ) }
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
