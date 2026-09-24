<?php
/**
 * NeuronAI tool: geocode a location string.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Tool that geocodes a location string using the plugin's active geocoder,
 * falling back to Mapbox Geocoding API when available.
 */
class Geocode_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'geocode',
			description: 'Convert a location name or address into latitude, longitude, and zoom. Uses the active geocoder first, then falls back to Mapbox if available.',
		);
	}

	/**
	 * Define tool properties.
	 *
	 * @return ToolProperty[]
	 */
	protected function properties(): array {
		return array(
			new ToolProperty(
				name: 'location',
				type: PropertyType::STRING,
				description: 'Location name, address, or description to geocode (e.g. "São Paulo, Brazil", "Amazon rainforest").',
				required: true,
			),
		);
	}

	/**
	 * Execute the tool.
	 *
	 * @param string $location Location text to geocode.
	 * @return string JSON-encoded geocoding result.
	 */
	public function __invoke( string $location ): string {
		$defaults = array(
			'lat'  => (float) \jeo_settings()->get_option( 'map_default_lat', 0 ),
			'lon'  => (float) \jeo_settings()->get_option( 'map_default_lng', 0 ),
			'zoom' => (float) \jeo_settings()->get_option( 'map_default_zoom', 2 ),
		);

		$result = $this->try_active_geocoder( $location );

		if ( null === $result ) {
			$result = $this->try_mapbox_geocoder( $location );
		}

		if ( null === $result ) {
			return wp_json_encode(
				array(
					'success' => false,
					'lat'     => $defaults['lat'],
					'lon'     => $defaults['lon'],
					'zoom'    => $defaults['zoom'],
					'message' => 'No geocoding result found. Using default center.',
				)
			);
		}

		return wp_json_encode(
			array(
				'success' => true,
				'lat'     => $result['lat'],
				'lon'     => $result['lon'],
				'zoom'    => $result['zoom'] ?? $defaults['zoom'],
				'address' => $result['address'] ?? '',
			)
		);
	}

	/**
	 * Try the active geocoder from plugin settings.
	 *
	 * @param string $location Location text.
	 * @return array|null Result with lat, lon, zoom, address or null.
	 */
	private function try_active_geocoder( string $location ): ?array {
		try {
			$geocoder = \jeo_geocode_handler()->get_active_geocoder();
			if ( ! $geocoder ) {
				return null;
			}

			$results = $geocoder->geocode( $location );
			if ( empty( $results ) || ! is_array( $results ) ) {
				return null;
			}

			$first = $results[0];
			if ( empty( $first['lat'] ) || empty( $first['lon'] ) ) {
				return null;
			}

			return array(
				'lat'     => (float) $first['lat'],
				'lon'     => (float) $first['lon'],
				'zoom'    => 10,
				'address' => $first['full_address'] ?? '',
			);
		} catch ( \Exception $e ) {
			return null;
		}
	}

	/**
	 * Try the Mapbox geocoder as fallback.
	 *
	 * @param string $location Location text.
	 * @return array|null Result with lat, lon, zoom, address or null.
	 */
	private function try_mapbox_geocoder( string $location ): ?array {
		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return null;
		}

		try {
			$mapbox  = new \Jeo\Geocoders\Mapbox( $mapbox_key );
			$results = $mapbox->geocode( $location );
			if ( empty( $results ) || ! is_array( $results ) ) {
				return null;
			}

			$first = $results[0];
			if ( empty( $first['lat'] ) || empty( $first['lon'] ) ) {
				return null;
			}

			return array(
				'lat'     => (float) $first['lat'],
				'lon'     => (float) $first['lon'],
				'zoom'    => 10,
				'address' => $first['full_address'] ?? '',
			);
		} catch ( \Exception $e ) {
			return null;
		}
	}
}
