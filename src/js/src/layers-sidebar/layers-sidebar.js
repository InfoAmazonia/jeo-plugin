import { PluginDocumentSettingPanel } from '@wordpress/editor';
import AttributionSettings from './attribution-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isEmpty, isEqual } from 'lodash-es';
import { useDebounce } from 'use-debounce';
import LayerSettings from './layer-settings';
import './layers-sidebar.scss';

const LayersSidebar = ( {
	postMeta,
	setPostMeta,
	sendNotice,
	removeNotice,
	lockPostAutoSaving,
	lockPostSaving,
	unlockPostSaving,
} ) => {
	const [ layerTypeSchema, setLayerTypeSchema ] = useState( {} );

	const [ renderControl, setRenderControl ] = useState( {
		status: 'incomplete_form',
	} );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );
	const prevPostMeta = useRef( {} );

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
		switch ( renderControl.status ) {
			case 'incomplete_form':
				createNotice( 'warning', __( 'Please fill all required fields, you will not be able to publish or update until that.', 'jeo' ) );
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'request_error':
				switch ( renderControl.statusCode ) {
					case 401:
						createNotice( 'error', __( 'Your Mapbox access token may be invalid. You will not be able to publish or update. Please check your settings.', 'jeo' ) );
						break;
					case 404:
						createNotice( 'error', __( 'Your layer was not found. You will not be able to publish or update. Please check your settings.', 'jeo' ) );
						break;
					default:
						createNotice( 'error', __( 'Error loading your layer, you will not be able to publish or update. Please check your settings.', 'jeo' ) );
						break;
				}
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'incomplete_settings':
				createNotice( 'warning', __( 'Your Mapbox API Key was not found in your JEO Settings. You will not be able to publish or update.', 'jeo' ), {
					actions: [
						{
							url: '/wp-admin/admin.php?page=jeo-settings',
							label: __( 'Please, check your settings.', 'jeo' ),
						},
					],
				} );
				lockPostSaving( 'layer_lock_key' );
				lockPostAutoSaving( 'layer_lock_key' );
				break;
			case 'ready':
				removeNotice( 'layer_notices' );
				unlockPostSaving( 'layer_lock_key' );
				break;
		}
	}, [ renderControl.status ] );

	useEffect( () => {
		const debouncedLayerTypeOptions = debouncedPostMeta.layer_type_options;
		const prevLayerTypeOptions = prevPostMeta.current.layer_type_options;
		if ( Object.keys( debouncedLayerTypeOptions ).length && Object.keys( layerTypeSchema ).length ) {
			const optionsKeys = Object.keys( layerTypeSchema.properties );
			let anyEmpty = false;
			optionsKeys.some( ( k ) => {
				if (
					isEmpty( debouncedLayerTypeOptions[ k ] ) &&
					layerTypeSchema.required.includes( k )
				) {
					anyEmpty = true;
					setRenderControl( {
						status: 'incomplete_form',
					} );
					return anyEmpty;
				}
				return false;
			} );
			if (
				! anyEmpty &&
				renderControl != 'ready' &&
				! isEqual( debouncedLayerTypeOptions, prevLayerTypeOptions )
			) {
				setRenderControl( {
					status: 'ready',
				} );
			}
			prevPostMeta.current = debouncedPostMeta;
		}
	}, [ debouncedPostMeta.layer_type_options, layerTypeSchema ] );

	return (
		<>
			<PluginDocumentSettingPanel
				name="settings"
				title={ __( 'Settings', 'jeo' ) }
			>
				<LayerSettings />
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel
				name="attribution-settings"
				title={ __( 'Attributions', 'jeo' ) }
			>
				<AttributionSettings />
			</PluginDocumentSettingPanel>

			<PluginDocumentSettingPanel
				name="legend-settings"
				title={ __( 'Legend', 'jeo' ) }
			>
				<LegendsEditor />
			</PluginDocumentSettingPanel>
		</>
	);
};
export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
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
	unlockPostSaving: ( key ) => {
		dispatch( 'core/editor' ).unlockPostSaving( key );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( LayersSidebar )
);
