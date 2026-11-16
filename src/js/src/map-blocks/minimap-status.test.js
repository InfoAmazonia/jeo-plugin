import {
	deriveMinimapStatus,
	minimapContentKey,
} from './minimap-status';

describe( 'deriveMinimapStatus', () => {
	it( 'keeps the explicit ready status', () => {
		expect( deriveMinimapStatus( { status: 'ready' } ) ).toBe( 'ready' );
	} );

	it( 'derives ready from generated content even without a status', () => {
		expect(
			deriveMinimapStatus( { status: 'idle', layers: [ { id: 1 } ] } )
		).toBe( 'ready' );
		expect(
			deriveMinimapStatus( {
				status: 'idle',
				conversation: [ { role: 'assistant' } ],
			} )
		).toBe( 'ready' );
		expect(
			deriveMinimapStatus( { base_layer: { id: 5 } } )
		).toBe( 'ready' );
	} );

	it( 'never resurrects a persisted loading spinner (V1 unbrick)', () => {
		// The bricked block of the audit: status 'loading' saved to the
		// post content. Content present → ready; no content → idle.
		expect(
			deriveMinimapStatus( {
				status: 'loading',
				layers: [ { id: 1 } ],
			} )
		).toBe( 'ready' );
		expect( deriveMinimapStatus( { status: 'loading' } ) ).toBe( 'idle' );
	} );

	it( 'treats a persisted error as transient (derives from content)', () => {
		expect( deriveMinimapStatus( { status: 'error' } ) ).toBe( 'idle' );
		expect(
			deriveMinimapStatus( {
				status: 'error',
				conversation: [ { role: 'assistant' } ],
			} )
		).toBe( 'ready' );
	} );

	it( 'defaults to idle for an empty block', () => {
		expect( deriveMinimapStatus( {} ) ).toBe( 'idle' );
	} );
} );

describe( 'minimapContentKey', () => {
	const base = {
		layers: [ { id: 1, use: 'fixed' } ],
		base_layer: { id: 2 },
		pins: [],
		center_lat: -3.1,
		center_lon: -60,
		initial_zoom: 5,
	};

	it( 'is stable for the same content', () => {
		expect( minimapContentKey( base ) ).toBe( minimapContentKey( base ) );
	} );

	it( 'changes when any content piece changes', () => {
		expect(
			minimapContentKey( { ...base, layers: [ { id: 9 } ] } )
		).not.toBe( minimapContentKey( base ) );
		expect( minimapContentKey( { ...base, initial_zoom: 8 } ) ).not.toBe(
			minimapContentKey( base )
		);
	} );

	it( 'ignores non-content attributes (status, message, conversation)', () => {
		expect(
			minimapContentKey( {
				...base,
				status: 'loading',
				message: 'x',
				conversation: [ { role: 'user' } ],
			} )
		).toBe( minimapContentKey( base ) );
	} );

	it( 'tolerates empty attributes', () => {
		expect( typeof minimapContentKey( {} ) ).toBe( 'string' );
	} );
} );
