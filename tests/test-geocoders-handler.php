<?php
/**
 * Class Geocoders Handlers
 *
 * @package Jeo
 */

namespace Jeo\Tests;

class GeocodersHandler extends Jeo_UnitTestCase {


	function test_register() {

		jeo_geocode_handler()->register_geocoder([
			'slug' => 'test',
			'name' => 'Test',
			'description' => 'Test description',
			'class_name' => '\stdClass' // just any class to test
		]);

		$slugs = array_map(function($e) {return $e['slug']; }, jeo_geocode_handler()->get_registered_geocoders());

		$this->assertContains('test', $slugs);

		$object = jeo_geocode_handler()->initialize_geocoder('test');

		$this->assertTrue( $object instanceof \stdClass );

	}

	function test_get_active() {

		$active = jeo_geocode_handler()->get_active_geocoder();

		$this->assertTrue( $active instanceof \Jeo\Geocoders\Nominatim );

	}


}
