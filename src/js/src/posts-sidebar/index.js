import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { Component, Fragment } from '@wordpress/element';
import { Modal, Button, Notice } from '@wordpress/components';
import { sprintf, __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import JeoGeocodePosts from './geo-posts';
import { JeoGeocodePostsAI } from './geo-posts-ai';

const JeoGeocodePanel = ( props ) => {
	const { postId, title, content } = props;
	const [ state, setState ] = wp.element.useState( {
		isOpen: false,
		isAIProcessing: false,
		aiError: null,
		isApprovalModalOpen: false,
		aiSuggestedLocations: [],
	} );

	const meta = useSelect( ( select ) => select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {} );
	const pendingLocations = meta._jeo_ai_pending_point || [];

	const handleAIGeoreference = async () => {
		setState( ( prev ) => ( { ...prev, isAIProcessing: true, aiError: null } ) );

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
					setState( ( prev ) => ( { ...prev, isAIProcessing: false, aiError: __( 'No locations found by the AI.', 'jeo' ) } ) );
					return;
				}

				const formattedPoints = locations.map( ( loc, index ) => {
					const confidence = loc.confidence ?? 100;
					let relevance = 'primary';
					let selected = true;
					let disabled = false;

					if ( confidence < 35 ) {
						relevance = 'secondary';
						selected = false;
						disabled = true;
					} else if ( confidence < 75 ) {
						relevance = 'secondary';
					}

					return {
						id: index,
						relevance: relevance,
						confidence: confidence,
						_geocode_lat: parseFloat( loc.lat ),
						_geocode_lon: parseFloat( loc.lng ),						_geocode_full_address: loc.name || '',
						_geocode_country: '',
						_geocode_country_code: '',
						_geocode_region_level_1: '',
						_geocode_region_level_2: '',
						_geocode_region_level_3: '',
						_geocode_city: '',
						_geocode_city_level_1: '',
						_ai_quote: loc.quote || '',
						_selected: selected,
						_disabled: disabled,
					};
				} );

				setState( ( prev ) => ( {
					...prev,
					aiSuggestedLocations: formattedPoints,
					isApprovalModalOpen: true,
					isAIProcessing: false
				} ) );
			} else {
				throw new Error( __( 'Invalid response from AI.', 'jeo' ) );
			}
		} catch ( error ) {
			setState( ( prev ) => ( {
				...prev,
				isAIProcessing: false,
				aiError: error.message || __( 'Error processing AI georeference.', 'jeo' ),
			} ) );
		}
	};

	const toggleAiLocation = ( index ) => {
		if ( state.aiSuggestedLocations[ index ]._disabled ) return;
		const newLocations = [ ...state.aiSuggestedLocations ];
		newLocations[ index ]._selected = ! newLocations[ index ]._selected;
		setState( ( prev ) => ( { ...prev, aiSuggestedLocations: newLocations } ) );
	};

	const changeRelevance = ( index, relevance, enrichment = {} ) => {
		const newLocations = [ ...state.aiSuggestedLocations ];
		newLocations[ index ].relevance = relevance;
		
		// If enrichment data is provided, merge it into the location
		if ( Object.keys( enrichment ).length > 0 ) {
			newLocations[ index ] = { ...newLocations[ index ], ...enrichment };
		}

		setState( ( prev ) => ( { ...prev, aiSuggestedLocations: newLocations } ) );
	};

	const saveAiLocations = () => {
		const selectedPoints = state.aiSuggestedLocations
			.filter( loc => loc._selected )
			.map( loc => ( {
				relevance: loc.relevance || 'primary',
				_geocode_lat: parseFloat( String( loc._geocode_lat || 0 ).replace( ',', '.' ) ),
				_geocode_lon: parseFloat( String( loc._geocode_lon || 0 ).replace( ',', '.' ) ),
				_geocode_full_address: loc._geocode_full_address || '',
				_geocode_country: loc._geocode_country || '',
				_geocode_country_code: loc._geocode_country_code || '',
				_geocode_region_level_1: loc._geocode_region_level_1 || '',
				_geocode_region_level_2: loc._geocode_region_level_2 || '',
				_geocode_region_level_3: loc._geocode_region_level_3 || '',
				_geocode_city: loc._geocode_city || '',
				_geocode_city_level_1: loc._geocode_city_level_1 || '',
				_geocode_address: loc._geocode_address || '',
				_geocode_address_number: loc._geocode_address_number || '',
				_geocode_postcode: loc._geocode_postcode || '',
				_ai_quote: loc._ai_quote || '',
			} ) );

		const currentPoints = ( meta._related_point || [] ).map( p => {
			const lat = parseFloat( String( p._geocode_lat ).replace( ',', '.' ) );
			const lon = parseFloat( String( p._geocode_lon || '' ).replace( ',', '.' ) );
			return {
				...p,
				_geocode_lat: isNaN( lat ) ? 0 : lat,
				_geocode_lon: isNaN( lon ) ? 0 : lon
			};
		} );

		const newPoints = [ ...currentPoints, ...selectedPoints ];

		wp.data.dispatch( 'core/editor' ).editPost( {
			meta: {
				...meta,
				_related_point: newPoints,
				_jeo_ai_pending_point: [],
				_jeo_legacy_status: 'approved'
			},
		} );

		setState( ( prev ) => ( {
			...prev,
			isApprovalModalOpen: false,
			aiSuggestedLocations: [],
			isOpen: true
		} ) );
	};

	const handleReviewPending = () => {
		const formattedPoints = pendingLocations.map( ( loc, index ) => {
			const confidence = loc.confidence ?? 100;
			let relevance = 'primary';
			let selected = true;
			let disabled = false;

			if ( confidence < 35 ) {
				relevance = 'secondary';
				selected = false;
				disabled = true;
			} else if ( confidence < 75 ) {
				relevance = 'secondary';
			}

			return {
				id: index,
				relevance: relevance,
				confidence: confidence,
				_geocode_lat: parseFloat( loc.lat ),
				_geocode_lon: parseFloat( loc.lng ),				_geocode_full_address: loc.name || '',
				_geocode_country: '',
				_geocode_country_code: '',
				_geocode_region_level_1: '',
				_geocode_region_level_2: '',
				_geocode_region_level_3: '',
				_geocode_city: '',
				_geocode_city_level_1: '',
				_ai_quote: loc.quote || '',
				_selected: selected,
				_disabled: disabled,
			};
		} );

		setState( ( prev ) => ( {
			...prev,
			aiSuggestedLocations: formattedPoints,
			isApprovalModalOpen: true,
		} ) );
	};

	const { isOpen, isAIProcessing, aiError, isApprovalModalOpen, aiSuggestedLocations } = state;
	const aiProviderName = globalThis.jeo?.ai_provider_name ?? _x( 'AI', 'Artifical Intelligence', 'jeo' );

	return (
		<Fragment>
			{ pendingLocations.length > 0 && (
				<Notice status="warning" isDismissible={ false }>
					<p>{ sprintf( __( 'AI found %d locations during bulk processing.', 'jeo' ), pendingLocations.length ) }</p>
					<Button variant="primary" onClick={ handleReviewPending }>
						{ __( 'Review Suggestions', 'jeo' ) }
					</Button>
				</Notice>
			) }

			<div style={ { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' } }>
				<Button
					variant="secondary"
					onClick={ () => setState( ( prev ) => ( { ...prev, isOpen: true } ) ) }
					style={ { width: '100%', justifyContent: 'center' } }
				>
					{ __( 'Geolocate this post', 'jeo' ) }
				</Button>
				<Button
					variant="secondary"
					isBusy={ isAIProcessing }
					disabled={ isAIProcessing }
					onClick={ handleAIGeoreference }
					style={ { width: '100%', justifyContent: 'center' } }
				>
					{ isAIProcessing
						? __( 'Processing AI...', 'jeo' )
						: __( 'Geolocate with AI', 'jeo' )
					}
				</Button>
			</div>

			{ aiError && (
				<Notice status="error" onRemove={ () => setState( ( prev ) => ( { ...prev, aiError: null } ) ) }>
					{ aiError }
				</Notice>
			) }

			{ isApprovalModalOpen && (
				<Modal
					title={ __( 'Review AI Suggestions', 'jeo' ) }
					onRequestClose={ () => setState( ( prev ) => ( { ...prev, isApprovalModalOpen: false } ) ) }
					className="jeo-geocode-modal"
					isFullScreen={ true }
				>
					<JeoGeocodePostsAI
						aiSuggestedLocations={ aiSuggestedLocations }
						saveAiLocations={ saveAiLocations }
						toggleAiLocation={ toggleAiLocation }
						changeRelevance={ changeRelevance }
						onCancel={ () => setState( ( prev ) => ( { ...prev, isApprovalModalOpen: false }) ) }
					/>
				</Modal>
			) }

			{ isOpen && (
				<Modal
					title={ __( 'Geolocate this post', 'jeo' ) }
					onRequestClose={ () => setState( ( prev ) => ( { ...prev, isOpen: false } ) ) }
					className="jeo-geocode-modal"
					isFullScreen={ true }
				>
					<JeoGeocodePosts
						onSaveLocation={ () => setState( ( prev ) => ( { ...prev, isOpen: false } ) ) }
						onCancel={ () => setState( ( prev ) => ( { ...prev, isOpen: false } ) ) }
					/>
				</Modal>
			) }
		</Fragment>
	);
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
