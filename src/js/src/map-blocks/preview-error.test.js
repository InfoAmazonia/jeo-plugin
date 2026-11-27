import {
	buildPreviewErrorDetail,
	getPreviewErrorInfo,
	getServerErrorPayload,
} from './preview-error';

vi.mock( './preview-error.css', () => ( {} ) );

describe( 'getServerErrorPayload', () => {
	it( 'returns null for errors without a data payload', () => {
		expect( getServerErrorPayload( new Error( 'boom' ) ) ).toBeNull();
		expect( getServerErrorPayload( null ) ).toBeNull();
		expect( getServerErrorPayload( { data: { status: 500 } } ) ).toBeNull();
	} );

	it( 'reads the humanized { message, action, detail } payload', () => {
		const payload = getServerErrorPayload( {
			data: {
				status: 400,
				message: 'Human message',
				action: {
					label: 'Open settings',
					url: '/wp-admin/admin.php?page=jeo-settings',
				},
				detail: 'technical dump',
			},
		} );

		expect( payload ).toEqual( {
			message: 'Human message',
			actionLabel: 'Open settings',
			actionUrl: '/wp-admin/admin.php?page=jeo-settings',
			detail: 'technical dump',
		} );
	} );

	it( 'accepts a plain-string action', () => {
		const payload = getServerErrorPayload( {
			data: { message: 'Human message', action: 'Try again later' },
		} );

		expect( payload.actionLabel ).toBe( 'Try again later' );
		expect( payload.actionUrl ).toBeNull();
	} );
} );

describe( 'getPreviewErrorInfo', () => {
	it( 'prefers the server payload over client-side classification', () => {
		const info = getPreviewErrorInfo( {
			status: 401,
			message: '401 Unauthorized',
			data: { message: 'Human message', detail: 'dump' },
		} );

		expect( info.message ).toBe( 'Human message' );
		expect( info.detail ).toBe( 'dump' );
	} );

	it( 'classifies 401/403 as a token problem with a settings action', () => {
		for ( const status of [ 401, 403 ] ) {
			const info = getPreviewErrorInfo( {
				status,
				message: `${ status }`,
			} );
			expect( info.message ).toMatch( /access token/i );
			expect( info.actionUrl ).toContain( 'page=jeo-settings' );
		}
	} );

	it( 'parses the status from legacy "NNN Reason" messages', () => {
		const info = getPreviewErrorInfo( new Error( '404 Not Found' ) );
		expect( info.message ).toMatch( /404/ );
	} );

	it( 'classifies network failures', () => {
		const info = getPreviewErrorInfo( new TypeError( 'Failed to fetch' ) );
		expect( info.message ).toMatch( /could not be reached/i );
	} );

	it( 'falls back to a generic message and keeps the technical detail', () => {
		const info = getPreviewErrorInfo( new Error( 'weird failure' ) );
		expect( info.message ).toMatch( /could not be loaded/i );
		expect( info.detail ).toContain( 'weird failure' );
	} );
} );

describe( 'buildPreviewErrorDetail', () => {
	it( 'includes status, url and message when present', () => {
		const detail = buildPreviewErrorDetail( {
			status: 404,
			url: 'https://api.example.com/style.json',
			message: '404 Not Found',
		} );

		expect( detail ).toContain( 'HTTP 404' );
		expect( detail ).toContain( 'https://api.example.com/style.json' );
		expect( detail ).toContain( '404 Not Found' );
	} );

	it( 'never returns an empty string', () => {
		expect( buildPreviewErrorDetail( undefined ) ).not.toBe( '' );
	} );
} );
