import {
	createDefaultRelatedPosts,
	normalizeRelatedPosts,
} from './defaults';

describe( 'posts selector defaults', () => {
	it( 'creates the expected default related-posts shape', () => {
		expect( createDefaultRelatedPosts() ).toEqual( {
			categories: [],
			tags: [],
			meta_query: [],
		} );
	} );

	it( 'normalizes missing related-posts data', () => {
		expect( normalizeRelatedPosts() ).toEqual( createDefaultRelatedPosts() );
	} );

	it( 'preserves existing filters while backfilling missing arrays', () => {
		expect(
			normalizeRelatedPosts( {
				after: '2026-03-20T00:00:00.000Z',
				before: '2026-03-21T00:00:00.000Z',
				categories: [ 12 ],
			} )
		).toEqual( {
			after: '2026-03-20T00:00:00.000Z',
			before: '2026-03-21T00:00:00.000Z',
			categories: [ 12 ],
			tags: [],
			meta_query: [],
		} );
	} );
} );
