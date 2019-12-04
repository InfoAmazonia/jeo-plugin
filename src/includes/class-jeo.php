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

		add_action('plugins_loaded', [$this, 'load_plugin_textdomain']);
		add_action('init', [$this, 'register_assets'] );
		add_action('enqueue_block_editor_assets', [$this, 'enqueue_blocks_assets'] );
		add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts'] );
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
		$asset_file = include( JEO_BASEPATH . '/js/build/postsSidebar.asset.php');

		$deps = array_merge(['lodash'], $asset_file['dependencies']);

		wp_register_script(
			'jeo-js',
			JEO_BASEURL . '/js/build/postsSidebar.js',
			$deps,
			$asset_file['version']
		);

		wp_localize_script('jeo-js', 'jeo', [
			'ajax_url' => admin_url('admin-ajax.php')
		]);

	}

	public function enqueue_blocks_assets() {
		global $post;

		$post_types = \jeo_settings()->get_option('enabled_post_types');

		if ( in_array($post->post_type, $post_types) ) {
			wp_enqueue_script( 'jeo-js' );
			wp_enqueue_style( 'leaflet', JEO_BASEURL . '/libs/leaflet/leaflet.css');
		}

	}

	public function enqueue_scripts() {

		if ( is_singular() ) {
			wp_enqueue_script('jeo-mapboxgl', JEO_BASEURL . '/js/build/mapbox.js', ['jquery']);
			wp_enqueue_style( 'mapboxgl', 'https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css', time());
			wp_localize_script('jeo-mapboxgl', "jeo_settings", [
				'mapbox_key' => \jeo_settings()->get_option('mapbox_key'),
			]);
		}

	}


}
