import {
	toPickerDate,
	toStoredDateValue,
	updateRelatedPostsDate,
} from './date-range';

describe( 'posts selector date helpers', () => {
	it( 'converts stored ISO strings to picker dates', () => {
		const date = toPickerDate( '2026-03-16T12:34:56.000Z' );

		expect( date ).toBeInstanceOf( Date );
		expect( date.toISOString() ).toBe( '2026-03-16T12:34:56.000Z' );
	} );

	it( 'returns null for empty or invalid stored dates', () => {
		expect( toPickerDate() ).toBeNull();
		expect( toPickerDate( 'invalid-date' ) ).toBeNull();
	} );

	it( 'serializes selected dates back to ISO strings', () => {
		const date = new Date( '2026-03-16T12:34:56.000Z' );

		expect( toStoredDateValue( date ) ).toBe( '2026-03-16T12:34:56.000Z' );
		expect( toStoredDateValue() ).toBeUndefined();
	} );

	it( 'updates the related-post date filters using the stored contract', () => {
		const relatedPosts = {
			categories: [ 10 ],
			tags: [ 20 ],
			after: '2026-03-15T00:00:00.000Z',
			before: undefined,
		};

		expect(
			updateRelatedPostsDate(
				relatedPosts,
				'after',
				new Date( '2026-03-16T12:34:56.000Z' )
			)
		).toEqual( {
			categories: [ 10 ],
			tags: [ 20 ],
			after: '2026-03-16T12:34:56.000Z',
			before: undefined,
		} );

		expect( updateRelatedPostsDate( relatedPosts, 'before', null ) ).toEqual( {
			categories: [ 10 ],
			tags: [ 20 ],
			after: '2026-03-15T00:00:00.000Z',
			before: undefined,
		} );
	} );
} );
