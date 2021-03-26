// import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { useSelect, AsyncModeProvider } from '@wordpress/data';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';

domReady( () => {
	registerPlugin( 'jeo-maps-sidebar', {
		icon: null,
		render: () => {
			const currentPostType = useSelect( ( select ) => {
				return select( 'core/editor' ).getCurrentPostType()
			}, [] );

			const postTitleElement = document.querySelector('.editor-post-title');

			if(!postTitleElement) {
				return null;
			}

			if(currentPostType === "map") {
				const preview = document.createElement('div');
				preview.setAttribute('id', 'map-preview');
				postTitleElement.parentNode.appendChild(preview);
			}

			return (
				<AsyncModeProvider value={ true }>
					{ currentPostType === "map"? <MapsSidebar /> : null };
				</AsyncModeProvider>
			)

		},
	} );

	// }


} );
