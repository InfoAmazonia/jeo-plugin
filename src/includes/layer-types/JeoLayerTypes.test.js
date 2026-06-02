describe( 'JeoLayerTypes', () => {
	beforeEach( () => {
		jest.resetModules();
		delete window.JeoLayerTypes;
	} );

	it( 'dispatches a change event when a layer type is registered', () => {
		const handleChange = jest.fn();
		window.addEventListener( 'jeo-layer-types-changed', handleChange );

		const layerTypes = require( './JeoLayerTypes' ).default;
		const layerType = { label: 'Custom layer' };

		layerTypes.registerLayerType( 'custom-layer', layerType );

		expect( window.JeoLayerTypes ).toBe( layerTypes );
		expect( layerTypes.getLayerType( 'custom-layer' ) ).toBe( layerType );
		expect( handleChange ).toHaveBeenCalledTimes( 1 );
		expect( handleChange.mock.calls[0][0].detail ).toEqual( {
			layerTypes: [ 'custom-layer' ],
		} );

		window.removeEventListener( 'jeo-layer-types-changed', handleChange );
	} );
} );
