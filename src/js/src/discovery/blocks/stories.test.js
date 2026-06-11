import {
	mergeUniqueStoriesById,
	normalizeStoriesTagIds,
	resolveStoryDateLocale,
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

	it( 'normalizes multiple selected tag ids for REST queries', () => {
		expect( normalizeStoriesTagIds( [ '4', 8, '4', 0, 'invalid' ] ) ).toEqual( [
			4,
			8,
		] );
		expect( normalizeStoriesTagIds( '9,12,bad,-1' ) ).toEqual( [ 9, 12 ] );
		expect( normalizeStoriesTagIds( null ) ).toEqual( [] );
	} );

	it( 'prefers the active site language for story dates', () => {
		expect(
			resolveStoryDateLocale( {
				siteLocale: 'es_CO',
				documentLocale: 'pt-BR',
				browserLocale: 'pt-BR',
			} )
		).toBe( 'es-CO' );

		expect(
			resolveStoryDateLocale( {
				siteLocale: '',
				documentLocale: 'en_US',
				browserLocale: 'pt-BR',
			} )
		).toBe( 'en-US' );
	} );
} );
