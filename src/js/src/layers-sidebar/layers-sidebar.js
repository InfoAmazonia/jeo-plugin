import { PluginDocumentSettingPanel } from '@wordpress/editor';
import AttributionSettings from './attribution-settings';
import LegendsEditor from '../posts-sidebar/legends-editor/legend-editor';
import { __ } from '@wordpress/i18n';
import LayerSettings from './layer-settings';

const LayersSidebar = () => {
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

export default LayersSidebar;
