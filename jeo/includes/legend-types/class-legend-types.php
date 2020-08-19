<?php

namespace Jeo;

class Legend_Types {

	use Singleton;

	private $registered_legend_types = [];

	protected function init() {
		add_action('init', [$this, 'register_assets'] );
		add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts'] );
		add_action('admin_print_scripts', [$this, 'enqueue_scripts'] );
	}

	/**
	 * Registers all core legend_types and fires the hook for
	 * extenals legend_types to be registered
	 *
	 * @return void
	 */
	private function _register_legend_types() {

		$this->register_legend_type(
			'barscale',
			[
				'script_url' => JEO_BASEURL . '/includes/legend-types/barscale.js'
			]
		);

		$this->register_legend_type(
			'simple-color',
			[
				'script_url' => JEO_BASEURL . '/includes/legend-types/simple-color.js'
			]
		);

		$this->register_legend_type(
			'icons',
			[
				'script_url' => JEO_BASEURL . '/includes/legend-types/icons.js'
			]
		);

		$this->register_legend_type(
			'circles',
			[
				'script_url' => JEO_BASEURL . '/includes/legend-types/circles.js'
			]
		);

		/**
		 * Hook used to register legend_types
		 *
		 * example:
		 * add_action('jeo_register_legend_types', function($legend_types) {
		 * 		$legend_types->register_legend_type('my-legend-type', [ 'script_url' => 'http://url.to/legendtype.js' ] );
		 * });
		 *
		 * @param Jeo\Geocode_Handler The Geocode_Handler instance
		 */
		do_action('jeo_register_legend_types', $this);

	}

	/**
	 * Register legend_type
	 *
	 * @param string $slug A unique slug for the legend_type. e.g. 'example-legend_type'
	 * @param array $options {
	 *     Required. Array or string of arguments describing the legend_type
	 * 	   @type string		 $script_url			Full URL to the legend type javascript file
	 * 	   @type array 		 $dependencies 			List of scripts handles, registered using @see \wp_register_script() that should be loaded as dependecies to the legend type main script
	 * }
	 */
	public function register_legend_type($slug, $options) {

		if (!is_array($options) || !isset($options['script_url'])) {
			return false;
		}

		$this->registered_legend_types[$slug] = $options;

		return true;
	}

	public function unregister_legend_type($legend_type_slug) {
		unset($this->registered_legend_types[$legend_type_slug]);
	}

	public function get_registered_legend_types() {
		if ( empty($this->registered_legend_types) ) {
			$this->_register_legend_types();
		}

		return $this->registered_legend_types;
	}

	public function get_legend_type($legend_type_slug) {
		$legend_types = $this->get_registered_legend_types();
		if (isset($legend_types[$legend_type_slug])) {
			return $legend_types[$legend_type_slug];
		}
		return null;
	}

	public function is_legend_type_registered($legend_type_slug) {
		return ! \is_null( $this->get_legend_type($legend_type_slug) );
	}

	public function register_assets() {
		$asset_file = include( JEO_BASEPATH . '/js/build/JeoLegend.asset.php');
		wp_register_script(
			'jeo-legend',
			JEO_BASEURL . '/js/build/JeoLegend.js',
			['mapboxgl-loader'],
			$asset_file['version']
		);
	}

	public function enqueue_scripts() {
		// TODO: load only when needed

		foreach ( $this->get_registered_legend_types() as $slug => $legend_type ) {
			$deps = isset( $legend_type['dependecies'] ) ? $legend_type['dependecies'] : [];
			$deps = array_merge( ['jeo-legend'], $deps );
			wp_enqueue_script( 'legend-type-' . $slug, $legend_type['script_url'], $deps );
		}

	}

}
