import { Layer } from '../lib/mapgl-react';
import { getStyleProps, renderLayer } from './map-preview-layer';

jest.mock( '../lib/mapgl-react', () => ( {
	Layer: () => null,
	Source: ( { children } ) => children,
	Map: () => null,
} ) );

function collectLayerElements( node, found = [] ) {
	if ( ! node || typeof node !== 'object' ) {
		return found;
	}

	if ( node.type === Layer ) {
		found.push( node );
	}

	if ( Array.isArray( node.props?.children ) ) {
		node.props.children.forEach( ( child ) =>
			collectLayerElements( child, found )
		);
	} else {
		collectLayerElements( node.props?.children, found );
	}

	return found;
}

describe( 'getStyleProps', () => {
	it( 'returns no keys for an empty style', () => {
		const props = getStyleProps( {} );

		expect( props ).toEqual( {} );
		expect( 'filter' in props ).toBe( false );
		expect( 'paint' in props ).toBe( false );
		expect( 'layout' in props ).toBe( false );
	} );

	it( 'keeps only the defined style keys', () => {
		expect(
			getStyleProps( { filter: [ '==', 'class', 'river' ] } )
		).toEqual( {
			filter: [ '==', 'class', 'river' ],
		} );

		expect(
			getStyleProps( { paint: { 'line-color': '#0000ff' } } )
		).toEqual( { paint: { 'line-color': '#0000ff' } } );

		expect( getStyleProps( { layout: { 'line-cap': 'round' } } ) ).toEqual(
			{
				layout: { 'line-cap': 'round' },
			}
		);
	} );

	it( 'returns all keys for a complete style', () => {
		const style = {
			filter: [ '==', 'class', 'river' ],
			paint: { 'line-color': '#0000ff' },
			layout: { 'line-cap': 'round' },
		};

		expect( getStyleProps( style ) ).toEqual( style );
	} );
} );

describe( 'renderLayer vector layer specs', () => {
	const vectorCases = [
		[
			'mapbox-tileset-vector',
			{
				tileset_id: 'mapbox.mapbox-streets-v8',
				source_layer: 'waterway',
				type: 'line',
				style_source_type: 'vector',
			},
		],
		[
			'mvt',
			{
				url: 'https://example.com/tiles/{z}/{x}/{y}.pbf',
				source_layer: 'waterway',
				type: 'line',
				style_source_type: 'vector',
			},
		],
	];

	it.each( vectorCases )(
		'omits undefined style keys for %s',
		( type, options ) => {
			const element = renderLayer( {
				layer: { type, layer_type_options: options },
				instance: { id: 1, use: 'fixed' },
			} );

			const layers = collectLayerElements( element );
			expect( layers ).toHaveLength( 1 );

			const { props } = layers[ 0 ];

			// MapLibre rejects present-but-undefined keys in addLayer().
			expect( 'filter' in props ).toBe( false );
			expect( 'paint' in props ).toBe( false );
			expect( 'layout' in props ).toBe( false );
		}
	);

	it.each( vectorCases )(
		'forwards defined style keys for %s',
		( type, options ) => {
			const style = {
				filter: [ '==', 'class', 'river' ],
				paint: { 'line-color': '#0000ff', 'line-opacity': 1 },
				layout: { 'line-cap': 'round' },
			};

			const element = renderLayer( {
				layer: { type, layer_type_options: options },
				instance: { id: 1, use: 'fixed', style },
			} );

			const [ layer ] = collectLayerElements( element );

			expect( layer.props.filter ).toEqual( style.filter );
			expect( layer.props.paint ).toEqual( style.paint );
			expect( layer.props.layout ).toEqual( style.layout );
		}
	);
} );
