import { PluginDocumentSettingPanel } from '@wordpress/editor';
import AttributionSettings from './attribution-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import { select, withDispatch, withSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Map } from '../lib/mapgl-react';
import { MemoizedRenderLayer } from '../map-blocks/map-preview-layer';
import { isEmpty, isEqual } from 'lodash-es';
import { useDebounce } from 'use-debounce';
import LayerPreviewPortal from './layer-preview-portal';
import LayerSettings from './layer-settings';
import './layers-sidebar.scss';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

const LayersSidebar = ( {
	postMeta = {},
	setPostMeta,
	sendNotice,
	removeNotice,
	lockPostAutoSaving,
	lockPostSaving,
	unlockPostAutoSaving,
	unlockPostSaving,
} ) => {
	const {
		center_lat: centerLat,
		center_lon: centerLon,
		initial_zoom: initialZoom,
	} = { ...mapDefaults, ...postMeta };
	const [ layerTypeSchema, setLayerTypeSchema ] = useState( {} );

	const loadedRef = useRef( false );
	const layerReadyRef = useRef( false );
	const [ renderControl, setRenderControl ] = useState( {
		status: 'incomplete_form',
	} );
	const editingMap = useRef( false );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );

	const createNotice = useCallback( ( type, message, options = {} ) => {
		sendNotice( type, message, { id: 'layer_notices', isDismissible: false, ...options } );
	}, [ sendNotice ] );

	useEffect( () => {
		if ( postMeta.type ) {
			const schema = window.JeoLayerTypes.getLayerTypeSchema( postMeta );
			setLayerTypeSchema( schema );
		}
	}, [ postMeta.type ] );

	useEffect( () => {
		if ( renderControl.status !== 'loaded' ) {
			loadedRef.current = false;
		}
		if ( [ 'ready', 'loaded' ].includes( renderControl.status ) ) {
			layerReadyRef.current = true;
		}
		switch ( renderControl.status ) {
			case 'incomplete_form':
				createNotice( 'warning', __( 'Please fill all required fields, you will not be able to publish or update until that.', 'jeowp' ) );
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'request_error':
				switch ( renderControl.statusCode ) {
					case 401:
						createNotice( 'error', __( 'Your Mapbox access token may be invalid. You will not be able to publish or update. Please check your settings.', 'jeowp' ) );
						break;
					case 404:
						createNotice( 'error', __( 'Your layer was not found. You will not be able to publish or update. Please check your settings.', 'jeowp' ) );
						break;
					default:
						createNotice( 'error', __( 'Error loading your layer, you will not be able to publish or update. Please check your settings.', 'jeowp' ) );
						break;
				}
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'incomplete_settings':
				createNotice( 'warning', __( 'Your Mapbox API Key was not found in your JEO Settings. You will not be able to publish or update.', 'jeowp' ), {
					actions: [
						{
							url: '/wp-admin/admin.php?page=jeo-settings',
							label: __( 'Please, check your settings.', 'jeowp' ),
						},
					],
				} );
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'ready':
				removeNotice( 'layer_notices' );
				unlockPostSaving( 'layer_lock_key' );
				unlockPostAutoSaving( 'layer_lock_key' );
				break;
		}
	}, [ renderControl.status ] );

	useEffect( () => {
		const debouncedLayerTypeOptions = debouncedPostMeta.layer_type_options || {};
		const requiredOptions = Array.isArray( layerTypeSchema.required )
			? layerTypeSchema.required
			: [];
		const hasSchema = Object.keys( layerTypeSchema ).length > 0;

		if ( ! debouncedPostMeta.type || ! hasSchema ) {
			setRenderControl( {
				status: 'incomplete_form',
			} );
			return;
		}

		const hasEmptyRequiredOption = requiredOptions.some( ( key ) =>
			isEmpty( debouncedLayerTypeOptions[ key ] )
		);

		if ( hasEmptyRequiredOption ) {
			setRenderControl( {
				status: 'incomplete_form',
			} );
			return;
		}

		setRenderControl( {
			status: 'ready',
		} );
	}, [ debouncedPostMeta.layer_type_options, layerTypeSchema ] );

	const handleMapError = useCallback( ( { target: map, error } ) => {
		try {
			const layer = map.getLayer( 'layer_1' );
			if ( layer ) {
				map.removeLayer( 'layer_1' );
			}
		} catch ( err ) {
			// Layer may not exist yet.
		}

		const statusCode = error?.status ?? error?.source?.status ?? 400;
		setRenderControl( { status: 'request_error', statusCode } );
	}, [] );

	return (
		<>
			<LayerPreviewPortal>
				<Map
					onError={ handleMapError }
					onSourceData={ () => {
						if ( loadedRef.current ) {
							return;
						}
						loadedRef.current = true;
						setRenderControl( { status: 'loaded' } );
						unlockPostSaving( 'layer_lock_key' );
					} }
					style={ { height: '500px', width: '100%' } }
					latitude={ centerLat || 0 }
					longitude={ centerLon || 0 }
					zoom={ initialZoom || 0 }
					onMove={ ( { viewState } ) => {
						setPostMeta( {
							center_lat: viewState.latitude,
							center_lon: viewState.longitude,
						} );
					} }
					onZoom={ ( { viewState } ) => {
						const zoom = Math.round( viewState.zoom * 10 ) / 10;
						setPostMeta( { initial_zoom: zoom } );
					} }
				>
					{ ( layerReadyRef.current || [ 'ready', 'loaded' ].includes( renderControl.status ) ) && (
						<MemoizedRenderLayer layer={ debouncedPostMeta } instance={ { id: 1, use: 'fixed' } } />
					) }
				</Map>
			</LayerPreviewPortal>

			<PluginDocumentSettingPanel
				name="settings"
				title={ __( 'Settings', 'jeowp' ) }
			>
				<LayerSettings />
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel
				name="attribution-settings"
				title={ __( 'Attributions', 'jeowp' ) }
			>
				<AttributionSettings />
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel
				name="legend-settings"
				title={ __( 'Legend', 'jeowp' ) }
			>
				<LegendsEditor />
			</PluginDocumentSettingPanel>
		</>
	);
};
export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		const currentMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};

		dispatch( 'core/editor' ).editPost( {
			meta: { ...currentMeta, ...meta },
		} );
	},
	sendNotice: ( type, message, options ) => {
		dispatch( 'core/notices' ).createNotice( type, message, options );
	},
	removeNotice: ( id ) => {
		dispatch( 'core/notices' ).removeNotice( id );
	},
	lockPostSaving: ( key ) => {
		dispatch( 'core/editor' ).lockPostSaving( key );
	},
	lockPostAutoSaving: ( key ) => {
		dispatch( 'core/editor' ).lockPostAutosaving( key );
	},
	unlockPostAutoSaving: ( key ) => {
		dispatch( 'core/editor' ).unlockPostAutosaving( key );
	},
	unlockPostSaving: ( key ) => {
		dispatch( 'core/editor' ).unlockPostSaving( key );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {},
	} ) )( LayersSidebar )
);
