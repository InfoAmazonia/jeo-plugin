<?php
/**
 * Layer-type registry and assets.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register available layer types and their assets.
 */
class Layer_Types {

	use Singleton;

	/**
	 * Registered layer types keyed by slug.
	 *
	 * @var array
	 */
	private $registered_layer_types = array();

	/**
	 * Register hooks for layer-type assets.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_print_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Registers all core layer types and fires the hook for
	 * external layer types to be registered.
	 *
	 * @return void
	 */
	private function register_layer_types() {

		$this->register_layer_type(
			'mapbox',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox.js',
			)
		);

		$this->register_layer_type(
			'tilelayer',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/tilelayer.js',
			)
		);

		$this->register_layer_type(
			'mvt',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/mvt.js',
			)
		);

		$this->register_layer_type(
			'mapbox-tileset-raster',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox-tileset-raster.js',
			)
		);

		$this->register_layer_type(
			'mapbox-tileset-vector',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/mapbox-tileset-vector.js',
			)
		);

		/**
		 * Hook used to register layer types.
		 *
		 * Example:
		 * add_action('jeo_register_layer_types', function($layer_types) {
		 *      $layer_types->register_layer_type('my-layer-type', [ 'script_url' => 'http://url.to/layertype.js' ] );
		 * });
		 *
		 * @param Jeo\Layer_Types $layer_types The Layer_Types instance.
		 */
		do_action( 'jeo_register_layer_types', $this );
	}

	/**
	 * Register a layer type.
	 *
	 * @param string $slug A unique slug for the layer type. e.g. 'example-layer-type'.
	 * @param array  $options {
	 *     Required. Array of arguments describing the layer type.
	 *
	 *     @type string $script_url   Full URL to the layer type JavaScript file.
	 *     @type array  $dependencies Script handles that should be loaded first.
	 * }
	 * @return bool
	 */
	public function register_layer_type( $slug, $options ) {

		if ( ! is_array( $options ) || ! isset( $options['script_url'] ) ) {
			return false;
		}

		$this->registered_layer_types[ $slug ] = $options;

		return true;
	}

	/**
	 * Remove a registered layer type.
	 *
	 * @param string $layer_type_slug Layer type slug.
	 * @return void
	 */
	public function unregister_layer_type( $layer_type_slug ) {
		unset( $this->registered_layer_types[ $layer_type_slug ] );
	}

	/**
	 * Return the current layer-type registry.
	 *
	 * @return array
	 */
	public function get_registered_layer_types() {
		if ( empty( $this->registered_layer_types ) ) {
			$this->register_layer_types();
		}

		return $this->registered_layer_types;
	}

	/**
	 * Return a single layer type definition.
	 *
	 * @param string $layer_type_slug Layer type slug.
	 * @return array|null
	 */
	public function get_layer_type( $layer_type_slug ) {
		$layer_types = $this->get_registered_layer_types();
		if ( isset( $layer_types[ $layer_type_slug ] ) ) {
			return $layer_types[ $layer_type_slug ];
		}
		return null;
	}

	/**
	 * Check whether a layer type is registered.
	 *
	 * @param string $layer_type_slug Layer type slug.
	 * @return bool
	 */
	public function is_layer_type_registered( $layer_type_slug ) {
		return ! \is_null( $this->get_layer_type( $layer_type_slug ) );
	}

	/**
	 * Register shared layer scripts.
	 *
	 * @return void
	 */
	public function register_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/JeoLayer.asset.php';
		wp_register_script(
			'jeo-layer',
			JEO_BASEURL . '/js/build/JeoLayer.js',
			array( 'mapgl' ),
			$asset_file['version'],
			true,
		);

		wp_set_script_translations( 'jeo-layer', 'jeo', JEO_BASEPATH . 'languages' );

		foreach ( $this->get_registered_layer_types() as $slug => $layer_type ) {
			$deps = isset( $layer_type['dependencies'] ) ? $layer_type['dependencies'] : array();
			$deps = array_merge( array( 'jeo-layer', 'wp-i18n' ), $deps );

			wp_register_script(
				'layer-type-' . $slug,
				$layer_type['script_url'],
				$deps,
				JEO_VERSION,
				true,
			);

			wp_set_script_translations( 'layer-type-' . $slug, 'jeo', JEO_BASEPATH . 'languages' );
		}
	}

	/**
	 * Return the script handles for the registered layer types.
	 *
	 * @return array
	 */
	public function get_layer_type_script_handles() {
		return array_map(
			function ( $slug ) {
				return 'layer-type-' . $slug;
			},
			array_keys( $this->get_registered_layer_types() )
		);
	}

	/**
	 * Enqueue scripts for all registered layer types.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		// TODO: Load only when needed via a more specific condition.
		if ( ! $this->should_load_assets() ) {
			return;
		}

		foreach ( $this->get_layer_type_script_handles() as $handle ) {
			wp_enqueue_script( $handle );
		}
	}
}
