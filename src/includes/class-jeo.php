<?php

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       leo.com
 * @since      1.0.0
 *
 * @package    Jeo
 * @subpackage Jeo/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    Jeo
 * @subpackage Jeo/includes
 * @author     Leo <leo@Leo.leo>
 */
class Jeo {

	use Jeo\Singleton;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	protected function init() {
		\jeo_maps();
		\jeo_layers();
		\jeo_geocode_handler();
		\jeo_settings();
		\jeo_layer_types();

		add_action( 'plugins_loaded', array( $this, 'load_plugin_textdomain' ) );
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );

		add_action( 'init', array( $this, 'register_embed_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'register_embed_query_var' ) );
		add_action( 'template_redirect', array( $this, 'register_embed_template_redirect' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_blocks_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'cli_init', array($this, 'register_cli_commands') );


	}

	/**
	 * Load the plugin text domain for translation.
	 *
	 * @since    1.0.0
	 */
	public function load_plugin_textdomain() {

		load_plugin_textdomain(
			'jeo',
			false,
			JEO_BASEPATH . '/languages/'
		);

	}

	public function register_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';

		$deps = array_merge( array( 'lodash' ), $asset_file['dependencies'] );

		wp_register_script(
			'jeo-js',
			JEO_BASEURL . '/js/build/postsSidebar.js',
			$deps,
			$asset_file['version']
		);

		wp_localize_script(
			'jeo-js',
			'jeo',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
			)
		);

		wp_register_script(
			'mapboxgl-loader',
			JEO_BASEURL . '/js/build/mapboxglLoader.js'
		);

		wp_localize_script(
			'mapboxgl-loader',
			'jeo_settings',
			array(
				'mapbox_key' => \jeo_settings()->get_option( 'mapbox_key' ),
			)
		);

		$map_blocks_assets = include JEO_BASEPATH . '/js/build/mapBlocks.asset.php';

		wp_register_script(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.js',
			array_merge( $map_blocks_assets['dependencies'], array( 'jeo-layer' ) ),
			$map_blocks_assets['version']
		);
	}

	public function register_block_types() {
		register_block_type( 'jeo/map-blocks', array( 'editor_script' => 'jeo-map-blocks' ) );
	}

	public function enqueue_blocks_assets() {
		global $post;

		$post_types = \jeo_settings()->get_option( 'enabled_post_types' );

		if ( in_array( $post->post_type, $post_types ) ) {
			wp_enqueue_script( 'jeo-js' );
			wp_enqueue_style( 'leaflet', JEO_BASEURL . '/libs/leaflet/leaflet.css' );
		}
	}

	public function enqueue_scripts() {

		wp_enqueue_style( 'mapboxgl', 'https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css', time() );
		wp_enqueue_script( 'mapboxgl-loader' );

		if ( is_singular() || get_query_var('jeo_embed') === 'map' ) {
			wp_enqueue_script( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.js', array( 'mapboxgl-loader', 'jquery' ) );
			wp_enqueue_style( 'jeo-map', JEO_BASEURL . '/css/jeo-map.css', time() );
			wp_localize_script(
				'jeo-map',
				'jeoMapVars',
				array(
					'jsonUrl' => rest_url( 'wp/v2/' ),
					'string_read_more' => __( 'Read more', 'jeo' ),
				)
			);
		}
	}

	/**
	 * Registers WP CLI commands
	 *
	 * @return void
	 */
	public function register_cli_commands() {
		\WP_CLI::add_command( 'jeo fixtures', 'Jeo\Fixtures' );
	}

	public function register_embed_rewrite() {
		add_rewrite_rule(
			'^embed/?$',
			'index.php?jeo_embed=map',
			'top'
		);
	}

	public function register_embed_query_var( $vars ) {
		$vars[] = 'jeo_embed';
		return $vars;
	}

	public function register_embed_template_redirect() {

		if( get_query_var( 'jeo_embed' ) === 'map' ) {

			$map_id = isset( $_GET['map_id'] ) ? $_GET['map_id'] : false;

			if ( $map_id ) {

				require JEO_BASEPATH . '/templates/embed.php';

				exit();

			}

		}

	}

}
