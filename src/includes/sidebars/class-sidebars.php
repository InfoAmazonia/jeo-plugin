<?php
/**
 * Sidebar asset bootstrap.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Register editor sidebar assets and REST helpers.
 */
class Sidebars {

	use Singleton;

	/**
	 * Register sidebar hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'admin_init', array( $this, 'load_assets' ) );
		add_action( 'rest_post_query', array( $this, 'rest_post_query' ), 10, 2 );
	}

	/**
	 * Allow meta_query arguments in sidebar REST post requests.
	 *
	 * @param array            $args REST query arguments.
	 * @param \WP_REST_Request $request REST request.
	 * @return array
	 */
	public function rest_post_query( $args, $request ) {
		if ( $request['meta_query'] ) {
			$args['meta_query'] = $request['meta_query'];
		}

		return $args;
	}

	/**
	 * Load the editor sidebar assets.
	 *
	 * @return void
	 */
	public function load_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/postsSidebar.asset.php';

		wp_enqueue_style( 'jeo-layers-sidebar', JEO_BASEURL . '/js/build/layersSidebar.css', array( 'mapgl' ), JEO_VERSION );
		wp_enqueue_script(
			'jeo-layers-sidebar',
			JEO_BASEURL . '/js/build/layersSidebar.js',
			array_merge( $asset_file['dependencies'] ?? array(), array( 'mapgl-react' ) ),
			$asset_file['version'],
			true
		);

		wp_set_script_translations( 'jeo-layers-sidebar', 'jeo', JEO_BASEPATH . 'languages' );

		wp_enqueue_style( 'jeo-maps-sidebar', JEO_BASEURL . '/js/build/mapsSidebar.css', array( 'mapgl' ), JEO_VERSION );
		wp_enqueue_script(
			'jeo-maps-sidebar',
			JEO_BASEURL . '/js/build/mapsSidebar.js',
			array_merge( $asset_file['dependencies'] ?? array(), array( 'mapgl-react' ) ),
			$asset_file['version'],
			true
		);

		wp_set_script_translations( 'jeo-maps-sidebar', 'jeo', JEO_BASEPATH . 'languages' );
	}
}
