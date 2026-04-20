<?php

namespace Jeo;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI Adapter Interface
 *
 * All AI providers must implement this.
 */
abstract class AI_Adapter {

	/**
	 * Georeference a post content.
	 *
	 * @param string $title Post title.
	 * @param string $content Post content.
	 * @param string $override_prompt Optional custom prompt for testing.
	 * @return array|\WP_Error
	 */
	abstract public function georeference( $title, $content, $override_prompt = null );

	/**
	 * Get the system prompt.
	 *
	 * @param string $override_prompt Optional prompt to override the saved one.
	 * @return string
	 */
	protected function get_system_prompt( $override_prompt = null ) {
		$prompt = '';

		if ( ! empty( $override_prompt ) ) {
			$prompt = $override_prompt;
		} else {
			$use_custom = \jeo_settings()->get_option( 'ai_use_custom_prompt' );
			if ( $use_custom ) {
				$custom = \jeo_settings()->get_option( 'ai_system_prompt' );
				if ( ! empty( $custom ) ) {
					$prompt = $custom;
				}
			}
		}

		if ( empty( $prompt ) ) {
			$prompt = __( 'You are a highly skilled geographer API. Analyze the text and extract locations.', 'jeo' );
		}

		// Allow internal tools (like the prompt generator) to bypass the aggressive schema injection
		if ( strpos( $prompt, '[SKIP_ENFORCED_SCHEMA]' ) !== false ) {
			return trim( str_replace( '[SKIP_ENFORCED_SCHEMA]', '', $prompt ) );
		}

		// Inject mandatory JSON schema constraints aggressively to any prompt to prevent formatting regressions
		$enforced_schema = "

	CRITICAL INSTRUCTION: You MUST respond ONLY with a raw, flat JSON array of objects. Do not nest the array inside a parent object.
	Each object inside the array MUST have EXACTLY these keys: 'name', 'lat', 'lng', 'quote', 'confidence'. Do NOT use any other keys.
	- \"name\": The location name.
	- \"lat\": Latitude (string or float).
	- \"lng\": Longitude (string or float).
	- \"quote\": A short relevant snippet (10-15 words) from the provided text.
	- \"confidence\": An integer 0-100.

	INSTRUCTION ON PRECISION: Include EVERY possible geographic location found in the text. Even if you have low confidence, include it and set the 'confidence' score accordingly. Do not be overly cautious; our system will handle the final filtering based on your score.

	Example: [{\"name\": \"Teatro Amazonas\", \"lat\": -3.1303, \"lng\": -60.0234, \"quote\": \"...localizado no centro...\", \"confidence\": 95}]

	If no locations are found, return exactly []. Do not use markdown backticks, no conversational text. Output MUST start with [ and end with ].";

		return $prompt . $enforced_schema;
	}
	/**
	 * Log AI Data and Costs for debugging.
	 *
	 * @param string $provider    Provider name.
	 * @param mixed  $input       The prompt sent.
	 * @param mixed  $output      The raw response received.
	 * @param int    $input_tokens  Tokens used for input.
	 * @param int    $output_tokens Tokens generated as output.
	 */
	protected function log_debug( $provider, $input, $output, $input_tokens = 0, $output_tokens = 0 ) {
		$debug_mode = \jeo_settings()->get_option( 'ai_debug_mode' );
		
		if ( empty( $debug_mode ) ) {
			return;
		}

		\jeo_ai_logger()->insert_log( $provider, $input, $output, $input_tokens, $output_tokens );
	}

	/**
	 * Handle API HTTP Errors.
	 *
	 * @param array|WP_Error $response The wp_remote_post response.
	 * @param string         $provider The name of the AI provider.
	 * @return array|\WP_Error
	 */
	protected function validate_api_response( $response, $provider ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = wp_remote_retrieve_body( $response );
		$data        = json_decode( $body, true );

		if ( $status_code >= 400 ) {
			$error_msg = 'Unknown Error';
			if ( isset( $data['error']['message'] ) ) {
				$error_msg = $data['error']['message'];
			} elseif ( isset( $data['error'] ) && is_string( $data['error'] ) ) {
				$error_msg = $data['error'];
			}
			return new \WP_Error( 'api_error', "{$provider} API Error ({$status_code}): {$error_msg}" );
		}

		return $data;
	}

	/**
	 * Extract and parse JSON from AI response text.
	 *
	 * @param string $text The raw text from AI.
	 * @return array|\WP_Error
	 */
	protected function parse_json_from_text( $text ) {
		if ( empty( $text ) ) {
			return new \WP_Error( 'empty_response', __( 'Empty response from AI.', 'jeo' ) );
		}

		// 1. Remove "Thinking" or "Thought" blocks often returned by models like DeepSeek or Gemini 2.5
		$text = preg_replace( '/<(thought|thinking)>.*?<\/\1>/is', '', $text );

		// 2. Remove markdown backticks if wrapped
		if ( preg_match( '/```(?:json)?\s*(.*?)\s*```/is', $text, $matches ) ) {
			$text = $matches[1];
		}

		// 3. Surgical Extraction: Find the first '[' and its MATCHING ']'
		// This prevents capturing extra data that LLMs often append after the array (like "topics", "keywords", etc.)
		$start_pos = strpos( $text, '[' );
		if ( $start_pos !== false ) {
			$depth = 0;
			$found_end = false;
			$len = strlen( $text );
			
			for ( $i = $start_pos; $i < $len; $i++ ) {
				if ( $text[ $i ] === '[' ) {
					$depth++;
				} elseif ( $text[ $i ] === ']' ) {
					$depth--;
					if ( $depth === 0 ) {
						$text = substr( $text, $start_pos, ( $i - $start_pos ) + 1 );
						$found_end = true;
						break;
					}
				}
			}
		}

		// Clean up the string to ensure it parses properly
		$text = trim( $text );
		
		// Attempt to parse the JSON
		$parsed = json_decode( $text, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return new \WP_Error( 'json_parse_error', 'Invalid JSON from AI: ' . json_last_error_msg() . ' | Cleaned output: ' . $text );
		}

		if ( ! is_array( $parsed ) ) {
			return new \WP_Error( 'json_format_error', 'AI response is not a JSON array.' );
		}

		return $parsed;
	}
}
