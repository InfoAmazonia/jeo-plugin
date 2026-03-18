import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';
import useDocumentSidebarDefault from '../shared/use-document-sidebar-default';

function LayersSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useDocumentSidebarDefault( currentPostType === 'map-layer' );

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
