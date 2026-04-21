<?php
/**
 * Base geocoder contract.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Shared behavior for concrete geocoder providers.
 */
abstract class Geocoder {

	/**
	 * Human-readable geocoder name.
	 *
	 * @var string
	 */
	private $name;

	/**
	 * Human-readable geocoder description.
	 *
	 * @var string
	 */
	private $description;

	/**
	 * This method must be implemented by Geocoders
	 *
	 * It will get an input string as a parameter and should make the request
	 * to the Geocoder service.
	 *
	 * It should return an array of matches.
	 *
	 * Each item of the array should have only the keys expected by the Jeo plugin,
	 * so each Geocoder must find the best correspondence between each field and the fields
	 * expected by Jeo.
	 *
	 * Note: Only lat and lon are required.
	 *
	 * Sample response with all accepted fields:
	 *
	 * [
	 *      [
	 *          'lat' => '',
	 *          'lon' => '',
	 *          'full_address' => '',
	 *          'country' => '',
	 *          'country_code' => '',
	 *          'region_level_1' => '',
	 *          'region_level_2' => '', // State goes here
	 *          'region_level_3' => '',
	 *          'city' => '',
	 *          'city_level_1' => '',
	 *      ]
	 * ]
	 *
	 * @param string $search_string Search query string.
	 * @return array List of geocoding matches.
	 */
	abstract public function geocode( $search_string );

	/**
	 * Reverse-geocode a latitude and longitude pair.
	 *
	 * @param string|float $lat Latitude value.
	 * @param string|float $lon Longitude value.
	 * @return array Reverse-geocoded matches.
	 */
	abstract public function reverse_geocode( $lat, $lon );

	/**
	 * Return custom settings fields for the geocoder.
	 *
	 * @return array|false Settings schema or false when none is available.
	 */
	public function get_settings() {
		return false;
	}

	/**
	 * Return default option values for the geocoder.
	 *
	 * @return array Default option values.
	 */
	public function get_default_options() {
		return array();
	}

	/**
	 * Render any extra settings footer output.
	 *
	 * @param array $settings Current settings payload.
	 * @return void
	 */
	public function settings_footer( $settings ) {
	}

	/**
	 * Return a single geocoder option value.
	 *
	 * @param string $option_name Option slug.
	 * @return mixed
	 */
	public function get_option( $option_name ) {
		$geocoder = \jeo_geocode_handler()->get_geocoder_by_object( $this );
		return \jeo_settings()->get_geocoder_option( $geocoder['slug'], $option_name );
	}

	/**
	 * Return all stored options for the current geocoder.
	 *
	 * @return array
	 */
	public function get_options() {
		$geocoder = \jeo_geocode_handler()->get_geocoder_by_object( $this );
		return \jeo_settings()->get_geocoder_options( $geocoder['slug'] );
	}
}
