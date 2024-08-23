import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';
import { waitUntil } from '../shared/wait';

domReady(() => {
	waitUntil(
		() => document.querySelector( '.editor-post-title' ),
		( postTitleElement ) => {
			registerPlugin( 'jeo-layers-sidebar', {
				icon: null,
				render: () => {
					const currentPostType = useSelect( ( select ) => {
						return select( 'core/editor' ).getCurrentPostType()
					}, [] );

					if (currentPostType === "map-layer") {
						const preview = document.createElement('div');
						preview.setAttribute('id', 'layer-preview');
						postTitleElement.parentNode.appendChild(preview);
					}

					return (
						<AsyncModeProvider value={ true }>
							{ currentPostType === "map-layer"? <LayersSidebar /> : null };
						</AsyncModeProvider>
					);
				},
			} );
		}
	);
});
