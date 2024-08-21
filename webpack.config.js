const path = require( 'path' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		mapboxglLoader: './src/js/src/mapboxgl-loader.js',
		jeoMap: './src/js/src/jeo-map/index.js',
		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		mapBlocks: './src/js/src/map-blocks/index.js',
		discovery: './src/js/src/discovery/index.js',
		// storymap: './src/js/src/map-blocks/storymap.js',
		layersSidebar: './src/js/src/layers-sidebar/index.js',
		mapsSidebar: './src/js/src/maps-sidebar/index.js',
		postsSidebar: './src/js/src/posts-sidebar/index.js',
	},
	output: {
		path: path.resolve( __dirname, './src/js/build/' ),
		publicPath: './src/js/build/',
		filename: '[name].js',
	},
};
