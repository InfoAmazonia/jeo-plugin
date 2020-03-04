import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';

domReady( () => {
	const currentPostType = select( 'core/editor' ).getCurrentPostType();

	if ( currentPostType === 'map' ) {
		registerPlugin( 'jeo-maps-sidebar', {
			icon: null,
			render: () => {
				return (
					<MapsSidebar />
				);
			},
		} );
	}
} );
