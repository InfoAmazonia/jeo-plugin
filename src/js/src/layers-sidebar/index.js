import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';

domReady( () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType();

	if ( currentPostType === 'map-layer' ) {
		jQuery( '.editor-post-title' ).after( '<div id="layer-preview" style="margin: 0 10%">' );

		registerPlugin( 'jeo-layers-sidebar', {
			icon: null,
			render: () => {
				return (
					<LayersSidebar />
				);
			},
		} );
	}
} );
