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

use function GuzzleHttp\json_decode;

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
		add_action( 'init', array( $this, 'register_block_types' ) );
		add_action( 'init', array( $this, 'register_oembed' ) );
		// add_action( 'init', '\Jeo\Integrations\Carto::carto_integration_cron_task');

		add_action( 'init', array( $this, 'register_embed_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'register_embed_query_var' ) );
		add_action( 'template_redirect', array( $this, 'register_embed_template_redirect' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_blocks_assets' ) );
		add_action( 'cli_init', array($this, 'register_cli_commands') );
		add_action( 'rest_api_init', array($this, 'register_endpoints') );

		add_action( 'init', array($this, 'restrict_story_map_block_count' ) );


		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_filter('rest_post_tag_query', array( $this, 'maximum_terms_api_filter'), 10, 1 );


		add_filter('rest_map-layer_query', array( $this, 'order_rest_post_by_post_title'), 10, 2);

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
			// this fixes the plugin renaming problem
			basename( plugin_dir_path(  dirname( __FILE__ , 1 ) ) ) . '/languages',
		);

	}

	function maximum_terms_api_filter( $prepared_args ) {
		$prepared_args['number'] = 1000;
		return $prepared_args;
	}

	public function order_rest_post_by_post_title($args, $request) {
		if(isset($args['post__in']) && sizeof($args['post__in'])) {
			$args['suppress_filters'] = true;
		}

		return $args;
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

		wp_set_script_translations('jeo-js', 'jeo', plugin_dir_path( __DIR__ ) . 'languages');


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
		wp_register_script(
			'mapboxgl-spiderifier',
			JEO_BASEURL . '/js/src/mapboxgl-spiderifier/index.js',
			'mapboxgl-loader',
			null,
			false
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
				'jeo_typography_name' => sanitize_text_field( \jeo_settings()->get_option( 'jeo_typography-name' ) ),
			)
		);

		$map_blocks_assets = include JEO_BASEPATH . '/js/build/mapBlocks.asset.php';

		wp_register_script(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.js',
			array_merge( $map_blocks_assets['dependencies'], array( 'jeo-layer' ) ),
			$map_blocks_assets['version']
		);

		wp_set_script_translations('jeo-map-blocks', 'jeo', plugin_dir_path( __DIR__ ) . 'languages');

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
		register_block_type( 'jeo/storymap', array(
			'render_callback' => [$this, 'story_map_dynamic_render_callback'],
			'editor_script' => 'jeo-map-blocks' )
		);
	}

	public function story_map_dynamic_render_callback( $block_attributes, $content ) {
		try {
			$saved_data = json_decode($content);
		} catch (Exception $e) {
			// Old block
		}

		$map_id = $saved_data->map_id;
		$map_layers = get_post_meta( $map_id, 'layers', true );

		if(!function_exists('layer_still_exists')) {
			function layer_still_exists($map_layers, $selected_layer) {
				$layer_status = get_post_status($selected_layer->id);
				if($layer_status == "trash" || $layer_status == false ||  $layer_status == "private" ) {
					return false;
				}

				foreach($map_layers as $layer) {
					if(in_array($layer["id"], (array) $selected_layer)) {
						$selected_layer->meta->type = get_post_meta($layer['id'], 'type', true);
						$selected_layer->meta->layer_type_options = (object) get_post_meta($layer['id'], 'layer_type_options', true);

						return true;
					}
				}

				return false;
			}
		}

		// Remove not present layers from selectedLayers -- Fix selected layers order
		foreach($saved_data->slides as $slide) {
			foreach($slide->selectedLayers as $index => $selected_layer) {
				// Check if the selected layers exists in the map
				if(!layer_still_exists($map_layers, $selected_layer)) {
					array_splice($slide->selectedLayers, $index, 1);
				}
			}

			$selected_layers_order = [];

			foreach ($map_layers as $layer) {
				foreach($slide->selectedLayers as $index => $selected_layer) {
					if($selected_layer->id == $layer['id']) {
						$selected_layers_order[] = $selected_layer;
					}
				}
			}

			$slide->selectedLayers = $selected_layers_order;
		}

		// Remove not present layers from navigateMapLayers and create new ordr
		$final_navigate_map_layers = [];

		foreach ($map_layers as $layer) {
			foreach($saved_data->navigateMapLayers as $index => $navigate_layer) {
				if($navigate_layer->id == $layer['id']) {
					// Update meta / types
					if(!layer_still_exists($map_layers, $navigate_layer)) {
						array_splice($saved_data->navigateMapLayers, $index, 1);
					} else {
						$final_navigate_map_layers[] = $navigate_layer;
					}
				}
			}
		}

		$saved_data->navigateMapLayers = $final_navigate_map_layers;

		// echo "<pre> <code>";
		// var_dump($saved_data->navigateMapLayers);
		// echo "</code></pre> ";

		return '<div id="story-map" data-properties="' . htmlentities(json_encode($saved_data)) . '" />';
	}

	public function filter_rest_query_by_zone($args, $request) {
		error_log("hsaduashduashdus");
		$args['suppress_filters'] = true;
		return $args;
	}

	public function enqueue_blocks_assets() {
		global $post;

		$post_types = apply_filters('jeo_enabled_post_types', \jeo_settings()->get_option( 'enabled_post_types' ));

		if ( in_array( $post->post_type, $post_types ) && $this->should_load_assets() ) {
			wp_enqueue_script( 'jeo-js' );
			wp_enqueue_style( 'leaflet', JEO_BASEURL . '/libs/leaflet/leaflet.css' );
		}
	}

	public function enqueue_scripts() {
		if ( $this->should_load_assets() || get_query_var('jeo_embed') === 'map') {
			wp_enqueue_style( 'mapboxgl', 'https://api.mapbox.com/mapbox-gl-js/v1.4.1/mapbox-gl.css', time() );
			wp_enqueue_script( 'mapboxgl-loader' );
			wp_enqueue_script( 'mapboxgl-spiderifier' );
			wp_enqueue_script( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.js', array( 'mapboxgl-loader', 'mapboxgl-spiderifier', 'jquery', 'wp-element' ), false, true );

			wp_set_script_translations('jeo-map', 'jeo', plugin_dir_path( __DIR__ ) . 'languages');


			$discovery_assets = include JEO_BASEPATH . '/js/build/discovery.asset.php';
			wp_enqueue_script( 'discovery-map', JEO_BASEURL . '/js/build/discovery.js', array_merge( $discovery_assets['dependencies'], array( 'wp-element', 'mapboxgl-loader', 'jquery', 'jeo-map' ) ), false, true);

			wp_set_script_translations('discovery-map', 'jeo', plugin_dir_path( __DIR__ ) . 'languages');


			// Check if sites uses WPML
			if ( function_exists('icl_object_id') ) {
				wp_localize_script('discovery-map', 'languageParams', array(
					'currentLang' => ICL_LANGUAGE_CODE,
				));
		   	}

			wp_localize_script('discovery-map', 'mapPreferences', array(
				'map_defaults' => [
					'zoom' => sanitize_text_field( \jeo_settings()->get_option( 'map_default_zoom' ) ),
					'lat' => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lat' ) ),
					'lng' => sanitize_text_field ( \jeo_settings()->get_option( 'map_default_lng' ) ),
				]
			));

			wp_enqueue_style( 'jeo-map', JEO_BASEURL . '/css/jeo-map.css', time() );
			wp_localize_script(
				'jeo-map',
				'jeoMapVars',
				array(
					'jsonUrl' => rest_url( 'wp/v2/' ),
					'string_read_more' => __( 'Read more', 'jeo' ),
					'jeoUrl' => JEO_BASEURL,
					'nonce' => wp_create_nonce('wp_rest'),
					'currentLang' => ICL_LANGUAGE_CODE,
					'templates' => [
						'moreInfo' => file_get_contents( jeo_get_template( 'map-more-info.ejs' ) ),
						'popup' => file_get_contents( jeo_get_template( 'generic-popup.ejs' ) ),
						'postPopup' => file_get_contents( jeo_get_template( 'post-popup.ejs' ) )
					],
					'cluster' => apply_filters( 'jeomap_js_cluster', [
						'circle_color' => '#ffffff'
					] ),
					'images' => apply_filters( 'jeomap_js_images', [
						'/js/src/icons/news-marker' => [
							'url' => JEO_BASEURL . '/js/src/icons/news-marker.png',
							'icon_size' => 0.1,
						],
						'/js/src/icons/news-marker-hover' => [
							'url' => JEO_BASEURL . '/js/src/icons/news-marker-hover.png',
							'icon_size' => 0.1,
						],
						'/js/src/icons/news' => [
							'url' => JEO_BASEURL . '/js/src/icons/news.png',
							'icon_size' => 0.13,
							'text_color' => '#202202'
						],
					] )
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

					// var_dump(empty($map_meta['relate_posts'][0]));

					$have_related_posts = !empty($map_meta['relate_posts'][0]) && !empty($data) || !empty($map->relate_posts);

					// var_dump($have_related_posts);

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
						$container_style = "width: 100%; height: 100%;";

						if($have_related_posts) {
							$map_style = "width: 70%; height: calc(100% - 35px);";
							$popup_style = "width: 30%; height: calc(100% - 35px);";
						} else {
							$map_style = "width: 100%; height: calc(100% - 35px);";
							$popup_style = $container_style;
						}

					}

					if(function_exists('wpml_get_language_information')) {
						global $sitepress;
						$post_language_information = wpml_get_language_information(null, $map_id);
						$sitepress->switch_lang($post_language_information['language_code'], true);
						switch_to_locale($post_language_information['locale']);
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

	function restrict_story_map_block_count() {
		global $post, $parent_file, $typenow, $current_screen, $pagenow;

		$post_type = NULL;

		if($post && (property_exists($post, 'post_type') || method_exists($post, 'post_type')))
			$post_type = $post->post_type;

		if(empty($post_type) && !empty($current_screen) && (property_exists($current_screen, 'post_type') || method_exists($current_screen, 'post_type')) && !empty($current_screen->post_type))
			$post_type = $current_screen->post_type;

		if(empty($post_type) && !empty($typenow))
			$post_type = $typenow;

		if(empty($post_type) && function_exists('get_current_screen'))
			$post_type = get_current_screen();

		if(empty($post_type) && isset($_REQUEST['post']) && !empty($_REQUEST['post']) && function_exists('get_post_type') && $get_post_type = get_post_type((int)$_REQUEST['post']))
			$post_type = $get_post_type;

		if(empty($post_type) && isset($_REQUEST['post_type']) && !empty($_REQUEST['post_type']))
			$post_type = sanitize_key($_REQUEST['post_type']);

		if(empty($post_type) && 'edit.php' == $pagenow)
			$post_type = 'post';


		if ( ! is_admin() || 'storymap' != $post_type ) {
			// This is not the post/page we want to limit things to.
			return false;
		}

		$post_type_object = get_post_type_object( 'storymap' );
		$post_type_object->template = array(
			array( 'jeo/storymap'),
		);
		$post_type_object->template_lock = 'all';
	}
}
