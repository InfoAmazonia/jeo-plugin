import {
	createLegacyDateRangePickerValue,
	formatDateRangeValue,
} from './date-range-filter';

describe( 'createLegacyDateRangePickerValue', () => {
	it( 'creates the picker shape expected by the Discovery callbacks', () => {
		const startDate = new Date( '2026-03-01T00:00:00.000Z' );
		const endDate = new Date( '2026-03-31T23:59:59.000Z' );
		const picker = createLegacyDateRangePickerValue( startDate, endDate );

		expect( picker.startDate.toDate() ).toEqual( startDate );
		expect( picker.startDate.toISOString() ).toBe( startDate.toISOString() );
		expect( picker.endDate.toDate() ).toEqual( endDate );
		expect( picker.endDate.toISOString() ).toBe( endDate.toISOString() );
	} );
} );

describe( 'formatDateRangeValue', () => {
	it( 'keeps the MM/DD/YY - MM/DD/YY display contract used by Discovery', () => {
		const startDate = new Date( 2026, 2, 1, 12 );
		const endDate = new Date( 2026, 2, 31, 12 );

		expect(
			formatDateRangeValue( startDate, endDate )
		).toBe( '03/01/26 - 03/31/26' );
	} );
} );
