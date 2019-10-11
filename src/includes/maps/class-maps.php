<?php

namespace Jeo;

class Maps {

	use Singleton;

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
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

		register_post_type('map', $args);

		register_post_meta('map', 'zoom', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'sanitize_callback' => [$this, 'sanitize_meta_center'],
			'type' => 'string',
			'description' => __('The map initial zoom level', 'jeo')
		]);



	}
	
	public function sanitize_meta_center($meta_value, $meta_key, $object_type, $object_subtype) {
		return intval($meta_value);
	}

}
