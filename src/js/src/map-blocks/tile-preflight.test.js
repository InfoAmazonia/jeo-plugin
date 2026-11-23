import {
	getPreviewAttemptKey,
	getTileLayerPreflightUrls,
	getTilePreflightUrl,
	resolveAttemptTransition,
} from './tile-preflight';

describe( 'resolveAttemptTransition (R3B-G1 (c))', () => {
	it( 'keeps the error when nothing really changed (reference-only commit)', () => {
		expect(
			resolveAttemptTransition( {
				dataChanged: false,
				hasSourceError: true,
			} )
		).toBe( 'keep' );
		expect(
			resolveAttemptTransition( {
				dataChanged: false,
				hasSourceError: false,
			} )
		).toBe( 'keep' );
	} );

	it( 're-decides instead of clearing when a source error shows', () => {
		expect(
			resolveAttemptTransition( {
				dataChanged: true,
				hasSourceError: true,
			} )
		).toBe( 'redecide' );
	} );

	it( 'clears normally on real change without a pending source error', () => {
		expect(
			resolveAttemptTransition( {
				dataChanged: true,
				hasSourceError: false,
			} )
		).toBe( 'clear' );
	} );
} );

describe( 'getPreviewAttemptKey (R3B-G1 race)', () => {
	const meta = {
		type: 'tilelayer',
		layer_type_options: {
			url: 'https://dead-host.example.com/{z}/{x}/{y}.png',
		},
	};

	it( 'is stable across reference-only commits (same content, new object)', () => {
		const renormalized = {
			type: 'tilelayer',
			layer_type_options: { ...meta.layer_type_options },
		};
		expect( getPreviewAttemptKey( meta, 0 ) ).toBe(
			getPreviewAttemptKey( renormalized, 0 )
		);
		// A SchemaForm-style deep-cloned normalization also compares equal.
		expect(
			getPreviewAttemptKey( JSON.parse( JSON.stringify( meta ) ), 0 )
		).toBe( getPreviewAttemptKey( meta, 0 ) );
	} );

	it( 'changes when the content really changes (error must clear)', () => {
		const changed = {
			...meta,
			layer_type_options: {
				url: 'https://tiles.example.com/{z}/{x}/{y}.png',
			},
		};
		expect( getPreviewAttemptKey( changed, 0 ) ).not.toBe(
			getPreviewAttemptKey( meta, 0 )
		);
		expect(
			getPreviewAttemptKey( { ...meta, type: 'mvt' }, 0 )
		).not.toBe( getPreviewAttemptKey( meta, 0 ) );
	} );

	it( 'changes on retry (Try again forces a new attempt)', () => {
		expect( getPreviewAttemptKey( meta, 1 ) ).not.toBe(
			getPreviewAttemptKey( meta, 0 )
		);
	} );
} );

describe( 'getTilePreflightUrl', () => {
	it( 'resolves template tokens into a concrete z0 tile URL', () => {
		expect(
			getTilePreflightUrl( 'https://tiles.example.com/{z}/{x}/{y}.png' )
		).toBe( 'https://tiles.example.com/0/0/0.png' );
		expect(
			getTilePreflightUrl(
				'https://{s}.tiles.example.com/{z}/{x}/{y}{r}.png'
			)
		).toBe( 'https://a.tiles.example.com/0/0/0.png' );
	} );

	it( 'returns null for non-fetchable values', () => {
		expect( getTilePreflightUrl( undefined ) ).toBeNull();
		expect( getTilePreflightUrl( '' ) ).toBeNull();
		expect( getTilePreflightUrl( '   ' ) ).toBeNull();
		expect( getTilePreflightUrl( 'mapbox://mapbox.satellite' ) ).toBeNull();
		expect( getTilePreflightUrl( 'not-a-url' ) ).toBeNull();
	} );

	it( 'trims surrounding whitespace', () => {
		expect( getTilePreflightUrl( ' https://t.example.com/{z}.png ' ) ).toBe(
			'https://t.example.com/0.png'
		);
	} );
} );

describe( 'getTileLayerPreflightUrls', () => {
	it( 'collects tilelayer and MVT urls', () => {
		expect(
			getTileLayerPreflightUrls( {
				type: 'tilelayer',
				layer_type_options: {
					url: 'https://tiles.example.com/{z}/{x}/{y}.png',
				},
			} )
		).toEqual( [ 'https://tiles.example.com/0/0/0.png' ] );
		expect(
			getTileLayerPreflightUrls( {
				type: 'mvt',
				layer_type_options: {
					url: 'https://tiles.example.com/{z}/{x}/{y}.pbf',
				},
			} )
		).toEqual( [ 'https://tiles.example.com/0/0/0.pbf' ] );
	} );

	it( 'returns an empty list for non-tile or incomplete layers', () => {
		expect(
			getTileLayerPreflightUrls( {
				type: 'geojson',
				layer_type_options: { data: 'https://x.example.com/a.json' },
			} )
		).toEqual( [] );
		expect(
			getTileLayerPreflightUrls( {
				type: 'tilelayer',
				layer_type_options: {},
			} )
		).toEqual( [] );
		expect( getTileLayerPreflightUrls( {} ) ).toEqual( [] );
		expect( getTileLayerPreflightUrls( null ) ).toEqual( [] );
	} );
} );
