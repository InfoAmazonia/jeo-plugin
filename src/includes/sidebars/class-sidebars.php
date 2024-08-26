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

		wp_enqueue_style( 'jeo-layers-sidebar', JEO_BASEURL . '/js/build/layersSidebar.css' );
		wp_enqueue_script(
			'jeo-layers-sidebar',
			JEO_BASEURL . '/js/build/layersSidebar.js',
			array_merge($asset_file['dependencies'], ['mapboxgl-loader']),
			$asset_file['version']
		);

		wp_set_script_translations( 'jeo-layers-sidebar', 'jeo', plugin_dir_path(  dirname( __FILE__ , 2 ) ) . 'languages' );


		wp_localize_script(
			'jeo-layers-sidebar',
			'jeo_private_options',
			array(
				'mapbox_private_key' => sanitize_text_field( \jeo_settings()->get_option( 'mapbox_private_key' )),
			)
		);

		wp_localize_script(
			'jeo-layers-sidebar',
			'carto_options',
			array(
				'carto_username' => sanitize_text_field( \jeo_settings()->get_option( 'carto_username' )),
				'carto_key' => sanitize_text_field( \jeo_settings()->get_option( 'carto_key' )),
			)
		);

		wp_enqueue_style( 'jeo-maps-sidebar', JEO_BASEURL . '/js/build/mapsSidebar.css' );
		wp_enqueue_script(
			'jeo-maps-sidebar',
			JEO_BASEURL . '/js/build/mapsSidebar.js',
			array_merge($asset_file['dependencies'], ['mapboxgl-loader']),
			$asset_file['version']
		);

		wp_set_script_translations( 'jeo-maps-sidebar', 'jeo', plugin_dir_path(  dirname( __FILE__ , 2 ) ) . 'languages' );

	}
}
