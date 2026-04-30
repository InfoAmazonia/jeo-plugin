<?php
/**
 * Minilayer REST Handler — orchestrates AI layer generation and CPT creation.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Registers the /jeo/v1/minilayer/generate REST endpoint and orchestrates
 * the AI style generation → JEO layer CPT creation pipeline.
 */
class Minilayer_Handler {

	use Singleton;

	/**
	 * Bootstrap the handler.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register the minilayer REST routes.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/minilayer/generate',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_generate' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * REST callback: generate a Mapbox style from a text prompt and create a JEO layer.
	 *
	 * @param \WP_REST_Request $request The incoming request.
	 * @return \WP_REST_Response
	 */
	public function api_generate( $request ) {
		$prompt     = sanitize_textarea_field( $request->get_param( 'prompt' ) );
		$layer_name = sanitize_text_field( $request->get_param( 'layer_name' ) );

		if ( empty( $prompt ) ) {
			return new \WP_REST_Response(
				array( 'error' => __( 'A prompt is required.', 'jeo' ) ),
				400
			);
		}

		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return new \WP_REST_Response(
				array( 'error' => __( 'Mapbox API key is not configured. Set it in JEO Settings.', 'jeo' ) ),
				400
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_REST_Response(
				array( 'error' => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeo' ) ),
				400
			);
		}

		try {
			$agent = new Minilayer_Agent( $mapbox_key );
			$raw   = $agent->generate( $prompt );
		} catch ( \Exception $e ) {
			return new \WP_REST_Response(
				array( 'error' => $e->getMessage() ),
				500
			);
		}

		$result = $this->parse_response( $raw );
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response(
				array(
					'error'      => $result->get_error_message(),
					'raw_output' => $raw,
				),
				502
			);
		}

		$layer = $this->create_layer( $result, $layer_name );
		if ( is_wp_error( $layer ) ) {
			return new \WP_REST_Response(
				array(
					'error'      => $layer->get_error_message(),
					'style'      => $result,
					'raw_output' => $raw,
				),
				500
			);
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'style'   => $result,
				'layer'   => $layer,
			),
			200
		);
	}

	/**
	 * Parse the raw AI response and extract the style JSON object.
	 *
	 * @param string $raw Raw text from the AI agent.
	 * @return array|\WP_Error Parsed style data or error.
	 */
	private function parse_response( string $raw ) {
		$text = preg_replace( '/<(thought|thinking)>.*?<\/\1>/is', '', $raw );

		if ( preg_match( '/```(?:json)?\s*(.*?)\s*```/is', $text, $matches ) ) {
			$text = $matches[1];
		}

		$start = strpos( $text, '{' );
		if ( false !== $start ) {
			$depth     = 0;
			$len       = strlen( $text );
			$in_string = false;
			$escape    = false;

			for ( $i = $start; $i < $len; $i++ ) {
				$ch = $text[ $i ];

				if ( $escape ) {
					$escape = false;
					continue;
				}

				if ( '\\' === $ch ) {
					$escape = true;
					continue;
				}

				if ( '"' === $ch ) {
					$in_string = ! $in_string;
					continue;
				}

				if ( $in_string ) {
					continue;
				}

				if ( '{' === $ch ) {
					++$depth;
				} elseif ( '}' === $ch ) {
					--$depth;
					if ( 0 === $depth ) {
						$text = substr( $text, $start, $i - $start + 1 );
						break;
					}
				}
			}
		}

		$parsed = json_decode( trim( $text ), true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $parsed ) ) {
			return new \WP_Error(
				'minilayer_parse_error',
				__( 'Failed to parse AI response as JSON.', 'jeo' )
			);
		}

		if ( empty( $parsed['style_id'] ) ) {
			return new \WP_Error(
				'minilayer_missing_style_id',
				__( 'AI response did not include a style_id.', 'jeo' )
			);
		}

		return $parsed;
	}

	/**
	 * Create a map-layer CPT post from the generated style data.
	 *
	 * @param array  $style_data Parsed style data from the AI.
	 * @param string $layer_name Optional custom title for the layer.
	 * @return array|\WP_Error Layer info array or error.
	 */
	private function create_layer( array $style_data, $layer_name = '' ) {
		$style_id = $style_data['style_id'];
		/* translators: %s: Mapbox style ID. */
		$fallback   = sprintf( __( 'Minilayer: %s', 'jeo' ), $style_id );
		$post_title = ! empty( $layer_name )
			? $layer_name
			: ( $style_data['layer_title'] ?? $style_data['style_name'] ?? $fallback );

		$post_id = wp_insert_post(
			array(
				'post_type'   => 'map-layer',
				'post_title'  => $post_title,
				'post_status' => 'publish',
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		update_post_meta( $post_id, 'type', 'mapbox' );
		update_post_meta(
			$post_id,
			'layer_type_options',
			array(
				'style_id' => $style_id,
			)
		);

		return array(
			'id'       => $post_id,
			'title'    => $post_title,
			'type'     => 'mapbox',
			'style_id' => $style_id,
			'edit_url' => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
		);
	}
}
