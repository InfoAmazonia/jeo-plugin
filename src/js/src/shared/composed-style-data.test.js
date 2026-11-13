import {
	fetchJson,
	loadComposedStyleData,
	loadComposedStyleDataFromUrls,
} from './composed-style-data';

function jsonResponse( body ) {
	return {
		ok: true,
		status: 200,
		statusText: 'OK',
		json: () => Promise.resolve( body ),
	};
}

function errorResponse( status = 500 ) {
	return {
		ok: false,
		status,
		statusText: 'Error',
	};
}

function stubFetch( handler ) {
	vi.stubGlobal(
		'fetch',
		vi.fn( ( url ) => Promise.resolve( handler( String( url ) ) ) )
	);
}

describe( 'fetchJson', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'rejects with the response status when the request fails', async () => {
		stubFetch( () => errorResponse( 401 ) );

		await expect( fetchJson( 'https://example.com/style.json' ) )
			.rejects.toThrow( '401 Error' );
	} );

	it( 'sends the REST nonce for same-origin requests', async () => {
		vi.stubGlobal( 'jeoMapVars', { nonce: 'abc123' } );
		const fetchMock = vi.fn( () => Promise.resolve( jsonResponse( {} ) ) );
		vi.stubGlobal( 'fetch', fetchMock );

		await fetchJson( `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/1` );

		expect( fetchMock.mock.calls[ 0 ][ 1 ].headers ).toEqual( {
			'X-WP-Nonce': 'abc123',
		} );
	} );
} );

describe( 'loadComposedStyleData', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	function stubMetadataFlow( metadata, manifest ) {
		stubFetch( ( url ) => {
			if ( url.includes( '/map-style/12' ) && ! url.includes( '/style' ) && ! url.includes( '/manifest' ) ) {
				return jsonResponse( metadata );
			}
			if ( url.includes( '/manifest' ) ) {
				return jsonResponse( manifest );
			}
			return jsonResponse( {} );
		} );
	}

	it( 'appends for_storymap to the metadata URL when provided', async () => {
		vi.stubGlobal( 'jeoMapVars', {
			composedStyleUrlBase: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/`,
		} );
		const fetchMock = stubFetch;
		fetchMock( () => errorResponse( 404 ) );

		await expect(
			loadComposedStyleData( { mapId: 12, forStorymap: 34 } )
		).rejects.toThrow();

		const requestedUrl = globalThis.fetch.mock.calls[ 0 ][ 0 ];
		expect( requestedUrl ).toContain( 'for_storymap=34' );
	} );

	it( 'omits for_storymap when not provided', async () => {
		vi.stubGlobal( 'jeoMapVars', {
			composedStyleUrlBase: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/`,
		} );
		stubFetch( () => errorResponse( 404 ) );

		await expect( loadComposedStyleData( { mapId: 12 } ) ).rejects.toThrow();

		const requestedUrl = globalThis.fetch.mock.calls[ 0 ][ 0 ];
		expect( requestedUrl ).not.toContain( 'for_storymap' );
	} );

	it( 'keeps the refresh flag alongside for_storymap', async () => {
		vi.stubGlobal( 'jeoMapVars', {
			composedStyleUrlBase: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/`,
		} );
		stubFetch( () => errorResponse( 404 ) );

		await expect(
			loadComposedStyleData( { mapId: 12, forStorymap: 34, forceRefresh: true } )
		).rejects.toThrow();

		const requestedUrl = globalThis.fetch.mock.calls[ 0 ][ 0 ];
		expect( requestedUrl ).toContain( 'refresh=true' );
		expect( requestedUrl ).toContain( 'for_storymap=34' );
	} );

	it( 'returns the manifest for a successful metadata flow', async () => {
		vi.stubGlobal( 'jeoMapVars', {
			composedStyleUrlBase: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/`,
		} );
		stubMetadataFlow(
			{
				enabled: true,
				style: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/12/style?hash=abc`,
				manifest: `${ globalThis.location.origin }/wp-json/jeo/v1/map-style/12/manifest?hash=abc`,
			},
			{ layers: [ { slug: 'layer-a' } ] }
		);

		const result = await loadComposedStyleData( { mapId: 12 } );

		expect( result.manifest.layers ).toHaveLength( 1 );
		expect( result.metadata.enabled ).toBe( true );
	} );
} );

describe( 'loadComposedStyleDataFromUrls', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'fetches style and manifest from the provided static URLs', async () => {
		const fetchMock = vi.fn( ( url ) =>
			Promise.resolve(
				jsonResponse(
					url.includes( 'manifest' )
						? { layers: [ { slug: 'layer-a' } ] }
						: { version: 8, sources: {} }
				)
			)
		);
		vi.stubGlobal( 'fetch', fetchMock );

		const result = await loadComposedStyleDataFromUrls( {
			manifestUrl: 'https://example.com/uploads/jeo-mapbox-composed-styles/12/abc/manifest.json',
			styleUrl: 'https://example.com/uploads/jeo-mapbox-composed-styles/12/abc/style.json',
			includeStyle: true,
		} );

		expect( fetchMock ).toHaveBeenCalledTimes( 2 );
		expect( result.manifest.layers ).toHaveLength( 1 );
		expect( result.metadata.style ).toBe(
			'https://example.com/uploads/jeo-mapbox-composed-styles/12/abc/style.json'
		);
		expect( result.style.version ).toBe( 8 );
	} );

	it( 'skips the style fetch by default and still returns its URL', async () => {
		const fetchMock = vi.fn( () =>
			Promise.resolve( jsonResponse( { layers: [ { slug: 'layer-a' } ] } ) )
		);
		vi.stubGlobal( 'fetch', fetchMock );

		const result = await loadComposedStyleDataFromUrls( {
			manifestUrl: 'https://example.com/manifest.json',
			styleUrl: 'https://example.com/style.json',
		} );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		expect( fetchMock.mock.calls[ 0 ][ 0 ] ).toContain( 'manifest.json' );
		expect( result.style ).toBeNull();
		expect( result.metadata.style ).toBe( 'https://example.com/style.json' );
	} );

	it( 'rejects when either URL is missing', async () => {
		await expect( loadComposedStyleDataFromUrls( {} ) ).rejects.toThrow();
		await expect(
			loadComposedStyleDataFromUrls( { styleUrl: 'https://example.com/style.json' } )
		).rejects.toThrow();
	} );

	it( 'rejects with the empty manifest message when no layers are present', async () => {
		vi.stubGlobal( 'fetch', vi.fn( () => Promise.resolve( jsonResponse( { layers: [] } ) ) ) );

		await expect(
			loadComposedStyleDataFromUrls( {
				manifestUrl: 'https://example.com/manifest.json',
				styleUrl: 'https://example.com/style.json',
				emptyManifestMessage: 'No renderable layers.',
			} )
		).rejects.toThrow( 'No renderable layers.' );
	} );

	it( 'rejects when a static fetch fails', async () => {
		vi.stubGlobal( 'fetch', vi.fn( () => Promise.resolve( errorResponse( 404 ) ) ) );

		await expect(
			loadComposedStyleDataFromUrls( {
				manifestUrl: 'https://example.com/manifest.json',
				styleUrl: 'https://example.com/style.json',
			} )
		).rejects.toThrow( '404' );
	} );
} );
