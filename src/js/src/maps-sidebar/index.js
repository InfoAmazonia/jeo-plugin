import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

import PostsSelector from '../posts-selector';

domReady( () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType();

	if ( currentPostType === 'map' ) {
		registerPlugin( 'jeo-maps-sidebar', {
			icon: null,
			render: () => {
				return (
					<PluginDocumentSettingPanel title={ __( 'Related posts', 'jeo' ) }>
						<PostsSelector />
					</PluginDocumentSettingPanel>
				);
			},
		} );
	}
} );
