import { mergeLayerTypeOptions } from './layer-type-options';

describe( 'layer type options', () => {
	const coreLayerTypeOptions = [
		{ label: 'Mapbox Style', value: 'mapbox' },
		{ label: 'Vector Mapbox Tiled Source', value: 'mapbox-tileset-vector' },
		{ label: 'Raster Mapbox Tiled Source', value: 'mapbox-tileset-raster' },
		{ label: 'Raster Tiled Source', value: 'tilelayer' },
		{ label: 'Mapbox Vector Tiles (MVT)', value: 'mvt' },
	];

	it( 'keeps all core types when runtime registration is partial', () => {
		expect(
			mergeLayerTypeOptions( coreLayerTypeOptions, [
				{ label: 'Mapbox Style', value: 'mapbox' },
			] )
		).toEqual( coreLayerTypeOptions );
	} );

	it( 'appends extra runtime layer types after the core ones', () => {
		expect(
			mergeLayerTypeOptions( coreLayerTypeOptions, [
				{ label: 'Custom Layer', value: 'custom' },
			] )
		).toEqual( [
			...coreLayerTypeOptions,
			{ label: 'Custom Layer', value: 'custom' },
		] );
	} );
} );
