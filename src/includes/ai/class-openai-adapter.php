<?php

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

use Jeo\AI_Adapter;

/**
 * OpenAI AI Adapter
 */
class OpenAI_Adapter extends AI_Adapter {

	/**
	 * Georeference using OpenAI API.
	 */
	public function georeference( $title, $content, $override_prompt = null ) {
		$api_key = \jeo_settings()->get_option( 'openai_api_key' );

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'missing_api_key', __( 'OpenAI API Key is missing.', 'jeo' ) );
		}

		$url = 'https://api.openai.com/v1/chat/completions';

		$body = array(
			'model'       => 'gpt-4o',
			'temperature' => 0.1,
			'messages'    => array(
				array(
					'role'    => 'system',
					'content' => $this->get_system_prompt( $override_prompt ),
				),
				array(
					'role'    => 'user',
					'content' => "Title: " . $title . "\n\nContent: " . $content,
				),
			),
		);

		$response = wp_remote_post(
			$url,
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array(
					'Content-Type'  => 'application/json',
					'Authorization' => 'Bearer ' . $api_key,
				),
				'timeout' => 30,
			)
		);

		$data = $this->validate_api_response( $response, 'OpenAI' );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		if ( isset( $data['choices'][0]['message']['content'] ) ) {
			$text = $data['choices'][0]['message']['content'];
			return $this->parse_json_from_text( $text );
		}

		return new \WP_Error( 'ai_error', __( 'Could not parse AI response from OpenAI structure.', 'jeo' ) );
	}
}
