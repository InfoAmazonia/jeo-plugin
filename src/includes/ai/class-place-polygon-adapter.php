<?php
/**
 * Place polygon adapter interface.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Adapter interface for place polygon resolution.
 */
interface Place_Polygon_Adapter {

	/**
	 * Try to resolve a place name into a polygon result.
	 *
	 * @param string      $place_name Place name requested by the user.
	 * @param string|null $context    Optional geographic context (state, country, etc.).
	 * @return array|\WP_Error|null Result array or error on failure; null when not applicable.
	 */
	public function resolve( string $place_name, ?string $context = null );

	/**
	 * Return the adapter identifier.
	 *
	 * @return string
	 */
	public function get_source(): string;
}
