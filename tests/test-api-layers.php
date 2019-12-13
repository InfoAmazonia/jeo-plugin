<?php
/**
 * Class ApiMaps
 *
 * @package Jeo
 */

namespace Jeo\Tests;

class ApiLayers extends Jeo_UnitApiTestCase {

	function test_create() {

		$request = new \WP_REST_Request('POST', '/wp/v2/map-layer');

		$request_body = [
			'title' => 'Test layer',
			'content' => 'Sample content',
			'meta' => [
				'type' => 'mapbox'
			]
		];

		$request->set_query_params($request_body);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();

		$this->assertEquals(201, $response->get_status());

		$this->assertEquals('Test layer', $data['title']['raw']);
		$this->assertEquals('mapbox', $data['meta']['type']);
		$this->assertEquals('map-layer', $data['type']);

	}

	function test_meta_validation() {

		$request = new \WP_REST_Request('POST', '/wp/v2/map-layer');

		$request_body = [
			'title' => 'Test layer',
			'content' => 'Sample content',
			'meta' => [
				'type' => 'unregistered_type'
			]
		];

		$request->set_query_params($request_body);

		$response = $this->server->dispatch($request);

		$data = $response->get_data();

		$this->assertEquals(400, $response->get_status());

	}


}
