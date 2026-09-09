describe( 'JeoLayer style-type bridge', () => {
	beforeEach( () => {
		jest.resetModules();
		delete window.JeoLayerTypes;
	} );

	function registerType( slug, definition ) {
		const layerTypes = require( './JeoLayerTypes' ).default;
		layerTypes.registerLayerType( slug, definition );
		return layerTypes;
	}

	it( 'exposes isStyle from the layer type definition', () => {
		registerType( 'style-json', { label: 'Style JSON', isStyle: true } );
		registerType( 'tilelayer', { label: 'Tile layer' } );

		const JeoLayer = require( './JeoLayer' ).default;

		expect(
			new JeoLayer( 'style-json', { layer_id: 'base' } ).isStyle
		).toBe( true );
		expect(
			new JeoLayer( 'tilelayer', { layer_id: 'tiles' } ).isStyle
		).toBe( false );
	} );

	it( 'dispatches getStyle with inline precedence over the URL', () => {
		const inline = { version: 8, sources: {}, layers: [] };
		registerType( 'style-json', {
			label: 'Style JSON',
			isStyle: true,
			getInlineStyle: ( attributes ) =>
				attributes.layer_type_options.inline
					? JSON.parse( attributes.layer_type_options.inline )
					: null,
			getStyleUrl: ( attributes ) =>
				attributes.layer_type_options.style_url || null,
			getStyle( attributes ) {
				return (
					this.getInlineStyle( attributes ) ||
					this.getStyleUrl( attributes )
				);
			},
		} );

		const JeoLayer = require( './JeoLayer' ).default;

		expect(
			new JeoLayer( 'style-json', {
				layer_type_options: { style_url: 'https://example.com/s.json' },
			} ).getStyle()
		).toBe( 'https://example.com/s.json' );

		expect(
			new JeoLayer( 'style-json', {
				layer_type_options: {
					style_url: 'https://example.com/s.json',
					inline: JSON.stringify( inline ),
				},
			} ).getStyle()
		).toEqual( inline );
	} );

	it( 'falls back to getInlineStyle/getStyleUrl when getStyle is absent', () => {
		registerType( 'legacy-style', {
			label: 'Legacy',
			isStyle: true,
			getStyleUrl: () => 'https://example.com/legacy.json',
		} );

		const JeoLayer = require( './JeoLayer' ).default;

		expect( new JeoLayer( 'legacy-style', {} ).getStyle() ).toBe(
			'https://example.com/legacy.json'
		);
	} );
} );
