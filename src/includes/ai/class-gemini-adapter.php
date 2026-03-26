<?php

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

use Jeo\AI_Adapter;

/**
 * Gemini AI Adapter
 */
class Gemini_Adapter extends AI_Adapter {

	/**
	 * Georeference using Google Gemini API.
	 */
	public function georeference( $title, $content, $override_prompt = null ) {
		$api_key = \jeo_settings()->get_option( 'gemini_api_key' );

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'missing_api_key', __( 'Gemini API Key is missing.', 'jeo' ) );
		}

		// Atualizado para os modelos suportados de 2026
		$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $api_key;

		$prompt = $this->get_system_prompt( $override_prompt ) . "\n\n" . "Title: " . $title . "\n\nContent: " . $content;

		$body = array(
			'contents'         => array(
				array(
					'parts' => array(
						array( 'text' => $prompt ),
					),
				),
			),
			'generationConfig' => array(
				'temperature' => 0.1,
			)
		);

		$response = wp_remote_post(
			$url,
			array(
				'body'    => wp_json_encode( $body ),
				'headers' => array( 'Content-Type' => 'application/json' ),
				'timeout' => 30,
			)
		);

		$data = $this->validate_api_response( $response, 'Gemini' );

		// Log raw data if enabled
		$this->log_debug( 'Gemini', $prompt, $data );

		if ( is_wp_error( $data ) ) {
			return $data;
		}

		if ( isset( $data['candidates'][0]['content']['parts'][0]['text'] ) ) {
			$text = $data['candidates'][0]['content']['parts'][0]['text'];
			return $this->parse_json_from_text( $text );
		}

		return new \WP_Error( 'ai_error', __( 'Could not parse AI response from Gemini structure.', 'jeo' ) );
	}
}
