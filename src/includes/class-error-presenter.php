<?php
/**
 * Error presentation layer (W1 reliability contract).
 *
 * @package Jeo
 */

namespace Jeo;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Produces editor-friendly error payloads without discarding the technical detail.
 *
 * Canonical shape (Contract A of the W1 reliability wave):
 *
 *     { message: string, action: string, detail: mixed }
 *
 * - `message`: human cause, one sentence, no jargon, no raw JSON.
 * - `action`:  the next step the editor can take.
 * - `detail`:  the full technical information (preserved, never discarded),
 *              collapsed by the frontend behind a "Copy details" affordance.
 */
class Error_Presenter {

	/**
	 * Build the canonical error payload array.
	 *
	 * @param string $message Human-readable cause (one sentence).
	 * @param string $action  Recommended next step for the editor.
	 * @param mixed  $detail  Full technical detail (string, array or null).
	 * @return array
	 */
	public static function wrap( $message, $action, $detail = null ) {
		return array(
			'message' => $message,
			'action'  => $action,
			'detail'  => $detail,
		);
	}

	/**
	 * Build a WP_Error carrying the Contract A payload in its data.
	 *
	 * REST serializes it as:
	 *
	 *     { code, message, data: { status, action, detail } }
	 *
	 * @param string $code    Machine-readable error code.
	 * @param string $message Human-readable cause.
	 * @param string $action  Recommended next step.
	 * @param mixed  $detail  Full technical detail.
	 * @param int    $status  HTTP status for the REST response.
	 * @return WP_Error
	 */
	public static function wp_error( $code, $message, $action, $detail = null, $status = 400 ) {
		return new WP_Error(
			$code,
			$message,
			array(
				'status' => $status,
				'action' => $action,
				'detail' => $detail,
			)
		);
	}

	/**
	 * Extract the useful cause from a raw provider/AI error string.
	 *
	 * Provider failures often arrive as long JSON blobs (or exception messages
	 * embedding them) with the actionable cause buried in the middle. This
	 * keeps the useful line as the message and the full raw string as detail.
	 *
	 * @param string $raw Raw error message (possibly a JSON blob).
	 * @return array{message:string,action:string,detail:string} Contract A payload.
	 */
	public static function humanize_provider_error( $raw ) {
		$raw   = (string) $raw;
		$cause = '';

		// Extract the first JSON object embedded in the message, if any.
		if ( preg_match( '/\{.*\}/s', $raw, $matches ) ) {
			$decoded = json_decode( $matches[0], true );
			if ( is_array( $decoded ) ) {
				if ( ! empty( $decoded['error']['message'] ) && is_string( $decoded['error']['message'] ) ) {
					$cause = $decoded['error']['message'];
				} elseif ( ! empty( $decoded['message'] ) && is_string( $decoded['message'] ) ) {
					$cause = $decoded['message'];
				} elseif ( ! empty( $decoded['error'] ) && is_string( $decoded['error'] ) ) {
					$cause = $decoded['error'];
				}
			}
		}

		// Fall back to the "Provider API Error (status): cause" pattern.
		if ( '' === $cause && preg_match( '/API Error \((\d+)\):\s*(.+)$/is', $raw, $matches ) ) {
			$status = $matches[1];
			$cause  = trim( $matches[2] );

			// If the captured cause is still a JSON blob, keep digging.
			if ( false !== strpos( $cause, '{' ) && preg_match( '/\{.*\}/s', $cause, $inner ) ) {
				$decoded = json_decode( $inner[0], true );
				if ( is_array( $decoded ) && ! empty( $decoded['error']['message'] ) ) {
					$cause = $decoded['error']['message'];
				}
			}

			/* translators: %s: useful cause reported by the AI provider. */
			$cause = sprintf( __( 'The AI provider rejected the request (code %1$s): %2$s', 'jeowp' ), $status, $cause );
		}

		if ( '' === $cause ) {
			// Trim to a single readable line, capped.
			$cause = trim( preg_replace( '/\s+/u', ' ', $raw ) );
			if ( mb_strlen( $cause ) > 220 ) {
				$cause = mb_substr( $cause, 0, 220 ) . '…';
			}
			/* translators: %s: short technical cause. */
			$cause = sprintf( __( 'The AI provider test failed: %s', 'jeowp' ), $cause );
		}

		$action = __( 'Check the API key and model on the AI settings page and run the test again. If the key is correct and the error persists, the provider may be temporarily unavailable.', 'jeowp' );

		/**
		 * Filter the human payload built for a provider error.
		 *
		 * @param array{message:string,action:string,detail:string} $payload Contract A payload.
		 * @param string                                            $raw     Original raw error message.
		 */
		$payload = apply_filters(
			'jeo_error_presenter_provider_payload',
			self::wrap( $cause, $action, $raw ),
			$raw
		);

		return $payload;
	}

	/**
	 * Build a Contract A payload from an exception.
	 *
	 * Known internal jargon (e.g. the missing embedding model) is translated
	 * into an editor-facing message with a concrete action; everything else
	 * goes through the provider-error humanizer. The technical detail
	 * (message + source location) is always preserved in `detail`.
	 *
	 * @param \Throwable $e Caught exception.
	 * @return array{message:string,action:string,detail:string} Contract A payload.
	 */
	public static function from_exception( $e ) {
		$raw    = $e->getMessage();
		$detail = $raw;
		$where  = $e->getFile() . ':' . $e->getLine();
		if ( '' !== $where ) {
			$detail .= ' in ' . $where;
		}

		if ( false !== stripos( $raw, 'No Embedding Model configured' ) ) {
			return self::wrap(
				__( 'Semantic layer search is unavailable because no embedding model is configured.', 'jeowp' ),
				__( 'Select an embedding model in Settings → AI (General tab) and save, then try again.', 'jeowp' ),
				$detail
			);
		}

		$payload           = self::humanize_provider_error( $raw );
		$payload['detail'] = $detail;

		return $payload;
	}

	/**
	 * Translate cryptic core meta-schema errors on map routes into Contract A payloads.
	 *
	 * Hooked on `rest_post_dispatch` for the `/wp/v2/map` and `/wp/v2/map-layer`
	 * routes. The original message is preserved in `data.detail` — the code and
	 * status are never changed.
	 *
	 * @param WP_REST_Response $result  REST response being dispatched.
	 * @param WP_REST_Server   $server  REST server (unused).
	 * @param WP_REST_Request  $request Current request.
	 * @return WP_REST_Response
	 */
	public static function translate_map_rest_error( $result, $server = null, $request = null ) {
		unset( $server );

		if ( ! $result instanceof WP_REST_Response || ! $result->is_error() ) {
			return $result;
		}

		if ( ! $request instanceof WP_REST_Request ) {
			return $result;
		}

		$route = $request->get_route();
		if ( 0 !== strpos( (string) $route, '/wp/v2/map' ) ) {
			return $result;
		}

		$data  = $result->get_data();
		$code  = isset( $data['code'] ) ? $data['code'] : '';
		$codes = array(
			'rest_additional_properties_forbidden',
			'rest_invalid_param',
			'rest_meta_database_error',
		);

		if ( ! in_array( $code, $codes, true ) ) {
			return $result;
		}

		$original_message = isset( $data['message'] ) ? $data['message'] : '';
		$original_data    = isset( $data['data'] ) && is_array( $data['data'] ) ? $data['data'] : array();

		switch ( $code ) {
			case 'rest_additional_properties_forbidden':
				$property = '';
				if ( preg_match( '/^(.+?)\s+is not a valid property/i', $original_message, $matches ) ) {
					$property = $matches[1];
				}

				if ( $property ) {
					/* translators: %s: field name rejected by the server. */
					$message = sprintf( __( 'This map could not be saved completely: the data sent contains a field the server does not accept ("%s").', 'jeowp' ), $property );
				} else {
					$message = __( 'This map could not be saved completely: the data sent contains a field the server does not accept.', 'jeowp' );
				}
				$action = __( 'The map was saved without the rejected change. Review the map panels (layers and settings) and save again.', 'jeowp' );
				break;

			case 'rest_invalid_param':
				// Only translate metadata failures — other param errors keep core wording.
				$params = isset( $original_data['params'] ) && is_array( $original_data['params'] ) ? $original_data['params'] : array();
				if ( ! array_key_exists( 'meta', $params ) && false === strpos( $original_message, 'meta' ) ) {
					return $result;
				}

				$message = __( 'The map settings could not be saved: some of the data sent is invalid.', 'jeowp' );
				$action  = __( 'Review the map panels (layers, settings) and try saving again.', 'jeowp' );
				break;

			default:
				$message = __( 'The map data could not be stored in the database.', 'jeowp' );
				$action  = __( 'Try saving again. If the problem persists, contact the site administrator.', 'jeowp' );
		}

		$original_data['action'] = $action;
		$original_data['detail'] = $original_message;

		$result->set_data(
			array(
				'code'    => $code,
				'message' => $message,
				'data'    => $original_data,
			)
		);

		return $result;
	}
}
