import { getLayerRequestContext } from './layer-request-context';

describe( 'getLayerRequestContext', () => {
	it( 'uses view context for public maps even when a nonce is available', () => {
		expect(
			getLayerRequestContext( {
				isPreviewMapPayload: false,
				nonce: 'nonce',
			} )
		).toBe( 'view' );
	} );

	it( 'uses edit context for preview map payloads with a nonce', () => {
		expect(
			getLayerRequestContext( {
				isPreviewMapPayload: true,
				nonce: 'nonce',
			} )
		).toBe( 'edit' );
	} );

	it( 'falls back to view context for preview map payloads without a nonce', () => {
		expect(
			getLayerRequestContext( {
				isPreviewMapPayload: true,
			} )
		).toBe( 'view' );
	} );
} );
