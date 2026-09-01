<?php
/**
 * Deterministic Mapbox style builder for AI-generated layers.
 *
 * Replaces the Mapbox DevKit MCP with direct Styles API calls for
 * boundary and thematic layers that require composed styles.
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
	 * Default boundary styling.
	 *
	 * @var array<string,mixed>
	 */
	private const DEFAULT_BOUNDARY_STYLE = array(
		'fill_color'   => '#8e44ad',
		'fill_opacity' => 0.15,
		'line_color'   => '#8e44ad',
		'line_width'   => 2,
		'line_opacity' => 0.9,
	);

	/**
	 * Build a simple boundary style from a GeoJSON URL.
	 *
	 * @param string $geojson_url Public URL of the boundary GeoJSON.
	 * @param string $display_name Human-readable name for the boundary.
	 * @param array  $options     Optional styling overrides.
	 * @return array Style definition as an associative array.
	 */
	public static function build_boundary_style( string $geojson_url, string $display_name, array $options = array() ): array {
		$options = wp_parse_args( $options, self::DEFAULT_BOUNDARY_STYLE );

		$source_id = 'boundary-source';
		$fill_id   = 'boundary-fill';
		$line_id   = 'boundary-line';

		return array(
			'version'  => 8,
			'name'     => sanitize_text_field( $display_name ),
			'metadata' => array(
				'mapbox:type' => 'template',
				'jeo:source'  => 'boundary',
			),
			'sources'  => array(
				$source_id => array(
					'type' => 'geojson',
					'data' => esc_url_raw( $geojson_url ),
				),
			),
			'layers'   => array(
				array(
					'id'     => $fill_id,
					'type'   => 'fill',
					'source' => $source_id,
					'paint'  => array(
						'fill-color'   => sanitize_hex_color( $options['fill_color'] ),
						'fill-opacity' => (float) $options['fill_opacity'],
					),
				),
				array(
					'id'     => $line_id,
					'type'   => 'line',
					'source' => $source_id,
					'paint'  => array(
						'line-color'   => sanitize_hex_color( $options['line_color'] ),
						'line-width'   => (float) $options['line_width'],
						'line-opacity' => (float) $options['line_opacity'],
					),
				),
			),
		);
	}

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
			return new \WP_Error(
				'jeo_mapbox_style_publish_http',
				sprintf(
					/* translators: %d: HTTP status code. */
					__( 'Mapbox Styles API returned HTTP %d.', 'jeowp' ),
					$code
				)
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
