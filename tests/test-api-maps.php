<?php
/**
 * Class ApiMaps
 *
 * @package Jeo
 */

namespace Jeo\Tests;

class ApiMaps extends Jeo_UnitApiTestCase {

	function test_maps() {

		$request = new \WP_REST_Request('POST', '/wp/v2/map');

		$request_body = [
			'title' => 'Test map',
			'content' => 'Sample content',
			'meta' => [
				'initial_zoom' => '12'
			]
		];

		$request->set_query_params($request_body);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();

		$this->assertEquals(201, $response->get_status());

		$this->assertEquals('Test map', $data['title']['raw']);
		$this->assertEquals('12', $data['meta']['initial_zoom']);
		$this->assertEquals('map', $data['type']);

	}

	function test_meta_validation() {

		$request = new \WP_REST_Request('POST', '/wp/v2/map');

		$request_body = [
			'title' => 'Test map',
			'content' => 'Sample content',
			'meta' => [
				'initial_zoom' => '123'
			]
		];

		$request->set_query_params($request_body);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();

		$this->assertEquals(400, $response->get_status());

	}

	function test_api_response() {

		$cli = new \Jeo\Fixtures();

		$cli->update();

		$map = get_page_by_title( 'Map 1', 'OBJECT', 'map');

		$request = new \WP_REST_Request('POST', '/wp/v2/map/' . $map->ID);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();

		$this->assertTrue( isset($data['meta']) );
		$this->assertTrue( isset($data['meta']['initial_zoom']) );
		$this->assertTrue( isset($data['meta']['center_lon']) );
		$this->assertTrue( isset($data['meta']['center_lat']) );
		$this->assertTrue( isset($data['meta']['disable_scroll_zoom']) );
		$this->assertTrue( isset($data['meta']['disable_scroll_pan']) );
		$this->assertTrue( isset($data['meta']['disable_drag_rotate']) );
		$this->assertTrue( isset($data['meta']['enable_fullscreen']) );
		$this->assertTrue( isset($data['meta']['max_bounds_ne']) );
		$this->assertTrue( isset($data['meta']['max_bounds_sw']) );
		$this->assertTrue( isset($data['meta']['min_zoom']) );
		$this->assertTrue( isset($data['meta']['max_zoom']) );
		$this->assertTrue( isset($data['meta']['layers']) );
		$this->assertTrue( isset($data['meta']['layers'][0]['id']) );
		$this->assertTrue( isset($data['meta']['layers'][0]['use']) );
		$this->assertTrue( isset($data['meta']['related_posts']) );
		$this->assertTrue( isset($data['meta']['related_posts']['categories']) );


	}


}
