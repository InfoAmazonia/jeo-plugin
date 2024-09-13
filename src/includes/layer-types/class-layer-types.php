<?php

namespace Jeo;

class Layer_Types {

	use Singleton;

	private $registered_layer_types = [];

	protected function init() {
		add_action('init', [$this, 'register_assets'] );
		add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts'] );
		add_action('admin_print_scripts', [$this, 'enqueue_scripts'] );
	}

	/**
	 * Registers all core layer_types and fires the hook for
	 * extenals layer_types to be registered
	 *
	 * @return void
	 */
	private function _register_layer_types() {

		$this->register_layer_type(
			'mapbox',
			[
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox.js'
			]
		);

		$this->register_layer_type(
			'tilelayer',
			[
				'script_url' => JEO_BASEURL . '/includes/layer-types/tilelayer.js'
			]
		);

		$this->register_layer_type(
			'mvt',
			[
				'script_url' => JEO_BASEURL . '/includes/layer-types/mvt.js'
			]
		);

		$this->register_layer_type(
			'mapbox-tileset-raster',
			[
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox-tileset-raster.js'
			]
		);

		$this->register_layer_type(
			'mapbox-tileset-vector',
			[
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox-tileset-vector.js'
			]
		);

		/**
		 * Hook used to register layer_types
		 *
		 * example:
		 * add_action('jeo_register_layer_types', function($layer_types) {
		 * 		$layer_types->register_layer_type('my-layer-type', [ 'script_url' => 'http://url.to/layertype.js' ] );
		 * });
		 *
		 * @param Jeo\Geocode_Handler The Geocode_Handler instance
		 */
		do_action('jeo_register_layer_types', $this);

	}

	/**
	 * Register layer_type
	 *
	 * @param string $slug A unique slug for the layer_type. e.g. 'example-layer_type'
	 * @param array $options {
	 *     Required. Array or string of arguments describing the layer_type
	 * 	   @type string		 $script_url			Full URL to the layer type javascript file
	 * 	   @type array 		 $dependencies 			List of scripts handles, registered using @see \wp_register_script() that should be loaded as dependencies to the layer type main script
	 * }
	 */
	public function register_layer_type($slug, $options) {

		if (!is_array($options) || !isset($options['script_url'])) {
			return false;
		}

		$this->registered_layer_types[$slug] = $options;

		return true;
	}

	public function unregister_layer_type($layer_type_slug) {
		unset($this->registered_layer_types[$layer_type_slug]);
	}

	public function get_registered_layer_types() {
		if ( empty($this->registered_layer_types) ) {
			$this->_register_layer_types();
		}

		return $this->registered_layer_types;
	}

	public function get_layer_type($layer_type_slug) {
		$layer_types = $this->get_registered_layer_types();
		if (isset($layer_types[$layer_type_slug])) {
			return $layer_types[$layer_type_slug];
		}
		return null;
	}

	public function is_layer_type_registered($layer_type_slug) {
		return ! \is_null( $this->get_layer_type($layer_type_slug) );
	}

	public function register_assets() {
		$asset_file = include( JEO_BASEPATH . '/js/build/JeoLayer.asset.php');
		wp_register_script(
			'jeo-layer',
			JEO_BASEURL . '/js/build/JeoLayer.js',
			['mapboxgl-loader'],
			$asset_file['version']
		);

		wp_set_script_translations('jeo-layer', 'jeo', plugin_dir_path(  dirname( __FILE__ , 2 ) ) . 'languages');

	}

	public function enqueue_scripts() {
		// TODO: load only when needed (non-generic way)
		if(!$this->should_load_assets()) {
			return;
		}

		foreach ( $this->get_registered_layer_types() as $slug => $layer_type ) {
			$deps = isset( $layer_type['dependencies'] ) ? $layer_type['dependencies'] : [];
			$deps = array_merge( ['jeo-layer'], $deps );
			wp_enqueue_script( 'layer-type-' . $slug, $layer_type['script_url'], $deps, JEO_VERSION );
			wp_set_script_translations('layer-type-' . $slug, 'jeo', plugin_dir_path(  dirname( __FILE__ , 2 ) ) . 'languages');
		}

	}
}
