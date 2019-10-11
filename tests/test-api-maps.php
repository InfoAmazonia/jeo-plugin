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
				'zoom' => '123'
			]
		];
		
		$request->set_query_params($request_body);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();
		
		$this->assertEquals(201, $response->get_status());
		
		$this->assertEquals('Test map', $data['title']['raw']);
		$this->assertEquals('123', $data['meta']['zoom']);
		$this->assertEquals('map', $data['type']);
		
	}
	
}
