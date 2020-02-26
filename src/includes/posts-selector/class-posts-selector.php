<?php

namespace Jeo;

class Posts_Selector {

	use Singleton;

	protected function init() {
		add_action('admin_init', [$this, 'load_assets']);
	}

	public function load_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';

		wp_enqueue_script(
			'jeo-posts-selector',
			JEO_BASEURL . '/js/build/postsSelector.js',
			$asset_file['dependencies'],
			$asset_file['version']
		);
	}
}
