<?php

namespace Jeo\Geocoders;

class Mapbox extends \Jeo\Geocoder {

	public function geocode( $search_string ) {

		$api_key = \jeo_settings()->get_option( 'mapbox_key' );

		if ( empty( $api_key ) ) {
			return array();
		}

		$params = array(
			'access_token' => $api_key,
			'limit'        => 5,
			'language'     => get_locale(),
		);

		$url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' . rawurlencode( $search_string ) . '.json';

		$r = wp_remote_get( add_query_arg( $params, $url ) );

		if ( is_wp_error( $r ) ) {
			return array();
		}

		$data = json_decode( wp_remote_retrieve_body( $r ), true );

		$response = array();

		if ( isset( $data['features'] ) && is_array( $data['features'] ) ) {
			foreach ( $data['features'] as $feature ) {
				$r = $this->format_response_item( $feature );
				if ( $r ) {
					$response[] = $r;
				}
			}
		}

		return $response;
	}

	public function reverse_geocode( $lat, $lon ) {

		$api_key = \jeo_settings()->get_option( 'mapbox_key' );

		if ( empty( $api_key ) ) {
			return array();
		}

		$params = array(
			'access_token' => $api_key,
			'limit'        => 1,
			'language'     => get_locale(),
		);

		$url = "https://api.mapbox.com/geocoding/v5/mapbox.places/{$lon},{$lat}.json";

		$r = wp_remote_get( add_query_arg( $params, $url ) );

		if ( is_wp_error( $r ) ) {
			return array();
		}

		$data = json_decode( wp_remote_retrieve_body( $r ), true );

		if ( isset( $data['features'][0] ) ) {
			return $this->format_response_item( $data['features'][0] );
		}

		return array();
	}

	private function format_response_item( $item ) {

		if ( ! isset( $item['geometry']['coordinates'] ) ) {
			return null;
		}

		$response = array(
			'lat'          => $item['geometry']['coordinates'][1],
			'lon'          => $item['geometry']['coordinates'][0],
			'full_address' => $item['place_name'],
		);

		/**
		 * Mapbox context parts:
		 * country, region (State), postcode, district, place (City), locality, neighborhood
		 */
		if ( isset( $item['context'] ) && is_array( $item['context'] ) ) {
			foreach ( $item['context'] as $ctx ) {
				$id = $ctx['id'];

				if ( strpos( $id, 'country' ) !== false ) {
					$response['country']      = $ctx['text'];
					$response['country_code'] = isset( $ctx['short_code'] ) ? strtoupper( $ctx['short_code'] ) : '';
				} elseif ( strpos( $id, 'region' ) !== false ) {
					$response['region_level_2'] = $ctx['text']; // State
				} elseif ( strpos( $id, 'postcode' ) !== false ) {
					$response['postcode'] = $ctx['text'];
				} elseif ( strpos( $id, 'place' ) !== false ) {
					$response['city'] = $ctx['text'];
				} elseif ( strpos( $id, 'neighborhood' ) !== false || strpos( $id, 'locality' ) !== false ) {
					$response['city_level_1'] = $ctx['text'];
				}
			}
		}

		// Mapbox specific address extraction (from properties or text)
		if ( isset( $item['properties']['address'] ) ) {
			$response['address'] = $item['properties']['address'];
		} elseif ( isset( $item['text'] ) && strpos( $item['id'], 'address' ) !== false ) {
			$response['address'] = $item['text'];
		}

		if ( isset( $item['address'] ) ) {
			$response['address_number'] = $item['address'];
		}

		$response['raw'] = $item;

		return $response;
	}
}
