<?php
/**
 * Layer post-type registration.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register and manage layer posts.
 */
class Layers {

	use Singleton;
	use Rest_Validate_Meta;

	/**
	 * Layer post type slug.
	 *
	 * @var string
	 */
	public $post_type = 'map-layer';

	/**
	 * Register layer hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ), 20 );
		add_action( 'admin_init', array( $this, 'add_capabilities' ) );
		add_action( 'add_meta_boxes', array( $this, 'remove_custom_fields_meta_box' ), 99 );
		add_filter( 'manage_' . $this->post_type . '_posts_columns', array( $this, 'add_admin_list_columns' ) );
		add_action( 'manage_' . $this->post_type . '_posts_custom_column', array( $this, 'render_admin_list_columns' ), 10, 2 );
		add_filter( 'rest_prepare_' . $this->post_type, array( $this, 'expose_layer_origin' ), 20, 3 );
		$this->register_rest_meta_validation();
	}

	/**
	 * Resolve the layer origin: 'ai' or 'manual' (W4 4.7).
	 *
	 * Resolution order (read-only — legacy audit layers are never written):
	 * 1. The stored `provenance` meta, when present (set at creation by the
	 *    AI generation tools: Minilayer_Service and Place_Polygon_Service).
	 * 2. Legacy boundary layers carrying `_jeo_boundary_source` — a
	 *    deterministic marker only the AI boundary tool writes.
	 * 3. Default: 'manual'.
	 *
	 * @param int $post_id Layer post ID.
	 * @return string 'ai' or 'manual'.
	 */
	public static function resolve_layer_origin( int $post_id ): string {
		$stored = get_post_meta( $post_id, 'provenance', true );
		if ( in_array( $stored, array( 'ai', 'manual' ), true ) ) {
			return $stored;
		}

		if ( get_post_meta( $post_id, '_jeo_boundary_source', true ) ) {
			return 'ai';
		}

		return 'manual';
	}

	/**
	 * Add the Origin column to the layers list table (W4 4.7).
	 *
	 * @param array $columns Default columns.
	 * @return array
	 */
	public function add_admin_list_columns( $columns ) {
		$new_columns = array();
		foreach ( $columns as $key => $label ) {
			$new_columns[ $key ] = $label;
			if ( 'title' === $key ) {
				$new_columns['jeo_layer_origin'] = __( 'Origin', 'jeowp' );
			}
		}

		if ( ! isset( $new_columns['jeo_layer_origin'] ) ) {
			$new_columns['jeo_layer_origin'] = __( 'Origin', 'jeowp' );
		}

		return $new_columns;
	}

	/**
	 * Render the Origin column for a layer row.
	 *
	 * Textual badge only (never color-only), following the same pattern as
	 * the Maps integrity columns.
	 *
	 * @param string $column  Column slug being rendered.
	 * @param int    $post_id Current layer ID.
	 * @return void
	 */
	public function render_admin_list_columns( $column, $post_id ) {
		if ( 'jeo_layer_origin' !== $column ) {
			return;
		}

		echo 'ai' === self::resolve_layer_origin( $post_id )
			? esc_html__( 'AI-generated', 'jeowp' )
			: esc_html__( 'Manual', 'jeowp' );
	}

	/**
	 * Expose the resolved layer origin on the layer REST response (W4 4.7).
	 *
	 * Contract with the frontend: read the top-level `layer_origin` field
	 * ('ai' | 'manual') — always present, resolved with the legacy fallbacks.
	 * The raw `meta.provenance` may be absent for legacy layers.
	 *
	 * @param \WP_REST_Response $response REST response.
	 * @param \WP_Post          $post     Current post.
	 * @param \WP_REST_Request  $request  REST request.
	 * @return \WP_REST_Response
	 */
	public function expose_layer_origin( $response, $post, $request ) {
		unset( $request );

		$response->data['layer_origin'] = self::resolve_layer_origin( $post->ID );

		return $response;
	}

	/**
	 * Register the layer post type and its metadata.
	 *
	 * @return void
	 */
	public function register_post_type() {

		$labels = array(
			'name'                     => __( 'Layers', 'jeowp' ),
			'singular_name'            => __( 'Layer', 'jeowp' ),
			'add_new'                  => __( 'Add new layer', 'jeowp' ),
			'add_new_item'             => __( 'Add new layer', 'jeowp' ),
			'edit_item'                => __( 'Edit layer', 'jeowp' ),
			'new_item'                 => __( 'New layer', 'jeowp' ),
			'view_item'                => __( 'View layer', 'jeowp' ),
			'view_items'               => __( 'View layers', 'jeowp' ),
			'search_items'             => __( 'Search layers', 'jeowp' ),
			'not_found'                => __( 'No layer found', 'jeowp' ),
			'not_found_in_trash'       => __( 'No layer found in the trash', 'jeowp' ),
			'menu_name'                => __( 'Layers', 'jeowp' ),
			'item_published'           => __( 'Layer published.', 'jeowp' ),
			'item_published_privately' => __( 'Layer published privately.', 'jeowp' ),
			'item_reverted_to_draft'   => __( 'Layer reverted to draft.', 'jeowp' ),
			'item_scheduled'           => __( 'Layer scheduled.', 'jeowp' ),
			'item_updated'             => __( 'Layer updated.', 'jeowp' ),
		);

		$args = array(
			'labels'              => $labels,
			'hierarchical'        => false,
			'description'         => __( 'JEO Layers', 'jeowp' ),
			'supports'            => array( 'title', 'editor', 'excerpt', 'page-attributes', 'custom-fields' ),
			'template'            => array(
				array(
					'jeo/layer-editor',
					array(
						'align' => 'full',
						'lock'  => array(
							'move'   => true,
							'remove' => true,
						),
					),
				),
			),
			'rewrite'             => array( 'slug' => 'layers' ),
			'show_in_rest'        => true,
			'public'              => true,
			'show_in_menu'        => 'jeo-main-menu',
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Encodes a bundled local SVG into a menu-icon data URI.
			'menu_icon'           => 'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/layers.svg' ) ),
			'has_archive'         => true,
			'exclude_from_search' => true,
			'capabilities'        => array(
				'edit_post'          => 'edit_map-layer',
				'edit_posts'         => 'edit_map-layers',
				'edit_others_posts'  => 'edit_others_map-layers',

				'publish_posts'      => 'publish_map-layers',
				'read_post'          => 'read_map-layer',
				'read_private_posts' => 'read_private_map-layers',

				'delete_post'        => 'delete_map-layer',
			),
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'publicly_queryable'  => false,
			'query_var'           => false,
		);

		register_post_type( $this->post_type, $args );

		$theme_labels = array(
			'name'          => __( 'Layer Themes', 'jeowp' ),
			'singular_name' => __( 'Layer Theme', 'jeowp' ),
			'add_new_item'  => __( 'Add New Layer Theme', 'jeowp' ),
			'edit_item'     => __( 'Edit Layer Theme', 'jeowp' ),
		);

		register_taxonomy(
			'layer-theme',
			$this->post_type,
			array(
				'labels'            => $theme_labels,
				'hierarchical'      => true,
				'public'            => false,
				'show_ui'           => true,
				'show_admin_column' => true,
				'show_in_rest'      => true,
				'rewrite'           => false,
			)
		);

		$this->seed_layer_theme_terms();

		register_post_meta(
			$this->post_type,
			'type',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'The layer type', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'attribution',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'Layer attribution as text or HTML with a link', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'layer_type_options',
			array(
				'show_in_rest'  => array(
					'schema' => array(
						'properties'           => array(),
						'additionalProperties' => true,
					),
				),
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'object',
				'description'   => __( 'Layer type-specific options', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'source_url',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'The URL to download the source data of the layer', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'attribution_name',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'Label for the attribution URL link', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'legend_type',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'The legend type', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'legend_type_options',
			array(
				'show_in_rest'  => array(
					'schema' => array(
						'properties'           => array(),
						'additionalProperties' => true,
					),
				),
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'object',
				'description'   => __( 'Legend type-specific options', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'use_legend',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'boolean',
				'description'   => __( 'Use legend', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'legend_title',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'Legend title', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'default_style',
			array(
				'show_in_rest'  => array(
					'schema' => array(
						'properties'           => array(),
						'additionalProperties' => true,
					),
				),
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'object',
				'description'   => __( 'AI-suggested default style (filter/paint/layout) applied when a map layer instance sets style.use_default', 'jeowp' ),
			)
		);

		register_post_meta(
			$this->post_type,
			'provenance',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'Layer origin: "ai" for layers generated by the AI tools, "manual" for layers created by an editor. Absent on legacy layers — use the resolved `layer_origin` response field.', 'jeowp' ),
				'enum'          => array( 'ai', 'manual' ),
			)
		);
	}

	/**
	 * Seed default layer theme terms if they do not exist.
	 *
	 * @return void
	 */
	private function seed_layer_theme_terms(): void {
		$default_terms = array(
			__( 'Deforestation', 'jeowp' ),
			__( 'Hydrography', 'jeowp' ),
			__( 'Indigenous Lands', 'jeowp' ),
			__( 'Protected Areas', 'jeowp' ),
			__( 'Mining', 'jeowp' ),
			__( 'Oil and Gas', 'jeowp' ),
			__( 'Land Use', 'jeowp' ),
			__( 'Agriculture', 'jeowp' ),
			__( 'Infrastructure', 'jeowp' ),
			__( 'Administrative Boundaries', 'jeowp' ),
			__( 'Socioeconomic', 'jeowp' ),
			__( 'Biodiversity', 'jeowp' ),
			__( 'Fire', 'jeowp' ),
			__( 'Climate', 'jeowp' ),
		);

		foreach ( $default_terms as $term_name ) {
			if ( ! term_exists( $term_name, 'layer-theme' ) ) {
				wp_insert_term( $term_name, 'layer-theme' );
			}
		}
	}

	/**
	 * Keep REST metadata support enabled while hiding the legacy custom fields UI.
	 *
	 * JEO layer metadata is edited through dedicated editor sidebars. Leaving the
	 * core custom fields metabox visible can resubmit stale values after a REST
	 * editor save and overwrite the sidebar state.
	 *
	 * @return void
	 */
	public function remove_custom_fields_meta_box() {
		remove_meta_box( 'postcustom', $this->post_type, 'normal' );
	}

	/**
	 * Grant layer capabilities to supported roles.
	 *
	 * @return void
	 */
	public function add_capabilities() {
		$roles = array( 'author', 'editor', 'administrator' );
		foreach ( $roles as $role ) {
			$role_obj = get_role( $role );
			if ( ! $role_obj ) {
				continue;
			}

			$role_obj->add_cap( 'edit_map-layer' );
			$role_obj->add_cap( 'edit_map-layers' );
			$role_obj->add_cap( 'edit_others_map-layers' );

			$role_obj->add_cap( 'publish_map-layers' );
			$role_obj->add_cap( 'read_map-layer' );
			$role_obj->add_cap( 'read_private_map-layers' );

			$role_obj->add_cap( 'delete_map-layer' );
		}
	}

	/**
	 * Validate that the selected layer type exists.
	 *
	 * @param string $meta_value Layer type slug.
	 * @return true|\WP_Error
	 */
	public function validate_meta_type( $meta_value ) {
		if ( ! \jeo_layer_types()->is_layer_type_registered( $meta_value ) ) {
			return new \WP_Error( 'rest_invalid_field', __( 'Layer type not registered', 'jeowp' ), array( 'status' => 400 ) );
		}

		return true;
	}
}
