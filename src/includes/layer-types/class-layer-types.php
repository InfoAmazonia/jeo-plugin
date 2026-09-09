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
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_iframe_assets' ) );
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
				'is_style'   => true,
			)
		);

		$this->register_layer_type(
			'style-json',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/style-json.js',
				'is_style'   => true,
			)
		);

		$this->register_layer_type(
			'tilelayer',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/tilelayer.js',
			)
		);

		$this->register_layer_type(
			'geojson',
			array(
				'script_url' => JEO_BASEURL . '/includes/layer-types/geojson.js',
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
	 *     @type bool   $is_style     Whether the type loads a whole map style
	 *                                (rendered as the map's base style instead of
	 *                                individual GL layers). Default false.
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
	 * Check whether a layer type loads a whole map style.
	 *
	 * Style layer types (e.g. 'mapbox', 'style-json') are rendered as the map's
	 * base style instead of being added as individual GL layers. This drives the
	 * editor style hoisting, the frontend base-style handling, and the composer
	 * bundle eligibility.
	 *
	 * @param string $layer_type_slug Layer type slug.
	 * @return bool
	 */
	public function is_style( $layer_type_slug ) {
		$definition = $this->get_layer_type( $layer_type_slug );
		$is_style   = ! empty( $definition['is_style'] );

		/**
		 * Filter whether a layer type loads a whole map style.
		 *
		 * Allows layer types registered outside the PHP registry (e.g. JS-only
		 * types) to opt into style-type behavior.
		 *
		 * @param bool   $is_style Whether the layer type is a style type.
		 * @param string $layer_type_slug Layer type slug.
		 */
		return (bool) apply_filters( 'jeo_layer_type_is_style', $is_style, $layer_type_slug );
	}

	/**
	 * Register shared layer scripts.
	 *
	 * @return void
	 */
	public function register_assets() {
		$asset_file = require JEO_BASEPATH . '/js/build/JeoLayer.asset.php';
		wp_register_script(
			'jeo-layer',
			JEO_BASEURL . '/js/build/JeoLayer.js',
			array_merge( $asset_file['dependencies'], array( 'mapgl' ) ),
			$asset_file['version'],
			true,
		);

		wp_set_script_translations( 'jeo-layer', 'jeowp', JEO_BASEPATH . 'languages' );

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

			wp_set_script_translations( 'layer-type-' . $slug, 'jeowp', JEO_BASEPATH . 'languages' );
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

	/**
	 * Enqueue the layer-type registry inside the block-editor iframe.
	 *
	 * Block API v3 renders the editor content in an iframe, which does not
	 * inherit scripts printed by admin_print_scripts in the parent document.
	 * Editor bundles running inside the iframe (block previews, layer CPT
	 * schema forms) need the registry for style-type metadata (`isStyle`,
	 * `getSchema`, `getStyleUrl`) — e.g. `map-blocks/use-style-layer.js` and
	 * `layers-sidebar/layer-type-definitions.js::getEditorLayerTypeSchema`.
	 *
	 * Enqueueing `jeo-layer` also pulls the `mapgl` script, which carries the
	 * `jeo_settings` localization used by the layer-type renderers.
	 *
	 * @return void
	 */
	public function enqueue_iframe_assets() {
		if ( ! is_admin() || ! $this->should_load_assets() ) {
			return;
		}

		wp_enqueue_script( 'jeo-layer' );

		foreach ( $this->get_layer_type_script_handles() as $handle ) {
			wp_enqueue_script( $handle );
		}
	}
}
