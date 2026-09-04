<?php
/**
 * Deterministic Mapbox style builder for AI-generated layers.
 *
 * Replaces the Mapbox DevKit MCP with direct Styles API calls for
 * thematic layers that require composed styles. (Boundary layers are
 * rendered client-side from GeoJSON attachments and do not use this.)
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Build and publish Mapbox styles from structured specifications.
 */
class Mapbox_Style_Builder {

	/**
	 * Publish a style JSON to the Mapbox Styles API.
	 *
	 * @param array  $style_json Full Mapbox GL style definition.
	 * @param string $name       Style name.
	 * @param string $token      Mapbox access token.
	 * @return array|\WP_Error Published style data (style_id, style_url) or error.
	 */
	public static function publish_style( array $style_json, string $name, string $token ) {
		$username = self::extract_mapbox_username( $token );
		if ( is_wp_error( $username ) ) {
			return $username;
		}

		$url = sprintf(
			'https://api.mapbox.com/styles/v1/%s?access_token=%s',
			rawurlencode( $username ),
			rawurlencode( $token )
		);

		$body = array(
			'version' => (int) ( $style_json['version'] ?? 8 ),
			'name'    => sanitize_text_field( $name ),
		);

		$copy_keys = array( 'metadata', 'center', 'zoom', 'bearing', 'pitch', 'sources', 'layers', 'glyphs', 'sprite', 'transition', 'light', 'terrain', 'fog' );
		foreach ( $copy_keys as $key ) {
			if ( isset( $style_json[ $key ] ) ) {
				$body[ $key ] = $style_json[ $key ];
			}
		}

		$response = wp_remote_post(
			$url,
			array(
				'timeout' => 30,
				'headers' => array(
					'Content-Type' => 'application/json',
				),
				'body'    => wp_json_encode( $body ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			$message = sprintf(
				/* translators: %d: HTTP status code. */
				__( 'Mapbox Styles API returned HTTP %d.', 'jeowp' ),
				$code
			);

			if ( 403 === $code ) {
				$message = __(
					'Mapbox denied the style publish request (HTTP 403): the configured Mapbox token likely lacks the styles:write scope. Use a secret token (sk.…) or add the styles:write scope to the token at mapbox.com/account/access-tokens, then update the key in JEO Settings.',
					'jeowp'
				);
			} elseif ( 401 === $code ) {
				$message = __(
					'Mapbox rejected the access token (HTTP 401): the Mapbox API key configured in JEO Settings is invalid or has expired.',
					'jeowp'
				);
			}

			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( sprintf( '[JEO] Mapbox style publish failed for "%s" (HTTP %d).', $name, $code ) );

			return new \WP_Error(
				'jeo_mapbox_style_publish_http',
				$message
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) || empty( $data['id'] ) ) {
			return new \WP_Error(
				'jeo_mapbox_style_publish_invalid',
				__( 'Mapbox returned an unexpected style payload.', 'jeowp' )
			);
		}

		$style_id = $username . '/' . $data['id'];

		// Validate the published style can be fetched back.
		$fetched = \Jeo::fetch_mapbox_style( $style_id, $token, array( 'bypass_cache' => true ) );
		if ( is_wp_error( $fetched ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( sprintf( '[JEO] Published Mapbox style "%s" could not be fetched back: %s', $style_id, $fetched->get_error_message() ) );

			return $fetched;
		}

		return array(
			'style_id'    => $style_id,
			'style_name'  => sanitize_text_field( $name ),
			'style_url'   => 'mapbox://styles/' . $style_id,
			'preview_url' => $data['draft'] ?? '',
		);
	}

	/**
	 * Build a composed Mapbox style from a minilayer spec.
	 *
	 * @param Layer_Spec_Output $spec Classified layer spec.
	 * @return array|\WP_Error Normalized style JSON or error.
	 */
	public static function build_from_spec( Layer_Spec_Output $spec ) {
		if ( 'mapbox' !== $spec->layer_type ) {
			return new \WP_Error(
				'jeo_mapbox_style_invalid_type',
				__( 'Only "mapbox" layer specs can be built into a composed style.', 'jeowp' )
			);
		}

		$style_json = $spec->style_json;
		if ( empty( $style_json ) || ! is_array( $style_json ) ) {
			return new \WP_Error(
				'jeo_mapbox_style_missing_json',
				__( 'Composed style spec is missing style_json.', 'jeowp' )
			);
		}

		$required = array( 'sources', 'layers' );
		foreach ( $required as $key ) {
			if ( empty( $style_json[ $key ] ) || ! is_array( $style_json[ $key ] ) ) {
				return new \WP_Error(
					'jeo_mapbox_style_invalid',
					sprintf(
						/* translators: %s: missing style key. */
						__( 'Composed style is missing required key: %s.', 'jeowp' ),
						esc_html( $key )
					)
				);
			}
		}

		$style_json['version'] = (int) ( $style_json['version'] ?? 8 );
		$style_json['name']    = sanitize_text_field( $spec->layer_title );

		if ( empty( $style_json['metadata'] ) || ! is_array( $style_json['metadata'] ) ) {
			$style_json['metadata'] = array();
		}
		$style_json['metadata']['jeo:source'] = 'minilayer-composed';

		return $style_json;
	}

	/**
	 * Extract the Mapbox username from an access token.
	 *
	 * Mapbox access tokens use a JWT-like shape. The second segment is a
	 * base64url-encoded JSON object that contains the username under `u`.
	 *
	 * @param string $token Mapbox access token.
	 * @return string|\WP_Error Username or error.
	 */
	public static function extract_mapbox_username( string $token ) {
		$token = trim( $token );
		if ( '' === $token ) {
			return new \WP_Error(
				'jeo_mapbox_no_token',
				__( 'Mapbox API key is not configured.', 'jeowp' )
			);
		}

		$parts = explode( '.', $token );
		if ( count( $parts ) < 2 ) {
			return new \WP_Error(
				'jeo_mapbox_token_format',
				__( 'Mapbox API key format is not recognized.', 'jeowp' )
			);
		}

		// Mapbox access tokens embed the username in the JWT-like payload segment.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$payload = self::base64url_decode( $parts[1] );
		if ( false === $payload ) {
			return new \WP_Error(
				'jeo_mapbox_token_decode',
				__( 'Could not decode Mapbox API key.', 'jeowp' )
			);
		}

		$json = json_decode( $payload, true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $json ) || empty( $json['u'] ) ) {
			return new \WP_Error(
				'jeo_mapbox_token_username',
				__( 'Could not extract Mapbox username from API key.', 'jeowp' )
			);
		}

		return sanitize_text_field( $json['u'] );
	}

	/**
	 * Decode a base64url-encoded string.
	 *
	 * @param string $input Base64url input.
	 * @return string|false Decoded string or false on failure.
	 */
	private static function base64url_decode( string $input ) {
		$padding = 4 - ( strlen( $input ) % 4 );
		if ( $padding < 4 ) {
			$input .= str_repeat( '=', $padding );
		}

		$input = strtr( $input, '-_', '+/' );

		// Decoding the Mapbox token payload (base64url) to read the username.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		return base64_decode( $input, true );
	}
}
