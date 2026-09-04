import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, Notice, PanelBody, Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { debounce } from 'lodash';
import { __, _x } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import LayersSettingsModal from './layers-settings-modal';
import { MemoizedRenderLayer } from './map-preview-layer';
import {
	applyStyleLayerFiltering,
	findStyleLayer,
	styleLayerMapProps,
} from './use-style-layer';
import {
	applyComposedVisibilityFromSettings,
	handleEditorMapPreviewError,
	hasMapboxStyleLayers,
	useComposedPayloadPreviewStyle,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';
import { coerceMinimapAttributes } from './minimap-config';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import { useRecordsByIds } from '../shared/rest-records';
import { RadioControl, SelectControl, TextareaControl } from '../shared/wp-form-controls';
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = globalThis.jeo_settings;

const LOADING_MESSAGES = [
	__( 'Analyzing content…', 'jeowp' ),
	__( 'Searching for map layers…', 'jeowp' ),
	__( 'Generating map configuration…', 'jeowp' ),
];

function generateUUID() {
	if ( typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ) {
		try {
			return crypto.randomUUID();
		} catch ( e ) {
			// Fall through to manual UUID.
		}
	}

	const bytes = new Uint8Array( 16 );
	if ( typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function' ) {
		crypto.getRandomValues( bytes );
	} else {
		for ( let i = 0; i < 16; i++ ) {
			bytes[ i ] = Math.floor( Math.random() * 256 );
		}
	}

	// Set version (4) and variant (RFC4122) bits.
	bytes[ 6 ] = ( bytes[ 6 ] & 0x0f ) | 0x40;
	bytes[ 8 ] = ( bytes[ 8 ] & 0x3f ) | 0x80;

	const hex = Array.from( bytes, ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
	return `${ hex.slice( 0, 8 ) }-${ hex.slice( 8, 12 ) }-${ hex.slice( 12, 16 ) }-${ hex.slice( 16, 20 ) }-${ hex.slice( 20 ) }`;
}

export default function MinimapEditor( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const postId = useSelect( ( select ) =>
		select( 'core/editor' ).getCurrentPostId(), [] );
	const [ modal, setModal ] = useState( false );
	const [ baseVariant, setBaseVariant ] = useState(
		attributes.base_layer?.variant || 'dark'
	);
	const [ chatLoading, setChatLoading ] = useState( false );
	const [ chatInput, setChatInput ] = useState( '' );
	const [ chatPromptVisible, setChatPromptVisible ] = useState( false );
	const [ chatPrompt, setChatPrompt ] = useState( '' );
	const [ loadingMsgIndex, setLoadingMsgIndex ] = useState( 0 );
	const messagesEndRef = useRef( null );
	const attrsRef = useRef( attributes );
	attrsRef.current = attributes;

	useEffect( () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	}, [ attributes.conversation ] );

	useEffect( () => {
		if ( 'ready' === attributes.status && ! attributes.conversation_id ) {
			setAttributes( { conversation_id: generateUUID() } );
		}
	}, [ attributes.status, attributes.conversation_id, setAttributes ] );

	useEffect( () => {
		if ( attributes.status !== 'loading' ) {
			setLoadingMsgIndex( 0 );
			return;
		}
		const timer = setInterval( () => {
			setLoadingMsgIndex( ( i ) => ( i + 1 ) % LOADING_MESSAGES.length );
		}, 3000 );
		return () => clearInterval( timer );
	}, [ attributes.status ] );

	const normalizedAttributes = useMemo( () => {
		return coerceMinimapAttributes( attributes, {
			center_lat: mapDefaults.lat,
			center_lon: mapDefaults.lng,
			initial_zoom: mapDefaults.zoom,
			min_zoom: 0,
			max_zoom: 20,
		} );
	}, [ attributes ] );

	const allLayers = useMemo( () => {
		const list = [];
		if ( attributes.base_layer ) {
			list.push( attributes.base_layer );
		}
		if ( attributes.layers ) {
			list.push( ...attributes.layers );
		}
		return list;
	}, [ attributes.base_layer, attributes.layers ] );

	const layerIds = useMemo( () => {
		return allLayers.map( ( l ) => l.id ).filter( ( id ) => id > 0 );
	}, [ allLayers ] );

	const { records: loadedLayers = [], isLoading: loadingLayers } = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

	const styleBase = useMemo(
		() => findStyleLayer( loadedLayers, allLayers ),
		[ loadedLayers, allLayers ]
	);

	const layerSettingsKey = useMemo(
		() => JSON.stringify( allLayers || [] ),
		[ allLayers ]
	);
	const hasMapboxLayers = hasMapboxStyleLayers( loadedLayers );
	const composedPayload = useMemo( () => ( {
		scope: 'preview',
		kind: 'minimap',
		postId,
		blockId: clientId,
		layers: allLayers || [],
	} ), [ postId, clientId, layerSettingsKey ] );
	const composedPreview = useComposedPayloadPreviewStyle( {
		enabled: hasMapboxLayers,
		payload: composedPayload,
		refreshKey: layerSettingsKey,
	} );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	const isPreparingComposedPreview = Boolean(
		! loadingLayers &&
			hasMapboxLayers &&
			! composedPreview.style &&
			! composedPreview.error
	);
	const transformRequest = useEditorMapboxTransformRequest( loadedLayers );
	const applyComposedVisibility = useCallback( () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSettings(
				mapRef.current,
				composedPreview.manifest,
				allLayers || []
			);
		}
	}, [
		composedPreview.manifest,
		layerSettingsKey,
		useComposedPreview,
	] );

	useEffect( () => {
		applyComposedVisibility();
	}, [ applyComposedVisibility ] );

	const generate = useCallback( () => {
		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Cannot generate: post ID is not available yet. Save the post first.' );
			setAttributes( {
				status: 'error',
				message: __( 'Save the post before generating the map.', 'jeowp' ),
			} );
			return;
		}

		setAttributes( { status: 'loading' } );

		const convId = attrsRef.current.conversation_id || generateUUID();

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup',
				method: 'POST',
				data: { post_id: postId, conversation_id: convId },
			} )
				.then( ( response ) => {
					if ( response.success ) {
						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							message: response.message || '',
							conversation_id: convId,
							conversation: [
								...( attrsRef.current.conversation || [] ),
								{
									role: 'assistant',
									text: response.message || __( 'Map generated from post content.', 'jeowp' ),
									ts: new Date().toISOString(),
								},
							],
						};

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
					} else {
						setAttributes( {
							status: 'error',
							message: response.message || __( 'Failed to suggest layers.', 'jeowp' ),
						} );
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( '[JEO Minimap] Setup request failed:', error );
					setAttributes( {
						status: 'error',
						message: error.message || __( 'Request failed.', 'jeowp' ),
					} );
				} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during setup:', syncError );
			setAttributes( {
				status: 'error',
				message: syncError.message || __( 'Could not start map generation.', 'jeowp' ),
			} );
		}
	}, [ setAttributes ] );

	const sendChat = useCallback( ( message, type = 'text', payload = {} ) => {
		if ( chatLoading ) {
			return;
		}
		const text = message || '';
		if ( ! text.trim() && 'regenerate' !== type ) {
			return;
		}

		const attrs = attrsRef.current;
		const convId = attrs.conversation_id || generateUUID();
		if ( ! attrs.conversation_id ) {
			setAttributes( { conversation_id: convId } );
		}

		setChatLoading( true );

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/chat',
				method: 'POST',
				data: {
					conversation_id: convId,
					post_id: wp.data.select( 'core/editor' ).getCurrentPostId(),
					message: text,
					type,
					payload,
					current_map_state: {
						layers: attrs.layers || [],
						base_layer: attrs.base_layer || null,
						center_lat: attrs.center_lat,
						center_lon: attrs.center_lon,
						initial_zoom: attrs.initial_zoom,
						pins: attrs.pins || [],
					},
				},
			} )
				.then( ( response ) => {
				const convUpdates = [];
				if ( text.trim() && 'regenerate' !== type ) {
					convUpdates.push( { role: 'user', text, ts: new Date().toISOString() } );
				}

				if ( response.success ) {
					convUpdates.push( {
						role: 'assistant',
						text: response.assistant_message || response.message || __( 'Map updated.', 'jeowp' ),
						ts: new Date().toISOString(),
					} );

					setAttributes( {
						layers: response.layers || attrs.layers,
						base_layer: response.base_layer || attrs.base_layer,
						center_lat: response.center_lat ?? attrs.center_lat,
						center_lon: response.center_lon ?? attrs.center_lon,
						initial_zoom: response.initial_zoom ?? attrs.initial_zoom,
						pins: response.pins || attrs.pins,
						message: response.message || '',
						conversation: [ ...( attrs.conversation || [] ), ...convUpdates ],
					} );

					if ( response.base_layer?.variant ) {
						setBaseVariant( response.base_layer.variant );
					}
				} else {
					convUpdates.push( {
						role: 'assistant',
						text: response.message || __( 'Failed to update map.', 'jeowp' ),
						ts: new Date().toISOString(),
					} );
					setAttributes( {
						conversation: [ ...( attrs.conversation || [] ), ...convUpdates ],
					} );
				}
			} )
			.catch( ( error ) => {
				const attrs = attrsRef.current;
				const convUpdates = [];
				if ( text.trim() && 'regenerate' !== type ) {
					convUpdates.push( { role: 'user', text, ts: new Date().toISOString() } );
				}
				convUpdates.push( {
					role: 'assistant',
					text: error.message || __( 'Request failed.', 'jeowp' ),
					ts: new Date().toISOString(),
				} );
				setAttributes( {
					conversation: [ ...( attrs.conversation || [] ), ...convUpdates ],
				} );
			} )
			.finally( () => {
				setChatLoading( false );
				setChatInput( '' );
			} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during chat:', syncError );
			const currentAttrs = attrsRef.current;
			const convUpdates = [];
			if ( text.trim() && 'regenerate' !== type ) {
				convUpdates.push( { role: 'user', text, ts: new Date().toISOString() } );
			}
			convUpdates.push( {
				role: 'assistant',
				text: syncError.message || __( 'Could not send message.', 'jeowp' ),
				ts: new Date().toISOString(),
			} );
			setAttributes( {
				conversation: [ ...( currentAttrs.conversation || [] ), ...convUpdates ],
			} );
			setChatLoading( false );
			setChatInput( '' );
		}
	}, [ chatLoading, setAttributes ] );

	const generateFromChatPrompt = useCallback( () => {
		if ( ! chatPrompt?.trim() || chatLoading ) {
			return;
		}

		const attrs = attrsRef.current;
		const convId = attrs.conversation_id || generateUUID();
		const userMsg = chatPrompt.trim();

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setAttributes( {
				status: 'error',
				message: __( 'Save the post before generating the map.', 'jeowp' ),
			} );
			return;
		}

		setChatLoading( true );
		setChatPromptVisible( false );

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup-prompt',
				method: 'POST',
				data: {
					prompt: userMsg,
					post_id: postId,
					conversation_id: convId,
				},
			} )
				.then( ( response ) => {
				const currentAttrs = attrsRef.current;
				const convUpdates = [
					{ role: 'user', text: userMsg, ts: new Date().toISOString() },
				];

				if ( response.success ) {
					convUpdates.push( {
						role: 'assistant',
						text: response.assistant_message || response.message || __( 'Map generated from prompt.', 'jeowp' ),
						ts: new Date().toISOString(),
					} );

					setAttributes( {
						layers: response.layers || [],
						base_layer: response.base_layer || null,
						center_lat: response.center_lat,
						center_lon: response.center_lon,
						initial_zoom: response.initial_zoom,
						pins: response.pins || currentAttrs.pins,
						message: response.message || '',
						conversation_id: convId,
						conversation: [ ...( currentAttrs.conversation || [] ), ...convUpdates ],
					} );

					if ( response.base_layer?.variant ) {
						setBaseVariant( response.base_layer.variant );
					}
				} else {
					convUpdates.push( {
						role: 'assistant',
						text: response.message || __( 'Failed to generate from prompt.', 'jeowp' ),
						ts: new Date().toISOString(),
					} );
					setAttributes( {
						conversation: [ ...( currentAttrs.conversation || [] ), ...convUpdates ],
					} );
				}
			} )
			.catch( ( error ) => {
				const currentAttrs = attrsRef.current;
				setAttributes( {
					conversation: [ ...( currentAttrs.conversation || [] ),
						{ role: 'user', text: userMsg, ts: new Date().toISOString() },
						{
							role: 'assistant',
							text: error.message || __( 'Request failed.', 'jeowp' ),
							ts: new Date().toISOString(),
						},
					],
				} );
			} )
			.finally( () => {
				setChatLoading( false );
				setChatPrompt( '' );
			} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during chat prompt:', syncError );
			const currentAttrs = attrsRef.current;
			setAttributes( {
				conversation: [ ...( currentAttrs.conversation || [] ),
					{ role: 'user', text: userMsg, ts: new Date().toISOString() },
					{
						role: 'assistant',
						text: syncError.message || __( 'Could not generate from prompt.', 'jeowp' ),
						ts: new Date().toISOString(),
					},
				],
			} );
			setChatLoading( false );
			setChatPrompt( '' );
		}
	}, [ chatPrompt, chatLoading, setAttributes ] );

	const resuggest = useCallback( () => {
		if ( attrsRef.current.conversation_id ) {
			sendChat( '', 'regenerate' );
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setAttributes( {
				status: 'error',
				message: __( 'Save the post before generating the map.', 'jeowp' ),
			} );
			return;
		}

		const convId = generateUUID();
		setAttributes( { status: 'loading', message: '' } );

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup',
				method: 'POST',
				data: { post_id: postId, conversation_id: convId },
			} )
				.then( ( response ) => {
					if ( response.success ) {
						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							message: response.message || '',
							conversation_id: convId,
							conversation: [
								{
									role: 'assistant',
									text: response.message || __( 'Map regenerated from post content.', 'jeowp' ),
									ts: new Date().toISOString(),
								},
							],
						};

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
					} else {
						setAttributes( {
							status: 'error',
							message: response.message || __( 'Failed to suggest layers.', 'jeowp' ),
						} );
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( '[JEO Minimap] Resuggest request failed:', error );
					setAttributes( {
						status: 'error',
						message: error.message || __( 'Request failed.', 'jeowp' ),
					} );
				} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during resuggest:', syncError );
			setAttributes( {
				status: 'error',
				message: syncError.message || __( 'Could not start map generation.', 'jeowp' ),
			} );
		}
	}, [ sendChat, setAttributes ] );

	const generateFromPrompt = useCallback( () => {
		if ( ! attributes.prompt?.trim() ) {
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setAttributes( {
				status: 'error',
				message: __( 'Save the post before generating the map.', 'jeowp' ),
			} );
			return;
		}

		setAttributes( { status: 'loading' } );

		const convId = attrsRef.current.conversation_id || generateUUID();

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup-prompt',
				method: 'POST',
				data: {
					prompt: attributes.prompt,
					post_id: postId,
					conversation_id: convId,
				},
			} )
				.then( ( response ) => {
					if ( response.success ) {
						const convUpdates = [
							{ role: 'user', text: attributes.prompt, ts: new Date().toISOString() },
							{
								role: 'assistant',
								text: response.assistant_message || response.message || __( 'Map generated from prompt.', 'jeowp' ),
								ts: new Date().toISOString(),
							},
						];

						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							message: response.message || '',
							conversation_id: convId,
							conversation: [ ...( attrsRef.current.conversation || [] ), ...convUpdates ],
						};

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
					} else {
						setAttributes( {
							status: 'error',
							message: response.message || __( 'Failed to generate from prompt.', 'jeowp' ),
						} );
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( '[JEO Minimap] Prompt request failed:', error );
					setAttributes( {
						status: 'error',
						message: error.message || __( 'Request failed.', 'jeowp' ),
						conversation: [ ...( attrsRef.current.conversation || [] ),
							{ role: 'user', text: attributes.prompt, ts: new Date().toISOString() },
							{
								role: 'assistant',
								text: error.message || __( 'Request failed.', 'jeowp' ),
								ts: new Date().toISOString(),
							},
						],
					} );
				} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during prompt setup:', syncError );
			setAttributes( {
				status: 'error',
				message: syncError.message || __( 'Could not start map generation.', 'jeowp' ),
				conversation: [ ...( attrsRef.current.conversation || [] ),
					{ role: 'user', text: attributes.prompt, ts: new Date().toISOString() },
					{
						role: 'assistant',
						text: syncError.message || __( 'Could not start map generation.', 'jeowp' ),
						ts: new Date().toISOString(),
					},
				],
			} );
		}
	}, [ attributes.prompt, setAttributes ] );

	const handleBaseVariantChange = useCallback( ( newVariant ) => {
		setBaseVariant( newVariant );

		if ( attrsRef.current.conversation_id ) {
			sendChat( `Change the base layer variant to ${ newVariant }.`, 'base_variant', { variant: newVariant } );
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			return;
		}

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup',
				method: 'POST',
				data: { post_id: postId },
			} ).then( ( response ) => {
				if ( response.success && response.base_layer ) {
					let chosen = response.base_layer;

					if ( newVariant !== 'none' && response.base_layer.variant !== newVariant ) {
						apiFetch( {
							path: '/jeo/v1/minimap/setup',
							method: 'POST',
							data: { post_id: postId, base_variant: newVariant },
						} ).then( ( r2 ) => {
							if ( r2.success && r2.base_layer ) {
								setAttributes( { base_layer: r2.base_layer } );
							}
						} );
					} else {
						setAttributes( { base_layer: chosen } );
					}
				}
			} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error( '[JEO Minimap] Synchronous error during base variant change:', syncError );
		}
	}, [ sendChat, setAttributes ] );

	const closeModal = useCallback( () => setModal( false ), [] );
	const openModal = useCallback( () => setModal( true ), [] );

	const setPanLimitsFromMap = () => {
		const map = mapRef.current;
		if ( map ) {
			const bounds = map.getBounds();
			const ne = bounds.getNorthEast();
			const sw = bounds.getSouthWest();
			setAttributes( {
				pan_limits: {
					east: ne.lng,
					north: ne.lat,
					south: sw.lat,
					west: sw.lng,
				},
			} );
		}
	};

	const [ zoomState, setZoomState ] = useState( 'initial_zoom' );
	const currentZoom = normalizedAttributes[ zoomState ];
	const mapRef = useRef( undefined );

	const debouncedOnMove = useMemo(
		() => debounce( ( { viewState } ) => {
			setAttributes( {
				center_lat: viewState.latitude,
				center_lon: viewState.longitude,
			} );
		}, 300 ),
		[ setAttributes ]
	);

	const debouncedOnZoom = useMemo(
		() => debounce( ( { viewState } ) => {
			const zoom = Math.round( viewState.zoom * 10 ) / 10;
			setAttributes( { [ zoomState ]: zoom } );
		}, 300 ),
		[ setAttributes, zoomState ]
	);

	useEffect( () => {
		return () => {
			debouncedOnMove.cancel();
			debouncedOnZoom.cancel();
		};
	}, [ debouncedOnMove, debouncedOnZoom ] );

	const [ generationMode, setGenerationMode ] = useState(
		() => attributes.prompt?.trim() ? 'prompt' : 'content'
	);

	const handleGenerate = useCallback( () => {
		if ( generationMode === 'prompt' ) {
			generateFromPrompt();
		} else {
			generate();
		}
	}, [ generationMode, generate, generateFromPrompt ] );

	if ( attributes.status === 'loading' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeowp' ) }
					isColumnLayout={ true }
					className="jeo-minimap-placeholder"
				>
					<div className="jeo-minimap-placeholder__loading">
						<Spinner />
						<span className="jeo-minimap-placeholder__loading-text">
							{ LOADING_MESSAGES[ loadingMsgIndex ] }
						</span>
					</div>
				</Placeholder>
			</div>
		);
	}

	if ( attributes.status === 'idle' || attributes.status === 'error' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeowp' ) }
					isColumnLayout={ true }
					className="jeo-minimap-placeholder"
				>
					<p className="jeo-minimap-placeholder__description">
						{ __( 'AI will analyze your content and suggest relevant map layers, center point, and zoom level.', 'jeowp' ) }
					</p>
					{ attributes.status === 'error' && (
						<Notice status="error" isDismissible={ false } className="jeo-minimap-placeholder__error">
							{ attributes.message }
						</Notice>
					) }
					<RadioControl
						selected={ generationMode }
						options={ [
							{ label: __( 'Generate from post content', 'jeowp' ), value: 'content' },
							{ label: __( 'Generate from prompt', 'jeowp' ), value: 'prompt' },
						] }
						onChange={ setGenerationMode }
					/>
					{ generationMode === 'prompt' && (
						<TextareaControl
							label={ __( 'Map prompt', 'jeowp' ) }
							value={ attributes.prompt || '' }
							onChange={ ( v ) => setAttributes( { prompt: v } ) }
						/>
					) }
					<Button
						variant="primary"
						onClick={ handleGenerate }
						disabled={ generationMode === 'prompt' && ! attributes.prompt?.trim() }
						className="jeo-minimap-placeholder__generate"
					>
						{ __( 'Generate map', 'jeowp' ) }
					</Button>
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ modal && (
				<LayersSettingsModal
					closeModal={ closeModal }
					attributes={ { ...attributes, layers: allLayers } }
					setAttributes={ ( update ) => {
						if ( update.layers ) {
							const baseId = attributes.base_layer?.id;
							const newBase = update.layers.find( ( l ) => l.id === baseId );
							const newThematic = update.layers.filter( ( l ) => l.id !== baseId );
							setAttributes( {
								base_layer: newBase || attributes.base_layer,
								layers: newThematic,
							} );
						} else {
							setAttributes( update );
						}
					} }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			<InspectorControls>
				<MapPanel
					attributes={ normalizedAttributes }
					setAttributes={ setAttributes }
					renderPanel={ PanelBody }
					setZoomState={ setZoomState }
					setPanLimitsFromMap={ setPanLimitsFromMap }
					isMapBlock={ true }
				/>
				<LayersPanel
					attributes={ { layers: allLayers } }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
					openModal={ openModal }
					renderPanel={ PanelBody }
				/>
				<PanelBody
					name="minimap-base"
					title={ __( 'Base Layer', 'jeowp' ) }
					className="jeo-minimap-base-panel"
				>
					<SelectControl
						label={ __( 'Base terrain', 'jeowp' ) }
						value={ baseVariant }
						options={ [
							{ label: _x( 'Dark', 'base terrain', 'jeowp' ), value: 'dark' },
							{ label: _x( 'Light', 'base terrain', 'jeowp' ), value: 'light' },
							{ label: _x( 'Satellite', 'base terrain', 'jeowp' ), value: 'satellite' },
							{ label: _x( 'None', 'base terrain', 'jeowp' ), value: 'none' },
						] }
						onChange={ handleBaseVariantChange }
					/>
				</PanelBody>
				<PanelBody
					name="minimap-pins"
					title={ __( 'Geolocation Pins', 'jeowp' ) }
					className="jeo-minimap-pins-panel"
				>
					<SelectControl
						label={ __( 'Show pins', 'jeowp' ) }
						value={ attributes.show_pins ? 'yes' : 'no' }
						options={ [
							{ label: __( 'Yes', 'jeowp' ), value: 'yes' },
							{ label: __( 'No', 'jeowp' ), value: 'no' },
						] }
						onChange={ ( v ) => setAttributes( { show_pins: v === 'yes' } ) }
					/>
				</PanelBody>
				<PanelBody
					name="minimap-chat"
					title={ __( 'AI Assistant', 'jeowp' ) }
					className="jeo-minimap-chat-panel"
					initialOpen={ true }
				>
					{ attributes.conversation?.length > 0 && (
						<div className="jeo-chat-messages">
							{ attributes.conversation.map( ( msg, i ) => (
								<div
									key={ i }
									className={ `jeo-chat-message jeo-chat-message--${ msg.role }` }
								>
									<span className="jeo-chat-message__role">
										{ 'assistant' === msg.role ? __( 'Assistant', 'jeowp' ) : __( 'You', 'jeowp' ) }
									</span>
									<span className="jeo-chat-message__text">{ msg.text }</span>
								</div>
							) ) }
							{ chatLoading && (
								<div className="jeo-chat-message jeo-chat-message--assistant jeo-chat-message--typing">
									<span className="jeo-chat-message__role">{ __( 'Assistant', 'jeowp' ) }</span>
									<span className="jeo-chat-typing-dots" aria-label={ __( 'Typing…', 'jeowp' ) }>
										<span /><span /><span />
									</span>
								</div>
							) }
							<div ref={ messagesEndRef } />
						</div>
					) }
					<div className="jeo-chat-input-row">
						<TextareaControl
							value={ chatInput }
							onChange={ setChatInput }
							placeholder={ __( 'Ask the AI to refine the map…', 'jeowp' ) }
						/>
						<Button
							variant="primary"
							onClick={ () => sendChat( chatInput ) }
							disabled={ chatLoading || ! chatInput.trim() }
							isSmall
							icon="arrow-right-alt2"
							aria-label={ __( 'Send message', 'jeowp' ) }
						/>
					</div>
					<div className="jeo-chat-actions">
						<Button
							variant="secondary"
							onClick={ () => sendChat( '', 'regenerate' ) }
							disabled={ chatLoading }
							isSmall
						>
							{ __( 'Regenerate', 'jeowp' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ () => setChatPromptVisible( ! chatPromptVisible ) }
							disabled={ chatLoading }
							isSmall
						>
							{ __( 'New prompt', 'jeowp' ) }
						</Button>
					</div>
					{ chatPromptVisible && (
						<div className="jeo-chat-prompt-area">
							<TextareaControl
								value={ chatPrompt }
								onChange={ setChatPrompt }
								placeholder={ __( 'Describe the map you want…', 'jeowp' ) }
							/>
							<Button
								variant="primary"
								onClick={ generateFromChatPrompt }
								disabled={ chatLoading || ! chatPrompt.trim() }
								isSmall
							>
								{ __( 'Generate', 'jeowp' ) }
							</Button>
						</div>
					) }
				</PanelBody>
			</InspectorControls>

			{ attributes.message && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="jeo-minimap-notice"
				>
					{ attributes.message }
				</Notice>
			) }

			<div className="jeo-preview-area">
				{ isPreparingComposedPreview && <Spinner /> }
				{ ( styleBase || useComposedPreview ) && (
					<div className="jeo-style-preview-badge">
						{ __( 'Vector style preview', 'jeowp' ) }
					</div>
				) }
				{ ! isPreparingComposedPreview && (
				<Map
					key={ `${ styleBase ? `style-${ styleBase.instance.id }` : 'default' }:${ layerSettingsKey }:${ composedPreview.metadata?.hash || 'default' }` }
					ref={ mapRef }
					{ ...( useComposedPreview
						? {
								mapStyle: composedPreview.style,
								transformRequest,
								onError: handleEditorMapPreviewError,
						  }
						: styleLayerMapProps( styleBase ) ) }
					style={ { height: '50vh' } }
					latitude={ normalizedAttributes.center_lat }
					longitude={ normalizedAttributes.center_lon }
					zoom={ currentZoom || mapDefaults.zoom }
					onMove={ debouncedOnMove }
					onZoom={ debouncedOnZoom }
					onStyleData={ () => {
						if ( useComposedPreview ) {
							applyComposedVisibility();
						} else if ( styleBase ) {
							applyStyleLayerFiltering(
								mapRef.current,
								styleBase.instance
							);
						}
					} }
				>
					{ loadedLayers.length > 0 &&
						allLayers.map( ( layer ) => {
							const layerRecord = loadedLayers.find(
								( { id } ) => id === layer.id
							);

							if ( ! layerRecord?.meta ) {
								return null;
							}

							if ( useComposedPreview ) {
								return null;
							}

							if ( hasMapboxLayers && layerRecord.meta.type === 'mapbox' ) {
								return null;
							}

							return <MemoizedRenderLayer key={ layer.id } layer={ layerRecord.meta } instance={ layer } />;
						} ) }
				</Map>
				) }
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeowp' ) }
				</Button>
			</div>
		</div>
	);
}
