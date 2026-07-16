export function getLayerRequestContext( { isPreviewMapPayload = false, nonce = null } = {} ) {
	return isPreviewMapPayload && nonce ? 'edit' : 'view';
}
