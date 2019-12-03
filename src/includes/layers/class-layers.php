<?php

namespace Jeo;

class Layers {

	use Singleton;
	use Rest_Validate_Meta;
	public $post_type = 'map-layer';

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
	}

	public function register_post_type() {

		$labels = array(
			'name' => __('Layers', 'jeo'),
			'singular_name' => __('Layer', 'jeo'),
			'add_new' => __('Add new layer', 'jeo'),
			'add_new_item' => __('Add new layer', 'jeo'),
			'edit_item' => __('Edit layer', 'jeo'),
			'new_item' => __('New layer', 'jeo'),
			'view_item' => __('View layer', 'jeo'),
			'search_items' => __('Search layers', 'jeo'),
			'not_found' => __('No layer found', 'jeo'),
			'not_found_in_trash' => __('No layer found in the trash', 'jeo'),
			'menu_name' => __('Layers', 'jeo')
		);

		$args = array(
			'labels' => $labels,
			'hierarchical' => true,
			'description' => __('JEO Layers', 'jeo'),
			'supports' => array('title', 'custom-fields'),
			'rewrite' => array('slug' => 'layers'),
			'show_in_rest' => true,
			'public' => true,
			'show_in_menu' => false,
			'has_archive' => true,
			'exclude_from_search' => true,
			'capability_type' => 'page'
		);

		register_post_type($this->post_type, $args);

		register_post_meta($this->post_type, 'type', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'sanitize_callback' => [$this, 'sanitize_meta_type'],
			'type' => 'string',
			'description' => __('The layer type', 'jeo')
		]);

		register_post_meta($this->post_type, 'url', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => '__return_true',
			'sanitize_callback' => [$this, 'sanitize_url'],
			'type' => 'string',
			'description' => __('The layer url', 'jeo')
		]);
	}

	public function sanitize_meta_type($meta_value, $meta_key, $object_type, $object_subtype) {
		// @TODO: use a layer type registry
		return in_array($meta_value, ['mapbox']);
	}

	public function sanitize_meta_url($meta_value, $meta_key, $object_type, $object_subtype) {
		return filter_var($meta_value, FILTER_VALIDATE_URL, FILTER_FLAG_SCHEME_REQUIRED);
	}

}
