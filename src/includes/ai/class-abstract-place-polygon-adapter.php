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
	 * Wrapper around wp_remote_post with consistent user-agent and timeout.
	 *
	 * @param string $url  Request URL.
	 * @param array  $args Optional wp_remote_post args.
	 * @return array|\WP_Error Response array or WP_Error.
	 */
	protected function http_post( string $url, array $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'timeout'     => 15,
				'redirection' => 3,
				'user-agent'  => 'JEO boundary resolver/' . JEO_VERSION . '; ' . home_url( '/' ),
			)
		);

		return wp_remote_post( esc_url_raw( $url ), $args );
	}

	/**
	 * Compute a bounding box from a GeoJSON geometry, Feature, or FeatureCollection.
	 *
	 * Walks the structure tracking min/max coordinates without materializing
	 * a merged coordinate list — large country geometries (e.g. France with
	 * overseas territories) would otherwise exhaust the memory limit.
	 *
	 * @param array $geojson GeoJSON array.
	 * @return array|null [west, south, east, north] or null.
	 */
	protected function compute_bbox( array $geojson ): ?array {
		$min_lon = PHP_FLOAT_MAX;
		$min_lat = PHP_FLOAT_MAX;
		$max_lon = -PHP_FLOAT_MAX;
		$max_lat = -PHP_FLOAT_MAX;

		$this->bbox_walk( $geojson, $min_lon, $min_lat, $max_lon, $max_lat );

		if ( PHP_FLOAT_MAX === $min_lon ) {
			return null;
		}

		return array(
			(float) $min_lon,
			(float) $min_lat,
			(float) $max_lon,
			(float) $max_lat,
		);
	}

	/**
	 * Recursively walk a GeoJSON structure updating bounding-box extremes.
	 *
	 * Handles FeatureCollection (features), Feature (geometry), bare
	 * geometries (type + coordinates), GeometryCollection, and plain
	 * coordinate arrays.
	 *
	 * @param array $node     GeoJSON node.
	 * @param float $min_lon  Running min longitude (by reference).
	 * @param float $min_lat  Running min latitude (by reference).
	 * @param float $max_lon  Running max longitude (by reference).
	 * @param float $max_lat  Running max latitude (by reference).
	 * @return void
	 */
	private function bbox_walk( array $node, &$min_lon, &$min_lat, &$max_lon, &$max_lat ): void {
		if ( isset( $node['type'], $node['coordinates'] ) && is_array( $node['coordinates'] ) ) {
			$this->bbox_coords_walk( $node['coordinates'], $min_lon, $min_lat, $max_lon, $max_lat );
			return;
		}

		if ( isset( $node['geometries'] ) && is_array( $node['geometries'] ) ) {
			foreach ( $node['geometries'] as $geometry ) {
				if ( is_array( $geometry ) ) {
					$this->bbox_walk( $geometry, $min_lon, $min_lat, $max_lon, $max_lat );
				}
			}
			return;
		}

		if ( isset( $node['features'] ) && is_array( $node['features'] ) ) {
			foreach ( $node['features'] as $feature ) {
				if ( is_array( $feature ) ) {
					$this->bbox_walk( $feature, $min_lon, $min_lat, $max_lon, $max_lat );
				}
			}
			return;
		}

		if ( isset( $node['geometry'] ) && is_array( $node['geometry'] ) ) {
			$this->bbox_walk( $node['geometry'], $min_lon, $min_lat, $max_lon, $max_lat );
			return;
		}

		$this->bbox_coords_walk( $node, $min_lon, $min_lat, $max_lon, $max_lat );
	}

	/**
	 * Recursively walk a coordinate tree updating bounding-box extremes.
	 *
	 * @param array $coords   Coordinate node ([lon, lat] pairs at the leaves).
	 * @param float $min_lon  Running min longitude (by reference).
	 * @param float $min_lat  Running min latitude (by reference).
	 * @param float $max_lon  Running max longitude (by reference).
	 * @param float $max_lat  Running max latitude (by reference).
	 * @return void
	 */
	private function bbox_coords_walk( array $coords, &$min_lon, &$min_lat, &$max_lon, &$max_lat ): void {
		if ( isset( $coords[0], $coords[1] ) && is_numeric( $coords[0] ) && is_numeric( $coords[1] ) ) {
			$lon = (float) $coords[0];
			$lat = (float) $coords[1];

			$min_lon = min( $min_lon, $lon );
			$min_lat = min( $min_lat, $lat );
			$max_lon = max( $max_lon, $lon );
			$max_lat = max( $max_lat, $lat );
			return;
		}

		foreach ( $coords as $value ) {
			if ( is_array( $value ) ) {
				$this->bbox_coords_walk( $value, $min_lon, $min_lat, $max_lon, $max_lat );
			}
		}
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
