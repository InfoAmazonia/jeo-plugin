import {
	mergeUniqueStoriesById,
	resolveStoriesPage,
} from './stories-helpers';

describe( 'Discovery stories helpers', () => {
	it( 'deduplicates cumulative stories by post id', () => {
		expect(
			mergeUniqueStoriesById(
				[
					{ id: 1, title: { rendered: 'First' } },
					{ id: 2, title: { rendered: 'Second' } },
				],
				[
					{ id: 2, title: { rendered: 'Second updated' } },
					{ id: 3, title: { rendered: 'Third' } },
				]
			)
		).toEqual( [
			{ id: 1, title: { rendered: 'First' } },
			{ id: 2, title: { rendered: 'Second updated' } },
			{ id: 3, title: { rendered: 'Third' } },
		] );
	} );

	it( 'preserves explicit page requests and increments implicit ones', () => {
		expect( resolveStoriesPage( { page: 1 }, { currentPage: 4 } ) ).toBe( 1 );
		expect( resolveStoriesPage( {}, { currentPage: 4 } ) ).toBe( 5 );
		expect( resolveStoriesPage( {}, {} ) ).toBe( 1 );
	} );
} );
