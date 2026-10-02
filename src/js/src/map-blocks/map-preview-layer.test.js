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

describe( 'renderLayer geojson layer', () => {
	const geojsonLayer = {
		type: 'geojson',
		layer_type_options: {
			data: 'https://example.com/boundary.geojson',
		},
	};
	const geojsonInstanceStyle = {
		id: 1,
		use: 'fixed',
		style: {
			paint: {
				'fill-color': '#8e44ad',
				'fill-opacity': 0.15,
				'fill-outline-color': '#8e44ad',
			},
		},
	};

	it( 'renders a single fill layer with a fill-outline-color', () => {
		const element = renderLayer( {
			layer: geojsonLayer,
			instance: geojsonInstanceStyle,
		} );

		const layers = collectLayerElements( element );
		expect( layers ).toHaveLength( 1 );
		expect( layers[ 0 ].props.type ).toBe( 'fill' );
		expect( layers[ 0 ].props.paint[ 'fill-outline-color' ] ).toBe(
			'#8e44ad'
		);
	} );

	it( 'applies instance opacity to the fill opacity', () => {
		const element = renderLayer( {
			layer: geojsonLayer,
			instance: { ...geojsonInstanceStyle, opacity: 0.5 },
		} );

		const [ fill ] = collectLayerElements( element );
		expect( fill.props.paint[ 'fill-opacity' ] ).toBeCloseTo( 0.075 );
	} );

	it( 'falls back to default paint values', () => {
		const element = renderLayer( {
			layer: geojsonLayer,
			instance: { id: 1, use: 'fixed' },
		} );

		const [ fill ] = collectLayerElements( element );
		expect( fill.props.paint ).toEqual( {
			'fill-color': '#8e44ad',
			'fill-opacity': 0.15,
			'fill-outline-color': '#8e44ad',
		} );
	} );

	it( 'uses inline GeoJSON when provided', () => {
		const inline = {
			type: 'FeatureCollection',
			features: [],
		};
		const element = renderLayer( {
			layer: {
				type: 'geojson',
				layer_type_options: {
					data: 'https://example.com/boundary.geojson',
					inline_geojson: JSON.stringify( inline ),
				},
			},
			instance: { id: 1, use: 'fixed' },
		} );

		expect( element.props.type ).toBe( 'geojson' );
		expect( element.props.data ).toEqual( inline );
	} );

	it( 'prefers inline GeoJSON over the URL', () => {
		const element = renderLayer( {
			layer: {
				type: 'geojson',
				layer_type_options: {
					data: 'https://example.com/boundary.geojson',
					inline_geojson: '{"type":"FeatureCollection","features":[]}',
				},
			},
			instance: { id: 1, use: 'fixed' },
		} );

		expect( typeof element.props.data ).toBe( 'object' );
	} );

	it( 'falls back to the URL when inline GeoJSON is invalid', () => {
		const element = renderLayer( {
			layer: {
				type: 'geojson',
				layer_type_options: {
					data: 'https://example.com/boundary.geojson',
					inline_geojson: '{invalid json',
				},
			},
			instance: { id: 1, use: 'fixed' },
		} );

		expect( element.props.data ).toBe(
			'https://example.com/boundary.geojson'
		);
	} );

	it( 'renders nothing when neither inline JSON nor URL is set', () => {
		const element = renderLayer( {
			layer: {
				type: 'geojson',
				layer_type_options: {},
			},
			instance: { id: 1, use: 'fixed' },
		} );

		expect( element ).toBeNull();
	} );

	it( 'renders a single layer for non-fill render types (extension point)', () => {
		const element = renderLayer( {
			layer: {
				type: 'geojson',
				layer_type_options: {
					data: 'https://example.com/roads.geojson',
					type: 'line',
				},
			},
			instance: { id: 1, use: 'fixed' },
		} );

		const layers = collectLayerElements( element );
		expect( layers ).toHaveLength( 1 );
		expect( layers[ 0 ].props.type ).toBe( 'line' );
		expect( layers[ 0 ].props.id ).toBe( 'layer_1' );
	} );

	it( 'lets the instance style paint override the defaults', () => {
		const element = renderLayer( {
			layer: geojsonLayer,
			instance: {
				id: 1,
				use: 'fixed',
				style: {
					paint: {
						'fill-color': '#222222',
					},
				},
			},
		} );

		const [ fill ] = collectLayerElements( element );
		expect( fill.props.paint[ 'fill-color' ] ).toBe( '#222222' );
		expect( fill.props.paint[ 'fill-outline-color' ] ).toBe( '#8e44ad' );
	} );

	it( 'applies instance opacity to the instance paint', () => {
		const element = renderLayer( {
			layer: geojsonLayer,
			instance: {
				id: 1,
				use: 'fixed',
				opacity: 0.5,
				style: {
					paint: {
						'fill-color': '#222222',
						'fill-opacity': 0.4,
					},
				},
			},
		} );

		const [ fill ] = collectLayerElements( element );
		expect( fill.props.paint[ 'fill-opacity' ] ).toBeCloseTo( 0.2 );
	} );

	it( 'resolves use_default to the layer default_style', () => {
		const element = renderLayer( {
			layer: {
				...geojsonLayer,
				default_style: {
					paint: {
						'fill-color': '#107a48',
						'fill-opacity': 0.3,
						'fill-outline-color': '#0b5c36',
					},
				},
			},
			instance: {
				id: 1,
				use: 'fixed',
				style: { use_default: true },
			},
		} );

		const [ fill ] = collectLayerElements( element );
		expect( fill.props.paint[ 'fill-color' ] ).toBe( '#107a48' );
		expect( fill.props.paint[ 'fill-opacity' ] ).toBeCloseTo( 0.3 );
	} );
} );

describe( 'renderLayer style layer types', () => {
	beforeEach( () => {
		delete window.JeoLayerTypes;
	} );

	afterEach( () => {
		delete window.JeoLayerTypes;
	} );

	it( 'renders nothing for style types (mapbox, style-json)', () => {
		expect(
			renderLayer( {
				layer: {
					type: 'mapbox',
					layer_type_options: { style_id: 'mapbox/dark-v11' },
				},
				instance: { id: 1, use: 'fixed', default: true },
			} )
		).toBeNull();

		expect(
			renderLayer( {
				layer: {
					type: 'style-json',
					layer_type_options: {
						style_url: 'https://tiles.openfreemap.org/styles/dark',
					},
				},
				instance: { id: 2, use: 'fixed', default: true },
			} )
		).toBeNull();
	} );

	it( 'recognizes style types registered with isStyle on the registry', () => {
		window.JeoLayerTypes = {
			isStyle: ( slug ) => 'my-future-style' === slug,
		};

		expect(
			renderLayer( {
				layer: {
					type: 'my-future-style',
					layer_type_options: { style_url: 'https://example.com/s.json' },
				},
				instance: { id: 3, use: 'fixed', default: true },
			} )
		).toBeNull();
	} );
} );
