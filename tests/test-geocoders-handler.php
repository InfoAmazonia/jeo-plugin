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

	function test_disable_update_of_protected_meta() {
		$p = $this->factory->post->create( array( 'post_title' => 'Test Post' ) );

		foreach ( \jeo_geocode_handler()->geo_attributes as $key ) {
			$this->assertFalse( update_post_meta( $p, $key, 'value' ) );
		}

	}

	function test_disable_add_of_protected_meta() {
		$p = $this->factory->post->create( array( 'post_title' => 'Test Post' ) );

		foreach ( \jeo_geocode_handler()->geo_attributes as $key ) {
			$this->assertFalse( add_post_meta( $p, $key, 'value' ) );
		}

	}

	function test_update_meta_indexes() {

		$p = $this->factory->post->create( array( 'post_title' => 'Test Post' ) );

		$meta1 = [
			'relevance' => 'primary',
			'_geocode_lat' => '1111',
			'_geocode_lon' => '2111',
			'_geocode_full_address' => 'Super address',
			'_geocode_city_level_1' => 'neighbor 1',
			'_geocode_city' => 'city 1',
			'_geocode_region_level_3' => 'region3 1',
			'_geocode_region_level_2' => 'region2 1',
			'_geocode_region_level_1' => 'region1 1',
			'_geocode_country_code' => 'ccode 1',
			'_geocode_country' => 'country 1',
		];

		$meta2 = [
			'relevance' => 'primary',
			'_geocode_lat' => '2222',
			'_geocode_lon' => '1222',
			'_geocode_full_address' => 'Super address 2',
			'_geocode_city_level_1' => 'neighbor 2',
			'_geocode_city' => 'city 2',
			'_geocode_region_level_3' => 'region3 2',
			'_geocode_region_level_2' => 'region2 2',
			'_geocode_region_level_1' => 'region1 2',
			'_geocode_country_code' => 'ccode 2',
			'_geocode_country' => 'country 2',
		];

		$meta3 = [
			'relevance' => 'secondary',
			'_geocode_lat' => '3333',
			'_geocode_lon' => '2333',
			'_geocode_full_address' => 'Super address 3',
			'_geocode_city_level_1' => 'neighbor 3',
			'_geocode_city' => 'city 3',
			'_geocode_region_level_3' => 'region3 3',
			'_geocode_region_level_2' => 'region2 3',
			'_geocode_region_level_1' => 'region1 3',
			'_geocode_country_code' => 'ccode 3',
			'_geocode_country' => 'country 3',
		];

		add_post_meta( $p, '_related_point', $meta1 );

		add_post_meta( $p, '_related_point', $meta2 );

		add_post_meta( $p, '_related_point', $meta3 );

		foreach ( \jeo_geocode_handler()->geo_attributes as $key ) {

			$meta = get_post_meta( $p, $key . '_p' );

			$this->assertEquals( 2, sizeof( $meta ) );

			$this->assertContains( $meta1[$key], $meta );
			$this->assertContains( $meta2[$key], $meta );


			$meta = get_post_meta( $p, $key . '_s' );

			$this->assertEquals( 1, sizeof( $meta ) );

			$this->assertContains( $meta3[$key], $meta );

		}

	}


}
