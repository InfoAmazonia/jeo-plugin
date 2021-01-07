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
		\jeo_storymap();

		add_action( 'plugins_loaded', array( $this, 'load_plugin_textdomain' ) );
		add_filter( 'block_categories', array( $this, 'register_block_category' ) );
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );
		add_action( 'init', array( $this, 'register_oembed' ) );
		// add_action( 'init', '\Jeo\Integrations\Carto::carto_integration_cron_task');

		add_action( 'init', array( $this, 'register_embed_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'register_embed_query_var' ) );
		add_action( 'template_redirect', array( $this, 'register_embed_template_redirect' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_blocks_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'cli_init', array($this, 'register_cli_commands') );
		add_action( 'rest_api_init', array($this, 'register_endpoints') );
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
					'disable_drag_pan' => false,
				],
				'nonce' => wp_create_nonce('wp_rest'),
				'jeo_typography-name' => sanitize_text_field( \jeo_settings()->get_option( 'jeo_typography-name' ) ),
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
			wp_enqueue_script( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.js', array( 'mapboxgl-loader', 'jquery', 'wp-element' ), false, true );

			$discovery_assets = include JEO_BASEPATH . '/js/build/discovery.asset.php';
			wp_enqueue_script( 'discovery-map', JEO_BASEURL . '/js/build/discovery.js', array_merge( $discovery_assets['dependencies'], array( 'wp-element', 'mapboxgl-loader', 'jquery', 'jeo-map' ) ), false, true);


			// Check if sites uses WPML
			if ( function_exists('icl_object_id') ) {
				wp_localize_script('discovery-map', 'languageParams', array(
					'currentLang' => ICL_LANGUAGE_CODE,
				));
		   	}

			wp_enqueue_style( 'jeo-map', JEO_BASEURL . '/css/jeo-map.css', time() );
			wp_localize_script(
				'jeo-map',
				'jeoMapVars',
				array(
					'jsonUrl' => rest_url( 'wp/v2/' ),
					'string_read_more' => __( 'Read more', 'jeo' ),
					'jeoUrl' => JEO_BASEURL,
					'nonce' => wp_create_nonce('wp_rest'),
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
			$discovery = isset($_GET['discovery'])? $_GET['discovery'] : false;

			if( !$discovery ) {
				$map_id = isset( $_GET['map_id'] ) && is_numeric( $_GET['map_id'] ) ? intval( $_GET['map_id'] ) : false;
				if ( $map_id ) {
					$map_meta = get_post_meta($map_id);
					$args = (array) maybe_unserialize($map_meta['related_posts'][0]);

					$args['per_page'] = 1;
					$request = new WP_REST_Request( 'GET', '/wp/v2/posts');
					$request->set_query_params( $args );
					$response = rest_do_request( $request );
					$server = rest_get_server();
					$data = $server->response_to_data( $response, false );

					$have_related_posts = !empty($data) || !empty($map->relate_posts);

					if(isset($_GET['width']) ) {
						$full_width = isset( $_GET['width'] ) && is_numeric( $_GET['width'] ) ? intval( $_GET['width'] ) : 820;
						$popup_width = isset( $_GET['popup_width'] ) && is_numeric( $_GET['popup_width'] ) ? intval( $_GET['popup_width'] ) : 220;
						$map_width = $full_width ? $full_width : 600;

						if($have_related_posts){
							$map_width = $full_width - $popup_width;
						}

						$height = isset( $_GET['height'] ) && is_numeric( $_GET['height'] ) ? intval ( $_GET['height'] ) : 600;

						$map_style = "width: ${map_width}px; height: ${height}px;";
						$container_style = "width: ${full_width}px; height: ${height}px;";
						$popup_style = "width: ${popup_width}px; height: ${height}px;";
					} else {
						$have_related_posts = !empty($data) || !empty($map->relate_posts);
						$container_style = "width: 100%; height: 100%;";

						if($have_related_posts) {
							$map_style = "width: 70%; height: 100%;";
							$popup_style = "width: 30%; height: 100%;";
						} else {
							$map_style = $container_style;
							$popup_style = $container_style;
						}

					}

					require JEO_BASEPATH . '/templates/embed.php';

					exit();

				}
			} else {
				$selected_layers = $_GET['selected-layers'];
				require JEO_BASEPATH . '/templates/embed-discovery.php';
				exit();
			}

		}

	}

	public function register_endpoints() {
		register_rest_route( 'jeowp', '/carto_integrate', array(
			'methods' => 'POST',
			'callback' => '\Jeo\Integrations\Carto::carto_integrate_api_callback',
			'args' => [
				'sql_query' => array(
					'required' => true,
				),

				'tileset' => array(
					'required' => false,
				),

				'title' => array(
					'required' => false,
				),
			],

			'permission_callback' => function () { return is_user_logged_in(); }
		));
	}
}
