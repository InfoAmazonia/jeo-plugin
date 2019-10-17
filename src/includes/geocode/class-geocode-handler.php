<?php

namespace Jeo;

class Geocode_Handler {

	use Singleton;

	protected function init() {
		add_action( 'wp_ajax_jeo_geocode', [$this, 'ajax_geocode'] );
		add_action( 'init', [$this, 'register_metadata'], 99 );
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
	
	public function register_metadata() {
		
		register_post_meta('post', '_geocode_address', [
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
		
		register_post_meta('post', '_geocode_city', [
			'show_in_rest' => true,
			'single' => true,
			'auth_callback' => function() {
				return current_user_can('edit_posts');
			},
			'type' => 'string',
			'description' => __('City', 'jeo')
		]);

		
	}
	
}