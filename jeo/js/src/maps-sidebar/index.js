import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';

domReady( () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType();

	if ( currentPostType === 'map' ) {
		jQuery( '.editor-post-title' ).after(
			'<div id="map-preview" style="margin: 0 10%">'
		);

		registerPlugin( 'jeo-maps-sidebar', {
			icon: null,
			render: () => {
				return <MapsSidebar />;
			},
		} );
	}
} );
