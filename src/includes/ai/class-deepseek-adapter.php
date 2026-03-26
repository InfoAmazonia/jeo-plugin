<?php

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

use Jeo\AI_Adapter;

/**
 * DeepSeek AI Adapter
 */
class DeepSeek_Adapter extends AI_Adapter {

	/**
	 * Georeference using DeepSeek API.
	 */
	public function georeference( $title, $content, $override_prompt = null ) {
		$api_key = \jeo_settings()->get_option( 'deepseek_api_key' );

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'missing_api_key', __( 'DeepSeek API Key is missing.', 'jeo' ) );
		}

		$url = 'https://api.deepseek.com/chat/completions';

		$body = array(
			'model'       => 'deepseek-chat',
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

		$data = $this->validate_api_response( $response, 'DeepSeek' );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		if ( isset( $data['choices'][0]['message']['content'] ) ) {
			$text = $data['choices'][0]['message']['content'];
			return $this->parse_json_from_text( $text );
		}

		return new \WP_Error( 'ai_error', __( 'Could not parse AI response from DeepSeek structure.', 'jeo' ) );
	}
}
