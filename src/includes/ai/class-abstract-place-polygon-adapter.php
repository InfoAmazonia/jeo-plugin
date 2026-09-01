<?php
/**
 * Base adapter with shared HTTP and caching helpers for place polygon resolution.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Base adapter with shared HTTP and caching helpers.
 */
abstract class Abstract_Place_Polygon_Adapter implements Place_Polygon_Adapter {

	/**
	 * Cache TTL for successful polygon lookups.
	 *
	 * @var int
	 */
	protected const CACHE_TTL = 24 * HOUR_IN_SECONDS;

	/**
	 * Build a transient cache key for this adapter and place.
	 *
	 * @param string $place_name Place name.
	 * @param string $context    Optional context.
	 * @return string
	 */
	protected function cache_key( string $place_name, string $context = '' ): string {
		return 'jeo_polygon_' . $this->get_source() . '_' . md5( $place_name . '|' . $context );
	}

	/**
	 * Get a cached polygon result.
	 *
	 * @param string $place_name Place name.
	 * @param string $context    Optional context.
	 * @return array|null
	 */
	protected function get_cached( string $place_name, string $context = '' ): ?array {
		$cache_key = $this->cache_key( $place_name, $context );
		$cached    = get_transient( $cache_key );
		return is_array( $cached ) ? $cached : null;
	}

	/**
	 * Store a polygon result in cache.
	 *
	 * @param string $place_name Place name.
	 * @param array  $result     Result data.
	 * @param string $context    Optional context.
	 * @return void
	 */
	protected function set_cached( string $place_name, array $result, string $context = '' ): void {
		$cache_key = $this->cache_key( $place_name, $context );
		set_transient( $cache_key, $result, self::CACHE_TTL );
	}

	/**
	 * Wrapper around wp_remote_get with consistent user-agent and timeout.
	 *
	 * @param string $url  Request URL.
	 * @param array  $args Optional wp_remote_get args.
	 * @return array|\WP_Error Response array or WP_Error.
	 */
	protected function http_get( string $url, array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'timeout'     => 15,
				'redirection' => 3,
				'user-agent'  => 'JEO boundary resolver/' . JEO_VERSION . '; ' . home_url( '/' ),
			)
		);

		return wp_remote_get( esc_url_raw( $url ), $args );
	}

	/**
	 * Compute a bounding box from a GeoJSON feature geometry.
	 *
	 * @param array $geometry GeoJSON geometry array.
	 * @return array|null [west, south, east, north] or null.
	 */
	protected function compute_bbox( array $geometry ): ?array {
		$coords = $this->extract_coordinates( $geometry );
		if ( empty( $coords ) ) {
			return null;
		}

		$lons = array_column( $coords, 0 );
		$lats = array_column( $coords, 1 );

		return array(
			(float) min( $lons ),
			(float) min( $lats ),
			(float) max( $lons ),
			(float) max( $lats ),
		);
	}

	/**
	 * Recursively extract [lon, lat] pairs from a GeoJSON geometry.
	 *
	 * @param array $geometry GeoJSON geometry.
	 * @return array<int,array{0:float,1:float}>
	 */
	protected function extract_coordinates( array $geometry ): array {
		$type   = $geometry['type'] ?? '';
		$coords = $geometry['coordinates'] ?? array();

		switch ( $type ) {
			case 'Point':
				return array( $coords );
			case 'MultiPoint':
			case 'LineString':
				return $coords;
			case 'MultiLineString':
			case 'Polygon':
				$result = array();
				foreach ( $coords as $ring ) {
					$result = array_merge( $result, $ring );
				}
				return $result;
			case 'MultiPolygon':
				$result = array();
				foreach ( $coords as $polygon ) {
					foreach ( $polygon as $ring ) {
						$result = array_merge( $result, $ring );
					}
				}
				return $result;
			case 'GeometryCollection':
				$result = array();
				foreach ( $geometry['geometries'] ?? array() as $g ) {
					$result = array_merge( $result, $this->extract_coordinates( $g ) );
				}
				return $result;
		}

		return array();
	}

	/**
	 * Normalize a place name for source queries.
	 *
	 * @param string $place_name Raw place name.
	 * @return string
	 */
	protected function normalize_name( string $place_name ): string {
		return sanitize_text_field( wp_unslash( $place_name ) );
	}
}
