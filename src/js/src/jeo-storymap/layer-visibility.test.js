import { isMapStyleReady, setMapLayerVisibility } from './layer-visibility';

const runtimeCases = [
	'Mapbox GL JS',
	'MapLibre GL JS',
];

function createMapMock( overrides = {} ) {
	return {
		isStyleLoaded: jest.fn( () => true ),
		getLayer: jest.fn( ( layerSlug ) =>
			layerSlug === 'story-layer' ? { id: layerSlug } : undefined
		),
		setLayoutProperty: jest.fn(),
		...overrides,
	};
}

describe( 'isMapStyleReady', () => {
	it( 'returns false before a map instance exists', () => {
		expect( isMapStyleReady( null ) ).toBe( false );
	} );

	it( 'keeps legacy map-like objects usable when they do not expose isStyleLoaded', () => {
		expect( isMapStyleReady( { getLayer: jest.fn() } ) ).toBe( true );
	} );

	it( 'returns false when checking the style state throws', () => {
		const map = createMapMock( {
			isStyleLoaded: jest.fn( () => {
				throw new Error( 'Style is not done loading' );
			} ),
		} );

		expect( isMapStyleReady( map ) ).toBe( false );
	} );
} );

describe.each( runtimeCases )( 'setMapLayerVisibility with %s', () => {
	it( 'sets layer visibility through the shared GL JS map API', () => {
		const map = createMapMock();

		expect( setMapLayerVisibility( map, 'story-layer', 'visible' ) ).toBe( true );
		expect( map.setLayoutProperty ).toHaveBeenCalledWith(
			'story-layer',
			'visibility',
			'visible'
		);
	} );

	it( 'waits for the style to be loaded before touching layer layout', () => {
		const map = createMapMock( {
			isStyleLoaded: jest.fn( () => false ),
		} );

		expect( setMapLayerVisibility( map, 'story-layer', 'none' ) ).toBe( false );
		expect( map.getLayer ).not.toHaveBeenCalled();
		expect( map.setLayoutProperty ).not.toHaveBeenCalled();
	} );

	it( 'skips layers that are not available in the current style', () => {
		const map = createMapMock();

		expect( setMapLayerVisibility( map, 'missing-layer', 'none' ) ).toBe( false );
		expect( map.setLayoutProperty ).not.toHaveBeenCalled();
	} );

	it( 'ignores transient style-loading errors from getLayer', () => {
		const map = createMapMock( {
			getLayer: jest.fn( () => {
				throw new Error( 'Style is not done loading' );
			} ),
		} );

		expect( setMapLayerVisibility( map, 'story-layer', 'visible' ) ).toBe( false );
		expect( map.setLayoutProperty ).not.toHaveBeenCalled();
	} );

	it( 'ignores transient missing-layer errors from setLayoutProperty', () => {
		const map = createMapMock( {
			setLayoutProperty: jest.fn( () => {
				throw new Error( 'Layer story-layer does not exist in the map' );
			} ),
		} );

		expect( setMapLayerVisibility( map, 'story-layer', 'visible' ) ).toBe( false );
	} );

	it( 'rethrows unexpected errors', () => {
		const map = createMapMock( {
			setLayoutProperty: jest.fn( () => {
				throw new Error( 'Unexpected renderer failure' );
			} ),
		} );

		expect( () =>
			setMapLayerVisibility( map, 'story-layer', 'visible' )
		).toThrow( 'Unexpected renderer failure' );
	} );
} );
