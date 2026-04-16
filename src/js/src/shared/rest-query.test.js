import { appendRestQueryParams } from './rest-query';

describe( 'appendRestQueryParams', () => {
	it( 'serializes nested arrays and objects using bracket notation', () => {
		const searchParams = new URLSearchParams();

		appendRestQueryParams( searchParams, {
			tags: [ 3, 7 ],
			meta_query: [
				{ key: '_flag', compare: '=', value: 'yes' },
				{ key: '_score', compare: '>=', value: '10' },
			],
		} );

		expect( searchParams.toString() ).toContain( 'tags%5B0%5D=3' );
		expect( searchParams.toString() ).toContain( 'tags%5B1%5D=7' );
		expect( searchParams.toString() ).toContain(
			'meta_query%5B0%5D%5Bkey%5D=_flag'
		);
		expect( searchParams.toString() ).toContain(
			'meta_query%5B1%5D%5Bcompare%5D=%3E%3D'
		);
	} );

	it( 'skips empty values but keeps valid scalars', () => {
		const searchParams = new URLSearchParams();

		appendRestQueryParams( searchParams, {
			search: '',
			page: 2,
			before: null,
			after: '2026-03-23T00:00:00',
		} );

		expect( searchParams.get( 'search' ) ).toBeNull();
		expect( searchParams.get( 'page' ) ).toBe( '2' );
		expect( searchParams.get( 'after' ) ).toBe( '2026-03-23T00:00:00' );
	} );
} );
