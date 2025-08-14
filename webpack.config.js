const path = require( 'path' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		mapboxglLoader: './src/js/src/mapboxgl-loader.js',
		maplibreglLoader: './src/js/src/maplibregl-loader.js',

		jeoMap: './src/js/src/jeo-map/index.js',
		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		discovery: './src/js/src/discovery/index.js',
		postsSidebar: './src/js/src/posts-sidebar/index.js',

		mapboxglReact: {
			import: './src/js/src/mapboxgl-react.js',
			dependOn: ['mapboxglLoader'],
		},
		maplibreglReact: {
			import: './src/js/src/maplibregl-react.js',
			dependOn: ['maplibreglLoader'],
		},

		mapBlocks: './src/js/src/map-blocks/index.js',
		layersSidebar: './src/js/src/layers-sidebar/index.js',
		mapsSidebar: './src/js/src/maps-sidebar/index.js',

		jeoStorymap: {
			import: './src/js/src/jeo-storymap/storymap-display.js',
			dependOn: ['jeoMap'],
		},
	},
	output: {
		path: path.resolve( __dirname, './src/js/build/' ),
		publicPath: './src/js/build/',
		filename: '[name].js',
	},
};
