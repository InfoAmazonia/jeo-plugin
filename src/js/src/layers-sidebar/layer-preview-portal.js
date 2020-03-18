import { createPortal } from '@wordpress/element';

export default function LayerPreviewPortal( { children } ) {
	const target = document.getElementById( 'layer-preview' );
	return createPortal( children, target );
}
