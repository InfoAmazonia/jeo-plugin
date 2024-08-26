import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';
import StoryMapSidebar from './storymap-sidebar';
import { waitUntil } from '../shared/wait';

domReady(() => {
	waitUntil(
		() => document.querySelector( '.editor-post-title' ),
		( postTitleElement ) => {
			registerPlugin( 'jeo-maps-sidebar', {
				icon: null,
				render: () => {
					const currentPostType = useSelect( ( select ) => {
						return select( 'core/editor' ).getCurrentPostType();
					}, [] );

					if (currentPostType === "map") {
						const preview = document.createElement('div');
						preview.setAttribute('id', 'map-preview');
						postTitleElement.parentNode.appendChild(preview);
					}

					return (
						<AsyncModeProvider value={ true }>
							{ currentPostType === "map"? <MapsSidebar /> : null };
							{ currentPostType === "storymap"? <StoryMapSidebar /> : null };
						</AsyncModeProvider>
					);
				},
			} );
		}
	);
});
