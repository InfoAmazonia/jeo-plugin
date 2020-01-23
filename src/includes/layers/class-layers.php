<?php

namespace Jeo;

class Layers {

	use Singleton;
	use Rest_Validate_Meta;
	public $post_type = 'map-layer';

	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		$this->register_rest_meta_validation();
	}

	public function register_post_type() {

		$labels = array(
			'name'               => __( 'Layers', 'jeo' ),
			'singular_name'      => __( 'Layer', 'jeo' ),
			'add_new'            => __( 'Add new layer', 'jeo' ),
			'add_new_item'       => __( 'Add new layer', 'jeo' ),
			'edit_item'          => __( 'Edit layer', 'jeo' ),
			'new_item'           => __( 'New layer', 'jeo' ),
			'view_item'          => __( 'View layer', 'jeo' ),
			'search_items'       => __( 'Search layers', 'jeo' ),
			'not_found'          => __( 'No layer found', 'jeo' ),
			'not_found_in_trash' => __( 'No layer found in the trash', 'jeo' ),
			'menu_name'          => __( 'Layers', 'jeo' ),
		);

		$args = array(
			'labels'              => $labels,
			'hierarchical'        => true,
			'description'         => __( 'JEO Layers', 'jeo' ),
			'supports'            => array( 'title', 'custom-fields' ),
			'rewrite'             => array( 'slug' => 'layers' ),
			'show_in_rest'        => true,
			'public'              => true,
			'show_in_menu'        => true,
			'has_archive'         => true,
			'exclude_from_search' => true,
			'capability_type'     => 'page',
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
				'description'   => __( 'The layer attribution. A text or HTML code with a link', 'jeo' ),
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
	}

	public function validate_meta_type( $meta_value ) {
		if ( ! \jeo_layer_types()->is_layer_type_registered( $meta_value ) ) {
			return new \WP_Error( 'rest_invalid_field', __( 'Layer type not registered', 'jeo' ), array( 'status' => 400 ) );
		}
		return true;
	}

}
