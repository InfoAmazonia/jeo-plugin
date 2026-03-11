import { useSelect, AsyncModeProvider } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import MapsSidebar from './maps-sidebar';
import StoryMapSidebar from './storymap-sidebar';

// In Block API v3 the editor content lives inside an iframe, so
// .editor-post-title only exists in the iframe's document, not in
// the parent window where sidebar plugins run. We query both
// documents to support v2 (no iframe) and v3 (iframe) editors.
function getEditorDocument() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentDocument ?? document;
}

function MapsSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useEffect( () => {
		if ( currentPostType !== 'map' ) {
			return;
		}

		// Create the preview container next to the post title, if it
		// doesn't already exist. Try both parent and iframe documents.
		if ( ! document.getElementById( 'map-preview' ) ) {
			const editorDoc = getEditorDocument();
			const postTitle = editorDoc.querySelector( '.editor-post-title' );
			if ( postTitle ) {
				const preview = editorDoc.createElement( 'div' );
				preview.setAttribute( 'id', 'map-preview' );
				postTitle.parentNode.appendChild( preview );
			}
		}
	}, [ currentPostType ] );

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
