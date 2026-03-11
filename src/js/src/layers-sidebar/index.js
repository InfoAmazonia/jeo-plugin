import { useSelect, AsyncModeProvider } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';

import LayersSidebar from './layers-sidebar';

// In Block API v3 the editor content lives inside an iframe, so
// .editor-post-title only exists in the iframe's document, not in
// the parent window where sidebar plugins run. We query both
// documents to support v2 (no iframe) and v3 (iframe) editors.
function getEditorDocument() {
	const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
	return iframe?.contentDocument ?? document;
}

function LayersSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useEffect( () => {
		if ( currentPostType !== 'map-layer' ) {
			return;
		}

		// Create the preview container next to the post title, if it
		// doesn't already exist. Try both parent and iframe documents.
		if ( ! document.getElementById( 'layer-preview' ) ) {
			const editorDoc = getEditorDocument();
			const postTitle = editorDoc.querySelector( '.editor-post-title' );
			if ( postTitle ) {
				const preview = editorDoc.createElement( 'div' );
				preview.setAttribute( 'id', 'layer-preview' );
				postTitle.parentNode.appendChild( preview );
			}
		}
	}, [ currentPostType ] );

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
