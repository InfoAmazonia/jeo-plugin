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
				'permission_callback' => AI_REST_Permissions::edit_posts(),
				'args'                => array(
					'prompt'     => array(
						'required'  => true,
						'type'      => 'string',
						'minLength' => 1,
					),
					'layer_name' => array(
						'required' => false,
						'type'     => 'string',
					),
				),
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
			$code   = $result->get_error_code();
			$status = ( 'minilayer_parse_error' === $code || 'minilayer_missing_style_id' === $code ) ? 502 : 400;

			$messages = array(
				'minilayer_no_mapbox_key'    => __( 'Mapbox API key is not configured. Set it in JEO Settings.', 'jeo' ),
				'minilayer_no_provider'      => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeo' ),
				'minilayer_agent_error'      => __( 'Could not generate the map style. Please try again.', 'jeo' ),
				'minilayer_parse_error'      => __( 'The AI returned an unexpected response. Please try again.', 'jeo' ),
				'minilayer_missing_style_id' => __( 'The AI did not create a valid style. Please try again.', 'jeo' ),
			);

			return new \WP_REST_Response(
				array(
					'success' => false,
					'error'   => $messages[ $code ] ?? $result->get_error_message(),
				),
				$status
			);
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
