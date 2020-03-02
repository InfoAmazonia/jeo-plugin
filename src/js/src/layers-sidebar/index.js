import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

import LayerSettings from './layer-settings';

domReady( () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType();

	if ( currentPostType === 'map-layer' ) {
		registerPlugin( 'jeo-layers-sidebar', {
			icon: null,
			render: () => {
				return (
					<Fragment>
						<PluginDocumentSettingPanel title={ __( 'Settings' ) }>
							<LayerSettings />
						</PluginDocumentSettingPanel>
					</Fragment>
				);
			},
		} );
	}
} );
