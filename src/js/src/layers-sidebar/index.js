import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';

function LayersSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	return (
		<AsyncModeProvider value={ true }>
			{ currentPostType === 'map-layer' ? <LayersSidebar /> : null }
		</AsyncModeProvider>
	);
}

domReady( () => {
	registerPlugin( 'jeo-layers-sidebar', {
		icon: null,
		render: LayersSidebarPlugin,
	} );
} );
