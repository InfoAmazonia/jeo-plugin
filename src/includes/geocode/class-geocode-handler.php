<?php

namespace Jeo;

class Geocode_Handler {

	use Singleton;

	protected function init() {
		add_action( 'wp_ajax_jeo_geocode', [$this, 'ajax_geocode'] );
		add_action( 'wp_ajax_jeo_reverse_geocode', [$this, 'ajax_reverse_geocode'] );
		add_action( 'init', [$this, 'register_metadata'], 99 );
	}

	private $registered_geocoders = [];

	public function ajax_geocode() {

		$geocoder = $this->get_active_geocoder();

		if ($geocoder) {
			echo json_encode( $geocoder->ajax_geocode( $_GET['search'] ) );
		} else {
			echo json_encode([]);
		}

		die;

	}

	public function ajax_reverse_geocode() {

		$geocoder = $this->get_active_geocoder();

		if ($geocoder) {
			echo json_encode( $geocoder->ajax_reverse_geocode( $_GET['lat'], $_GET['lon'] ) );
		} else {
			echo json_encode([]);
		}

		die;

	}

	/**
	 * Registers all core geocoders and fires the hook for
	 * extenals geocoders to be registered
	 *
	 * @return void
	 */
	private function _register_geocoders() {

		$this->register_geocoder([
			'slug' => 'nominatim',
			'name' => 'Nominatim',
			'description' => __('Service provided by Open Street Maps at https://nominatim.openstreetmap.org/', 'jeo'),
			'class_name' => '\Jeo\Geocoders\Nominatim'
		]);

		/**
		 * Hook used to register geocoders
		 *
		 * example:
		 * add_action('jeo_register_geocoders', function($geocoders) {
		 * 		$geocoders->register_geocoder([
		 * 			'slug' => 'my-geocoder',
		 *			'name' => 'My Geocoder',
		 *			'description' => __('My Geocoder description', 'my-textdomain'),
		 *			'class_name' => 'MyGeocoderClass'
		 * 		]);
		 * });
		 *
		 * @param Jeo\Geocode_Handler The Geocode_Handler instance
		 */
		do_action('jeo_register_geocoders', $this);

	}

	public function get_active_geocoder() {
		$this->_register_geocoders();
		$active_geocoder = jeo_settings()->get_option('active_geocoder');
		return $this->initialize_geocoder($active_geocoder);
	}

	public function register_metadata() {

		register_post_meta('post', '_geocode_full_address', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('The address returned by the Geocode service', 'jeo')
		]);

		register_post_meta('post', '_geocode_lat', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'number',
			'description' => __('Latitude', 'jeo')
		]);

		register_post_meta('post', '_geocode_lon', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'number',
			'description' => __('Longitude', 'jeo')
		]);

		register_post_meta('post', '_geocode_country', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('Country', 'jeo')
		]);

		register_post_meta('post', '_geocode_country_code', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('Country code', 'jeo')
		]);

		register_post_meta('post', '_geocode_region_level_1', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('Region level 1', 'jeo')
		]);

		register_post_meta('post', '_geocode_region_level_2', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('Region level 2', 'jeo')
		]);

		register_post_meta('post', '_geocode_region_level_3', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('Region level 3', 'jeo')
		]);

		register_post_meta('post', '_geocode_city', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('City', 'jeo')
		]);

		register_post_meta('post', '_geocode_city_level_1', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('City sub-level 1', 'jeo')
		]);

	}

	/**
	 * Register Geocoder
	 *
	 * @param array $geocoder {
	 *     Required. Array or string of arguments describing the geocoder
	 *
	 * 	   @type string		 $name					The name of the geocoder. e.g. 'Example geocoder'
	 * 	   @type string		 $slug					A unique slug for the geocoder. e.g. 'example-geocoder'
	 * 	   @type string		 $description			The geocoder description. e.g. 'This is an example geocoder description'
	 * 	   @type string		 $class_name			The geocoder Class. e.g. '\Jeo\Geocoders\Test_geocoder'
	 *
	 */
	public function register_geocoder(array $geocoder) {

		if (!isset($geocoder['slug']) || !isset($geocoder['class_name']) || !isset($geocoder['name'])) {
			return false;
		}

		$this->registered_geocoders[$geocoder['slug']] = $geocoder;

		return true;
	}

	public function unregister_geocoder($geocoder_slug) {
		unset($this->registered_geocoders[$geocoder_slug]);
	}

	public function get_registered_geocoders() {
		return $this->registered_geocoders;
	}

	public function get_geocoder($geocoder_slug) {
		$geocoders = $this->get_registered_geocoders();
		if (isset($geocoders[$geocoder_slug])) {
			return $geocoders[$geocoder_slug];
		}
		return null;
	}

	public function get_geocoder_by_object(\Jeo\Geocoders $geocoder_object) {
		$class_name = get_class($geocoder_object);
		// add first bracket
		$class_name = '\\' . $class_name;
		$geocoders = $this->get_registered_geocoders();
		foreach ($geocoders as $geocoder) {
			if ($geocoder['class_name'] == $class_name)
				return $geocoder;
		}
		return null;
	}

	public function initialize_geocoder($geocoder_slug) {
		$geocoder = $this->get_geocoder($geocoder_slug);
		if ( is_array($geocoder) && isset($geocoder['class_name']) ) {
			try {
				return new $geocoder['class_name']();
			} catch (\Throwable $th) {
				return false;
			}

		}
		return false;
	}

}
