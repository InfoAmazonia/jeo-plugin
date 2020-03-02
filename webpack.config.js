const path = require( 'path' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		layerSidebar: './src/js/src/layer-sidebar/index.js',
		postsSelector: './src/js/src/posts-selector/index.js',
		postsSidebar: './src/js/src/posts-sidebar/index.js',
		mapboxglLoader: './src/js/src/mapboxgl-loader.js',
		jeoMap: './src/js/src/jeo-map/index.js',
		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		mapBlocks: './src/js/src/map-blocks/index.js',
	},
	output: {
		path: path.resolve( __dirname, './src/js/build/' ),
		publicPath: './src/js/build/',
		filename: '[name].js',
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.css$/,
				use: [ 'style-loader', 'css-loader' ],
			},
		],
	},
};
