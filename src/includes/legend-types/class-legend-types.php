<?php
/**
 * Legend-type registry and assets.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Register available legend types and their assets.
 */
class Legend_Types {

	use Singleton;

	/**
	 * Registered legend types keyed by slug.
	 *
	 * @var array
	 */
	private $registered_legend_types = array();

	/**
	 * Register hooks for legend-type assets.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_print_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Registers all core legend types and fires the hook for
	 * external legend types to be registered.
	 *
	 * @return void
	 */
	private function register_legend_types() {

		$this->register_legend_type(
			'barscale',
			array(
				'script_url' => JEO_BASEURL . '/includes/legend-types/barscale.js',
			)
		);

		$this->register_legend_type(
			'simple-color',
			array(
				'script_url' => JEO_BASEURL . '/includes/legend-types/simple-color.js',
			)
		);

		$this->register_legend_type(
			'icons',
			array(
				'script_url' => JEO_BASEURL . '/includes/legend-types/icons.js',
			)
		);

		$this->register_legend_type(
			'circles',
			array(
				'script_url' => JEO_BASEURL . '/includes/legend-types/circles.js',
			)
		);

		/**
		 * Hook used to register legend types.
		 *
		 * Example:
		 * add_action('jeo_register_legend_types', function($legend_types) {
		 *      $legend_types->register_legend_type('my-legend-type', [ 'script_url' => 'http://url.to/legendtype.js' ] );
		 * });
		 *
		 * @param Jeo\Legend_Types $legend_types The Legend_Types instance.
		 */
		do_action( 'jeo_register_legend_types', $this );
	}

	/**
	 * Register a legend type.
	 *
	 * @param string $slug A unique slug for the legend type. e.g. 'example-legend-type'.
	 * @param array  $options {
	 *     Required. Array of arguments describing the legend type.
	 *
	 *     @type string $script_url   Full URL to the legend type JavaScript file.
	 *     @type array  $dependencies Script handles that should be loaded first.
	 * }
	 * @return bool
	 */
	public function register_legend_type( $slug, $options ) {

		if ( ! is_array( $options ) || ! isset( $options['script_url'] ) ) {
			return false;
		}

		$this->registered_legend_types[ $slug ] = $options;

		return true;
	}

	/**
	 * Remove a registered legend type.
	 *
	 * @param string $legend_type_slug Legend type slug.
	 * @return void
	 */
	public function unregister_legend_type( $legend_type_slug ) {
		unset( $this->registered_legend_types[ $legend_type_slug ] );
	}

	/**
	 * Return the current legend-type registry.
	 *
	 * @return array
	 */
	public function get_registered_legend_types() {
		if ( empty( $this->registered_legend_types ) ) {
			$this->register_legend_types();
		}

		return $this->registered_legend_types;
	}

	/**
	 * Return a single legend type definition.
	 *
	 * @param string $legend_type_slug Legend type slug.
	 * @return array|null
	 */
	public function get_legend_type( $legend_type_slug ) {
		$legend_types = $this->get_registered_legend_types();
		if ( isset( $legend_types[ $legend_type_slug ] ) ) {
			return $legend_types[ $legend_type_slug ];
		}
		return null;
	}

	/**
	 * Check whether a legend type is registered.
	 *
	 * @param string $legend_type_slug Legend type slug.
	 * @return bool
	 */
	public function is_legend_type_registered( $legend_type_slug ) {
		return ! \is_null( $this->get_legend_type( $legend_type_slug ) );
	}

	/**
	 * Register shared legend scripts.
	 *
	 * @return void
	 */
	public function register_assets() {
		$asset_file = include JEO_BASEPATH . '/js/build/JeoLegend.asset.php';
		wp_register_script(
			'jeo-legend',
			JEO_BASEURL . '/js/build/JeoLegend.js',
			array( 'mapgl' ),
			$asset_file['version'],
			true,
		);

		wp_set_script_translations( 'jeo-legend', 'jeo', JEO_BASEPATH . 'languages' );

		foreach ( $this->get_registered_legend_types() as $slug => $legend_type ) {
			$deps = isset( $legend_type['dependencies'] ) ? $legend_type['dependencies'] : array();
			$deps = array_merge( array( 'jeo-legend', 'wp-i18n' ), $deps );

			wp_register_script(
				'legend-type-' . $slug,
				$legend_type['script_url'],
				$deps,
				JEO_VERSION,
				true
			);

			wp_set_script_translations( 'legend-type-' . $slug, 'jeo', JEO_BASEPATH . 'languages' );
		}
	}

	/**
	 * Enqueue scripts for all registered legend types.
	 *
	 * @return void
	 */
	public function enqueue_scripts() {
		// TODO: Load only when needed.
		if ( ! $this->should_load_assets() ) {
			return;
		}

		foreach ( array_keys( $this->get_registered_legend_types() ) as $slug ) {
			wp_enqueue_script( 'legend-type-' . $slug );
		}
	}

	/**
	 * Get all registered legend type script handles.
	 *
	 * @return array
	 */
	public function get_registered_script_handles() {
		return array_map(
			static function ( $slug ) {
				return 'legend-type-' . $slug;
			},
			array_keys( $this->get_registered_legend_types() )
		);
	}
}
