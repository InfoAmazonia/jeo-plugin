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

		add_filter( 'rest_post_tag_query', array( $this, 'maximum_terms_api_filter' ), 10, 1 );

		add_filter( 'rest_map-layer_query', array( $this, 'custom_layer_search_filters' ), 10, 2 );
		add_filter( 'rest_map-layer_query', array( $this, 'order_rest_post_by_post_title' ), 10, 1 );
		add_filter( 'rest_request_before_callbacks', array( $this, 'rest_authenticate_by_cookie' ), 10, 3 );
	}

	private function get_current_language(): string {
		$language = get_bloginfo( 'language' );
		if ( defined( 'ICL_LANGUAGE_CODE' ) ) {
			$language = ICL_LANGUAGE_CODE;
		}
		return apply_filters( 'wpml_current_language', $language );
	}

	private function get_rest_nonce() {
		if ( is_user_logged_in() ) {
			return wp_create_nonce( 'wp_rest' );
		}
		return null;
	}

	/**
	 * Determine whether the current request is a preview for the given post.
	 *
	 * @param int $post_id Post ID.
	 * @return bool
	 */
	public function is_preview_request_for_post( int $post_id ): bool {
		$preview = filter_input( INPUT_GET, 'preview', FILTER_VALIDATE_BOOL );
		if ( ! $preview && ! is_preview() ) {
			return false;
		}

		$preview_id = filter_input( INPUT_GET, 'preview_id', FILTER_VALIDATE_INT );
		if ( $preview_id && $preview_id !== $post_id ) {
			return false;
		}

		return true;
	}

	/**
	 * Return the autosave revision when previewing a post, falling back to the
	 * published post otherwise.
	 *
	 * @param int $post_id Post ID.
	 * @return WP_Post|null
	 */
	public function get_preview_post( int $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return null;
		}

		if ( ! $this->is_preview_request_for_post( $post_id ) ) {
			return $post;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return $post;
		}

		$autosave = wp_get_post_autosave( $post_id );
		if ( $autosave instanceof WP_Post ) {
			return $autosave;
		}

		return $post;
	}

	/**
	 * Return the requested map runtime normalized to a supported value.
	 *
	 * @return string
	 */
	private function get_requested_map_runtime(): string {
		$map_runtime = sanitize_key( (string) \jeo_settings()->get_option( 'map_runtime' ) );
		return in_array( $map_runtime, array( 'maplibregl', 'mapboxgl' ), true ) ? $map_runtime : 'maplibregl';
	}

	/**
	 * Return the externally hosted Mapbox SDK metadata.
	 *
	 * @return array{version:string,js_url:string,css_url:string}
	 */
	private function get_mapbox_external_sdk(): array {
		$version = 'v3.20.0';
		$sdk     = apply_filters(
			'jeo_mapbox_external_sdk',
			array(
				'version' => $version,
				'js_url'  => sprintf( 'https://api.mapbox.com/mapbox-gl-js/%1$s/mapbox-gl.js', $version ),
				'css_url' => sprintf( 'https://api.mapbox.com/mapbox-gl-js/%1$s/mapbox-gl.css', $version ),
			)
		);

		return array(
			'version' => sanitize_text_field( (string) ( $sdk['version'] ?? $version ) ),
			'js_url'  => esc_url_raw( (string) ( $sdk['js_url'] ?? '' ) ),
			'css_url' => esc_url_raw( (string) ( $sdk['css_url'] ?? '' ) ),
		);
	}

	/**
	 * Determine whether the external Mapbox SDK should be enqueued.
	 *
	 * @return bool
	 */
	private function should_load_external_mapbox_sdk(): bool {
		if ( 'mapboxgl' !== $this->get_requested_map_runtime() ) {
			return false;
		}

		return '' !== trim( sanitize_text_field( (string) \jeo_settings()->get_option( 'mapbox_key' ) ) );
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

	public function maximum_terms_api_filter( $prepared_args ) {
		$prepared_args['number'] = 1000;
		return $prepared_args;
	}

	public function order_rest_post_by_post_title( $args ) {
		if ( isset( $args['post__in'] ) && ! empty( $args['post__in'] ) ) {
			$args['suppress_filters'] = true;
		}

		return $args;
	}

	public function custom_layer_search_filters( array $query, \WP_REST_Request $request ) {
		if ( $layer_type = $request->get_param( 'layer_type' ) ) {
			if ( ! isset( $query['meta_query'] ) ) {
				$query['meta_query'] = array();
			}

			$query['meta_query'][] = array(
				'key'   => 'type',
				'value' => $layer_type,
			);
		}

		if ( $layer_name = $request->get_param( 'layer_name' ) ) {
			$query['s'] = $layer_name;
		}

		return $query;
	}

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

		$requested_map_runtime = $this->get_requested_map_runtime();
		$mapgl_script_deps     = array();
		$mapgl_style_deps      = array();

		if ( $this->should_load_external_mapbox_sdk() ) {
			$mapbox_sdk = $this->get_mapbox_external_sdk();

			if ( ! empty( $mapbox_sdk['js_url'] ) ) {
				wp_register_script(
					'jeo-mapbox-sdk-js',
					$mapbox_sdk['js_url'],
					array(),
					$mapbox_sdk['version'],
					true,
				);
				$mapgl_script_deps[] = 'jeo-mapbox-sdk-js';
			}

			if ( ! empty( $mapbox_sdk['css_url'] ) ) {
				wp_register_style(
					'jeo-mapbox-sdk-css',
					$mapbox_sdk['css_url'],
					array(),
					$mapbox_sdk['version'],
				);
				$mapgl_style_deps[] = 'jeo-mapbox-sdk-css';
			}
		}

		wp_localize_script(
			'jeo-js',
			'jeo',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
			)
		);

		wp_register_script(
			'mapgl',
			JEO_BASEURL . '/js/build/mapglLoader.js',
			$mapgl_script_deps,
			JEO_VERSION,
			true,
		);

		wp_register_style(
			'mapgl',
			JEO_BASEURL . '/js/build/mapglLoader.css',
			$mapgl_style_deps,
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
				'map_runtime'         => $requested_map_runtime,
				'runtime_messages'    => array(
					'mapbox_missing_token'       => __( 'Mapbox was selected as the rendering library, but no Mapbox API key is configured. Falling back to MapLibre.', 'jeo' ),
					'mapbox_runtime_unavailable' => __(
						'Mapbox was selected as the rendering library, but the external Mapbox SDK could not be loaded. Falling back to MapLibre.',
						'jeo'
					),
				),
				'nonce'               => $this->get_rest_nonce(),
				'jeo_typography_name' => sanitize_text_field( \jeo_settings()->get_option( 'jeo_typography-name' ) ),
				'public_path'         => JEO_BASEURL . '/js/build/',
			)
		);

		$mapgl_react_assets = include JEO_BASEPATH . '/js/build/mapglReact.asset.php';

		wp_register_script(
			'mapgl-react',
			JEO_BASEURL . '/js/build/mapglReact.js',
			array_merge( $mapgl_react_assets['dependencies'] ?? array(), array( 'mapgl' ) ),
			$mapgl_react_assets['version'] ?? JEO_VERSION,
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
				'render_callback' => array( $this, 'story_map_dynamic_render_callback' ),
				'editor_script'   => 'jeo-map-blocks',
				'editor_style'    => 'jeo-map-blocks',
			)
		);
		register_block_type(
			'jeo/embedded-storymap',
			array(
				'render_callback' => array( $this, 'embedded_story_map_dynamic_render_callback' ),
				'editor_script'   => 'jeo-map-blocks',
				'editor_style'    => 'jeo-map-blocks',
			)
		);
	}

	public function embedded_story_map_dynamic_render_callback( $block_attributes, $content ) {
		$content = json_decode( $content );

		$story_id                       = $content->attributes->storyID;
		$story                          = get_post( $story_id );
		$story_block                    = parse_blocks( $story->post_content )[0];
		$story_block['attrs']['postID'] = $story_id;

		return $this->story_map_dynamic_render_callback( $block_attributes, wp_json_encode( $story_block['attrs'] ) );
	}

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

	public function story_map_dynamic_render_callback( $block_attributes, $content ) {
		$saved_data = json_decode( $content );

		$map_id     = $saved_data->map_id;
		$map_layers = get_post_meta( $map_id, 'layers', true );

		if ( ! function_exists( 'layer_still_exists' ) ) {
			function layer_still_exists( $map_layers, $selected_layer ) {
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
		}

		// Remove not present layers from selectedLayers -- Fix selected layers order
		foreach ( $saved_data->slides as $slide ) {
			foreach ( $slide->selectedLayers as $index => $selected_layer ) {
				// Check if the selected layers exists in the map
				if ( ! layer_still_exists( $map_layers, $selected_layer ) ) {
					array_splice( $slide->selectedLayers, $index, 1 );
				}
			}

			$selected_layers_order = array();

			foreach ( $map_layers as $layer ) {
				foreach ( $slide->selectedLayers as $index => $selected_layer ) {
					if ( $selected_layer->id === $layer['id'] ) {
						$selected_layers_order[] = $selected_layer;
					}
				}
			}

			$slide->selectedLayers = $selected_layers_order;
			$this->cleanup_layers( $slide->selectedLayers );
		}

		// Remove not present layers from navigateMapLayers and create new order
		$final_navigate_map_layers = array();

		foreach ( $map_layers as $layer ) {
			foreach ( $saved_data->navigateMapLayers as $index => $navigate_layer ) {
				if ( $navigate_layer->id === $layer['id'] ) {
					// Update meta / types
					if ( ! layer_still_exists( $map_layers, $navigate_layer ) ) {
						array_splice( $saved_data->navigateMapLayers, $index, 1 );
					} else {
						$final_navigate_map_layers[] = $navigate_layer;
					}
				}
			}
		}

		$saved_data->navigateMapLayers = $final_navigate_map_layers;
		$this->cleanup_layers( $saved_data->navigateMapLayers );
		$this->cleanup_layers( $saved_data->loadedLayers );

		// Option `use_smilies` breaks returned HTML :'-(
		add_filter(
			'option_use_smilies',
			function ( $value ) {
				return false;
			}
		);

		return '<div class="story-map-container" data-properties="' . htmlentities( wp_json_encode( $saved_data ) ) . '" ></div>';
	}

	public function filter_rest_query_by_zone( $args, $request ) {
		$args['suppress_filters'] = true;
		return $args;
	}

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
					'templates'        => array(
						'moreInfo'  => file_get_contents( jeo_get_template( 'map-more-info.ejs' ) ),
						'popup'     => file_get_contents( jeo_get_template( 'generic-popup.ejs' ) ),
						'postPopup' => file_get_contents( jeo_get_template( 'post-popup.ejs' ) ),
					),
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

	public function enqueue_discovery_scripts() {
		$current_language = $this->get_current_language();

		$discovery_assets = include JEO_BASEPATH . '/js/build/discovery.asset.php';
		wp_enqueue_style( 'discovery-map', JEO_BASEURL . '/js/build/discovery.css', array(), JEO_VERSION );
		wp_enqueue_script( 'discovery-map', JEO_BASEURL . '/js/build/discovery.js', array_merge( $discovery_assets['dependencies'] ?? array(), array( 'jeo-map' ) ), JEO_VERSION, true );

		wp_set_script_translations( 'discovery-map', 'jeo', JEO_BASEPATH . 'languages' );

		// Check if sites uses WPML
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

	public function enqueue_storymap_scripts() {
		$storymap_assets = include JEO_BASEPATH . '/js/build/jeoStorymap.asset.php';
		wp_enqueue_style( 'jeo-storymap', JEO_BASEURL . '/js/build/jeoStorymap.css', array( 'jeo-map' ), JEO_VERSION );
		wp_enqueue_script( 'jeo-storymap', JEO_BASEURL . '/js/build/jeoStorymap.js', array_merge( $storymap_assets['dependencies'] ?? array(), array( 'jeo-map', 'mapgl-react' ) ), JEO_VERSION, true );

		wp_set_script_translations( 'jeo-storymap', 'jeo', JEO_BASEPATH . 'languages' );
	}

	public function register_oembed() {
		\jeo_register_embedder( 'local_jeo', get_site_url() );
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

		if ( get_query_var( 'jeo_embed' ) === 'map' ) {
			add_filter( 'show_admin_bar', '__return_false' );
			if ( isset( $_GET['storymap_id'] ) ) {
				$post = get_post( absint( sanitize_text_field( $_GET['storymap_id'] ) ) );
				setup_postdata( $post );
				add_filter( 'the_content', array( $this, 'storymap_content' ), 1 );

				require JEO_BASEPATH . '/templates/embed-storymap.php';
				exit();
			}
			$discovery = isset( $_GET['discovery'] ) ? sanitize_text_field( $_GET['discovery'] ) : false;

			if ( ! $discovery ) {
				$map_id = isset( $_GET['map_id'] ) && is_numeric( $_GET['map_id'] ) ? intval( sanitize_text_field( $_GET['map_id'] ) ) : false;
				if ( $map_id ) {
					$map_meta = get_post_meta( $map_id );
					$args     = (array) maybe_unserialize( $map_meta['related_posts'][0] );

					$args['per_page'] = 1;
					$request          = new WP_REST_Request( 'GET', '/wp/v2/posts' );
					$request->set_query_params( $args );
					$response = rest_do_request( $request );
					$server   = rest_get_server();
					$data     = $server->response_to_data( $response, false );

					$have_related_posts = ! empty( $map_meta['relate_posts'][0] ) && ! empty( $data ) || ! empty( $map->relate_posts );

					if ( isset( $_GET['width'] ) ) {
						$full_width  = isset( $_GET['width'] ) && is_numeric( $_GET['width'] ) ? intval( sanitize_text_field( $_GET['width'] ) ) : 820;
						$popup_width = isset( $_GET['popup_width'] ) && is_numeric( $_GET['popup_width'] ) ? intval( sanitize_text_field( $_GET['popup_width'] ) ) : 220;
						$map_width   = $full_width ? $full_width : 600;

						if ( $have_related_posts ) {
							$map_width = $full_width - $popup_width;
						}

						$height = isset( $_GET['height'] ) && is_numeric( $_GET['height'] ) ? intval( sanitize_text_field( $_GET['height'] ) ) : 600;

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
				$selected_layers = sanitize_text_field( $_GET['selected-layers'] );
				require JEO_BASEPATH . '/templates/embed-discovery.php';
				exit();
			}
		}
	}

	public function storymap_content( $content ) {
		$storymap_id = filter_input( INPUT_GET, 'storymap_id', FILTER_VALIDATE_INT );

		if ( ( is_singular() && in_the_loop() && is_main_query() ) || ( get_query_var( 'jeo_embed' ) === 'map' && $storymap_id ) ) {
			global $post;

			$post_id    = $post->ID;
			$preview_id = filter_input( INPUT_GET, 'preview_id', FILTER_VALIDATE_INT );
			if ( $preview_id ) {
				$post_id = $preview_id;
			}
			if ( ! empty( $_GET['storymap_id'] ) ) {
				$post_id = filter_input( INPUT_GET, 'storymap_id', FILTER_VALIDATE_INT );
			}

			$preview_post = $this->get_preview_post( $post_id );
			if ( $preview_post instanceof WP_Post ) {
				return do_blocks( $preview_post->post_content );
			}
		}
	}

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
		}
	}
}
