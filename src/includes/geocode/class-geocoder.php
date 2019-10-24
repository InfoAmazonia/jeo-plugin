<?php

namespace Jeo;

abstract class Geocoder {

	private $name;
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
	 * 		[
	 * 			'lat' => '',
	 * 			'lon' => '',
	 * 			'full_address' => '',
	 * 			'country' => '',
	 * 			'country_code' => '',
	 * 			'region_level_1' => '',
	 * 			'region_level_2' => '', // State goes here
	 * 			'region_level_3' => '',
	 * 			'city' => '',
	 * 			'city_level_1' => '',
	 * 		]
	 * ]
	 *
	 * @param string $search_string
	 * @return array $matches
	 */
	abstract public function ajax_geocode($search_string);
	abstract public function ajax_reverse_geocode($lat, $lon);



}
