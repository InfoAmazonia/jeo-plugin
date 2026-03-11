import { createPortal } from '@wordpress/element';

export default function MapPreviewPortal( { children } ) {
	// Try the parent document first, then the iframe editor document.
	let target = document.getElementById( 'map-preview' );
	if ( ! target ) {
		const iframe = document.querySelector( 'iframe[name="editor-canvas"]' );
		target = iframe?.contentDocument?.getElementById( 'map-preview' ) ?? null;
	}
	// If the target still doesn't exist (e.g. iframe not ready yet, or
	// Block API v3 where the container lives in a different document
	// context), render children inline so the preview appears in the
	// sidebar instead of crashing with React error #200.
	if ( ! target ) {
		return children;
	}
	return createPortal( children, target );
}
