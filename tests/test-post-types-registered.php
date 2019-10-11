<?php
/**
 * Class RegisteredPostTypes
 *
 * @package Jeo
 */

namespace Jeo\Tests;

class RegisteredPostTypes extends Jeo_UnitTestCase {


	function test_maps() {
		$maps = get_post_type_object('map');
		$this->assertTrue( $maps instanceof \WP_Post_Type );
	}
	
	function test_layers() {
		$layers = get_post_type_object('map-layer');
		$this->assertTrue( $layers instanceof \WP_Post_Type );
	}
}
