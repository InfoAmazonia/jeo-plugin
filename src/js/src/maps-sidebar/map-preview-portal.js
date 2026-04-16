import { createPortal } from '@wordpress/element';

export default function MapPreviewPortal( { children } ) {
	// Only look in the parent document. In Block API v3 the editor
	// content lives inside an iframe — createPortal cannot reliably
	// render across document boundaries, so we fall back to inline
	// rendering (the preview shows in the sidebar panel instead).
	const target = document.getElementById( 'map-preview' );
	if ( ! target ) {
		return children;
	}
	return createPortal( children, target );
}
