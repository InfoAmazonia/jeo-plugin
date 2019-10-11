<?php

namespace Jeo;

class Layers {

	use Singleton;

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
			'supports' => array('title'),
			'rewrite' => array('slug' => 'layers'),
			'show_in_rest' => true,
			'public' => true,
			'show_in_menu' => false,
			'has_archive' => true,
			'exclude_from_search' => true,
			'capability_type' => 'page'
		);

		register_post_type('map-layer', $args);

	}

}
