let path = require('path');
const defaultConfig = require("./node_modules/@wordpress/scripts/config/webpack.config");

module.exports = {
	...defaultConfig,
	entry: {
		postsSidebar: './src/js/src/posts-sidebar/index.js',
		jeoMap: './src/js/src/jeo-map/index.js',
		JeoLayerTypes: './src/includes/layer-types/JeoLayerTypes.js',
		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		layerTypeMapbox: './src/includes/layer-types/mapbox.js',
		layerTypeTile: './src/includes/layer-types/tilelayer.js'
	},
	output: {
		path: path.resolve(__dirname, './src/js/build/'),
		publicPath: './src/js/build/',
		filename: '[name].js'
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test:/\.css$/,
				use:['style-loader','css-loader']
			}
		]
	}
};
