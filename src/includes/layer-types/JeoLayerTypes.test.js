describe( 'JeoLayerTypes', () => {
	beforeEach( () => {
		vi.resetModules();
		delete window.JeoLayerTypes;
	} );

	it( 'dispatches a change event when a layer type is registered', async () => {
		const handleChange = vi.fn();
		window.addEventListener( 'jeo-layer-types-changed', handleChange );

		const { default: layerTypes } = await import( './JeoLayerTypes' );
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

	it( 'reports isStyle only for types registered with isStyle: true', async () => {
		const { default: layerTypes } = await import( './JeoLayerTypes' );

		layerTypes.registerLayerType( 'mapbox', { label: 'Mapbox', isStyle: true } );
		layerTypes.registerLayerType( 'style-json', { label: 'Style JSON', isStyle: true } );
		layerTypes.registerLayerType( 'tilelayer', { label: 'Tile layer' } );

		expect( layerTypes.isStyle( 'mapbox' ) ).toBe( true );
		expect( layerTypes.isStyle( 'style-json' ) ).toBe( true );
		expect( layerTypes.isStyle( 'tilelayer' ) ).toBe( false );
		expect( layerTypes.isStyle( 'unregistered' ) ).toBe( false );
	} );
} );
