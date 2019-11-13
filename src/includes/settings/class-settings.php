<?php

namespace Jeo;

class Settings {

	use Singleton;

	public $option_key = 'jeo-settings';

	protected function init() {

		$this->default_options = [
			'enabled_post_types' => [
				'post'
			],
			'active_geocoder' => 'nominatim'
		];

		add_action('admin_menu', [$this, 'add_menu_item']);
		add_action('admin_init', [$this, 'admin_init']);
		add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);

	}

	public function get_option( $option_name ) {
		$options = get_option($this->option_key);
		if (!$options) {
			$options = [];
		}
		$options = array_merge($this->default_options, $options);
		if ( isset($options[$option_name]) ) {
			return $options[$option_name];
		}
		return null;
	}

	public function get_field_name($name) {
		return $this->option_key . '[' . $name . ']';
	}

	public function get_geocoder_option_field_name($geocoder, $name) {
		return $this->get_field_name('geocoders') . '[' . $geocoder . ']' . '[' . $name . ']';
	}

	public function get_geocoder_options($geocoder_slug) {
		$options = $this->get_option('geocoders');
		$geoObj = \jeo_geocode_handler()->initialize_geocoder($geocoder_slug);
		$defaults = $geoObj->get_default_options();
		$current = isset($options[$geocoder_slug]) ? $options[$geocoder_slug] : [];
		//var_dump($options); die;
		return array_merge($defaults, $current);
	}

	public function get_geocoder_option($geocoder_slug, $option_name) {
		$options = $this->get_geocoder_options($geocoder_slug);
		return isset($options[$option_name]) ? $options[$option_name] : '';
	}

	public function admin_init() {
		register_setting( 'jeo-settings', $this->option_key );
	}

	public function enqueue_admin_scripts($page) {
		if ($page == 'toplevel_page_jeo-settings') {
			wp_enqueue_script('jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', ['jquery']);
		}
	}

	public function add_menu_item() {
		$page_suffix = add_menu_page(
			__('Jeo Settings', 'jeo'),
			'Jeo',
			'manage_options',
			'jeo-settings',
			[$this, 'admin_page'],
			// $icon_url:string,
			// $position:integer|null
		);

		add_action( 'load-' . $page_suffix, array( &$this, 'load_admin_page' ) );
	}

	public function admin_page() {
		include 'settings-page.php';
	}

	public function load_admin_page() {
		add_action( 'admin_enqueue_scripts', array( &$this, 'add_admin_assets' ), 90 );
	}
	public function add_admin_assets() {
		wp_enqueue_script('cartojs', 'http://libs.cartocdn.com/cartodb.js/v3/3.15/cartodb.js');
		wp_enqueue_script('mapboxvector', 'http://spatialserver.github.io/Leaflet.MapboxVectorTile/dist/Leaflet.MapboxVectorTile.js', ['cartojs']);
		//wp_enqueue_script('mapboxvector', 'https://unpkg.com/leaflet.vectorgrid@latest/dist/Leaflet.VectorGrid.bundled.js', ['cartojs']);
		wp_enqueue_script('jeo-cartojs', JEO_BASEURL . '/includes/settings/jeo_cartojs.js', ['jquery', 'cartojs']);
		wp_enqueue_style( 'cartojs', 'http://libs.cartocdn.com/cartodb.js/v3/3.15/themes/css/cartodb.css', time());
		wp_localize_script('jeo-cartojs', "jeo_settings", [
			'mapbox_key' => $this->get_option('mapbox_key'),
			'carto_key' => $this->get_option('carto_key')
		]);
	}






}
