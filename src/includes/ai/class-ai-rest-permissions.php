<?php
/**
 * Centralised REST API permission callbacks for JEO AI endpoints.
 *
 * Replaces inline closures in register_rest_route() with reusable,
 * testable static methods. Ensures consistent capability checks and
 * nonce validation across all AI routes.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI REST Permissions
 *
 * Provides standardised permission_callback closures for REST routes.
 *
 * Usage:
 *
 *     register_rest_route( 'jeo/v1', '/ai-georeference', array(
 *         'methods'             => 'POST',
 *         'callback'            => array( $this, 'api_georeference' ),
 *         'permission_callback' => AI_REST_Permissions::edit_posts(),
 *     ) );
 */
class AI_REST_Permissions {

	/**
	 * Require 'edit_posts' capability.
	 *
	 * Used for endpoints that mutate or expose editorial data
	 * (georeferencing, minimap generation, layer creation).
	 *
	 * @return callable
	 */
	public static function edit_posts(): callable {
		return function (): bool {
			return current_user_can( 'edit_posts' );
		};
	}

	/**
	 * Require 'manage_options' capability.
	 *
	 * Used for admin-only endpoints (settings, model fetching,
	 * vector store management, bulk operations).
	 *
	 * @return callable
	 */
	public static function manage_options(): callable {
		return function (): bool {
			return current_user_can( 'manage_options' );
		};
	}

	/**
	 * Require 'edit_posts' AND a valid REST nonce.
	 *
	 * Use this for endpoints called from the block editor or
	 * frontend where cookie-based auth is active.
	 *
	 * @return callable
	 */
	public static function edit_posts_with_nonce(): callable {
		return function (): bool {
			if ( ! current_user_can( 'edit_posts' ) ) {
				return false;
			}
			return wp_verify_nonce( $_SERVER['HTTP_X_WP_NONCE'] ?? '', 'wp_rest' );
		};
	}

	/**
	 * Require 'manage_options' AND a valid REST nonce.
	 *
	 * @return callable
	 */
	public static function manage_options_with_nonce(): callable {
		return function (): bool {
			if ( ! current_user_can( 'manage_options' ) ) {
				return false;
			}
			return wp_verify_nonce( $_SERVER['HTTP_X_WP_NONCE'] ?? '', 'wp_rest' );
		};
	}
}
