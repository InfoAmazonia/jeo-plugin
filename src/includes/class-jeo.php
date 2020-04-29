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
		\jeo_menu();
		\jeo_maps();
		\jeo_layers();
		\jeo_geocode_handler();
		\jeo_settings();
		\jeo_layer_types();
		\jeo_legend_types();
		\jeo_sidebars();

		add_action( 'plugins_loaded', array( $this, 'load_plugin_textdomain' ) );
		add_filter( 'block_categories', array( $this, 'register_block_category' ) );
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );
		add_action( 'init', array( $this, 'register_oembed' ) );

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
				'site_url' => get_site_url(),
				'mapbox_key' => sanitize_text_field( \jeo_settings()->get_option( 'mapbox_key' )),
				'map_defaults' => [
					'zoom' => intval( \jeo_settings()->get_option( 'map_default_zoom' ) ),
					'lat' => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lat' ) ),
					'lng' => sanitize_text_field ( \jeo_settings()->get_option( 'map_default_lng' ) ),
					'disable_scroll_zoom' => false,
					'disable_drag_rotate' => false,
					'enable_fullscreen' => true,
				]
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

	public function register_block_category( $categories ) {
		$slugs = wp_list_pluck( $categories, 'slug' );
		return in_array( 'jeo', $slugs, true )
			? $categories
			: array_merge( $categories, [
				[
					'slug' => 'jeo',
					'title' => 'JEO',
					'icon' => null
				]
			] );
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
					'templates' => [
						'moreInfo' => file_get_contents( jeo_get_template( 'map-more-info.ejs' ) ),
						'popup' => file_get_contents( jeo_get_template( 'generic-popup.ejs' ) ),
						'postPopup' => file_get_contents( jeo_get_template( 'post-popup.ejs' ) )
					]
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

	public function register_oembed () {
		\jeo_register_embedder('local_jeo', get_site_url());
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

			$map_id = isset( $_GET['map_id'] ) && is_numeric( $_GET['map_id'] ) ? intval( $_GET['map_id'] ) : false;

			if ( $map_id ) {

				$full_width = isset( $_GET['width'] ) && is_numeric( $_GET['width'] ) ? intval( $_GET['width'] ) : 820;
				$map_width = $full_width ? $full_width - 220 : 600;
				$height = isset( $_GET['height'] ) && is_numeric( $_GET['height'] ) ? intval ( $_GET['height'] ) : 600;

				$map_style = "width: ${map_width}px; height: ${height}px;";
				$container_style = "width: ${full_width}px; height: ${height}px;";

				require JEO_BASEPATH . '/templates/embed.php';

				exit();

			}

		}

	}

}
