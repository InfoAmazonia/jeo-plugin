import { getLayerRequestContext } from './layer-request-context';

describe( 'getLayerRequestContext', () => {
	it( 'returns "edit" when preview payload and nonce are present', () => {
		expect(
			getLayerRequestContext( { isPreviewMapPayload: true, nonce: 'abc123' } )
		).toBe( 'edit' );
	} );

	it( 'returns "view" when preview payload is present but nonce is missing', () => {
		expect(
			getLayerRequestContext( { isPreviewMapPayload: true, nonce: null } )
		).toBe( 'view' );
	} );

	it( 'returns "view" for public embeds without a preview payload', () => {
		expect(
			getLayerRequestContext( { isPreviewMapPayload: false, nonce: 'abc123' } )
		).toBe( 'view' );
	} );
} );
