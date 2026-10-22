const path = require( 'path' );
const webpack = require( 'webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	plugins: [
		...( defaultConfig.plugins || [] ),
		new webpack.NormalModuleReplacementPlugin(
			/^node:(.*)$/,
			( resource ) => {
				resource.request = resource.request.replace( /^node:/, '' );
			}
		),
		// MapLibre GL JS ships its web worker as a separate file. Publish it
		// next to our entry bundles so maplibregl-loader.js can point
		// `setWorkerUrl()` at it. The .mjs contents are self-contained (no
		// imports), so renaming to .js is safe: MapLibre tries a module
		// worker first and falls back to a classic worker.
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: path.resolve(
						__dirname,
						'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'
					),
					to: 'maplibre-gl-worker.js',
				},
			],
		} ),
	],
	resolve: {
		...defaultConfig.resolve,
		fallback: {
			...( defaultConfig.resolve?.fallback ),
			fs: false,
			path: false,
		},
	},
	entry: {
		mapglLoader: './src/js/src/lib/mapgl-loader.js',
		mapglReact: {
			import: './src/js/src/lib/mapgl-react.js',
			dependOn: ['mapglLoader'],
		},

		JeoLayer: './src/includes/layer-types/JeoLayer.js',
		JeoLegend: './src/includes/legend-types/JeoLegend.js',
		postsSidebar: './src/js/src/posts-sidebar/index.js',
		contextSidebar: './src/js/src/context-sidebar/index.js',

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
		storiesNearYou: './src/js/src/stories-near-you/stories-near-you-frontend.js',
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
		{
			// MapLibre GL JS builds a Blob-based module worker from a dynamic
			// import expression when the worker URL is cross-origin. Our
			// worker is published same-origin next to the bundles, so this
			// code path never executes.
			module: /node_modules\/maplibre-gl\/dist\/maplibre-gl\.mjs$/,
			message: /Critical dependency: the request of a dependency is an expression/,
		},
	],
};
