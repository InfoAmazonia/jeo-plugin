import {
	chunkRecordIds,
	mergeRecordsByIdOrder,
} from './rest-records';

describe( 'rest-records helpers', () => {
	it( 'chunks normalized IDs into stable groups', () => {
		expect(
			chunkRecordIds( [ 1, '2', 2, 3, null, 'foo', 4 ], 2 )
		).toEqual( [ [ 1, 2 ], [ 3, 4 ] ] );
	} );

	it( 'merges fetched records back into the requested ID order', () => {
		const records = [
			{ id: 2, title: { rendered: 'Second' } },
			{ id: 1, title: { rendered: 'First' } },
			{ id: 3, title: { rendered: 'Third' } },
		];

		expect(
			mergeRecordsByIdOrder( [ 3, 1, 2 ], records ).map( ( record ) => record.id )
		).toEqual( [ 3, 1, 2 ] );
	} );

	it( 'skips missing records while preserving the remaining order', () => {
		const records = [
			{ id: 10, title: { rendered: 'Layer 10' } },
			{ id: 30, title: { rendered: 'Layer 30' } },
		];

		expect(
			mergeRecordsByIdOrder( [ 10, 20, 30 ], records ).map( ( record ) => record.id )
		).toEqual( [ 10, 30 ] );
	} );
} );
