<?php

namespace Jeo;

class Maps {

	use Singleton;
	use Rest_Validate_Meta;

	public $post_type = 'map';

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
		$this->register_rest_meta_validation();

	}

	public function register_post_type() {

		$labels = array(
			'name' => __('Maps', 'jeo'),
			'singular_name' => __('Map', 'jeo'),
			'add_new' => __('Add new map', 'jeo'),
			'add_new_item' => __('Add new map', 'jeo'),
			'edit_item' => __('Edit map', 'jeo'),
			'new_item' => __('New map', 'jeo'),
			'view_item' => __('View map', 'jeo'),
			'search_items' => __('Search maps', 'jeo'),
			'not_found' => __('No map found', 'jeo'),
			'not_found_in_trash' => __('No map found in the trash', 'jeo'),
			'menu_name' => __('Maps', 'jeo')
		);

		$args = array(
			'labels' => $labels,
			'hierarchical' => true,
			'description' => __('JEO Maps', 'jeo'),
			'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields'),
			'rewrite' => array('slug' => 'maps'),
			'public' => true,
			'show_in_menu' => true,
			'show_in_rest' => true,
			'menu_position' => 4,
			'menu_icon' => 'dashicons-location-alt',
			'has_archive' => true,
			'exclude_from_search' => true,
			'capability_type' => 'page'
		);

		register_post_type($this->post_type, $args);

		register_post_meta($this->post_type, 'initial_zoom', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'sanitize_callback' => [$this, 'sanitize_meta_initial_zoom'],
			'type' => 'number',
			'description' => __('The map initial zoom level', 'jeo')
		]);

		register_post_meta($this->post_type, 'center_lat', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'string',
			'description' => __('The map initial latitude', 'jeo')
		]);

		register_post_meta($this->post_type, 'center_lon', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'string',
			'description' => __('The map initial longitude', 'jeo')
		]);

		register_post_meta($this->post_type, 'layers', [
			'show_in_rest'  => array(
				'schema' => array(
					'items' => [
						'type' => 'object',
						'properties' => [
							'id' => [
								'description' => __('The Layer ID', 'jeo'),
								'type' => 'integer'
							],
							'use' => [
								'description' => __('How this layer is used in this map. Can be fixed, switchable or swappable', 'jeo'),
								'type' => 'string'
							],
							'default' => [
								'description' => __('Indicates whether this layer is visible by default', 'jeo'),
								'type' => 'boolean'
							]
						],
						'required' => [ 'id', 'use' ]
					],

				),
			),
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'array',
			'description' => __('The map Layers', 'jeo')
		]);

		register_post_meta($this->post_type, 'related_posts', [
			'show_in_rest' => [
				'schema' => [
					'properties' => [
						'cat' => [
							'description' => __('List of category IDs related posts must have', 'jeo'),
							'type' => 'array',
							'items' => [
								'type' => 'integer'
							]
						]
					]
				]

			],
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'object',
			'description' => __('The map criteria to get related posts', 'jeo')
		]);

		register_post_meta($this->post_type, 'disable_scroll_zoom', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'boolean',
			'description' => __('Disable scroll zoom', 'jeo')
		]);

		register_post_meta($this->post_type, 'max_bounds_sw', [
			'show_in_rest' => [
				'schema' => [
					'items' => [
						'type' => 'string'
					]
				]
			],
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'array',
			'description' => __('Southwest coordinates pan limit', 'jeo')
		]);

		register_post_meta($this->post_type, 'max_bounds_ne', [
			'show_in_rest' => [
				'schema' => [
					'items' => [
						'type' => 'string'
					]
				]
			],
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'array',
			'description' => __('Northeast coordinates pan limit', 'jeo')
		]);

		register_post_meta($this->post_type, 'min_zoom', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'integer',
			'description' => __('Minimum Zoom level', 'jeo')
		]);

		register_post_meta($this->post_type, 'max_zoom', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'type' => 'integer',
			'description' => __('Maximum zoom level', 'jeo')
		]);


	}

	public function sanitize_meta_center($meta_value, $meta_key, $object_type, $object_subtype) {
		return intval($meta_value);
	}

	public function sanitize_meta_initial_zoom($meta_value, $meta_key, $object_type, $object_subtype) {
		return intval($meta_value);
	}

	/**
	 * Validates the zoom metadata value
	 * @param  mixed $value The value to be validated
	 * @return void|\WP_Error Returns a \WP_Error object in case the value is invalid
	 */
	public function validate_meta_initial_zoom($value) {
		// WordPress is already validating if it is a number

		$val = intval($value);
		if ( $val < 1 || $val > 14 ) {
			return new \WP_Error( 'rest_invalid_field', __( 'Map zoom must be between 1 and 14', 'jeo' ), array( 'status' => 400 ) );
		}

	}


}
