<?php
/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://www.jeowp.org/
 * @since      1.0.0
 *
 * @package    Jeo
 * @subpackage Jeo/includes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
 * @author     InfoAmazonia <contact@infoamazonia.org>
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
		\jeo_ai_logger();
		\jeo_ai_handler();
		\jeo_layer_types();
		\jeo_legend_types();
		\jeo_sidebars();
		\jeo_storymap();

		add_filter( 'load_textdomain_mofile', array( $this, 'fallback_translation_mofile' ), 10, 2 );
		add_filter( 'load_script_translation_file', array( $this, 'fallback_script_translation_file' ), 10, 3 );
		add_filter( 'block_categories_all', array( $this, 'register_block_category' ) );
		add_action( 'init', array( $this, 'register_block_types' ) );
		add_action( 'init', array( $this, 'register_oembed' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );

		add_action( 'init', array( $this, 'register_embed_rewrite' ) );
		add_filter( 'query_vars', array( $this, 'register_embed_query_var' ) );
		add_action( 'template_redirect', array( $this, 'register_embed_template_redirect' ) );

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_blocks_assets' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_block_iframe_assets' ) );
		add_action( 'init', array( $this, 'restrict_story_map_block_count' ) );

		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_action( 'rest_api_init', array( $this, 'register_dashboard_routes' ) );

		add_filter( 'rest_post_tag_query', array( $this, 'maximum_terms_api_filter' ), 10, 1 );

		add_filter( 'rest_map-layer_query', array( $this, 'custom_layer_search_filters' ), 10, 2 );
		add_filter( 'rest_map-layer_query', array( $this, 'order_rest_post_by_post_title' ), 10, 1 );
		add_filter( 'rest_request_before_callbacks', array( $this, 'rest_authenticate_by_cookie' ), 10, 3 );

		// Auto-inject editor preview blocks into existing map/layer posts.
		// so they don't show the "template mismatch" warning.
		add_filter( 'rest_prepare_map', array( $this, 'inject_editor_block_for_map' ), 10, 3 );
		add_filter( 'rest_prepare_map-layer', array( $this, 'inject_editor_block_for_layer' ), 10, 3 );
	}

	public function register_dashboard_routes() {
		register_rest_route(
			'jeo/v1',
			'/all-pins',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'api_all_pins' ),
				'permission_callback' => function () { return current_user_can( 'read' ); },
			)
		);

		register_rest_route(
			'jeo/v1',
			'/dashboard-stats',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'api_dashboard_stats' ),
				'permission_callback' => function () { return current_user_can( 'read' ); },
			)
		);

		register_rest_route(
			'jeo/v1',
			'/readme',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'api_get_readme' ),
				'permission_callback' => function () { return current_user_can( 'read' ); },
			)
		);
	}

	/**
	 * Returns the content of all README*.md files found in the plugin root.
	 * Also looks one level up to support Docker development environments where only src is mounted.
	 */
	public function api_get_readme() {
		$paths = array(
			JEO_BASEPATH . 'README*.md',
			dirname( JEO_BASEPATH ) . '/README*.md',
		);

		$files = array();
		foreach ( $paths as $path ) {
			$found = glob( $path );
			if ( is_array( $found ) ) {
				$files = array_merge( $files, $found );
			}
		}

		// Remove duplicates (same filename in different paths)
		$unique_files = array();
		foreach ( $files as $file ) {
			$name = basename( $file );
			if ( ! isset( $unique_files[ $name ] ) ) {
				$unique_files[ $name ] = $file;
			}
		}

		$readmes = array();

		if ( empty( $unique_files ) ) {
			return new \WP_REST_Response( array( 'error' => 'No README files found' ), 404 );
		}

		foreach ( $unique_files as $file_name => $file_path ) {
			// Create a friendly label: README_BR.md -> BR, README.md -> Default
			$label = str_replace( array( 'README_', 'README', '.md' ), '', $file_name );
			$label = empty( $label ) ? 'English' : str_replace( '_', ' ', $label );

			// Map specific codes to names
			if ( 'BR' === $label ) { $label = 'Português Brasil'; }

			$readmes[] = array(
				'label'   => $label,
				'content' => file_get_contents( $file_path )
			);
		}

		return new \WP_REST_Response( $readmes, 200 );
	}

	public function api_dashboard_stats() {
		global $wpdb;
		$min_date = $wpdb->get_var( "SELECT MIN(post_date) FROM {$wpdb->posts} WHERE post_status = 'publish'" );

		$post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		$types_data = array();
		foreach ( $post_types as $pt ) {
			$obj = get_post_type_object( $pt );
			if ( ! $obj ) continue;

			$taxonomies = get_object_taxonomies( $pt, 'objects' );
			$tax_data = array();
			foreach ( $taxonomies as $tax ) {
				if ( ! $tax->public || ! $tax->show_ui ) continue;
				$terms = get_terms( array( 'taxonomy' => $tax->name, 'hide_empty' => true ) );
				$term_list = array();
				foreach ( $terms as $term ) {
					$term_list[] = array( 'id' => (int) $term->term_id, 'name' => (string) $term->name );
				}
				$tax_data[] = array(
					'slug'  => (string) $tax->name,
					'label' => (string) $tax->label,
					'terms' => $term_list
				);
			}

			$types_data[] = array(
				'slug'       => (string) $pt,
				'label'      => (string) $obj->label,
				'taxonomies' => $tax_data
			);
		}

		return new \WP_REST_Response( array(
			'min_date'   => $min_date ? substr( $min_date, 0, 10 ) : date( 'Y-m-d', strtotime( '-1 year' ) ),
			'post_types' => $types_data
		), 200 );
	}

	public function api_all_pins( $request ) {
		global $wpdb;

		$search    = $request->get_param( 'search' );
		$after     = $request->get_param( 'after' );
		$before    = $request->get_param( 'before' );
		$post_type = $request->get_param( 'post_type' );
		$taxonomy  = $request->get_param( 'taxonomy' );
		$term_id   = $request->get_param( 'term_id' );

		$query_where = "pm.meta_key = '_related_point' AND pm.meta_value != ''";
		$join = "";
		$params = array();

		if ( ! empty( $search ) || ! empty( $after ) || ! empty( $before ) || ! empty( $post_type ) || ! empty( $taxonomy ) ) {
			$join .= " INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID";
		}

		if ( ! empty( $search ) ) {
			$query_where .= " AND (p.post_title LIKE %s OR p.post_content LIKE %s)";
			$params[] = '%' . $wpdb->esc_like( $search ) . '%';
			$params[] = '%' . $wpdb->esc_like( $search ) . '%';
		}

		if ( ! empty( $post_type ) ) {
			$query_where .= " AND p.post_type = %s";
			$params[] = $post_type;
		}

		if ( ! empty( $taxonomy ) && ! empty( $term_id ) ) {
			$join .= " INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id";
			$join .= " INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id";
			$query_where .= " AND tt.taxonomy = %s AND tt.term_id = %d";
			$params[] = $taxonomy;
			$params[] = (int) $term_id;
		}

		if ( ! empty( $after ) ) {
			$query_where .= " AND p.post_date >= %s";
			$params[] = $after . ' 00:00:00';
		}
		if ( ! empty( $before ) ) {
			$query_where .= " AND p.post_date <= %s";
			$params[] = $before . ' 23:59:59';
		}

		$sql = "SELECT pm.post_id, pm.meta_value FROM {$wpdb->postmeta} pm $join WHERE $query_where";

		if ( ! empty( $params ) ) {
			$sql = $wpdb->prepare( $sql, $params );
		}

		$results = $wpdb->get_results( $sql );

		$unique_pins = array();
		$hash_map    = array();

		foreach ( $results as $row ) {
			$post_id     = $row->post_id;
			$meta_data   = maybe_unserialize( $row->meta_value );
			$post_title  = get_the_title( $post_id );
			$view_url    = get_permalink( $post_id );
			$edit_url    = get_edit_post_link( $post_id, '' );

			// O WordPress pode retornar um array de pontos ou um ponto único
			// dependendo de como o metadado foi registrado e salvo.
			$points = array();
			if ( is_array( $meta_data ) ) {
				// Se o primeiro item for numérico, é um array de arrays (múltiplos pontos)
				if ( isset( $meta_data[0] ) && is_array( $meta_data[0] ) ) {
					$points = $meta_data;
				} else {
					// Caso contrário é um ponto único formatado como array associativo
					$points[] = $meta_data;
				}
			}

			foreach ( $points as $point ) {
				if ( isset( $point['_geocode_lat'] ) && isset( $point['_geocode_lon'] ) ) {

					$lat = (float) str_replace(',', '.', $point['_geocode_lat']);
					$lon = (float) str_replace(',', '.', $point['_geocode_lon']);

					// Arredondamento para filtrar duplicatas
					$hash = round($lat, 5) . '|' . round($lon, 5) . '|' . $post_id;

					if ( ! isset( $hash_map[ $hash ] ) ) {
						$hash_map[ $hash ] = true;
						$unique_pins[] = array(
							'post_id'  => $post_id,
							'title'    => $post_title,
							'view_url' => $view_url,
							'edit_url' => $edit_url,
							'name'     => isset( $point['_geocode_full_address'] ) ? $point['_geocode_full_address'] : '',
							'lat'      => $lat,
							'lon'      => $lon,
							'quote'    => isset( $point['_ai_quote'] ) ? $point['_ai_quote'] : ''
						);
					}
				}
			}
		}
		return new \WP_REST_Response( $unique_pins, 200 );
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
	 * Fall back to the closest bundled locale when another locale in the same language family is active.
	 *
	 * @param string $mofile Translation file path.
	 * @param string $domain Text domain.
	 * @return string
	 */
	public function fallback_translation_mofile( $mofile, $domain ) {
		if ( 'jeo' !== $domain || is_readable( $mofile ) ) {
			return $mofile;
		}

		$fallback_locale = $this->get_locale_fallback( determine_locale() );
		if ( ! $fallback_locale ) {
			return $mofile;
		}

		$fallback_mofile = JEO_BASEPATH . 'languages/jeo-' . $fallback_locale . '.mo';

		return is_readable( $fallback_mofile ) ? $fallback_mofile : $mofile;
	}

	/**
	 * Fall back to the closest bundled script catalog for locales in the same language family.
	 *
	 * @param string|false $file Script translation file path.
	 * @param string       $handle Script handle.
	 * @param string       $domain Text domain.
	 * @return string|false
	 */
	public function fallback_script_translation_file( $file, $handle, $domain ) {
		if ( 'jeo' !== $domain || ! $file || is_readable( $file ) ) {
			return $file;
		}

		$current_locale  = $this->normalize_translation_locale( determine_locale() );
		$fallback_locale = $this->get_locale_fallback( $current_locale );
		if ( ! $fallback_locale ) {
			return $file;
		}

		$fallback_file = str_replace(
			'-' . $current_locale . '-',
			'-' . $fallback_locale . '-',
			$file,
		);

		return $fallback_file !== $file && is_readable( $fallback_file ) ? $fallback_file : $file;
	}

	/**
	 * Normalize locale codes used in translation file names.
	 *
	 * @param string $locale Locale code.
	 * @return string
	 */
	private function normalize_translation_locale( string $locale ): string {
		return str_replace( '-', '_', $locale );
	}

	/**
	 * Get a fallback locale for translation files.
	 *
	 * @param string $locale Locale code.
	 * @return string|null
	 */
	private function get_locale_fallback( string $locale ): ?string {
		$locale = $this->normalize_translation_locale( $locale );

		$fallbacks = array(
			'es' => 'es_CO',
			'pt' => 'pt_BR',
		);

		foreach ( $fallbacks as $language => $fallback_locale ) {
			if ( $fallback_locale === $locale ) {
				return null;
			}

			if ( $language === $locale || 0 === strpos( $locale, $language . '_' ) ) {
				return $fallback_locale;
			}
		}

		return null;
	}

	/**
	 * Preserve requested map-layer ordering when explicit IDs are provided.
	 *
	 * @param array $args REST query args.
	 * @return array
	 */
	public function order_rest_post_by_post_title( $args ) {
		if ( isset( $args['post__in'] ) && ! empty( $args['post__in'] ) ) {
			$args['orderby'] = 'post__in';
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
	 * Register custom REST routes used by JEO.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/map-layer',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_map_layers_by_ids' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'include' => array(
						'description'       => __( 'Ordered list of map-layer IDs to return.', 'jeo' ),
						'sanitize_callback' => array( $this, 'sanitize_rest_include_ids' ),
						'default'           => array(),
					),
					'context' => array(
						'description'       => __( 'Request context.', 'jeo' ),
						'sanitize_callback' => 'sanitize_key',
						'default'           => 'view',
						'validate_callback' => static function ( $value ) {
							return in_array( $value, array( 'view', 'edit' ), true );
						},
					),
				),
			)
		);
	}

	/**
	 * Normalize a REST include argument into an ordered array of unique IDs.
	 *
	 * @param mixed           $value Raw request value.
	 * @param WP_REST_Request $request Current request.
	 * @param string          $param Parameter name.
	 * @return int[]
	 */
	public function sanitize_rest_include_ids( $value, $request = null, $param = '' ) {
		unset( $request, $param );

		if ( is_string( $value ) ) {
			$value = explode( ',', $value );
		}

		if ( ! is_array( $value ) ) {
			return array();
		}

		return array_values(
			array_unique(
				array_filter(
					array_map( 'absint', $value )
				)
			)
		);
	}

	/**
	 * Return map-layer posts in the requested order without relying on filtered collection queries.
	 *
	 * @param WP_REST_Request $request Current request.
	 * @return WP_REST_Response
	 */
	public function get_map_layers_by_ids( WP_REST_Request $request ) {
		$ids     = $this->sanitize_rest_include_ids( $request->get_param( 'include' ) );
		$context = 'edit' === $request->get_param( 'context' ) ? 'edit' : 'view';

		if ( empty( $ids ) ) {
			return rest_ensure_response( array() );
		}

		$controller = new \WP_REST_Posts_Controller( 'map-layer' );
		$items      = array();

		foreach ( $ids as $id ) {
			$post = get_post( $id );

			if ( ! $post instanceof \WP_Post || 'map-layer' !== $post->post_type ) {
				continue;
			}

			if ( 'edit' === $context ) {
				if ( ! current_user_can( 'edit_post', $id ) ) {
					continue;
				}
			} elseif ( 'publish' !== get_post_status( $post ) ) {
				continue;
			}

			$item_request = new \WP_REST_Request( \WP_REST_Server::READABLE, '/jeo/v1/map-layer' );
			$item_request->set_param( 'context', $context );

			$item = $controller->prepare_item_for_response( $post, $item_request );

			if ( is_wp_error( $item ) ) {
				continue;
			}

			$items[] = $controller->prepare_response_for_collection( $item );
		}

		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', (string) count( $items ) );
		$response->header( 'X-WP-TotalPages', '1' );

		return $response;
	}

	/**
	 * Register shared frontend and editor assets for the plugin.
	 *
	 * @return void
	 */
	public function register_assets() {
		$asset_file            = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';
		$layer_type_handles    = \Jeo\Layer_Types::get_instance()->get_layer_type_script_handles();
		$legend_script_handles = \jeo_legend_types()->get_registered_script_handles();

		$deps = array_merge(
			array( 'lodash' ),
			$asset_file['dependencies'] ?? array(),
			$legend_script_handles
		);

		wp_register_style( 'jeo-js', JEO_BASEURL . '/js/build/postsSidebar.css', array(), JEO_VERSION );
		wp_register_script(
			'jeo-js',
			JEO_BASEURL . '/js/build/postsSidebar.js',
			$deps,
			$asset_file['version'],
			true,
		);

		wp_set_script_translations( 'jeo-js', 'jeo', JEO_BASEPATH . 'languages' );

		$map_runtime_requested = $this->get_requested_map_runtime();
		$mapgl_script_deps     = array();
		$mapgl_style_deps      = array();

		$mapbox_key  = \jeo_settings()->get_option( 'mapbox_key' );
		$default_lat = \jeo_settings()->get_option( 'map_default_lat' ) ?: -23.549985;
		$default_lon = \jeo_settings()->get_option( 'map_default_lon' ) ?: -46.633519;
		$default_zoom = \jeo_settings()->get_option( 'map_default_zoom' ) ?: 5;

		$ai_provider_slug = \jeo_settings()->get_option( 'ai_default_provider' ) ?: 'gemini';
		$ai_adapters      = \jeo_ai_handler()->get_adapters();
		$ai_provider_name = isset( $ai_adapters[ $ai_provider_slug ] ) ? $ai_adapters[ $ai_provider_slug ] : 'AI';

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
				'ajax_url'         => admin_url( 'admin-ajax.php' ),
				'ai_provider_name' => $ai_provider_name,
				'map_runtime'      => $map_runtime_requested,
				'mapbox_key'       => $mapbox_key,
				'default_lat'      => $default_lat,
				'default_lon'      => $default_lon,
				'default_zoom'     => $default_zoom,
				'rest_url'         => rest_url('jeo/v1'),
				'nonce'            => wp_create_nonce( 'wp_rest' )
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
				'site_url'              => get_site_url(),
				'mapbox_key'            => sanitize_text_field( \jeo_settings()->get_option( 'mapbox_key' ) ),
				'map_defaults'          => array(
					'zoom'                => intval( \jeo_settings()->get_option( 'map_default_zoom' ) ),
					'lat'                 => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lat' ) ),
					'lon'                 => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lon' ) ),
					'disable_scroll_zoom' => false,
					'disable_drag_rotate' => false,
					'enable_fullscreen'   => true,
					'disable_drag_pan'    => false,
				),
				'map_runtime'           => $map_runtime_requested,
				'map_runtime_requested' => $map_runtime_requested,
				'runtime_messages'      => array(
					'mapbox_missing_token'       => __( 'Mapbox was selected as the rendering library, but no Mapbox API key is configured. Falling back to MapLibre.', 'jeo' ),
					'mapbox_runtime_unavailable' => __(
						'Mapbox was selected as the rendering library, but the external Mapbox SDK could not be loaded. Falling back to MapLibre.',
						'jeo'
					),
				),
				'nonce'                 => $this->get_rest_nonce(),
				'jeo_typography_name'   => sanitize_text_field( \jeo_settings()->get_option( 'jeo_typography-name' ) ),
				'public_path'           => JEO_BASEURL . '/js/build/',
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

		wp_register_style(
			'mapgl-react-style',
			false,
			array( 'mapgl' ),
			JEO_VERSION,
		);

		$map_blocks_assets = include JEO_BASEPATH . '/js/build/mapBlocks.asset.php';

		wp_register_style(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.css',
			array( 'mapgl', 'mapgl-react-style' ),
			JEO_VERSION,
		);
		wp_register_script(
			'jeo-map-blocks',
			JEO_BASEURL . '/js/build/mapBlocks.js',
			array_merge(
				$map_blocks_assets['dependencies'] ?? array(),
				array( 'jeo-layer', 'mapgl-react' ),
				$layer_type_handles,
				$legend_script_handles
			),
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
		if ( ! is_object( $saved_data ) ) {
			return '';
		}

		$map_id     = isset( $saved_data->map_id ) ? (int) $saved_data->map_id : 0;
		$map_layers = get_post_meta( $map_id, 'layers', true );
		if ( ! is_array( $map_layers ) ) {
			$map_layers = array();
		}

		if ( ! isset( $saved_data->slides ) || ! is_array( $saved_data->slides ) ) {
			$saved_data->slides = array();
		}

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

		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'story-map-container' ) );

		return '<div ' . $wrapper_attributes . ' data-properties="' . htmlentities( wp_json_encode( $saved_data ) ) . '" ></div>';
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

		if ( isset( $args['post__in'] ) && ! empty( $args['post__in'] ) ) {
			$args['orderby'] = 'post__in';
		}

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
	 * Enqueue shared map runtime styles inside the block-editor iframe.
	 *
	 * Block API v3 renders content in an iframe, and runtime styles enqueued for
	 * the parent admin document do not automatically follow there. The map editor
	 * previews need the runtime stylesheet in the iframe document as well so
	 * Mapbox can resolve its required CSS declarations.
	 *
	 * @return void
	 */
	public function enqueue_block_iframe_assets() {
		if ( ! is_admin() ) {
			return;
		}

		wp_enqueue_style( 'mapgl' );
		wp_enqueue_style( 'mapgl-react-style' );
	}

	/**
	 * Enqueue the public map runtime and conditional frontend experiences.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		if ( $this->should_load_assets() ) {
			$legend_script_handles = \jeo_legend_types()->get_registered_script_handles();

			wp_enqueue_style( 'mapgl' );
			wp_enqueue_script( 'mapgl' );
			wp_enqueue_style( 'jeo-map', JEO_BASEURL . '/js/build/jeoMap.css', array( 'mapgl' ), JEO_VERSION );
			wp_enqueue_script(
				'jeo-map',
				JEO_BASEURL . '/js/build/jeoMap.js',
				array_merge( array( 'mapgl', 'jquery' ), $legend_script_handles ),
				JEO_VERSION,
				true
			);

			wp_set_script_translations( 'jeo-map', 'jeo', JEO_BASEPATH . 'languages' );

			$current_language = $this->get_current_language();

			wp_localize_script(
				'jeo-map',
				'jeoMapVars',
				array(
					'jsonUrl'          => rest_url( 'wp/v2/' ),
					'layersUrl'        => rest_url( 'jeo/v1/map-layer' ),
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
					'lon'  => sanitize_text_field( \jeo_settings()->get_option( 'map_default_lon' ) ),
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
			global $post;

			$post_id    = $post->ID;
			$preview_id = filter_input( INPUT_GET, 'preview_id', FILTER_VALIDATE_INT );
			if ( $preview_id ) {
				$post_id = $preview_id;
			}
			if ( $storymap_id ) {
				$post_id = $storymap_id;
			}

			$preview_post = $this->get_preview_post( $post_id );
			if ( $preview_post instanceof WP_Post ) {
				return do_blocks( $preview_post->post_content );
			}
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
				$response->data['content']['raw'] = '<!-- wp:jeo/map-editor {"align":"full"} /-->' . $raw;
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

			if ( isset( $wp_post_types['storymap'] ) ) {
				$wp_post_types['storymap']->template      = array(
					array( 'jeo/storymap' ),
				);
				$wp_post_types['storymap']->template_lock = 'all';
			}

			if ( isset( $wp_post_types['map'] ) ) {
				$wp_post_types['map']->template = array(
					array(
						'jeo/map-editor',
						array(
							'align' => 'full',
							'lock'  => array(
								'move'   => true,
								'remove' => true,
							),
						),
					),
				);
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
