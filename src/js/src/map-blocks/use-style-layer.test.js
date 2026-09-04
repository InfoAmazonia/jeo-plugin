import {
	findStyleLayer,
	getStyleJsonStyle,
	getStyleLayerStyle,
	styleLayerMapProps,
} from './use-style-layer';

jest.mock( '../lib/mapgl-loader', () => ( {
	mapboxToken: 'global-test-token',
	transformRequest: null,
} ) );

describe( 'getStyleLayerStyle', () => {
	it( 'returns null when the instance does not load as style', () => {
		expect(
			getStyleLayerStyle(
				{ type: 'style-json', layer_type_options: { style_url: 'https://example.com/style.json' } },
				{ load_as_style: false }
			)
		).toBeNull();
	} );

	it( 'resolves a style-json URL without requiring a token', () => {
		expect(
			getStyleLayerStyle(
				{ type: 'style-json', layer_type_options: { style_url: 'https://tiles.openfreemap.org/styles/dark' } },
				{ load_as_style: true }
			)
		).toBe( 'https://tiles.openfreemap.org/styles/dark' );
	} );

	it( 'gives precedence to inline style JSON over the URL', () => {
		const inline = { version: 8, sources: {}, layers: [] };

		expect(
			getStyleLayerStyle(
				{
					type: 'style-json',
					layer_type_options: {
						style_url: 'https://example.com/style.json',
						inline_style: JSON.stringify( inline ),
					},
				},
				{ load_as_style: true }
			)
		).toEqual( inline );
	} );

	it( 'falls back to the URL when inline style JSON is invalid', () => {
		expect(
			getStyleLayerStyle(
				{
					type: 'style-json',
					layer_type_options: {
						style_url: 'https://example.com/style.json',
						inline_style: '{invalid json',
					},
				},
				{ load_as_style: true }
			)
		).toBe( 'https://example.com/style.json' );
		expect( console ).toHaveWarned();
	} );

	it( 'resolves a legacy mapbox style through the Mapbox API', () => {
		expect(
			getStyleLayerStyle(
				{ type: 'mapbox', layer_type_options: { style_id: 'mapbox/dark-v11' } },
				{ load_as_style: true }
			)
		).toBe(
			'https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=global-test-token'
		);
	} );

	it( 'honors a per-layer mapbox access token', () => {
		expect(
			getStyleLayerStyle(
				{
					type: 'mapbox',
					layer_type_options: {
						style_id: 'mapbox://styles/custom/user-style',
						access_token: 'layer-token',
					},
				},
				{ load_as_style: true }
			)
		).toBe(
			'https://api.mapbox.com/styles/v1/custom/user-style?access_token=layer-token'
		);
	} );

	it( 'returns null for a mapbox style without any token', () => {
		const loader = require( '../lib/mapgl-loader' );
		loader.mapboxToken = '';

		expect(
			getStyleLayerStyle(
				{ type: 'mapbox', layer_type_options: { style_id: 'mapbox/dark-v11' } },
				{ load_as_style: true }
			)
		).toBeNull();

		loader.mapboxToken = 'global-test-token';
	} );
} );

describe( 'getStyleJsonStyle', () => {
	it( 'returns inline style when present', () => {
		const inline = { version: 8, sources: {}, layers: [] };

		expect(
			getStyleJsonStyle( {
				style_url: 'https://example.com/style.json',
				inline_style: JSON.stringify( inline ),
			} )
		).toEqual( inline );
	} );

	it( 'returns the URL when no inline style is set', () => {
		expect(
			getStyleJsonStyle( { style_url: ' https://example.com/style.json ' } )
		).toBe( 'https://example.com/style.json' );
	} );

	it( 'returns null when neither is set', () => {
		expect( getStyleJsonStyle( {} ) ).toBeNull();
	} );
} );

describe( 'findStyleLayer', () => {
	it( 'hoists a style-json base without a transformRequest', () => {
		const styleBase = findStyleLayer(
			[
				{
					id: 7,
					meta: {
						type: 'style-json',
						layer_type_options: { style_url: 'https://tiles.openfreemap.org/styles/dark' },
					},
				},
			],
			[ { id: 7, load_as_style: true } ]
		);

		expect( styleBase ).not.toBeNull();
		expect( styleBase.style ).toBe( 'https://tiles.openfreemap.org/styles/dark' );
		expect( styleBase.transformRequest ).toBeNull();
	} );

	it( 'ignores layers that are not loaded as style', () => {
		expect(
			findStyleLayer(
				[
					{
						id: 7,
						meta: {
							type: 'style-json',
							layer_type_options: { style_url: 'https://example.com/style.json' },
						},
					},
				],
				[ { id: 7, load_as_style: false } ]
			)
		).toBeNull();
	} );

	it( 'returns null when nothing resolves', () => {
		expect( findStyleLayer( [], [] ) ).toBeNull();
	} );
} );

describe( 'styleLayerMapProps', () => {
	it( 'returns an empty object without a style base', () => {
		expect( styleLayerMapProps( null ) ).toEqual( {} );
	} );

	it( 'passes a style URL as mapStyle', () => {
		expect(
			styleLayerMapProps( { style: 'https://example.com/style.json' } )
		).toEqual( { mapStyle: 'https://example.com/style.json' } );
	} );

	it( 'passes an inline style object as mapStyle', () => {
		const inline = { version: 8, sources: {}, layers: [] };

		expect( styleLayerMapProps( { style: inline } ) ).toEqual( {
			mapStyle: inline,
		} );
	} );
} );
