import { formatElapsedTime } from './minimap-wait';
import {
	buildRestoreAriaLabel,
	buildRestoreConfirmation,
	formatVersionTimestamp,
} from './minimap-versions';

describe( 'buildRestoreAriaLabel', () => {
	it( 'names the version number and label (a11y C-5)', () => {
		expect( buildRestoreAriaLabel( { n: 3, label: 'Switch to satellite' } ) ).toBe(
			'Restore version 3 (Switch to satellite)'
		);
	} );

	it( 'falls back to a placeholder when the version has no label', () => {
		expect( buildRestoreAriaLabel( { n: 7 } ) ).toBe(
			'Restore version 7 (no description)'
		);
	} );
} );

describe( 'formatElapsedTime', () => {
	it( 'formats seconds below a minute', () => {
		expect( formatElapsedTime( 0 ) ).toBe( '0s' );
		expect( formatElapsedTime( 45 ) ).toBe( '45s' );
	} );

	it( 'formats minutes with zero-padded seconds', () => {
		expect( formatElapsedTime( 65 ) ).toBe( '1m 05s' );
		expect( formatElapsedTime( 125.7 ) ).toBe( '2m 05s' );
	} );
} );

describe( 'formatVersionTimestamp', () => {
	it( 'returns an empty string for empty input', () => {
		expect( formatVersionTimestamp( '' ) ).toBe( '' );
		expect( formatVersionTimestamp( undefined ) ).toBe( '' );
	} );

	it( 'formats a mysql timestamp (or falls back to it)', () => {
		const result = formatVersionTimestamp( '2026-11-09 14:32:11' );
		expect( result ).toBeTruthy();
		// Either the localized datetime or the raw fallback — never garbage.
		expect( result ).not.toMatch( /Invalid|NaN/ );
	} );

	it( 'falls back to the raw value when it cannot be parsed', () => {
		expect( formatVersionTimestamp( 'not-a-date' ) ).toBeTruthy();
	} );
} );

describe( 'buildRestoreConfirmation', () => {
	it( 'names what is discarded and declares reversibility', () => {
		const message = buildRestoreConfirmation(
			{ n: 2, label: 'first draft', timestamp: '2026-11-09 14:00:00' },
			{ n: 5, label: 'current map' }
		);

		expect( message ).toContain( '#2' );
		expect( message ).toContain( 'first draft' );
		expect( message ).toContain( '#5' );
		expect( message ).toContain( 'stays in the history' );
	} );

	it( 'tolerates a missing current version', () => {
		const message = buildRestoreConfirmation(
			{ n: 1, label: '' },
			undefined
		);
		expect( message ).toContain( '#1' );
	} );
} );
