<?php

namespace Jeo\Geocoders;

class Nominatim extends \Jeo\Geocoder {

	public function geocode( $search_string ) {

		$params = array(
			'q'              => $search_string,
			'format'         => 'json',
			'addressdetails' => 1,
		);

		$r = wp_remote_get( add_query_arg( $params, 'https://nominatim.openstreetmap.org/search' ) );

		$data = wp_remote_retrieve_body( $r );

		$data     = \json_decode( $data );
		$response = array();

		if ( \is_array( $data ) ) {

			foreach ( $data as $match ) {
				$r = $this->format_response_item( (array) $match );
				if ( $r ) {
					$response[] = $r;
				}
			}
		}

		return $response;
	}

	public function reverse_geocode( $lat, $lon ) {

		$params = array(
			'lat'            => $lat,
			'lon'            => $lon,
			'format'         => 'json',
			'addressdetails' => 1,
		);

		$r = wp_remote_get( add_query_arg( $params, 'https://nominatim.openstreetmap.org/reverse' ) );

		$data = wp_remote_retrieve_body( $r );

		$data = \json_decode( $data );

		return $this->format_response_item( (array) $data );
	}

	private function format_response_item( $item ) {

		if ( isset( $item['lat'] ) && isset( $item['lon'] ) && isset( $item['display_name'] ) ) {

			$response = array(
				'lat'          => $item['lat'],
				'lon'          => $item['lon'],
				'full_address' => $item['display_name'],
			);
		}

		/**
		 * See https://github.com/OpenCageData/address-formatting/blob/master/conf/components.yaml
		 * See https://github.com/openstreetmap/Nominatim/blob/6c1977b448e8b195bf96b6144674ffe0527e79de/lib/lib.php#L63
		 * for all possible values
		 */
		$correspondences = array(
			'country'        => array(
				'country',
				'country_name',
			),
			'region_level_1' => array(
				'region',
			),
			'region_level_2' => array(
				'state',
				'state_code',
				'province',
			),
			'region_level_3' => array(
				'state_district',
				'county',
				'local_administrative_area',
				'county_code',
			),
			'city'           => array(
				'city',
				'town',
				'municipality',
			),
			'city_level_1'   => array(
				'neighbourhood',
				'suburb',
				'city_district',
				'district',
				'quarter',
				'houses',
				'subdivision',
				'village',
				'hamlet',
				'locality',
				'croft',
			),
		);

		foreach ( $correspondences as $jeo_field => $nominatim_fields ) {

			foreach ( $nominatim_fields as $field ) {
				if ( isset( $item['address']->$field ) ) {
					$response[ $jeo_field ] = $item['address']->$field;
					break;
				}
			}
		}

		$response['raw'] = $item;

		return $response;
	}
}
