import { PluginDocumentSettingPanel } from '@wordpress/editor';
import AttributionSettings from './attribution-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import { select, withDispatch, withSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isEmpty } from 'lodash-es';
import { useDebounce } from 'use-debounce';
import LayerSettings from './layer-settings';
import { getEditorLayerTypeSchema } from './layer-type-definitions';
import './layers-sidebar.scss';

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
	const [ layerTypeSchema, setLayerTypeSchema ] = useState( {} );
	const [ layerTypeRegistryVersion, setLayerTypeRegistryVersion ] = useState( 0 );

	const [ renderControl, setRenderControl ] = useState( {
		status: 'incomplete_form',
	} );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );

	const createNotice = useCallback( ( type, message, options = {} ) => {
		sendNotice( type, message, { id: 'layer_notices', isDismissible: false, ...options } );
	}, [ sendNotice ] );

	useEffect( () => {
		const handleLayerTypesChanged = () => {
			setLayerTypeRegistryVersion( ( currentVersion ) => currentVersion + 1 );
		};

		window.addEventListener(
			'jeo-layer-types-changed',
			handleLayerTypesChanged
		);

		return () => {
			window.removeEventListener(
				'jeo-layer-types-changed',
				handleLayerTypesChanged
			);
		};
	}, [] );

	useEffect( () => {
		if ( postMeta.type ) {
			const schema = getEditorLayerTypeSchema( postMeta );
			setLayerTypeSchema( schema || {} );
		} else {
			setLayerTypeSchema( {} );
		}
	}, [ postMeta.type, layerTypeRegistryVersion ] );

	useEffect( () => {
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

	return (
		<>
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
