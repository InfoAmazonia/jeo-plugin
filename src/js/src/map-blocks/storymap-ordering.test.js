import {
	createLayerIdSet,
	getLayerId,
	layerIdsMatch,
	moveActiveIndex,
	reconcileSelectedLayersWithAvailableLayers,
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

	it( 'normalizes layer IDs from saved storymap data', () => {
		expect( getLayerId( { id: '12' } ) ).toBe( 12 );
		expect( getLayerId( { id: 12 } ) ).toBe( 12 );
		expect( getLayerId( { id: 'missing' } ) ).toBeNull();
		expect( layerIdsMatch( { id: '12' }, { id: 12 } ) ).toBe( true );
		expect( createLayerIdSet( [ { id: '12' }, { id: 13 } ] ) ).toEqual(
			new Set( [ 12, 13 ] )
		);
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

	it( 'sorts selected layers when saved IDs are strings', () => {
		expect(
			sortSelectedLayersByMapOrder(
				[ { id: '2', name: 'Layer 2' }, { id: '1', name: 'Layer 1' } ],
				[ { id: 1 }, { id: 2 } ]
			)
		).toEqual( [
			{ id: '1', name: 'Layer 1' },
			{ id: '2', name: 'Layer 2' },
		] );
	} );

	it( 'reconciles selected layers against available map-layer records', () => {
		expect(
			reconcileSelectedLayersWithAvailableLayers(
				[
					{ id: '2', name: 'Layer 2' },
					{ id: '1', name: 'Layer 1' },
					{ id: '999', name: 'Detached' },
				],
				[ { id: 1 }, { id: 2 }, { id: 3 } ],
				[ { id: 1 }, { id: 2 } ]
			)
		).toEqual( [
			{ id: 1, name: 'Layer 1' },
			{ id: 2, name: 'Layer 2' },
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
