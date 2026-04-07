import { Button, CheckboxControl } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function JeoGeocodePostsAI ({ aiSuggestedLocations, onCancel, saveAiLocations, toggleAiLocation }) {
	return (
		<Fragment>
			<div style={ { marginBottom: '20px' } }>
				<p style={ { fontSize: '14px', color: '#1e1e1e', margin: '0 0 10px 0' } }>
					{ __( 'I identified these locations in your text. Review and select which ones to add to the map:', 'jeo' ) }
				</p>
			</div>

			<div style={ {
				maxHeight: '450px',
				overflowY: 'auto',
				padding: '4px',
				display: 'flex',
				flexDirection: 'column',
				gap: '12px'
			} }>
				{ aiSuggestedLocations.map( ( loc, index ) => (
					<div key={ index } style={ {
						background: '#fff',
						border: '1px solid #e0e0e0',
						borderRadius: '8px',
						padding: '16px',
						boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
						transition: 'border-color 0.2s ease',
						borderColor: loc._selected ? '#007cba' : '#e0e0e0'
					} }>
						<div style={ { display: 'flex', alignItems: 'flex-start' } }>
							<CheckboxControl
								label={ <span style={ { fontSize: '15px', fontWeight: '600', color: '#1e1e1e' } }>{ loc._geocode_full_address }</span> }
								checked={ loc._selected }
								onChange={ () => toggleAiLocation( index ) }
							/>
						</div>

						<div style={ { marginLeft: '32px' } }>
							<p style={ { fontSize: '11px', color: '#757575', margin: '4px 0 12px 0', fontFamily: 'monospace' } }>
								{ `LAT: ${ Number.parseFloat(loc._geocode_lat).toFixed(6) } | LNG: ${ Number.parseFloat(loc._geocode_lon).toFixed(6) }` }
							</p>

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
						</div>
					</div>
				) ) }
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
	)
}
