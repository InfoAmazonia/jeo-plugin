import {
	moveActiveIndex,
	reorderList,
	reorderSlides,
	reorderStorymapLayers,
	sortSelectedLayersByMapOrder,
} from './storymap-ordering';

describe( 'storymap ordering helpers', () => {
	it( 'reorders generic lists immutably', () => {
		expect( reorderList( [ 'a', 'b', 'c' ], 0, 2 ) ).toEqual( [ 'b', 'c', 'a' ] );
	} );

	it( 'keeps track of the active slide index while slides move', () => {
		expect( moveActiveIndex( 1, 0, 2 ) ).toBe( 0 );
		expect( moveActiveIndex( 1, 2, 0 ) ).toBe( 2 );
		expect( moveActiveIndex( 2, 2, 0 ) ).toBe( 0 );
	} );

	it( 'reorders slides and preserves the active slide identity', () => {
		expect(
			reorderSlides(
				[ { id: 'slide-a' }, { id: 'slide-b' }, { id: 'slide-c' } ],
				1,
				0,
				2
			)
		).toEqual( {
			slides: [ { id: 'slide-b' }, { id: 'slide-c' }, { id: 'slide-a' } ],
			currentSlideIndex: 0,
		} );
	} );

	it( 'sorts selected layers by the visible layer order', () => {
		expect(
			sortSelectedLayersByMapOrder(
				[ { id: 2, name: 'Layer 2' }, { id: 1, name: 'Layer 1' }, { id: 999, name: 'Detached' } ],
				[ { id: 1 }, { id: 2 }, { id: 3 } ]
			)
		).toEqual( [
			{ id: 1, name: 'Layer 1' },
			{ id: 2, name: 'Layer 2' },
			{ id: 999, name: 'Detached' },
		] );
	} );

	it( 'reorders the visible layer list and keeps slide selections aligned with it', () => {
		expect(
			reorderStorymapLayers(
				[ { id: 1 }, { id: 2 }, { id: 3 } ],
				[
					{
						selectedLayers: [ { id: 1 }, { id: 3 } ],
					},
					{
						selectedLayers: [ { id: 2 } ],
					},
				],
				2,
				0
			)
		).toEqual( {
			navigateMapLayers: [ { id: 3 }, { id: 1 }, { id: 2 } ],
			slides: [
				{
					selectedLayers: [ { id: 3 }, { id: 1 } ],
				},
				{
					selectedLayers: [ { id: 2 } ],
				},
			],
		} );
	} );
} );
