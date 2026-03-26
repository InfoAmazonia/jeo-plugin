<?php

namespace Jeo\Geocoders;

class GoogleMaps extends \Jeo\Geocoder {

	public function geocode( $search_string ) {

		$api_key = \jeo_settings()->get_option( 'google_maps_key' );

		if ( empty( $api_key ) ) {
			return array();
		}

		$params = array(
			'address' => $search_string,
			'key'     => $api_key,
		);

		$r = wp_remote_get( add_query_arg( $params, 'https://maps.googleapis.com/maps/api/geocode/json' ) );

		if ( is_wp_error( $r ) ) {
			return array();
		}

		$data = wp_remote_retrieve_body( $r );
		$data = json_decode( $data, true );

		$response = array();

		if ( isset( $data['status'] ) && 'OK' === $data['status'] ) {
			foreach ( $data['results'] as $result ) {
				$r = $this->format_response_item( $result );
				if ( $r ) {
					$response[] = $r;
				}
			}
		}

		return $response;
	}

	public function reverse_geocode( $lat, $lon ) {

		$api_key = \jeo_settings()->get_option( 'google_maps_key' );

		if ( empty( $api_key ) ) {
			return array();
		}

		$params = array(
			'latlng' => $lat . ',' . $lon,
			'key'    => $api_key,
		);

		$r = wp_remote_get( add_query_arg( $params, 'https://maps.googleapis.com/maps/api/geocode/json' ) );

		if ( is_wp_error( $r ) ) {
			return array();
		}

		$data = wp_remote_retrieve_body( $r );
		$data = json_decode( $data, true );

		if ( isset( $data['status'] ) && 'OK' === $data['status'] ) {
			return $this->format_response_item( $data['results'][0] );
		}

		return array();
	}

	private function format_response_item( $item ) {

		if ( ! isset( $item['geometry']['location']['lat'] ) || ! isset( $item['geometry']['location']['lng'] ) ) {
			return null;
		}

		$response = array(
			'lat'          => $item['geometry']['location']['lat'],
			'lon'          => $item['geometry']['location']['lng'],
			'full_address' => $item['formatted_address'],
		);

		$address_components = $item['address_components'];

		$correspondences = array(
			'country'        => 'country',
			'country_code'   => 'country', // will handle short_name
			'region_level_1' => 'administrative_area_level_1',
			'region_level_2' => 'administrative_area_level_2',
			'region_level_3' => 'administrative_area_level_3',
			'city'           => 'locality',
			'city_level_1'   => 'sublocality_level_1',
		);

		foreach ( $address_components as $component ) {
			$types = $component['types'];

			foreach ( $correspondences as $jeo_field => $google_type ) {
				if ( in_array( $google_type, $types, true ) ) {
					if ( 'country_code' === $jeo_field ) {
						$response[ $jeo_field ] = $component['short_name'];
					} else {
						$response[ $jeo_field ] = $component['long_name'];
					}
				}
			}
		}

		// Fallback for city if locality is not found
		if ( ! isset( $response['city'] ) ) {
			foreach ( $address_components as $component ) {
				if ( in_array( 'administrative_area_level_2', $component['types'], true ) ) {
					$response['city'] = $component['long_name'];
					break;
				}
			}
		}

		$response['raw'] = $item;

		return $response;
	}
}
