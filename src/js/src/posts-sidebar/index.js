import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { Modal, Button, Notice, CheckboxControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import JeoGeocodePosts from './geo-posts';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const JeoGeocodePanel = class JeoGeocodePanel extends Component {
	constructor() {
		super();
		this.state = {
			isOpen: false,
			isAIProcessing: false,
			aiError: null,
			isApprovalModalOpen: false,
			aiSuggestedLocations: [],
		};
		this.handleAIGeoreference = this.handleAIGeoreference.bind( this );
		this.saveAiLocations = this.saveAiLocations.bind( this );
		this.toggleAiLocation = this.toggleAiLocation.bind( this );
	}

	async handleAIGeoreference() {
		this.setState( { isAIProcessing: true, aiError: null } );

		const { postId, title, content } = this.props;

		try {
			const locations = await apiFetch( {
				path: '/jeo/v1/ai-georeference',
				method: 'POST',
				data: {
					post_id: postId,
					title: title,
					content: content,
				},
			} );

			if ( locations && Array.isArray( locations ) ) {
				if ( locations.length === 0 ) {
					this.setState( { isAIProcessing: false, aiError: __( 'No locations found by the AI.', 'jeo' ) } );
					return;
				}

				const formattedPoints = locations.map( ( loc, index ) => ( {
					id: index,
					relevance: 'primary',
					_geocode_lat: String( loc.lat ),
					_geocode_lon: String( loc.lng ),
					_geocode_full_address: loc.name || '',
					_geocode_country: '',
					_geocode_country_code: '',
					_geocode_region_level_1: '',
					_geocode_region_level_2: '',
					_geocode_region_level_3: '',
					_geocode_city: '',
					_geocode_city_level_1: '',
					_ai_quote: loc.quote || '', // Armazena o trecho onde foi encontrado para o Modal Visual
					_selected: true, // Auto-select items by default
				} ) );

				// Show the intermediate approval modal instead of saving immediately
				this.setState( {
					aiSuggestedLocations: formattedPoints,
					isApprovalModalOpen: true,
					isAIProcessing: false
				} );
			} else {
				throw new Error( __( 'Invalid response from AI.', 'jeo' ) );
			}
		} catch ( error ) {
			this.setState( {
				isAIProcessing: false,
				aiError: error.message || __( 'Error processing AI georeference.', 'jeo' ),
			} );
		}
	}

	toggleAiLocation( index ) {
		const newLocations = [ ...this.state.aiSuggestedLocations ];
		newLocations[ index ]._selected = ! newLocations[ index ]._selected;
		this.setState( { aiSuggestedLocations: newLocations } );
	}

	saveAiLocations() {
		// Filter only selected points and map them to the exact Schema expected by JEO Backend
		const selectedPoints = this.state.aiSuggestedLocations
			.filter( loc => loc._selected )
			.map( loc => {
				return {
					relevance: 'primary',
					_geocode_lat: String( loc._geocode_lat ),
					_geocode_lon: String( loc._geocode_lon ),
					_geocode_full_address: loc._geocode_full_address || '',
					_geocode_country: '',
					_geocode_country_code: '',
					_geocode_region_level_1: '',
					_geocode_region_level_2: '',
					_geocode_region_level_3: '',
					_geocode_city: '',
					_geocode_city_level_1: '',
					_ai_quote: loc._ai_quote || '', // Persiste o trecho no banco de dados para o Dashboard
				};
			});

		// Merge Additively with current map points (preserve old points)
		const currentMeta = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' );
		const currentPoints = currentMeta._related_point || [];
		const newPoints = [ ...currentPoints, ...selectedPoints ];

		wp.data.dispatch( 'core/editor' ).editPost( {
			meta: {
				_related_point: newPoints,
			},
		} );

		// Close approval modal and open the primary Map modal for the user to review
		this.setState( {
			isApprovalModalOpen: false,
			aiSuggestedLocations: [],
			isOpen: true
		} );
	}

	render() {
		const { isOpen, isAIProcessing, aiError, isApprovalModalOpen, aiSuggestedLocations } = this.state;

		// Fallback se window.jeo não existir, com tradução (Ex: 'Georeference with Google Gemini')
		const aiProviderName = window.jeo && window.jeo.ai_provider_name ? window.jeo.ai_provider_name : 'AI';

		return (
			<Fragment>
				<div style={ { display: 'flex', flexDirection: 'column', gap: '10px' } }>
					<Button
						variant="secondary"
						onClick={ () => this.setState( { isOpen: true } ) }
						style={ { width: '100%', justifyContent: 'center' } }
					>
						{ __( 'Geolocate this post', 'jeo' ) }
					</Button>
					<Button
						variant="secondary"
						isBusy={ isAIProcessing }
						disabled={ isAIProcessing }
						onClick={ this.handleAIGeoreference }
						style={ { width: '100%', justifyContent: 'center' } }
					>
						{ isAIProcessing
							? __( 'Processing AI...', 'jeo' )
							// translators: %s is the AI provider (e.g. Google Gemini, DeepSeek, etc.)
							: sprintf( __( 'Geolocate with %s', 'jeo' ),  aiProviderName )
						}
					</Button>
				</div>

				{ aiError && (
					<Notice status="error" onRemove={ () => this.setState( { aiError: null } ) }>
						{ aiError }
					</Notice>
				) }

				{ isApprovalModalOpen && (
					<Modal
						title={ __( 'Review AI Suggestions', 'jeo' ) }
						onRequestClose={ () => this.setState( { isApprovalModalOpen: false } ) }
						style={ { width: '550px' } }
					>
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
											onChange={ () => this.toggleAiLocation( index ) }
										/>
									</div>

									<div style={ { marginLeft: '32px' } }>
										<p style={ { fontSize: '11px', color: '#757575', margin: '4px 0 12px 0', fontFamily: 'monospace' } }>
											{ `LAT: ${ parseFloat(loc._geocode_lat).toFixed(6) } | LNG: ${ parseFloat(loc._geocode_lon).toFixed(6) }` }
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
								onClick={ () => this.setState( { isApprovalModalOpen: false } ) }
								style={ { color: '#cc1818' } }
							>
								{ __( 'Discard All', 'jeo' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ this.saveAiLocations }
								disabled={ ! aiSuggestedLocations.some( l => l._selected ) }
								style={ { height: '40px', padding: '0 24px' } }
							>
								{ __( 'Add to Map', 'jeo' ) }
							</Button>
						</div>
					</Modal>
				) }

				{ isOpen && (
					<Modal
						title={ __( 'Geolocate this post', 'jeo' ) }
						onRequestClose={ () => this.setState( { isOpen: false } ) }
						className="jeo-geocode-modal"
						isFullScreen={ true }
					>
						<JeoGeocodePosts
							onSaveLocation={ () => this.setState( { isOpen: false } ) }
							onCancel={ () => this.setState( { isOpen: false } ) }
						/>
					</Modal>
				) }
			</Fragment>
		);
	}
};

registerPlugin( 'jeo-posts-sidebar', {
	icon: null,
	render: () => {
		const postData = useSelect( ( select ) => {
			const editor = select( 'core/editor' );
			return {
				postId: editor.getCurrentPostId(),
				title: editor.getEditedPostAttribute( 'title' ),
				content: editor.getEditedPostAttribute( 'content' ),
				postType: editor.getCurrentPostType(),
			};
		}, [] );

		return (
			<div>
				{ postData.postType ?
					<PluginDocumentSettingPanel title={ __( 'Geolocation', 'jeo' ) }>
						<JeoGeocodePanel
							postId={ postData.postId }
							title={ postData.title }
							content={ postData.content }
						/>
					</PluginDocumentSettingPanel>
				: null }
			</div>
		);
	},
} );
