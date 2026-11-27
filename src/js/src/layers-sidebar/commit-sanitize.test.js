import {
	learnInjectedDefaults,
	stripInjectedDefaults,
} from './commit-sanitize';

const TILELAYER_SCHEMA = {
	required: [ 'url' ],
	properties: {
		url: { type: 'string' },
		scheme: { type: 'string', default: 'xyz' },
	},
};

const TILESET_SCHEMA = {
	required: [ 'tileset_id', 'style_source_type', 'type' ],
	properties: {
		tileset_id: { type: 'string' },
		style_source_type: { type: 'string', default: 'vector' },
		type: { type: 'string', default: 'raster' },
	},
};

function makeFormData( options, type = 'tilelayer' ) {
	return { type, layer_type_options: options };
}

describe( 'learnInjectedDefaults', () => {
	it( 'learns non-required keys absent at mount carrying the schema default', () => {
		const injected = new Set();
		learnInjectedDefaults( {
			formData: makeFormData( {
				url: 'https://t.example.com/{z}/{x}/{y}.png',
				scheme: 'xyz',
			} ),
			initialFormData: makeFormData( {
				url: 'https://t.example.com/{z}/{x}/{y}.png',
			} ),
			schema: TILELAYER_SCHEMA,
			injectedKeys: injected,
		} );
		expect( [ ...injected ] ).toEqual( [ 'scheme' ] );
	} );

	it( 'never learns required keys or user-provided values', () => {
		const injected = new Set();
		learnInjectedDefaults( {
			formData: makeFormData(
				{
					tileset_id: 'a.b',
					style_source_type: 'vector',
					type: 'raster',
				},
				'mapbox-tileset-vector'
			),
			initialFormData: makeFormData(
				{ tileset_id: 'a.b' },
				'mapbox-tileset-vector'
			),
			schema: TILESET_SCHEMA,
			injectedKeys: injected,
		} );
		expect( injected.size ).toBe( 0 );
	} );
} );

describe( 'stripInjectedDefaults (R3B-G1 (a))', () => {
	it( 'strips untouched mount-injected defaults from the commit', () => {
		const injected = new Set( [ 'scheme' ] );
		const committed = stripInjectedDefaults( {
			formData: makeFormData( {
				url: 'https://t.example.com/{z}/{x}/{y}.png',
				scheme: 'xyz',
			} ),
			schema: TILELAYER_SCHEMA,
			injectedKeys: injected,
		} );
		expect( committed.layer_type_options ).toEqual( {
			url: 'https://t.example.com/{z}/{x}/{y}.png',
		} );
		expect( committed.type ).toBe( 'tilelayer' );
	} );

	it( 'keeps required keys even when marked injected', () => {
		const injected = new Set( [ 'style_source_type' ] );
		const committed = stripInjectedDefaults( {
			formData: makeFormData(
				{
					tileset_id: 'a.b',
					style_source_type: 'vector',
					type: 'raster',
				},
				'mapbox-tileset-vector'
			),
			schema: TILESET_SCHEMA,
			injectedKeys: injected,
		} );
		expect( committed.layer_type_options.style_source_type ).toBe(
			'vector'
		);
	} );

	it( 'persists an injected key once the user changes it (unlearn)', () => {
		const injected = new Set( [ 'scheme' ] );
		const committed = stripInjectedDefaults( {
			formData: makeFormData( { url: 'https://t.example.com/{z}/{x}/{y}.png', scheme: 'tms' } ),
			schema: TILELAYER_SCHEMA,
			injectedKeys: injected,
		} );
		expect( committed.layer_type_options.scheme ).toBe( 'tms' );
		expect( injected.has( 'scheme' ) ).toBe( false );
	} );

	it( 'commits user-chosen values for keys never injected', () => {
		const committed = stripInjectedDefaults( {
			formData: makeFormData( { url: 'https://t.example.com/{z}/{x}/{y}.png', scheme: 'tms' } ),
			schema: TILELAYER_SCHEMA,
			injectedKeys: new Set(),
		} );
		expect( committed.layer_type_options ).toEqual( {
			url: 'https://t.example.com/{z}/{x}/{y}.png',
			scheme: 'tms',
		} );
	} );
} );
