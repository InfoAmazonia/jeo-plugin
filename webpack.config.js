let path = require('path');
const defaultConfig = require("./node_modules/@wordpress/scripts/config/webpack.config");

module.exports = {
	...defaultConfig,
	entry: {
		postsSidebar: './src/js/src/posts-sidebar/index.js'
	},
	output: {
		path: path.resolve(__dirname, './src/js/build/'),
		publicPath: './src/js/build/',
		filename: '[name].js'
	}
};