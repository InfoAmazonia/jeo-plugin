const path = require( 'path' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		mapglLoader: './src/js/src/lib/mapgl-loader.js',
		mapglReact: {
			import: './src/js/src/lib/mapgl-react.js',
			dependOn: ['mapglLoader'],
		},

		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		postsSidebar: './src/js/src/posts-sidebar/index.js',

		jeoMap: {
			import: './src/js/src/jeo-map/index.js',
			dependOn: ['mapglLoader'],
		},
		jeoStorymap: {
			import: './src/js/src/jeo-storymap/storymap-display.js',
			dependOn: ['jeoMap'],
		},
		discovery: {
			import: './src/js/src/discovery/index.js',
			dependOn: ['jeoMap'],
		},

		mapBlocks: {
			import: './src/js/src/map-blocks/index.js',
			dependOn: ['mapglReact'],
		},
		layersSidebar: {
			import: './src/js/src/layers-sidebar/index.js',
			dependOn: ['mapglReact'],
		},
		mapsSidebar: {
			import: './src/js/src/maps-sidebar/index.js',
			dependOn: ['mapglReact'],
		},
	},
	output: {
		path: path.resolve( __dirname, './src/js/build/' ),
		publicPath: 'auto',
		filename: '[name].js',
	},
	optimization: {
		...defaultConfig.optimization,
		splitChunks: false,
		chunkIds: 'named',
	},
	performance: false,
	ignoreWarnings: [
		...( defaultConfig.ignoreWarnings || [] ),
		{
			module: /node_modules\/react-datepicker\/dist\/index\.es\.js$/,
			message: /Critical dependency: the request of a dependency is an expression/,
		},
	],
};
