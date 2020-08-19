import { createPortal } from '@wordpress/element';

export default function MapPreviewPortal( { children } ) {
	const target = document.getElementById( 'map-preview' );
	return createPortal( children, target );
}
