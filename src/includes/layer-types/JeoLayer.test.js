describe( 'JeoLayer style-type bridge', () => {
	beforeEach( () => {
		vi.resetModules();
		delete window.JeoLayerTypes;
	} );

	async function registerType( slug, definition ) {
		const { default: layerTypes } = await import( './JeoLayerTypes' );
		layerTypes.registerLayerType( slug, definition );
		return layerTypes;
	}

	it( 'exposes isStyle from the layer type definition', async () => {
		await registerType( 'style-json', { label: 'Style JSON', isStyle: true } );
		await registerType( 'tilelayer', { label: 'Tile layer' } );

		const { default: JeoLayer } = await import( './JeoLayer' );

		expect(
			new JeoLayer( 'style-json', { layer_id: 'base' } ).isStyle
		).toBe( true );
		expect(
			new JeoLayer( 'tilelayer', { layer_id: 'tiles' } ).isStyle
		).toBe( false );
	} );

	it( 'dispatches getStyle with inline precedence over the URL', async () => {
		const inline = { version: 8, sources: {}, layers: [] };
		await registerType( 'style-json', {
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

		const { default: JeoLayer } = await import( './JeoLayer' );

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

	it( 'falls back to getInlineStyle/getStyleUrl when getStyle is absent', async () => {
		await registerType( 'legacy-style', {
			label: 'Legacy',
			isStyle: true,
			getStyleUrl: () => 'https://example.com/legacy.json',
		} );

		const { default: JeoLayer } = await import( './JeoLayer' );

		expect( new JeoLayer( 'legacy-style', {} ).getStyle() ).toBe(
			'https://example.com/legacy.json'
		);
	} );
} );
