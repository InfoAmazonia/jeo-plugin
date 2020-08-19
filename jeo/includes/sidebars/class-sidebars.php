<?php

namespace Jeo;

class Sidebars {

	use Singleton;

	protected function init() {
		add_action('admin_init', [$this, 'load_assets']);
		add_action('rest_post_query', [$this, 'rest_post_query'], 10, 2);
	}

	public function rest_post_query($args, $request) {
		if ($request['meta_query']) {
			$args['meta_query'] = $request['meta_query'];
		}

		return $args;
	}

	public function load_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';

		wp_enqueue_script(
			'jeo-layers-sidebar',
			JEO_BASEURL . '/js/build/layersSidebar.js',
			array_merge($asset_file['dependencies'], ['mapboxgl-loader']),
			$asset_file['version']
		);

		wp_enqueue_script(
			'jeo-maps-sidebar',
			JEO_BASEURL . '/js/build/mapsSidebar.js',
			array_merge($asset_file['dependencies'], ['mapboxgl-loader']),
			$asset_file['version']
		);
	}
}
