import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { debounce } from 'lodash';
import { __, _x, sprintf } from '@wordpress/i18n';

import { Map, Marker } from '../lib/mapgl-react';
import LayersSettingsModal from './layers-settings-modal';
import { MemoizedRenderLayer } from './map-preview-layer';
import PreviewErrorState, { PreviewErrorBoundary } from './preview-error';
import {
	getTileLayerPreflightUrls,
	useTileLayerPreflight,
} from './tile-preflight';
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
import {
	deriveMinimapStatus,
	minimapContentKey,
} from './minimap-status';
import { MinimapWaitNote, useElapsedSeconds } from './minimap-wait';
import {
	MinimapAiGate,
	MinimapPrePublishGateWarning,
} from './minimap-ai-gate';
import MinimapVersionsPanel, {
	buildRestoreConfirmation,
} from './minimap-versions';
import { buildRestoreMessage } from './minimap-api';
import { fetchMinimapState } from './minimap-api';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import { useRecordsByIds } from '../shared/rest-records';
import { handleChatKeyDown } from '../shared/chat-input-keys';
import {
	RadioControl,
	SelectControl,
	TextareaControl,
} from '../shared/wp-form-controls';
import './onetime-map-editor.css';
import './minimap-editor.css';

const { map_defaults: mapDefaults } = globalThis.jeo_settings;

const PIN_ICON_PRIMARY =
	globalThis.jeoMapVars?.images?.[ '/js/src/icons/news-marker' ]?.url;
const PIN_ICON_SECONDARY =
	globalThis.jeoMapVars?.images?.[ '/js/src/icons/news-marker-hover' ]?.url;

const AI_CONFIGURED = Boolean( globalThis.jeoMapVars?.ai_configured );

const LOADING_MESSAGES = [
	__( 'Analyzing content…', 'jeowp' ),
	__( 'Searching for map layers…', 'jeowp' ),
	__( 'Generating map configuration…', 'jeowp' ),
];

// V1 race guard notice — shown when an AI response arrives after the user
// changed the map content mid-flight (e.g. via undo).
const PREEMPTED_MESSAGE = __(
	'The map changed while the AI was thinking — its edits were discarded to protect yours. The answer is still in the chat.',
	'jeowp'
);

function generateUUID() {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
	) {
		try {
			return crypto.randomUUID();
		} catch ( e ) {
			// Fall through to manual UUID.
		}
	}

	const bytes = new Uint8Array( 16 );
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.getRandomValues === 'function'
	) {
		crypto.getRandomValues( bytes );
	} else {
		for ( let i = 0; i < 16; i++ ) {
			bytes[ i ] = Math.floor( Math.random() * 256 );
		}
	}

	// Set version (4) and variant (RFC4122) bits.
	bytes[ 6 ] = ( bytes[ 6 ] & 0x0f ) | 0x40;
	bytes[ 8 ] = ( bytes[ 8 ] & 0x3f ) | 0x80;

	const hex = Array.from( bytes, ( b ) =>
		b.toString( 16 ).padStart( 2, '0' )
	).join( '' );
	return `${ hex.slice( 0, 8 ) }-${ hex.slice( 8, 12 ) }-${ hex.slice(
		12,
		16
	) }-${ hex.slice( 16, 20 ) }-${ hex.slice( 20 ) }`;
}

/**
 * Renders a geolocation pin as a non-interactive map marker.
 *
 * Mirrors the frontend rendering in `class-jeo-map.js::addOwnPinsAsMarkers()`:
 * primary pins use the `news-marker` icon, secondary ones (`relevance === 'secondary'`)
 * use `news-marker-hover`. Falls back to a plain CSS dot when the localized
 * icon URLs are unavailable.
 *
 * The `Marker` component resolves the active runtime (MapLibre GL or Mapbox GL)
 * from the parent `<Map>` context, so pins render under both runtimes.
 *
 * @param {Object} props
 * @param {Object} props.pin Pin object (`lat`, `lon`, `relevance`, `address`).
 */
function MinimapPinMarker( { pin } ) {
	const lat = parseFloat( pin.lat );
	const lon = parseFloat( pin.lon );

	if ( Number.isNaN( lat ) || Number.isNaN( lon ) ) {
		return null;
	}

	const isSecondary = pin.relevance === 'secondary';
	const iconUrl = isSecondary ? PIN_ICON_SECONDARY : PIN_ICON_PRIMARY;

	const style = iconUrl
		? {
				backgroundImage: `url(${ iconUrl })`,
				width: '27px',
				height: '36px',
				backgroundSize: 'cover',
				pointerEvents: 'none',
		  }
		: {
				// Fallback dot when localized icons are unavailable.
				width: '14px',
				height: '14px',
				borderRadius: '50%',
				backgroundColor: isSecondary ? '#9e9e9e' : '#e03e3e',
				border: '2px solid #ffffff',
				boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
				pointerEvents: 'none',
		  };

	return (
		<Marker
			latitude={ lat }
			longitude={ lon }
			anchor={ iconUrl ? 'bottom' : 'center' }
		>
			<div className="jeo-minimap-pin" style={ style } />
		</Marker>
	);
}

export default function MinimapEditor( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const blockProps = useBlockProps();
	const postId = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostId(),
		[]
	);
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

	// Transient UI state (W2 — 2.2/V1): `loading`/`error` never reach the
	// attributes, so the undo history can never land on a persisted spinner
	// state (the bricked-block bug). Only `ready` is written back, because
	// the frontend save renders nothing when a legacy `error` survives.
	// The status is derived from the persisted content on mount/reload and
	// re-derived when the attributes change externally (undo/redo) while no
	// request is in flight.
	const [ uiStatus, setUiStatus ] = useState( () =>
		deriveMinimapStatus( attributes )
	);
	const [ uiError, setUiError ] = useState( '' );
	// Race guard (V1): fingerprint of the map content captured when a
	// request is dispatched. If the content changes mid-flight (the user
	// undid/redid or edited), the response must not write attributes over
	// the user's edits.
	const inFlightRef = useRef( null );
	const [ preemptedNotice, setPreemptedNotice ] = useState( '' );
	// Base variant switch failure (W3 — 3.7/G-C): never silent.
	const [ baseNotice, setBaseNotice ] = useState( '' );
	// Wait contract (2.2): elapsed time for the generation and chat waits.
	const generationElapsed = useElapsedSeconds( uiStatus === 'loading' );
	const chatElapsed = useElapsedSeconds( chatLoading );
	// Contrato F (C2-32): the conversation lives server-side; attributes are
	// only the legacy fallback. Hydrated on mount, appended locally per turn.
	const [ conversation, setConversation ] = useState(
		() => attributes.conversation || []
	);
	// Contrato F: the notice message also migrates server-side — local state
	// initialized from the legacy attribute, hydrated/updated per turn.
	const [ uiMessage, setUiMessage ] = useState( () => attributes.message || '' );
	const [ versionsRefreshKey, setVersionsRefreshKey ] = useState( 0 );

	useEffect( () => {
		messagesEndRef.current?.scrollIntoView( { behavior: 'smooth' } );
	}, [ conversation ] );

	useEffect( () => {
		if ( 'ready' === uiStatus && ! attributes.conversation_id ) {
			setAttributes( { conversation_id: generateUUID() } );
		}
	}, [ uiStatus, attributes.conversation_id, setAttributes ] );

	// Undo/redo sync: re-derive the status from the content whenever the
	// attributes change without an in-flight request.
	const attributesContentKey = minimapContentKey( attributes );
	useEffect( () => {
		if ( inFlightRef.current !== null ) {
			return;
		}
		setUiStatus( deriveMinimapStatus( attributes ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the content fingerprint only
	}, [ attributesContentKey, attributes.status ] );

	// Contrato F (C2-32): hydrate the conversation and notice message from
	// the server-side storage. A non-empty server copy wins; the attribute
	// copy is the legacy fallback (empty server history never wipes it).
	// While the endpoint is absent, the block keeps working with attributes.
	useEffect( () => {
		const conversationId = attrsRef.current.conversation_id;
		if ( ! postId || ! conversationId ) {
			return undefined;
		}
		let cancelled = false;
		fetchMinimapState( postId, conversationId )
			.then( ( response ) => {
				if ( cancelled ) {
					return;
				}
				if (
					Array.isArray( response?.conversation ) &&
					response.conversation.length > 0
				) {
					setConversation( response.conversation );
				}
				if (
					typeof response?.message === 'string' &&
					response.message !== ''
				) {
					setUiMessage( response.message );
				}
			} )
			.catch( () => {
				// Endpoint not available yet (or fetch failed): keep the
				// legacy attribute conversation.
			} );
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once per conversation
	}, [ postId, attributes.conversation_id ] );

	const beginRequest = useCallback( () => {
		inFlightRef.current = minimapContentKey( attrsRef.current );
	}, [] );
	const endRequest = useCallback( () => {
		inFlightRef.current = null;
	}, [] );
	// True when the map content changed while the request was in flight —
	// the response must then discard its attribute writes (V1 race guard).
	const requestWasPreempted = useCallback( () => {
		return (
			inFlightRef.current !== null &&
			inFlightRef.current !== minimapContentKey( attrsRef.current )
		);
	}, [] );

	useEffect( () => {
		if ( uiStatus !== 'loading' ) {
			setLoadingMsgIndex( 0 );
			return;
		}
		const timer = setInterval( () => {
			setLoadingMsgIndex( ( i ) => ( i + 1 ) % LOADING_MESSAGES.length );
		}, 3000 );
		return () => clearInterval( timer );
	}, [ uiStatus ] );

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

	const { records: loadedLayers = [], isLoading: loadingLayers } =
		useRecordsByIds( {
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
	const [ previewError, setPreviewError ] = useState( null );
	const [ retryCount, setRetryCount ] = useState( 0 );
	const mapLoadedRef = useRef( false );
	// RISK-01: per-source content tracking — an error from a JEO layer
	// source (source_{id}) is fatal until that source has produced real
	// content, even when the base style loaded first. After content,
	// errors are incidental and the live map stays.
	const layerContentRef = useRef( new Set() );
	const composedPayload = useMemo(
		() => ( {
			scope: 'preview',
			kind: 'minimap',
			postId,
			blockId: clientId,
			layers: allLayers || [],
		} ),
		[ postId, clientId, layerSettingsKey ]
	);
	const composedPreview = useComposedPayloadPreviewStyle( {
		enabled: hasMapboxLayers,
		payload: composedPayload,
		refreshKey: `${ layerSettingsKey }:${ retryCount }`,
	} );

	// A failed composed-style load means the layer source failed: show the
	// error state in the preview area instead of the courtesy base map.
	useEffect( () => {
		if ( composedPreview.error ) {
			setPreviewError( composedPreview.error );
		}
	}, [ composedPreview.error ] );

	// New layer configuration (or a retry) means a new attempt: clear the
	// error state and let the map prove itself again.
	useEffect( () => {
		setPreviewError( null );
		mapLoadedRef.current = false;
		layerContentRef.current.clear();
	}, [ layerSettingsKey, retryCount ] );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	// R3-G1: tile-based direct layers (tilelayer/MVT) cannot rely on GL
	// error events alone (MapLibre swallows 404 tiles and errored tiles
	// still emit `sourcedata` content events). Preflight the concrete tile
	// URLs so a dead source becomes the error state, never a courtesy map.
	const tilePreflightUrls = useMemo(
		() =>
			useComposedPreview
				? []
				: loadedLayers.flatMap( ( record ) =>
						getTileLayerPreflightUrls( record?.meta || {} )
				  ),
		[ loadedLayers, useComposedPreview ]
	);
	const tilePreflight = useTileLayerPreflight( tilePreflightUrls, retryCount );
	useEffect( () => {
		if ( tilePreflight.error ) {
			setPreviewError( tilePreflight.error );
		}
	}, [ tilePreflight.error ] );
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
	}, [ composedPreview.manifest, layerSettingsKey, useComposedPreview ] );

	useEffect( () => {
		applyComposedVisibility();
	}, [ applyComposedVisibility ] );

	const generate = useCallback( () => {
		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			// eslint-disable-next-line no-console
			console.error(
				'[JEO Minimap] Cannot generate: post ID is not available yet. Save the post first.'
			);
			setUiStatus( 'error' );
			setUiError(
				__( 'Save the post before generating the map.', 'jeowp' )
			);
			return;
		}

		setUiStatus( 'loading' );
		setUiError( '' );
		beginRequest();

		const convId = attrsRef.current.conversation_id || generateUUID();

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup',
				method: 'POST',
				data: { post_id: postId, conversation_id: convId },
			} )
				.then( ( response ) => {
					if ( response.success ) {
						if ( requestWasPreempted() ) {
							// The user edited/undid while the AI was thinking:
							// keep the user's content, drop the AI map state.
							setUiStatus( deriveMinimapStatus( attrsRef.current ) );
							setPreemptedNotice( PREEMPTED_MESSAGE );
							return;
						}
						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							conversation_id: convId,
						};
							// BUG-C1: always rewrite — a turn without a note clears the previous one.
							updates.framing_note = response.framing_note || '';

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
						setConversation( ( current ) => [
							...current,
							{
								role: 'assistant',
								text:
									response.message ||
									__(
										'Map generated from post content.',
										'jeowp'
									),
								ts: new Date().toISOString(),
							},
						] );
						setUiStatus( 'ready' );
						setUiMessage( response.message || '' );
						setVersionsRefreshKey( ( key ) => key + 1 );
					} else {
						setUiStatus( 'error' );
						setUiError(
							response.message ||
								__( 'Failed to suggest layers.', 'jeowp' )
						);
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error(
						'[JEO Minimap] Setup request failed:',
						error
					);
					setUiStatus( 'error' );
					setUiError(
						error.message || __( 'Request failed.', 'jeowp' )
					);
				} )
				.finally( endRequest );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error(
				'[JEO Minimap] Synchronous error during setup:',
				syncError
			);
			endRequest();
			setUiStatus( 'error' );
			setUiError(
				syncError.message ||
					__( 'Could not start map generation.', 'jeowp' )
			);
		}
	}, [ setAttributes, beginRequest, endRequest, requestWasPreempted, PREEMPTED_MESSAGE ] );

	const sendChat = useCallback(
		( message, type = 'text', payload = {} ) => {
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
			beginRequest();

			try {
				apiFetch( {
					path: '/jeo/v1/minimap/chat',
					method: 'POST',
					data: {
						conversation_id: convId,
						post_id: wp.data
							.select( 'core/editor' )
							.getCurrentPostId(),
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
							convUpdates.push( {
								role: 'user',
								text,
								ts: new Date().toISOString(),
							} );
						}

						if ( response.success ) {
							convUpdates.push( {
								role: 'assistant',
								text:
									response.assistant_message ||
									response.message ||
									__( 'Map updated.', 'jeowp' ),
								ts: new Date().toISOString(),
							} );

							if ( requestWasPreempted() ) {
								// The user edited/undid while the AI was
								// thinking: keep the answer in the chat but
								// never overwrite the user's content.
								setPreemptedNotice( PREEMPTED_MESSAGE );
							} else {
								const contentUpdates = {
									layers: response.layers || attrs.layers,
									base_layer:
										response.base_layer || attrs.base_layer,
									center_lat:
										response.center_lat ?? attrs.center_lat,
									center_lon:
										response.center_lon ?? attrs.center_lon,
									initial_zoom:
										response.initial_zoom ??
										attrs.initial_zoom,
									pins: response.pins || attrs.pins,
								};
						// BUG-C1: always rewrite — a turn without a note
						// clears the previous one (no stale framing).
						contentUpdates.framing_note = response.framing_note || '';
								setAttributes( contentUpdates );
								setUiMessage( response.message || '' );

								if ( response.base_layer?.variant ) {
									setBaseVariant(
										response.base_layer.variant
									);
									if ( 'base_variant' === type ) {
										setBaseNotice( '' );
									}
								}
							}
							// The server appended a version for this turn
							// even when the client discards the content.
							setVersionsRefreshKey( ( key ) => key + 1 );
						} else {
							convUpdates.push( {
								role: 'assistant',
								text:
									response.message ||
									__( 'Failed to update map.', 'jeowp' ),
								ts: new Date().toISOString(),
							} );
							// 3.7 (G-C): a failed base switch must not be
							// silent — revert the select to the base that is
							// actually active and say what happened.
							if ( 'base_variant' === type ) {
								setBaseVariant(
									attrs.base_layer?.variant || 'none'
								);
								setBaseNotice(
									__(
										'The selected base could not be loaded; the previous base was kept. Check your connection and try again.',
										'jeowp'
									)
								);
							}
						}
						setConversation( ( current ) => [
							...current,
							...convUpdates,
						] );
					} )
					.catch( ( error ) => {
						const convUpdates = [];
						if ( text.trim() && 'regenerate' !== type ) {
							convUpdates.push( {
								role: 'user',
								text,
								ts: new Date().toISOString(),
							} );
						}
						convUpdates.push( {
							role: 'assistant',
							text:
								error.message ||
								__( 'Request failed.', 'jeowp' ),
							ts: new Date().toISOString(),
						} );
						setConversation( ( current ) => [
							...current,
							...convUpdates,
						] );
						if ( 'base_variant' === type ) {
							setBaseVariant(
								attrsRef.current.base_layer?.variant || 'none'
							);
							setBaseNotice(
								__(
									'The selected base could not be loaded; the previous base was kept. Check your connection and try again.',
									'jeowp'
								)
							);
						}
					} )
					.finally( () => {
						setChatLoading( false );
						setChatInput( '' );
						endRequest();
					} );
			} catch ( syncError ) {
				// eslint-disable-next-line no-console
				console.error(
					'[JEO Minimap] Synchronous error during chat:',
					syncError
				);
				const convUpdates = [];
				if ( text.trim() && 'regenerate' !== type ) {
					convUpdates.push( {
						role: 'user',
						text,
						ts: new Date().toISOString(),
					} );
				}
				convUpdates.push( {
					role: 'assistant',
					text:
						syncError.message ||
						__( 'Could not send message.', 'jeowp' ),
					ts: new Date().toISOString(),
				} );
				setConversation( ( current ) => [
					...current,
					...convUpdates,
				] );
				setChatLoading( false );
				setChatInput( '' );
				endRequest();
			}
		},
		[ chatLoading, setAttributes, beginRequest, endRequest, requestWasPreempted, PREEMPTED_MESSAGE ]
	);

	const generateFromChatPrompt = useCallback( () => {
		if ( ! chatPrompt?.trim() || chatLoading ) {
			return;
		}

		const attrs = attrsRef.current;
		const convId = attrs.conversation_id || generateUUID();
		const userMsg = chatPrompt.trim();

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setUiStatus( 'error' );
			setUiError(
				__( 'Save the post before generating the map.', 'jeowp' )
			);
			return;
		}

		setChatLoading( true );
		setChatPromptVisible( false );
		beginRequest();

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
					const convUpdates = [
						{
							role: 'user',
							text: userMsg,
							ts: new Date().toISOString(),
						},
					];

					if ( response.success ) {
						convUpdates.push( {
							role: 'assistant',
							text:
								response.assistant_message ||
								response.message ||
								__( 'Map generated from prompt.', 'jeowp' ),
							ts: new Date().toISOString(),
						} );

						if ( requestWasPreempted() ) {
							setPreemptedNotice( PREEMPTED_MESSAGE );
							setVersionsRefreshKey( ( key ) => key + 1 );
						} else {
							const contentUpdates = {
								status: 'ready',
								layers: response.layers || [],
								base_layer: response.base_layer || null,
								center_lat: response.center_lat,
								center_lon: response.center_lon,
								initial_zoom: response.initial_zoom,
								pins: response.pins || attrsRef.current.pins,
								conversation_id: convId,
							};
						// BUG-C1: always rewrite — a turn without a note
						// clears the previous one (no stale framing).
						contentUpdates.framing_note = response.framing_note || '';
							setAttributes( contentUpdates );

							if ( response.base_layer?.variant ) {
								setBaseVariant( response.base_layer.variant );
							}
							setUiStatus( 'ready' );
							setUiMessage( response.message || '' );
							setVersionsRefreshKey( ( key ) => key + 1 );
						}
					} else {
						convUpdates.push( {
							role: 'assistant',
							text:
								response.message ||
								__(
									'Failed to generate from prompt.',
									'jeowp'
								),
							ts: new Date().toISOString(),
						} );
					}
					setConversation( ( current ) => [
						...current,
						...convUpdates,
					] );
				} )
				.catch( ( error ) => {
					setConversation( ( current ) => [
						...current,
						{
							role: 'user',
							text: userMsg,
							ts: new Date().toISOString(),
						},
						{
							role: 'assistant',
							text:
								error.message ||
								__( 'Request failed.', 'jeowp' ),
							ts: new Date().toISOString(),
						},
					] );
				} )
				.finally( () => {
					setChatLoading( false );
					setChatPrompt( '' );
					endRequest();
				} );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error(
				'[JEO Minimap] Synchronous error during chat prompt:',
				syncError
			);
			setConversation( ( current ) => [
				...current,
				{
					role: 'user',
					text: userMsg,
					ts: new Date().toISOString(),
				},
				{
					role: 'assistant',
					text:
						syncError.message ||
						__( 'Could not generate from prompt.', 'jeowp' ),
					ts: new Date().toISOString(),
				},
			] );
			setChatLoading( false );
			setChatPrompt( '' );
			endRequest();
		}
	}, [ chatPrompt, chatLoading, setAttributes, beginRequest, endRequest, requestWasPreempted, PREEMPTED_MESSAGE ] );

	const resuggest = useCallback( () => {
		if ( attrsRef.current.conversation_id ) {
			sendChat( '', 'regenerate' );
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setUiStatus( 'error' );
			setUiError(
				__( 'Save the post before generating the map.', 'jeowp' )
			);
			return;
		}

		const convId = generateUUID();
		setUiStatus( 'loading' );
		setUiError( '' );
		beginRequest();

		try {
			apiFetch( {
				path: '/jeo/v1/minimap/setup',
				method: 'POST',
				data: { post_id: postId, conversation_id: convId },
			} )
				.then( ( response ) => {
					if ( response.success ) {
						if ( requestWasPreempted() ) {
							setUiStatus( deriveMinimapStatus( attrsRef.current ) );
							setPreemptedNotice( PREEMPTED_MESSAGE );
							return;
						}
						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							conversation_id: convId,
						};
							// BUG-C1: always rewrite — a turn without a note clears the previous one.
							updates.framing_note = response.framing_note || '';

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
						setConversation( [
							{
								role: 'assistant',
								text:
									response.message ||
									__(
										'Map regenerated from post content.',
										'jeowp'
									),
								ts: new Date().toISOString(),
							},
						] );
						setUiStatus( 'ready' );
						setUiMessage( response.message || '' );
						setVersionsRefreshKey( ( key ) => key + 1 );
					} else {
						setUiStatus( 'error' );
						setUiError(
							response.message ||
								__( 'Failed to suggest layers.', 'jeowp' )
						);
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error(
						'[JEO Minimap] Resuggest request failed:',
						error
					);
					setUiStatus( 'error' );
					setUiError(
						error.message || __( 'Request failed.', 'jeowp' )
					);
				} )
				.finally( endRequest );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error(
				'[JEO Minimap] Synchronous error during resuggest:',
				syncError
			);
			endRequest();
			setUiStatus( 'error' );
			setUiError(
				syncError.message ||
					__( 'Could not start map generation.', 'jeowp' )
			);
		}
	}, [ sendChat, setAttributes, beginRequest, endRequest, requestWasPreempted, PREEMPTED_MESSAGE ] );

	const generateFromPrompt = useCallback( () => {
		if ( ! attributes.prompt?.trim() ) {
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			setUiStatus( 'error' );
			setUiError(
				__( 'Save the post before generating the map.', 'jeowp' )
			);
			return;
		}

		setUiStatus( 'loading' );
		setUiError( '' );
		beginRequest();

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
							{
								role: 'user',
								text: attributes.prompt,
								ts: new Date().toISOString(),
							},
							{
								role: 'assistant',
								text:
									response.assistant_message ||
									response.message ||
									__( 'Map generated from prompt.', 'jeowp' ),
								ts: new Date().toISOString(),
							},
						];

						if ( requestWasPreempted() ) {
							setUiStatus( deriveMinimapStatus( attrsRef.current ) );
							setPreemptedNotice( PREEMPTED_MESSAGE );
							setConversation( ( current ) => [
								...current,
								...convUpdates,
							] );
							return;
						}

						const updates = {
							status: 'ready',
							layers: response.layers || [],
							base_layer: response.base_layer || null,
							center_lat: response.center_lat,
							center_lon: response.center_lon,
							initial_zoom: response.initial_zoom,
							pins: response.pins || [],
							conversation_id: convId,
						};
							// BUG-C1: always rewrite — a turn without a note clears the previous one.
							updates.framing_note = response.framing_note || '';

						if ( response.base_layer?.variant ) {
							setBaseVariant( response.base_layer.variant );
						}

						setAttributes( updates );
						setConversation( ( current ) => [
							...current,
							...convUpdates,
						] );
						setUiStatus( 'ready' );
						setUiMessage( response.message || '' );
						setVersionsRefreshKey( ( key ) => key + 1 );
					} else {
						setUiStatus( 'error' );
						setUiError(
							response.message ||
								__( 'Failed to generate from prompt.', 'jeowp' )
						);
					}
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error(
						'[JEO Minimap] Prompt request failed:',
						error
					);
					setUiStatus( 'error' );
					setUiError(
						error.message || __( 'Request failed.', 'jeowp' )
					);
					setConversation( ( current ) => [
						...current,
						{
							role: 'user',
							text: attributes.prompt,
							ts: new Date().toISOString(),
						},
						{
							role: 'assistant',
							text:
								error.message ||
								__( 'Request failed.', 'jeowp' ),
							ts: new Date().toISOString(),
						},
					] );
				} )
				.finally( endRequest );
		} catch ( syncError ) {
			// eslint-disable-next-line no-console
			console.error(
				'[JEO Minimap] Synchronous error during prompt setup:',
				syncError
			);
			endRequest();
			setUiStatus( 'error' );
			setUiError(
				syncError.message ||
					__( 'Could not start map generation.', 'jeowp' )
			);
			setConversation( ( current ) => [
				...current,
				{
					role: 'user',
					text: attributes.prompt,
					ts: new Date().toISOString(),
				},
				{
					role: 'assistant',
					text:
						syncError.message ||
						__( 'Could not start map generation.', 'jeowp' ),
					ts: new Date().toISOString(),
				},
			] );
		}
	}, [ attributes.prompt, setAttributes, beginRequest, endRequest, requestWasPreempted, PREEMPTED_MESSAGE ] );

	const handleBaseVariantChange = useCallback(
		( newVariant ) => {
			setBaseVariant( newVariant );
			setBaseNotice( '' );

			if ( attrsRef.current.conversation_id ) {
				sendChat(
					`Change the base layer variant to ${ newVariant }.`,
					'base_variant',
					{ variant: newVariant }
				);
				return;
			}

			const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
			if ( ! postId ) {
				return;
			}

			// 3.7 (G-C): a failed base switch is never silent — revert the
			// select to the base that is actually active (so the shown
			// attribution keeps matching the rendered base) and say what
			// happened.
			const failBaseSwitch = () => {
				setBaseVariant(
					attrsRef.current.base_layer?.variant || 'none'
				);
				setBaseNotice(
					__(
						'The selected base could not be loaded; the previous base was kept. Check your connection and try again.',
						'jeowp'
					)
				);
			};

			try {
				apiFetch( {
					path: '/jeo/v1/minimap/setup',
					method: 'POST',
					data: { post_id: postId },
				} )
					.then( ( response ) => {
						if ( response.success && response.base_layer ) {
							const chosen = response.base_layer;

							if (
								newVariant !== 'none' &&
								response.base_layer.variant !== newVariant
							) {
								apiFetch( {
									path: '/jeo/v1/minimap/setup',
									method: 'POST',
									data: {
										post_id: postId,
										base_variant: newVariant,
									},
								} )
									.then( ( r2 ) => {
										if ( r2.success && r2.base_layer ) {
											setAttributes( {
												base_layer: r2.base_layer,
											} );
											setBaseNotice( '' );
										} else {
											failBaseSwitch();
										}
									} )
									.catch( failBaseSwitch );
							} else {
								setAttributes( { base_layer: chosen } );
								setBaseNotice( '' );
							}
						} else {
							failBaseSwitch();
						}
					} )
					.catch( failBaseSwitch );
			} catch ( syncError ) {
				// eslint-disable-next-line no-console
				console.error(
					'[JEO Minimap] Synchronous error during base variant change:',
					syncError
				);
				failBaseSwitch();
			}
		},
		[ sendChat, setAttributes ]
	);

	// C2-01 (Contrato G): version restore stays on the existing chat
	// channel (the list is read-only) — the confirmation lives here in the
	// button, stating what is discarded and that the current version stays
	// in the history (git-revert semantics on the server).
	const handleRestoreVersion = useCallback(
		( version, current ) => {
			if ( chatLoading || ! attrsRef.current.conversation_id ) {
				return;
			}

			// eslint-disable-next-line no-alert
			const confirmed = window.confirm(
				buildRestoreConfirmation( version, current )
			);
			if ( ! confirmed ) {
				return;
			}

			sendChat( buildRestoreMessage( version.n ) );
		},
		[ chatLoading, sendChat ]
	);

	const closeModal = useCallback( () => setModal( false ), [] );
	const openModal = useCallback( () => setModal( true ), [] );

	// The minimap preview renders inside the editor iframe while the block
	// sidebar (InspectorControls) lives in the parent document — resolve the
	// top window and dispatch there, mirroring the iframe bridge pattern used
	// by map-editor-preview.js.
	const openSidebarToLayers = useCallback( () => {
		let topWin;
		try {
			topWin = window.parent !== window ? window.parent : window;
			topWin.wp.data
				.dispatch( 'core/edit-post' )
				.openGeneralSidebar( 'edit-post/block' );
		} catch ( e ) {
			return;
		}

		const scrollToLayersPanel = () => {
			const panel = topWin.document.querySelector( '.jeo-layers-panel' );
			if ( panel ) {
				panel.scrollIntoView( { behavior: 'smooth', block: 'start' } );
				return true;
			}
			return false;
		};

		topWin.setTimeout( () => {
			if ( scrollToLayersPanel() ) {
				return;
			}
			// The inspector may be showing the "Styles" tab, which unmounts the
			// Settings panels — switch back to "Settings" and try again.
			const settingsTab = Array.from(
				topWin.document.querySelectorAll(
					'.block-editor-block-inspector [role="tab"]'
				)
			).find( ( tab ) => /settings/i.test( tab.textContent ) );
			if ( settingsTab ) {
				settingsTab.click();
				topWin.setTimeout( scrollToLayersPanel, 150 );
			}
		}, 100 );
	}, [] );

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
		() =>
			debounce( ( { viewState } ) => {
				const updates = {
					center_lat: viewState.latitude,
					center_lon: viewState.longitude,
				};
				// BUG-C1: a manual reframe makes a stored framing note stale.
				if ( attrsRef.current.framing_note ) {
					updates.framing_note = '';
				}
				setAttributes( updates );
			}, 300 ),
		[ setAttributes ]
	);

	const debouncedOnZoom = useMemo(
		() =>
			debounce( ( { viewState } ) => {
				const zoom = Math.round( viewState.zoom * 10 ) / 10;
				const updates = { [ zoomState ]: zoom };
				if ( attrsRef.current.framing_note ) {
					updates.framing_note = '';
				}
				setAttributes( updates );
			}, 300 ),
		[ setAttributes, zoomState ]
	);

	useEffect( () => {
		return () => {
			debouncedOnMove.cancel();
			debouncedOnZoom.cancel();
		};
	}, [ debouncedOnMove, debouncedOnZoom ] );

	const [ generationMode, setGenerationMode ] = useState( () =>
		attributes.prompt?.trim() ? 'prompt' : 'content'
	);

	const handleGenerate = useCallback( () => {
		if ( generationMode === 'prompt' ) {
			generateFromPrompt();
		} else {
			generate();
		}
	}, [ generationMode, generate, generateFromPrompt ] );

	if ( uiStatus === 'loading' ) {
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
					{ /* Wait contract (2.2/A5): phase + elapsed + recovery.
					     No Cancel — the server persists the turn as it
					     processes, so an abort would diverge the block from
					     the stored conversation; waiting is the safe path. */ }
					<MinimapWaitNote
						phase={ __( 'Generating the map…', 'jeowp' ) }
						elapsed={ generationElapsed }
						recovery={ __(
							'This can take a couple of minutes. If it takes too long, reload the page — the block offers to generate again and nothing already saved is lost.',
							'jeowp'
						) }
					/>
				</Placeholder>
			</div>
		);
	}

	if ( uiStatus === 'idle' || uiStatus === 'error' ) {
		return (
			<div { ...blockProps }>
				{ ! AI_CONFIGURED && <MinimapPrePublishGateWarning /> }
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeowp' ) }
					isColumnLayout={ true }
					className="jeo-minimap-placeholder"
				>
					{ /* 2.1 (K-3): without a configured AI provider the
					     placeholder shows the gate (two capability-aware
					     texts, Contrato D) instead of the dead empty state. */ }
					{ ! AI_CONFIGURED && <MinimapAiGate /> }
					{ AI_CONFIGURED && (
						<p className="jeo-minimap-placeholder__description">
							{ __(
								'AI will analyze your content and suggest relevant map layers, center point, and zoom level.',
								'jeowp'
							) }
						</p>
					) }
					{ uiStatus === 'error' && (
						<div role="alert">
							<Notice
								status="error"
								isDismissible={ false }
								className="jeo-minimap-placeholder__error"
							>
								{ uiError }
							</Notice>
						</div>
					) }
					{ AI_CONFIGURED && (
						<>
							<RadioControl
								selected={ generationMode }
								options={ [
									{
										label: __(
											'Generate from post content',
											'jeowp'
										),
										value: 'content',
									},
									{
										label: __(
											'Generate from prompt',
											'jeowp'
										),
										value: 'prompt',
									},
								] }
								onChange={ setGenerationMode }
							/>
							{ generationMode === 'prompt' && (
								<TextareaControl
									label={ __( 'Map prompt', 'jeowp' ) }
									value={ attributes.prompt || '' }
									onChange={ ( v ) =>
										setAttributes( { prompt: v } )
									}
								/>
							) }
							<Button
								variant="primary"
								onClick={ handleGenerate }
								disabled={
									generationMode === 'prompt' &&
									! attributes.prompt?.trim()
								}
								className="jeo-minimap-placeholder__generate"
							>
								{ __( 'Generate map', 'jeowp' ) }
							</Button>
						</>
					) }
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
							const newBase = update.layers.find(
								( l ) => l.id === baseId
							);
							const newThematic = update.layers.filter(
								( l ) => l.id !== baseId
							);
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
							{
								label: _x( 'Dark', 'base terrain', 'jeowp' ),
								value: 'dark',
							},
							{
								label: _x( 'Light', 'base terrain', 'jeowp' ),
								value: 'light',
							},
							{
								label: _x(
									'Satellite',
									'base terrain',
									'jeowp'
								),
								value: 'satellite',
							},
							{
								label: _x( 'None', 'base terrain', 'jeowp' ),
								value: 'none',
							},
						] }
						onChange={ handleBaseVariantChange }
					/>
					{ /* 3.7 (G-C): a failed base switch is announced, and the
					     select already points back at the base that is actually
					     active (attribution matches the rendered base). */ }
					{ baseNotice && (
						<Notice
							status="warning"
							isDismissible={ true }
							onRemove={ () => setBaseNotice( '' ) }
							className="jeo-minimap-base-notice"
						>
							{ baseNotice }
						</Notice>
					) }
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
						onChange={ ( v ) =>
							setAttributes( { show_pins: v === 'yes' } )
						}
					/>
					{ /* W4 §4: the control communicates when there is
					     nothing to show. */ }
					{ attributes.show_pins &&
						( attributes.pins || [] ).length === 0 && (
							<p
								className="jeo-minimap-pins-empty"
								role="status"
							>
								{ __(
									'No pins were generated for this map.',
									'jeowp'
								) }
							</p>
						) }
				</PanelBody>
				{ AI_CONFIGURED && (
					<PanelBody
						name="minimap-chat"
						title={ __( 'AI Assistant', 'jeowp' ) }
						className="jeo-minimap-chat-panel"
						initialOpen={ true }
					>
						{ conversation.length > 0 && (
							<div className="jeo-chat-messages">
								{ conversation.map( ( msg, i ) => (
									<div
										key={ i }
										className={ `jeo-chat-message jeo-chat-message--${ msg.role }` }
									>
										<span className="jeo-chat-message__role">
											{ 'assistant' === msg.role
												? __( 'Assistant', 'jeowp' )
												: __( 'You', 'jeowp' ) }
										</span>
										<span className="jeo-chat-message__text">
											{ msg.text }
										</span>
									</div>
								) ) }
								{ chatLoading && (
									<div className="jeo-chat-message jeo-chat-message--assistant jeo-chat-message--typing">
										<span className="jeo-chat-message__role">
											{ __( 'Assistant', 'jeowp' ) }
										</span>
										<span
											className="jeo-chat-typing-dots"
											aria-label={ __(
												'Typing…',
												'jeowp'
											) }
										>
											<span />
											<span />
											<span />
										</span>
									</div>
								) }
								<div ref={ messagesEndRef } />
							</div>
						) }
						{ /* Wait contract (2.2/A5) for chat turns: phase + elapsed
						     + recovery. No Cancel — the server persists the turn
						     as it processes, so aborting would diverge the block
						     from the stored conversation. */ }
						{ chatLoading && (
							<MinimapWaitNote
								phase={ __( 'Waiting for the AI…', 'jeowp' ) }
								elapsed={ chatElapsed }
								recovery={ __(
									'If it takes too long, reload the page — everything already generated stays saved.',
									'jeowp'
								) }
							/>
						) }
						<div className="jeo-chat-input-row">
							<TextareaControl
								value={ chatInput }
								onChange={ setChatInput }
								onKeyDown={ ( e ) =>
									handleChatKeyDown( e, () =>
										sendChat( chatInput )
									)
								}
								placeholder={ __(
									'Ask the AI to refine the map… (Shift+Enter for a line break)',
									'jeowp'
								) }
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
								onClick={ () => {
									// C2-01 faceta Regenerate: warn before
									// discarding manually added layers (the
									// server regenerates from scratch).
									const manualCount = (
										attributes.layers || []
									).filter(
										( layer ) =>
											layer.provenance === 'manual'
									).length;
									if (
										manualCount > 0 &&
										// eslint-disable-next-line no-alert
										! window.confirm(
											sprintf(
												/* translators: %d: number of manually added layers. */
												__(
													'Regenerating the map discards the %d layer(s) you added manually. The conversation and the version history are kept. Continue?',
													'jeowp'
												),
												manualCount
											)
										)
									) {
										return;
									}
									sendChat( '', 'regenerate' );
								} }
								disabled={ chatLoading }
								isSmall
							>
								{ __( 'Regenerate', 'jeowp' ) }
							</Button>
							<Button
								variant="secondary"
								onClick={ () =>
									setChatPromptVisible( ! chatPromptVisible )
								}
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
									onKeyDown={ ( e ) =>
										handleChatKeyDown(
											e,
											generateFromChatPrompt
										)
									}
									placeholder={ __(
										'Describe the map you want… (Shift+Enter for a line break)',
										'jeowp'
									) }
								/>
								<Button
									variant="primary"
									onClick={ generateFromChatPrompt }
									disabled={
										chatLoading || ! chatPrompt.trim()
									}
									isSmall
								>
									{ __( 'Generate', 'jeowp' ) }
								</Button>
							</div>
						) }
					</PanelBody>
				) }
				{ /* C2-01 (Contrato G): version history, one entry per accepted
				     AI turn; restore is deterministic with an explicit confirm. */ }
				{ AI_CONFIGURED && attributes.conversation_id && (
					<MinimapVersionsPanel
						postId={ postId }
						conversationId={ attributes.conversation_id }
						onRestore={ handleRestoreVersion }
						refreshKey={ versionsRefreshKey }
						busy={ chatLoading }
					/>
				) }
			</InspectorControls>

			{ uiMessage && (
				<Notice
					status="warning"
					isDismissible={ false }
					className="jeo-minimap-notice"
				>
					{ uiMessage }
				</Notice>
			) }

			{ /* 3.6 (G-B): when the AI declares the real framing, the map
			     "confesses" it next to the map. */ }
			{ attributes.framing_note && (
				<Notice
					status="info"
					isDismissible={ false }
					className="jeo-minimap-framing-note"
				>
					{ sprintf(
						/* translators: %s: humanized framing note from the AI. */
						__( 'Map framing: %s', 'jeowp' ),
						attributes.framing_note
					) }
				</Notice>
			) }

			{ /* V1 race guard: the AI answer arrived after the user changed
			     the map (e.g. undo) — its attribute writes were discarded. */ }
			{ preemptedNotice && (
				<Notice
					status="warning"
					isDismissible={ true }
					onRemove={ () => setPreemptedNotice( '' ) }
					className="jeo-minimap-notice"
				>
					{ preemptedNotice }
				</Notice>
			) }

			<div className="jeo-preview-area">
				{ isPreparingComposedPreview && ! previewError && <Spinner /> }
				{ previewError && (
					<PreviewErrorState
						error={ previewError }
						onRetry={ () =>
							setRetryCount( ( count ) => count + 1 )
						}
					/>
				) }
				{ ( styleBase || useComposedPreview ) && ! previewError && (
					<div className="jeo-style-preview-badge">
						{ __( 'Vector style preview', 'jeowp' ) }
					</div>
				) }
				{ ! isPreparingComposedPreview &&
					! previewError &&
					! tilePreflight.checking && (
					<PreviewErrorBoundary
						onCatch={ ( error ) => setPreviewError( error ) }
					>
					<Map
						key={ `${
							styleBase
								? `style-${ styleBase.instance.id }`
								: 'default'
						}:${ layerSettingsKey }:${
							composedPreview.metadata?.hash || 'default'
						}:${ retryCount }` }
						ref={ mapRef }
						{ ...( useComposedPreview
							? {
									mapStyle: composedPreview.style,
									transformRequest,
							  }
							: styleLayerMapProps( styleBase ) ) }
						onLoad={ () => {
							mapLoadedRef.current = true;
						} }
						onSourceData={ ( event ) => {
							if (
								event?.sourceId &&
								event.sourceDataType === 'content'
							) {
								layerContentRef.current.add( event.sourceId );
							}
						} }
						onError={ ( error ) => {
							handleEditorMapPreviewError( error );
							// After the first successful load, errors are incidental
							// (e.g. a single failing tile); before it, the source
							// itself failed — replace the preview with the error state.
							// Errors from a JEO layer source stay fatal until that
							// source has produced content, even when the base style
							// loaded first (RISK-01 — no courtesy map).
							const sourceId =
								error?.sourceId ?? error?.error?.sourceId;
							const isJeoLayerSource =
								typeof sourceId === 'string' &&
								sourceId.startsWith( 'source_' );
							if (
								isJeoLayerSource
									? ! layerContentRef.current.has( sourceId )
									: ! mapLoadedRef.current
							) {
								setPreviewError( error?.error || error );
							}
						} }
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

								if (
									hasMapboxLayers &&
									layerRecord.meta.type === 'mapbox'
								) {
									return null;
								}

								return (
									<MemoizedRenderLayer
										key={ layer.id }
										layer={ layerRecord.meta }
										instance={ layer }
									/>
								);
							} ) }
						{ attributes.show_pins &&
							( attributes.pins || [] ).map( ( pin, i ) => (
								<MinimapPinMarker
									key={ `${ pin.lat },${ pin.lon },${ i }` }
									pin={ pin }
								/>
							) ) }
					</Map>
					</PreviewErrorBoundary>
				) }
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeowp' ) }
				</Button>
				{ allLayers.length > 0 && (
					<Button
						variant="link"
						onClick={ openSidebarToLayers }
						className="jeo-minimap-understand-layers"
					>
						{ __( 'Understand chosen layers', 'jeowp' ) }
					</Button>
				) }
			</div>
		</div>
	);
}
