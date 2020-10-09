const path = require( 'path' );
let mix = require('laravel-mix');
const defaultConfig = require( './node_modules/@wordpress/scripts/config/webpack.config' );
/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for your application, as well as bundling up your JS files.
 |
 */

const root_dir = './';
const assets_dir = root_dir + '/assets';
const dist_dir = root_dir + '/dist';

mix.js(assets_dir + '/javascript/app.js', '');
mix.sass(assets_dir + '/scss/app.scss', '').sourceMaps();


mix.react('./assets/javascript/toolbar/tooltip/tooltip.js', 'tooltip.js');
mix.react('./assets/javascript/blocks/embedTemplate/index.js', 'embedTemplate.js');
mix.react('./assets/javascript/blocks/contentBox/index.js', 'contentBox.js');
mix.react('./assets/javascript/blocks/imageGallery/index.js', 'imageGallery.js');
mix.react('./assets/javascript/blocks/videoGallery/index.js', 'videoGallery.js');
mix.react('./assets/javascript/blocks/imageBlock/index.js', 'imageBlock.js');
mix.react('./assets/javascript/blocks/newsletter/index.js', 'newsletter.js');
mix.react('./assets/javascript/blocks/linkDropdown/index.js', 'linkDropdown.js');
mix.react('./assets/javascript/blocks/teamBlock/index.js', 'teamBlock.js');
mix.react('./assets/javascript/blocks/teamMember/index.js', 'teamMember.js');

mix.webpackConfig({
	...defaultConfig,
	entry: {
		//imageBlock: './assets/javascript/blocks/imageBlock/index.js',
    },
    
    output: {
        chunkFilename: dist_dir + '/[name].js',
        path: path.resolve( __dirname, './dist/' ),
        publicPath: dist_dir,
        filename: '[name].js',
    },

    module: {
		
    },
  
	devtool: "inline-source-map" 
});



