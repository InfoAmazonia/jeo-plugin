import { isStyleLayerType } from './style-layer-types';

describe( 'isStyleLayerType', () => {
	it( 'defers to the JeoLayerTypes registry', () => {
		const registry = { isStyle: ( slug ) => 'custom-style' === slug };

		expect( isStyleLayerType( 'custom-style', registry ) ).toBe( true );
		expect( isStyleLayerType( 'mapbox', registry ) ).toBe( false );
	} );

	it( 'returns false when the registry is unavailable', () => {
		expect( isStyleLayerType( 'mapbox', undefined ) ).toBe( false );
		expect( isStyleLayerType( 'mapbox', {} ) ).toBe( false );
	} );

	it( 'returns false for empty slugs', () => {
		const registry = { isStyle: () => true };

		expect( isStyleLayerType( '', registry ) ).toBe( false );
		expect( isStyleLayerType( null, registry ) ).toBe( false );
		expect( isStyleLayerType( undefined, registry ) ).toBe( false );
	} );

	it( 'defaults to the window registry', () => {
		window.JeoLayerTypes = { isStyle: ( slug ) => 'window-style' === slug };

		expect( isStyleLayerType( 'window-style' ) ).toBe( true );
		expect( isStyleLayerType( 'other' ) ).toBe( false );

		delete window.JeoLayerTypes;
	} );
} );
