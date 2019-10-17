<?php

namespace Jeo;

class Geocode_Handler {

	use Singleton;

	protected function init() {
		add_action( 'wp_ajax_jeo_geocode', [$this, 'ajax_geocode'] );
	}
	
	public function ajax_geocode() {
		
		$params = [
			'q' => $_GET['search'], 
			'format' => 'json',
			'addressdetails' => 1
		];
		
		$r = wp_remote_get( add_query_arg($params, 'https://nominatim.openstreetmap.org/search') );
		
		$data = wp_remote_retrieve_body( $r );
		
		echo $data;
		
		die;
		
	}
	
}