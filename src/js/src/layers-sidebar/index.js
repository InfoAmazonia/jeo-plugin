import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';

domReady( () => {
	registerPlugin( 'jeo-layers-sidebar', {
		icon: null,
		render: () => {
			const currentPostType = useSelect( ( select ) => {
				return select( 'core/editor' ).getCurrentPostType()
			}, [] );

			const postTitleElement = document.querySelector('.editor-post-title');

			if(!postTitleElement) {
				return null;
			}

			if(currentPostType === "map-layer") {
				const preview = document.createElement('div');
				preview.setAttribute('id', 'layer-preview');
				postTitleElement.parentNode.appendChild(preview);
			}

			return (
				<AsyncModeProvider value={ true }>
					{ currentPostType === "map-layer"? <LayersSidebar /> : null };
				</AsyncModeProvider>
			)

		},
	} );
} );
