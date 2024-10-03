const path = require( 'path' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		mapboxglLoader: './src/js/src/mapboxgl-loader.js',
		jeoMap: {
			import: './src/js/src/jeo-map/index.js',
			dependOn: ['mapboxglLoader'],
		},
		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		mapBlocks: {
			import: './src/js/src/map-blocks/index.js',
			dependOn: ['mapboxglLoader'],
		},
		discovery: './src/js/src/discovery/index.js',
		// storymap: './src/js/src/map-blocks/storymap.js',
		layersSidebar: {
			import: './src/js/src/layers-sidebar/index.js',
			dependOn: ['mapboxglLoader'],
		},
		mapsSidebar: {
			import: './src/js/src/maps-sidebar/index.js',
			dependOn: ['mapboxglLoader'],
		},
		postsSidebar: './src/js/src/posts-sidebar/index.js',
	},
	externals: {
		'mapbox-gl': 'mapboxgl',
	},
	output: {
		path: path.resolve( __dirname, './src/js/build/' ),
		publicPath: './src/js/build/',
		filename: '[name].js',
	},
};
