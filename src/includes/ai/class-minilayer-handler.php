<?php
/**
 * Minilayer REST Handler — delegates to Minilayer_Service.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Registers the /jeo/v1/minilayer/generate REST endpoint.
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

		$result = Minilayer_Service::generate_and_create( $prompt, $layer_name );

		if ( is_wp_error( $result ) ) {
			$code     = $result->get_error_code();
			$status   = ( 'minilayer_parse_error' === $code || 'minilayer_missing_style_id' === $code ) ? 502 : 400;
			$response = array( 'error' => $result->get_error_message() );

			if ( 502 === $status ) {
				$response['raw_output'] = $prompt;
			}

			return new \WP_REST_Response( $response, $status );
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'layer'   => $result,
			),
			200
		);
	}
}
