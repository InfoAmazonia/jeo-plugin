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
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_action( 'admin_init', array( $this, 'add_capabilities' ) );
		add_filter( "rest_{$this->post_type}_collection_params", array( $this, 'rest_collection_params' ) );
		$this->register_rest_meta_validation();
	}

	/**
	 * Register the layer post type and its metadata.
	 *
	 * @return void
	 */
	public function register_post_type() {

		$labels = array(
			'name'                     => __( 'Layers', 'jeo' ),
			'singular_name'            => __( 'Layer', 'jeo' ),
			'add_new'                  => __( 'Add new layer', 'jeo' ),
			'add_new_item'             => __( 'Add new layer', 'jeo' ),
			'edit_item'                => __( 'Edit layer', 'jeo' ),
			'new_item'                 => __( 'New layer', 'jeo' ),
			'view_item'                => __( 'View layer', 'jeo' ),
			'view_items'               => __( 'View layers', 'jeo' ),
			'search_items'             => __( 'Search layers', 'jeo' ),
			'not_found'                => __( 'No layer found', 'jeo' ),
			'not_found_in_trash'       => __( 'No layer found in the trash', 'jeo' ),
			'menu_name'                => __( 'Layers', 'jeo' ),
			'item_published'           => __( 'Layer published.', 'jeo' ),
			'item_published_privately' => __( 'Layer published privately.', 'jeo' ),
			'item_reverted_to_draft'   => __( 'Layer reverted to draft.', 'jeo' ),
			'item_scheduled'           => __( 'Layer scheduled.', 'jeo' ),
			'item_updated'             => __( 'Layer updated.', 'jeo' ),
		);

		$args = array(
			'labels'              => $labels,
			'hierarchical'        => true,
			'description'         => __( 'JEO Layers', 'jeo' ),
			'supports'            => array( 'title', 'editor', 'page-attributes', 'custom-fields' ),
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

		register_post_meta(
			$this->post_type,
			'type',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'auth_callback' => '__return_true',
				'type'          => 'string',
				'description'   => __( 'The layer type', 'jeo' ),
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
				'description'   => __( 'Layer attribution as text or HTML with a link', 'jeo' ),
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
				'description'   => __( 'Layer type-specific options', 'jeo' ),
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
				'description'   => __( 'The URL to download the source data of the layer', 'jeo' ),
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
				'description'   => __( 'Label for the attribution URL link', 'jeo' ),
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
				'description'   => __( 'The legend type', 'jeo' ),
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
				'description'   => __( 'Legend type-specific options', 'jeo' ),
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
				'description'   => __( 'Use legend', 'jeo' ),
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
				'description'   => __( 'Legend title', 'jeo' ),
			)
		);
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
	 * Relax the REST per_page limit for layers.
	 *
	 * @param array $params REST collection params.
	 * @return array
	 */
	public function rest_collection_params( $params ) {
		$params['per_page']['minimum'] = -1;
		unset( $params['per_page']['maximum'] );
		return $params;
	}

	/**
	 * Validate that the selected layer type exists.
	 *
	 * @param string $meta_value Layer type slug.
	 * @return true|\WP_Error
	 */
	public function validate_meta_type( $meta_value ) {
		if ( ! \jeo_layer_types()->is_layer_type_registered( $meta_value ) ) {
			return new \WP_Error( 'rest_invalid_field', __( 'Layer type not registered', 'jeo' ), array( 'status' => 400 ) );
		}

		return true;
	}
}
