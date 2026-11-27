import { formatSiteDateTime } from './datetime';
import { formatGeoNumber } from './geo-format';

describe( 'formatSiteDateTime (W4 §6.1)', () => {
	it( 'returns an empty string for empty input', () => {
		expect( formatSiteDateTime( '' ) ).toBe( '' );
		expect( formatSiteDateTime( undefined ) ).toBe( '' );
	} );

	it( 'formats a mysql timestamp (or falls back to it)', () => {
		const result = formatSiteDateTime( '2026-11-09 14:32:11' );
		expect( result ).toBeTruthy();
		expect( result ).not.toMatch( /Invalid|NaN/ );
	} );

	it( 'falls back to the raw value when it cannot be parsed', () => {
		expect( formatSiteDateTime( 'not-a-date' ) ).toBeTruthy();
	} );
} );

describe( 'formatGeoNumber (W4 §6.2)', () => {
	it( 'caps display at 6 decimals and strips trailing zeros', () => {
		expect( formatGeoNumber( -51.92527900123 ) ).toBe( -51.925279 );
		expect( formatGeoNumber( 46.937590934706 ) ).toBe( 46.937591 );
		expect( formatGeoNumber( 5.5 ) ).toBe( 5.5 );
	} );

	it( 'never emits scientific notation', () => {
		const formatted = formatGeoNumber( 5.68e-14 );
		expect( String( formatted ) ).not.toMatch( /e/i );
		expect( formatted ).toBe( 0 );
	} );

	it( 'passes through empty and non-finite input unchanged', () => {
		expect( formatGeoNumber( '' ) ).toBe( '' );
		expect( formatGeoNumber( undefined ) ).toBeUndefined();
		expect( formatGeoNumber( 'abc' ) ).toBe( 'abc' );
	} );
} );
