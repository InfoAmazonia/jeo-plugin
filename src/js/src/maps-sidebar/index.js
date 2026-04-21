import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';
import StoryMapSidebar from './storymap-sidebar';
import useDocumentSidebarDefault from '../shared/use-document-sidebar-default';

function MapsSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useDocumentSidebarDefault(
		currentPostType === 'map' || currentPostType === 'storymap'
	);

	return (
		<AsyncModeProvider value={ true }>
			{ currentPostType === 'map' ? <MapsSidebar /> : null }
			{ currentPostType === 'storymap' ? <StoryMapSidebar /> : null }
		</AsyncModeProvider>
	);
}

domReady( () => {
	registerPlugin( 'jeo-maps-sidebar', {
		icon: null,
		render: MapsSidebarPlugin,
	} );
} );
