import { getPanLimitsMaxBounds } from './pan-limits';
import { toFiniteNumber } from './map-numbers';

describe( 'toFiniteNumber', () => {
	it( 'coerces numeric strings and preserves zero values', () => {
		expect( toFiniteNumber( '20' ) ).toBe( 20 );
		expect( toFiniteNumber( '3' ) ).toBe( 3 );
		expect( toFiniteNumber( 0 ) ).toBe( 0 );
		expect( toFiniteNumber( '0' ) ).toBe( 0 );
	} );

	it( 'returns null for missing or non-numeric values', () => {
		expect( toFiniteNumber( '' ) ).toBeNull();
		expect( toFiniteNumber( undefined ) ).toBeNull();
		expect( toFiniteNumber( null ) ).toBeNull();
		expect( toFiniteNumber( false ) ).toBeNull();
		expect( toFiniteNumber( 'not a number' ) ).toBeNull();
	} );
} );

describe( 'getPanLimitsMaxBounds', () => {
	it( 'returns Mapbox/MapLibre bounds in longitude-latitude order', () => {
		expect(
			getPanLimitsMaxBounds( {
				east: -6.0484710101644055,
				north: 5.0559606245613935,
				south: -16.66983997060082,
				west: -105.58460382266483,
			} )
		).toEqual( [
			[ -105.58460382266483, -16.66983997060082 ],
			[ -6.0484710101644055, 5.0559606245613935 ],
		] );
	} );

	it( 'coerces numeric strings and preserves zero values', () => {
		expect(
			getPanLimitsMaxBounds( {
				east: '0',
				north: '0',
				south: '-10',
				west: '-20',
			} )
		).toEqual( [
			[ -20, -10 ],
			[ 0, 0 ],
		] );
	} );

	it( 'returns null when a pan limit is missing or non-numeric', () => {
		expect(
			getPanLimitsMaxBounds( {
				east: -6,
				north: 5,
				south: -16,
			} )
		).toBeNull();

		expect(
			getPanLimitsMaxBounds( {
				east: -6,
				north: 5,
				south: -16,
				west: '',
			} )
		).toBeNull();
	} );
} );
