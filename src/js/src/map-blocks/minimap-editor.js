import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, Notice, PanelBody, Placeholder, Spinner } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Map } from '../lib/mapgl-react';
import LayersSettingsModal from './layers-settings-modal';
import { renderLayer } from './map-preview-layer';
import { coerceMinimapAttributes } from './minimap-config';
import MapPanel from './map-panel';
import LayersPanel from './layers-panel';
import { useRecordsByIds } from '../shared/rest-records';
import { SelectControl, TextareaControl } from '../shared/wp-form-controls';
import './onetime-map-editor.css';

const { map_defaults: mapDefaults } = window.jeo_settings;

export default function MinimapEditor( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const [ modal, setModal ] = useState( false );
	const [ key, setKey ] = useState( 0 );
	const [ baseVariant, setBaseVariant ] = useState(
		attributes.base_layer?.variant || 'dark'
	);

	const normalizedAttributes = useMemo( () => {
		return coerceMinimapAttributes( attributes, {
			center_lat: mapDefaults.lat,
			center_lon: mapDefaults.lng,
			initial_zoom: mapDefaults.zoom,
			min_zoom: 0,
			max_zoom: 20,
		} );
	}, [ attributes ] );

	useEffect( () => {
		setKey( ( k ) => k + 1 );
	}, [ attributes.align, window.screen.width ] );

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

	const layerSettingsKey = useMemo(
		() => JSON.stringify( allLayers ),
		[ allLayers ]
	);

	const { records: loadedLayers = [], isLoading: loadingLayers } = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

	const hasMapboxKey = !! window.jeo_settings?.mapbox_key;

	useEffect( () => {
		if ( attributes.status !== 'idle' ) {
			return;
		}

		if ( ! hasMapboxKey ) {
			setAttributes( {
				status: 'error',
				message: __( 'Mapbox API key is not configured. Set the key in JEO Settings to use the AI-Assisted Map block.', 'jeo' ),
			} );
			return;
		}

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			return;
		}

		setAttributes( { status: 'loading' } );

		apiFetch( {
			path: '/jeo/v1/minimap/setup',
			method: 'POST',
			data: { post_id: postId },
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
					};

					if ( response.base_layer?.variant ) {
						setBaseVariant( response.base_layer.variant );
					}

					setAttributes( updates );
				} else {
					setAttributes( {
						status: 'error',
						message: response.message || __( 'Failed to suggest layers.', 'jeo' ),
					} );
				}
			} )
			.catch( ( error ) => {
				setAttributes( {
					status: 'error',
					message: error.message || __( 'Request failed.', 'jeo' ),
				} );
			} );
	}, [] );

	const resuggest = useCallback( () => {
		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			return;
		}

		setAttributes( { status: 'loading', message: '' } );

		apiFetch( {
			path: '/jeo/v1/minimap/setup',
			method: 'POST',
			data: { post_id: postId },
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
					};

					if ( response.base_layer?.variant ) {
						setBaseVariant( response.base_layer.variant );
					}

					setAttributes( updates );
				} else {
					setAttributes( {
						status: 'error',
						message: response.message || __( 'Failed to suggest layers.', 'jeo' ),
					} );
				}
			} )
			.catch( ( error ) => {
				setAttributes( {
					status: 'error',
					message: error.message || __( 'Request failed.', 'jeo' ),
				} );
			} );
	}, [ setAttributes ] );

	const generateFromPrompt = useCallback( () => {
		if ( ! attributes.prompt?.trim() ) {
			return;
		}

		if ( ! mapboxKey ) {
			setAttributes( {
				status: 'error',
				message: __( 'Mapbox API key is not configured. Set the key in JEO Settings to use the AI-Assisted Map block.', 'jeo' ),
			} );
			return;
		}

		setAttributes( { status: 'loading' } );

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();

		apiFetch( {
			path: '/jeo/v1/minimap/setup-prompt',
			method: 'POST',
			data: { prompt: attributes.prompt, post_id: postId || undefined },
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
					};

					if ( response.base_layer?.variant ) {
						setBaseVariant( response.base_layer.variant );
					}

					setAttributes( updates );
				} else {
					setAttributes( {
						status: 'error',
						message: response.message || __( 'Failed to generate from prompt.', 'jeo' ),
					} );
				}
			} )
			.catch( ( error ) => {
				setAttributes( {
					status: 'error',
					message: error.message || __( 'Request failed.', 'jeo' ),
				} );
			} );
	}, [ attributes.prompt, setAttributes ] );

	const handleBaseVariantChange = useCallback( ( newVariant ) => {
		setBaseVariant( newVariant );

		const postId = wp.data.select( 'core/editor' ).getCurrentPostId();
		if ( ! postId ) {
			return;
		}

		apiFetch( {
			path: '/jeo/v1/minimap/setup',
			method: 'POST',
			data: { post_id: postId },
		} ).then( ( response ) => {
			if ( response.success && response.base_layer ) {
				let chosen = response.base_layer;

				if ( newVariant !== 'none' && response.base_layer.variant !== newVariant ) {
					const allDefaults = [
						{ variant: 'dark', id: response.base_layer.id },
						{ variant: 'light', id: response.base_layer.id },
						{ variant: 'satellite', id: response.base_layer.id },
					];

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
	}, [ setAttributes ] );

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

	if ( attributes.status === 'error' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeo' ) }
				>
					<Notice status="error" isDismissible={ false }>
						{ attributes.message }
					</Notice>
					<TextareaControl
						label={ __( 'Map prompt', 'jeo' ) }
						placeholder={ __( 'Describe the map you want…', 'jeo' ) }
						value={ attributes.prompt || '' }
						onChange={ ( v ) => setAttributes( { prompt: v } ) }
					/>
					<Button variant="primary" onClick={ generateFromPrompt }
						disabled={ ! attributes.prompt?.trim() }
					>
						{ __( 'Generate from prompt', 'jeo' ) }
					</Button>
					<hr />
					<Button variant="secondary" onClick={ generate }>
						{ __( 'Generate from post content', 'jeo' ) }
					</Button>
				</Placeholder>
			</div>
		);
	}

	if ( attributes.status === 'idle' || attributes.status === 'loading' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeo' ) }
					instructions={ __( 'Analyzing post content and suggesting layers…', 'jeo' ) }
				>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	if ( attributes.status === 'idle' ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon="map"
					label={ __( 'AI-Assisted Map', 'jeo' ) }
					instructions={ __( 'Generate map from a text prompt or from post content.', 'jeo' ) }
				>
					<TextareaControl
						label={ __( 'Map prompt', 'jeo' ) }
						placeholder={ __( 'Describe the map you want…', 'jeo' ) }
						value={ attributes.prompt || '' }
						onChange={ ( v ) => setAttributes( { prompt: v } ) }
					/>
					<Button variant="primary" onClick={ generateFromPrompt }
						disabled={ ! attributes.prompt?.trim() }
					>
						{ __( 'Generate from prompt', 'jeo' ) }
					</Button>
					<hr />
					<Button variant="secondary" onClick={ generate }>
						{ __( 'Generate from post content', 'jeo' ) }
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
					title={ __( 'Base Layer', 'jeo' ) }
					className="jeo-minimap-base-panel"
				>
					<SelectControl
						label={ __( 'Base terrain', 'jeo' ) }
						value={ baseVariant }
						options={ [
							{ label: __( 'Dark', 'jeo' ), value: 'dark' },
							{ label: __( 'Light', 'jeo' ), value: 'light' },
							{ label: __( 'Satellite', 'jeo' ), value: 'satellite' },
							{ label: __( 'None', 'jeo' ), value: 'none' },
						] }
						onChange={ handleBaseVariantChange }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
				<PanelBody
					name="minimap-pins"
					title={ __( 'Geolocation Pins', 'jeo' ) }
					className="jeo-minimap-pins-panel"
				>
					<SelectControl
						label={ __( 'Show pins', 'jeo' ) }
						value={ attributes.show_pins ? 'yes' : 'no' }
						options={ [
							{ label: __( 'Yes', 'jeo' ), value: 'yes' },
							{ label: __( 'No', 'jeo' ), value: 'no' },
						] }
						onChange={ ( v ) => setAttributes( { show_pins: v === 'yes' } ) }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				</PanelBody>
				<PanelBody
					name="minimap-actions"
					title={ __( 'AI Suggestions', 'jeo' ) }
					className="jeo-minimap-actions-panel"
				>
					<TextareaControl
						label={ __( 'Map prompt', 'jeo' ) }
						value={ attributes.prompt || '' }
						onChange={ ( v ) => setAttributes( { prompt: v } ) }
					/>
					<Button variant="secondary" onClick={ generateFromPrompt } isLarge
						disabled={ ! attributes.prompt?.trim() }
					>
						{ __( 'Generate from prompt', 'jeo' ) }
					</Button>
					<hr />
					<Button variant="secondary" onClick={ resuggest } isLarge>
						{ __( 'Re-suggest layers', 'jeo' ) }
					</Button>
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
				<Map
					key={ `${ key }:${ currentZoom }:${ layerSettingsKey }` }
					ref={ mapRef }
					style={ { height: '50vh' } }
					latitude={ normalizedAttributes.center_lat }
					longitude={ normalizedAttributes.center_lon }
					zoom={ currentZoom || mapDefaults.zoom }
					onMove={ ( { viewState } ) => {
						setAttributes( {
							center_lat: viewState.latitude,
							center_lon: viewState.longitude,
						} );
					} }
					onZoom={ ( { viewState } ) => {
						const zoom = Math.round( viewState.zoom * 10 ) / 10;
						setAttributes( { [ zoomState ]: zoom } );
					} }
				>
					{ loadedLayers &&
						allLayers.map( ( layer ) => {
							const layerRecord = loadedLayers.find(
								( { id } ) => id === layer.id
							);

							if ( ! layerRecord?.meta ) {
								return null;
							}

							return renderLayer( { layer: layerRecord.meta, instance: layer } );
						} ) }
				</Map>
			</div>

			<div className="jeo-preview-controls">
				<Button variant="primary" isLarge onClick={ openModal }>
					{ __( 'Edit layers settings', 'jeo' ) }
				</Button>
			</div>
		</div>
	);
}
