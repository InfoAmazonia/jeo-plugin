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

		add_action( 'init', array( $this, 'load_plugin_textdomain' ) );
		add_filter( 'block_categories_all', array( $this, 'register_block_category' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );
		add_action( 'init', array( $this, 'register_oembed' ) );

		add_action( 'init', array( $this, 'register_embed_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'register_embed_query_var' ) );
		add_action( 'template_redirect', array( $this, 'register_embed_template_redirect' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_blocks_assets' ) );
		add_action( 'init', array( $this, 'restrict_story_map_block_count' ) );

		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_filter( 'rest_map-layer_query', array( $this, 'custom_layer_search_filters' ), 10, 2 );
		add_filter( 'rest_map-layer_query', array( $this, 'order_rest_post_by_post_title' ), 10, 1 );
		add_filter( 'rest_request_before_callbacks', array( $this, 'rest_authenticate_by_cookie' ), 10, 3 );

		// Auto-inject editor preview blocks into existing map/layer posts.
		// so they don't show the "template mismatch" warning.
		add_filter( 'rest_prepare_map', array( $this, 'inject_editor_block_for_map' ), 10, 3 );
		add_filter( 'rest_prepare_map-layer', array( $this, 'inject_editor_block_for_layer' ), 10, 3 );
	}

	/**
	 * Get the current site language, including WPML overrides when available.
	 *
	 * @return string
	 */
	private function get_current_language(): string {
		$language = get_bloginfo( 'language' );
		if ( defined( 'ICL_LANGUAGE_CODE' ) ) {
			$language = ICL_LANGUAGE_CODE;
		}
		return apply_filters( 'wpml_current_language', $language );
	}

	/**
	 * Create a REST nonce for logged-in users.
	 *
	 * @return string|null
	 */
	private function get_rest_nonce() {
		if ( is_user_logged_in() ) {
			return wp_create_nonce( 'wp_rest' );
		}
		return null;
	}

	/**
	 * Authenticate REST requests to protected JEO post types using the logged-in cookie.
	 *
	 * @param mixed           $response Current REST pre-callback response.
	 * @param array           $handler Callback handler metadata.
	 * @param WP_REST_Request $request Current REST request.
	 * @return mixed
	 */
	public function rest_authenticate_by_cookie( $response, $handler, $request ) {
		if ( preg_match( '/\/wp\/v2\/(map|map-layer|storymap)/', $request->get_route() ) === 1 ) {
			$user_id = wp_validate_auth_cookie( '', 'logged_in' );
			if ( ! empty( $user_id ) ) {
				wp_set_current_user( $user_id );
			}
		}
		return $response;
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
			plugin_basename( JEO_BASEPATH ) . '/languages',
		);
	}

	/**
	 * Preserve requested map-layer ordering when explicit IDs are provided.
	 *
	 * @param array $args REST query args.
	 * @return array
	 */
	public function order_rest_post_by_post_title( $args ) {
		if ( isset( $args['post__in'] ) && ! empty( $args['post__in'] ) ) {
			$args['suppress_filters'] = true;
		}

		return $args;
	}

	/**
	 * Add custom layer type and search filters to map-layer REST queries.
	 *
	 * @param array           $query REST query args.
	 * @param WP_REST_Request $request REST request object.
	 * @return array
	 */
	public function custom_layer_search_filters( array $query, WP_REST_Request $request ) {
		$layer_type = $request->get_param( 'layer_type' );
		if ( $layer_type ) {
			if ( ! isset( $query['meta_query'] ) ) {
				$query['meta_query'] = array();
			}

			$query['meta_query'][] = array(
				'key'   => 'type',
				'value' => $layer_type,
			);
		}

		$layer_name = $request->get_param( 'layer_name' );
		if ( $layer_name ) {
			$query['s'] = $layer_name;
		}

		return $query;
	}

	/**
	 * Register shared frontend and editor assets for the plugin.
	 *
	 * @return void
	 */
	public function register_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';

		$deps = array_merge( array( 'lodash' ), $asset_file['dependencies'] ?? array() );

		wp_register_style( 'jeo-js', JEO_BASEURL . '/js/build/postsSidebar.css', array(), JEO_VERSION );
		wp_register_script(
			'jeo-js',
			JEO_BASEURL . '/js/build/postsSidebar.js',
			$deps,
			$asset_file['version'],
			true,
		);

		wp_set_script_translations( 'jeo-js', 'jeo', JEO_BASEPATH . 'languages' );

		$map_runtime = \jeo_settings()->get_option( 'map_runtime' );

		if ( 'maplibregl' === $map_runtime ) {
			$mapgl_loader = 'maplibreglLoader';
			$mapgl_react  = 'maplibreglReact';
		} else {
			$mapgl_loader = 'mapboxglLoader';
			$mapgl_react  = 'mapboxglReact';
		}

		wp_localize_script(
			'jeo-js',
			'jeo',
			array(
				'ajax_url'      => admin_url( 'admin-ajax.php' ),
				'geocode_nonce' => wp_create_nonce( 'jeo_geocode' ),
			)
		);

		wp_register_script(
			'mapgl-vendor',
			JEO_BASEURL . "/js/build/{$mapgl_loader}.js",
			array(),
			JEO_VERSION,
			true,
		);

		wp_register_script(
			'mapgl',
			JEO_BASEURL . '/js/build/mapglLoader.js',
			array( 'mapgl-vendor' ),
			JEO_VERSION,
			true,
		);

		wp_register_style(
			'mapgl',
			JEO_BASEURL . "/js/build/{$mapgl_loader}.css",
			array(),
			JEO_VERSION,
		);

		wp_localize_script(
			'mapgl',
			'jeo_settings',
			array(
				'site_url'            => get_site_url(),
				'mapbox_key'          => sanitize_text_field( \jeo_settings()->get_option( 'mapbox_key' ) ),
				'map_defaults'        => array(
					'zoom'                => intval( \jeo_settings()->get_option( 'map_default_zoom' ) ),
					'lat'                 => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lat' ) ),
					'lng'                 => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lng' ) ),
					'disable_scroll_zoom' => false,
					'disable_drag_rotate' => false,
					'enable_fullscreen'   => true,
					'disable_drag_pan'    => false,
				),
				'map_runtime'         => $map_runtime,
				'nonce'               => $this->get_rest_nonce(),
				'jeo_typography_name' => sanitize_text_field( \jeo_settings()->get_option( 'jeo_typography-name' ) ),
				'public_path'         => JEO_BASEURL . '/js/build/',
			)
		);

		$mapgl_react_assets = include JEO_BASEPATH . '/js/build/mapglReact.asset.php';

		wp_register_script(
			'mapgl-react-vendor',
			JEO_BASEURL . "/js/build/{$mapgl_react}.js",
			array( 'mapgl' ),
			JEO_VERSION,
			true,
		);

		wp_register_script(
			'mapgl-react',
			JEO_BASEURL . '/js/build/mapglReact.js',
			array_merge( $mapgl_react_assets['dependencies'] ?? array(), array( 'mapgl-react-vendor' ) ),
			JEO_VERSION,
			true,
		);

		$map_blocks_assets = include JEO_BASEPATH . '/js/build/mapBlocks.asset.php';

		wp_register_style(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.css',
			array( 'mapgl' ),
			JEO_VERSION,
		);
		wp_register_script(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.js',
			array_merge( $map_blocks_assets['dependencies'] ?? array(), array( 'jeo-layer', 'mapgl-react' ) ),
			$map_blocks_assets['version'],
			true,
		);

		wp_set_script_translations( 'jeo-map-blocks', 'jeo', JEO_BASEPATH . 'languages' );
	}

	/**
	 * Register the JEO block category when it is not already present.
	 *
	 * @param array $categories Registered block categories.
	 * @return array
	 */
	public function register_block_category( $categories ) {
		$slugs = wp_list_pluck( $categories, 'slug' );
		return in_array( 'jeo', $slugs, true )
			? $categories
			: array_merge(
				$categories,
				array(
					array(
						'slug'  => 'jeo',
						'title' => 'JEO',
						'icon'  => null,
					),
				)
			);
	}

	/**
	 * Register all JEO blocks used in the editor.
	 *
	 * @return void
	 */
	public function register_block_types() {
		register_block_type(
			'jeo/map-blocks',
			array(
				'editor_script' => 'jeo-map-blocks',
				'editor_style'  => 'jeo-map-blocks',
			)
		);
		register_block_type(
			'jeo/storymap',
			array(
				'api_version'     => 3,
				'render_callback' => array( $this, 'story_map_dynamic_render_callback' ),
				'editor_script'   => 'jeo-map-blocks',
				'editor_style'    => 'jeo-map-blocks',
			)
		);
		register_block_type(
			'jeo/embedded-storymap',
			array(
				'api_version'     => 3,
				'render_callback' => array( $this, 'embedded_story_map_dynamic_render_callback' ),
				'editor_script'   => 'jeo-map-blocks',
				'editor_style'    => 'jeo-map-blocks',
			)
		);
		register_block_type(
			'jeo/map-editor',
			array(
				'api_version'   => 3,
				'editor_script' => 'jeo-map-blocks',
				'editor_style'  => 'jeo-map-blocks',
			)
		);
		register_block_type(
			'jeo/layer-editor',
			array(
				'api_version'   => 3,
				'editor_script' => 'jeo-map-blocks',
				'editor_style'  => 'jeo-map-blocks',
			)
		);
	}

	/**
	 * Extract JSON content from block save output.
	 *
	 * Handles both legacy format (raw JSON string) and API v2+ format
	 * (JSON wrapped in a <div> element with useBlockProps).
	 *
	 * @param string $content Block save output.
	 * @return string Extracted JSON string.
	 */
	private function extract_json_from_block_content( $content ) {
		$content = trim( $content );

		// If it's already valid JSON, return as-is (legacy format).
		$decoded = json_decode( $content );
		if ( json_last_error() === JSON_ERROR_NONE ) {
			return $content;
		}

		// API v2+ format: JSON is wrapped in a <div> element.
		// Strip the outer HTML wrapper to get the JSON content inside.
		$inner = preg_replace( '/^<div[^>]*>/', '', $content );
		$inner = preg_replace( '/<\/div>$/', '', $inner );
		$inner = trim( $inner );

		return $inner;
	}

	/**
	 * Render an embedded story map block from a referenced story.
	 *
	 * @param array  $block_attributes Block attributes.
	 * @param string $content Saved block content.
	 * @return string
	 */
	public function embedded_story_map_dynamic_render_callback( $block_attributes, $content ) {
		$content = json_decode( $this->extract_json_from_block_content( $content ) );

		$story_id                       = $content->attributes->storyID;
		$story                          = get_post( $story_id );
		$story_block                    = parse_blocks( $story->post_content )[0];
		$story_block['attrs']['postID'] = $story_id;

		return $this->story_map_dynamic_render_callback( $block_attributes, wp_json_encode( $story_block['attrs'] ) );
	}

	/**
	 * Remove transient SEO payloads from layer objects before serializing them.
	 *
	 * @param array $layers Layer objects.
	 * @return void
	 */
	private function cleanup_layers( $layers ) {
		foreach ( $layers as $layer ) {
			if ( property_exists( $layer, 'yoast_head' ) ) {
				unset( $layer->yoast_head );
			}
			if ( property_exists( $layer, 'yoast_head_json' ) ) {
				unset( $layer->yoast_head_json );
			}
		}
	}

	/**
	 * Check whether a selected story map layer still exists in the parent map.
	 *
	 * @param array  $map_layers Map layers from post meta.
	 * @param object $selected_layer Selected layer object from saved story data.
	 * @return bool
	 */
	private function layer_still_exists( array $map_layers, $selected_layer ) {
		$layer_status = get_post_status( $selected_layer->id );
		if ( 'trash' === $layer_status || false === $layer_status || 'private' === $layer_status ) {
			return false;
		}

		foreach ( $map_layers as $layer ) {
			if ( $layer['id'] === $selected_layer->id ) {
				$selected_layer->meta->type               = get_post_meta( $layer['id'], 'type', true );
				$selected_layer->meta->layer_type_options = (object) get_post_meta( $layer['id'], 'layer_type_options', true );
				return true;
			}
		}

		return false;
	}

	/**
	 * Get a saved story map layers collection without renaming its camelCase contract.
	 *
	 * @param object $source Source object holding the saved property.
	 * @param string $property Saved camelCase property name.
	 * @return array
	 */
	private function get_saved_layers_property( $source, string $property ): array {
		$value = $source->{$property} ?? array();
		return is_array( $value ) ? $value : array();
	}

	/**
	 * Persist a saved story map layers collection without renaming its camelCase contract.
	 *
	 * @param object $target Target object holding the saved property.
	 * @param string $property Saved camelCase property name.
	 * @param array  $layers Layers to persist.
	 * @return void
	 */
	private function set_saved_layers_property( $target, string $property, array $layers ) {
		$target->{$property} = $layers;
	}

	/**
	 * Render the public story map block markup.
	 *
	 * @param array  $block_attributes Block attributes.
	 * @param string $content Saved block content.
	 * @return string
	 */
	public function story_map_dynamic_render_callback( $block_attributes, $content ) {
		$saved_data = json_decode( $this->extract_json_from_block_content( $content ) );

		$map_id     = $saved_data->map_id;
		$map_layers = get_post_meta( $map_id, 'layers', true );

		// Remove missing layers and restore the saved selected layer order.
		foreach ( $saved_data->slides as $slide ) {
			$selected_layers = $this->get_saved_layers_property( $slide, 'selectedLayers' );

			foreach ( $selected_layers as $index => $selected_layer ) {
				// Check if the selected layer still exists in the map.
				if ( ! $this->layer_still_exists( $map_layers, $selected_layer ) ) {
					array_splice( $selected_layers, $index, 1 );
				}
			}

			$selected_layers_order = array();

			foreach ( $map_layers as $layer ) {
				foreach ( $selected_layers as $selected_layer ) {
					if ( $selected_layer->id === $layer['id'] ) {
						$selected_layers_order[] = $selected_layer;
					}
				}
			}

			$this->set_saved_layers_property( $slide, 'selectedLayers', $selected_layers_order );
			$this->cleanup_layers( $selected_layers_order );
		}

		// Remove missing navigation layers and restore their saved order.
		$final_navigate_map_layers = array();
		$navigate_map_layers       = $this->get_saved_layers_property( $saved_data, 'navigateMapLayers' );

		foreach ( $map_layers as $layer ) {
			foreach ( $navigate_map_layers as $index => $navigate_layer ) {
				if ( $navigate_layer->id === $layer['id'] ) {
					// Update the saved metadata and layer types.
					if ( ! $this->layer_still_exists( $map_layers, $navigate_layer ) ) {
						array_splice( $navigate_map_layers, $index, 1 );
					} else {
						$final_navigate_map_layers[] = $navigate_layer;
					}
				}
			}
		}

		$this->set_saved_layers_property( $saved_data, 'navigateMapLayers', $final_navigate_map_layers );
		$this->cleanup_layers( $final_navigate_map_layers );
		$this->cleanup_layers( $this->get_saved_layers_property( $saved_data, 'loadedLayers' ) );

		// The `use_smilies` option breaks the returned HTML.
		add_filter( 'option_use_smilies', '__return_false' );

		return '<div class="story-map-container" data-properties="' . htmlentities( wp_json_encode( $saved_data ) ) . '" ></div>';
	}

	/**
	 * Ensure zone-filtered REST queries preserve their explicit ordering.
	 *
	 * @param array           $args REST query args.
	 * @param WP_REST_Request $request Current REST request.
	 * @return array
	 */
	public function filter_rest_query_by_zone( $args, $request ) {
		unset( $request );
		$args['suppress_filters'] = true;
		return $args;
	}

	/**
	 * Enqueue editor assets for supported post types.
	 *
	 * @return void
	 */
	public function enqueue_blocks_assets() {
		global $post;

		if ( empty( $post ) ) {
			return;
		}

		$post_types = apply_filters( 'jeo_enabled_post_types', \jeo_settings()->get_option( 'enabled_post_types' ) );

		if ( in_array( $post->post_type, $post_types, true ) && $this->should_load_assets() ) {
			wp_enqueue_script( 'jeo-js' );
			wp_enqueue_style( 'jeo-js' );
		}
	}

	/**
	 * Enqueue the public map runtime and conditional frontend experiences.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		if ( $this->should_load_assets() ) {
			wp_enqueue_style( 'mapgl' );
			wp_enqueue_script( 'mapgl' );
			wp_enqueue_style( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.css', array( 'mapgl' ), JEO_VERSION );
			wp_enqueue_script( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.js', array( 'mapgl', 'jquery' ), JEO_VERSION, true );

			wp_set_script_translations( 'jeo-map', 'jeo', JEO_BASEPATH . 'languages' );

			$current_language = $this->get_current_language();

			wp_localize_script(
				'jeo-map',
				'jeoMapVars',
				array(
					'jsonUrl'          => rest_url( 'wp/v2/' ),
					'string_read_more' => esc_html__( 'Read more', 'jeo' ),
					'jeoUrl'           => JEO_BASEURL,
					'nonce'            => $this->get_rest_nonce(),
					'currentLang'      => $current_language,
						// phpcs:disable WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Bundled templates are read from the local plugin directory at runtime.
					'templates'        => array(
						'moreInfo'  => file_get_contents( jeo_get_template( 'map-more-info.ejs' ) ),
						'popup'     => file_get_contents( jeo_get_template( 'generic-popup.ejs' ) ),
						'postPopup' => file_get_contents( jeo_get_template( 'post-popup.ejs' ) ),
					),
						// phpcs:enable
					'cluster'          => apply_filters(
						'jeomap_js_cluster',
						array(
							'circle_color' => '#ffffff',
						)
					),
					'images'           => apply_filters(
						'jeomap_js_images',
						array(
							'/js/src/icons/news-marker' => array(
								'url'       => JEO_BASEURL . '/js/src/icons/news-marker.png',
								'icon_size' => 0.1,
							),
							'/js/src/icons/news-marker-hover' => array(
								'url'       => JEO_BASEURL . '/js/src/icons/news-marker-hover.png',
								'icon_size' => 0.1,
							),
							'/js/src/icons/news'        => array(
								'url'        => JEO_BASEURL . '/js/src/icons/news.png',
								'icon_size'  => 0.13,
								'text_color' => '#202202',
							),
							'/js/src/icons/cluster'     => array(
								'url' => JEO_BASEURL . '/js/src/icons/cluster.png',
							),
						)
					),
				)
			);
		}

		if ( $this->should_load_discovery_assets() ) {
			$this->enqueue_discovery_scripts();
		}

		if ( $this->should_log_storymap_assets() ) {
			$this->enqueue_storymap_scripts();
		}
	}

	/**
	 * Enqueue Discovery frontend assets and localization payloads.
	 *
	 * @return void
	 */
	public function enqueue_discovery_scripts() {
		$current_language = $this->get_current_language();

		$discovery_assets = include JEO_BASEPATH . '/js/build/discovery.asset.php';
		wp_enqueue_style( 'discovery-map', JEO_BASEURL . '/js/build/discovery.css', array(), JEO_VERSION );
		wp_enqueue_script( 'discovery-map', JEO_BASEURL . '/js/build/discovery.js', array_merge( $discovery_assets['dependencies'] ?? array(), array( 'jeo-map' ) ), JEO_VERSION, true );

		wp_set_script_translations( 'discovery-map', 'jeo', JEO_BASEPATH . 'languages' );

		// Check if the site uses WPML.
		if ( function_exists( 'icl_object_id' ) ) {
			wp_localize_script(
				'discovery-map',
				'languageParams',
				array(
					'currentLang' => $current_language,
				)
			);
		}

		wp_localize_script(
			'discovery-map',
			'mapPreferences',
			array(
				'map_defaults' => array(
					'zoom' => sanitize_text_field( \jeo_settings()->get_option( 'map_default_zoom' ) ),
					'lat'  => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lat' ) ),
					'lng'  => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lng' ) ),
				),
			)
		);
	}

	/**
	 * Enqueue story map frontend assets.
	 *
	 * @return void
	 */
	public function enqueue_storymap_scripts() {
		$storymap_assets = include JEO_BASEPATH . '/js/build/jeoStorymap.asset.php';
		wp_enqueue_style( 'jeo-storymap', JEO_BASEURL . '/js/build/jeoStorymap.css', array( 'jeo-map' ), JEO_VERSION );
		wp_enqueue_script( 'jeo-storymap', JEO_BASEURL . '/js/build/jeoStorymap.js', array_merge( $storymap_assets['dependencies'] ?? array(), array( 'jeo-map', 'mapgl-react' ) ), JEO_VERSION, true );

		wp_set_script_translations( 'jeo-storymap', 'jeo', JEO_BASEPATH . 'languages' );
	}

	/**
	 * Register the local JEO oEmbed provider.
	 *
	 * @return void
	 */
	public function register_oembed() {
		\jeo_register_embedder( 'local_jeo', get_site_url() );
	}

	/**
	 * Register the pretty permalink used by JEO embeds.
	 *
	 * @return void
	 */
	public function register_embed_rewrite() {
		add_rewrite_rule(
			'^embed/?$',
			'index.php?jeo_embed=map',
			'top'
		);
	}

	/**
	 * Register custom query vars used by embed endpoints.
	 *
	 * @param array $vars Existing query vars.
	 * @return array
	 */
	public function register_embed_query_var( $vars ) {
		$vars[] = 'jeo_embed';
		return $vars;
	}

	/**
	 * Serve the public embed templates for maps, story maps, and discovery.
	 *
	 * @return void
	 */
	public function register_embed_template_redirect() {
		if ( get_query_var( 'jeo_embed' ) === 'map' ) {
			$storymap_id     = filter_input( INPUT_GET, 'storymap_id', FILTER_VALIDATE_INT );
			$discovery       = filter_input( INPUT_GET, 'discovery', FILTER_DEFAULT );
			$discovery       = is_string( $discovery ) ? sanitize_text_field( $discovery ) : false;
			$map_id          = filter_input( INPUT_GET, 'map_id', FILTER_VALIDATE_INT );
			$full_width      = filter_input( INPUT_GET, 'width', FILTER_VALIDATE_INT );
			$popup_width_arg = filter_input( INPUT_GET, 'popup_width', FILTER_VALIDATE_INT );
			$height          = filter_input( INPUT_GET, 'height', FILTER_VALIDATE_INT );
			$selected_layers = filter_input( INPUT_GET, 'selected-layers', FILTER_DEFAULT );
			$selected_layers = is_string( $selected_layers ) ? sanitize_text_field( $selected_layers ) : '';

			add_filter( 'show_admin_bar', '__return_false' );
			if ( $storymap_id ) {
				$post = get_post( $storymap_id );
				setup_postdata( $post );
				add_filter( 'the_content', array( $this, 'storymap_content' ), 1 );

				require JEO_BASEPATH . '/templates/embed-storymap.php';
				exit();
			}
			if ( ! $discovery ) {
				if ( $map_id ) {
					$map_meta = get_post_meta( $map_id );
					$args     = (array) maybe_unserialize( $map_meta['related_posts'][0] );

					$args['per_page'] = 1;
					$request          = new WP_REST_Request( 'GET', '/wp/v2/posts' );
					$request->set_query_params( $args );
					$response = rest_do_request( $request );
					$server   = rest_get_server();
					$data     = $server->response_to_data( $response, false );

					$have_related_posts = ( ! empty( $map_meta['relate_posts'][0] ) && ! empty( $data ) );

					if ( $full_width ) {
						$popup_width = $popup_width_arg ? $popup_width_arg : 220;
						$map_width   = $full_width ? $full_width : 600;

						if ( $have_related_posts ) {
							$map_width = $full_width - $popup_width;
						}

						$height = $height ? $height : 600;

						$map_style       = "width: {$map_width}px; height: {$height}px;";
						$container_style = "position: fixed; width: {$full_width}px; height: {$height}px;";
						$popup_style     = "width: {$popup_width}px; height: {$height}px;";
					} else {
						$container_style = 'position: fixed; width: 100%; height: 100%;';

						if ( $have_related_posts ) {
							$map_style   = 'width: 70%; height: calc(100% - 35px);';
							$popup_style = 'width: 30%; height: calc(100% - 35px);';
						} else {
							$map_style   = 'width: 100%; height: calc(100% - 35px);';
							$popup_style = $container_style;
						}
					}

					if ( function_exists( 'wpml_get_language_information' ) ) {
						global $sitepress;
						$post_language_information = wpml_get_language_information( null, $map_id );
						if ( ! is_wp_error( $post_language_information ) ) {
							$sitepress->switch_lang( $post_language_information['language_code'], true );
							switch_to_locale( $post_language_information['locale'] );
						}
					}

					require JEO_BASEPATH . '/templates/embed.php';
					exit();

				}
			} else {
				require JEO_BASEPATH . '/templates/embed-discovery.php';
				exit();
			}
		}
	}

	/**
	 * Render the story map content for previews and embed requests.
	 *
	 * @param string $content Existing post content.
	 * @return string
	 */
	public function storymap_content( $content ) {
		$storymap_id = filter_input( INPUT_GET, 'storymap_id', FILTER_VALIDATE_INT );

		if ( ( is_singular() && in_the_loop() && is_main_query() ) || ( get_query_var( 'jeo_embed' ) === 'map' && $storymap_id ) ) {
			global $post, $wpdb;

			// Sometimes the saved content is empty.
			$post_id    = $post->ID;
			$preview_id = filter_input( INPUT_GET, 'preview_id', FILTER_VALIDATE_INT );
			if ( $preview_id ) {
				$post_id = $preview_id;
			}
			if ( $storymap_id ) {
				$post_id = $storymap_id;
			}
			$post_content = $wpdb->get_results(
				$wpdb->prepare( "SELECT post_content FROM {$wpdb->posts} WHERE ID=%d", $post_id )
			);

			return do_blocks( $post_content[0]->post_content );
		}

		return $content;
	}

	/**
	 * Auto-inject the editor preview block into existing map posts
	 * so the block editor template matches without user intervention.
	 *
	 * @param WP_REST_Response $response REST response.
	 * @param WP_Post          $post Current post object.
	 * @param WP_REST_Request  $request REST request.
	 * @return WP_REST_Response
	 */
	public function inject_editor_block_for_map( $response, $post, $request ) {
		unset( $post );
		if ( 'edit' === $request->get_param( 'context' ) ) {
			$raw = $response->data['content']['raw'] ?? '';
			if ( false === strpos( $raw, 'jeo/map-editor' ) ) {
				$response->data['content']['raw'] = '<!-- wp:jeo/map-editor {"align":"full"} /-->';
			}
		}
		return $response;
	}

	/**
	 * Auto-inject the editor preview block into existing layer posts
	 * so the block editor template matches without user intervention.
	 *
	 * @param WP_REST_Response $response REST response.
	 * @param WP_Post          $post Current post object.
	 * @param WP_REST_Request  $request REST request.
	 * @return WP_REST_Response
	 */
	public function inject_editor_block_for_layer( $response, $post, $request ) {
		unset( $post );
		if ( 'edit' === $request->get_param( 'context' ) ) {
			$raw = $response->data['content']['raw'] ?? '';
			if ( false === strpos( $raw, 'jeo/layer-editor' ) ) {
				$response->data['content']['raw'] = '<!-- wp:jeo/layer-editor {"align":"full"} /-->';
			}
		}
		return $response;
	}

	/**
	 * Lock the story map post type to a single block and enforce preview rendering.
	 *
	 * @return void
	 */
	public function restrict_story_map_block_count() {
		global $post;

		$preview = filter_input( INPUT_GET, 'preview', FILTER_VALIDATE_BOOL );
		if ( $preview ) {
			if ( ! empty( $post ) ) {
				$post_id = $post->ID;
			} else {
				$preview_id = filter_input( INPUT_GET, 'preview_id', FILTER_VALIDATE_INT );
				if ( $preview_id ) {
					$post_id = $preview_id;
				}
			}

			if ( ! empty( $post_id ) ) {
				$wp_post = get_post( $post_id );

				if ( is_object( $wp_post ) && $wp_post instanceof WP_Post && 'storymap' === $wp_post->post_type ) {
					add_filter( 'the_content', array( $this, 'storymap_content' ), 1 );
				}
			}
		}

		if ( is_admin() ) {
			global $wp_post_types;

			$wp_post_types['storymap']->template      = array(
				array( 'jeo/storymap' ),
			);
			$wp_post_types['storymap']->template_lock = 'all';

			if ( isset( $wp_post_types['map'] ) ) {
				$wp_post_types['map']->template      = array(
					array( 'jeo/map-editor', array( 'align' => 'full' ) ),
				);
				$wp_post_types['map']->template_lock = 'all';
			}

			if ( isset( $wp_post_types['map-layer'] ) ) {
				$wp_post_types['map-layer']->template      = array(
					array( 'jeo/layer-editor', array( 'align' => 'full' ) ),
				);
				$wp_post_types['map-layer']->template_lock = 'all';
			}
		}
	}
}
