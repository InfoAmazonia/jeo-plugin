<?php
/**
 * AI Adapter abstract class.
 *
 * @package Jeo
 */

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
	 * Build a calibration-aware default prompt.
	 *
	 * Reads active calibration settings and incorporates them so that
	 * users who do not use the AI Prompt Assistant still benefit from
	 * their calibration configuration.
	 *
	 * @deprecated 3.6.6 Use System_Prompt_Builder::for_georeferencing() instead.
	 * @return string
	 */
	public static function get_calibration_aware_prompt() {
		return AI\System_Prompt_Builder::for_georeferencing();
	}

	/**
	 * Build the enforced JSON schema block.
	 *
	 * @deprecated 3.6.6 Use System_Prompt_Builder::get_georeference_schema_block() instead.
	 * @return string
	 */
	protected function build_enforced_schema() {
		return AI\System_Prompt_Builder::get_georeference_schema_block();
	}

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
			$prompt = self::get_calibration_aware_prompt();
		}

		// Allow internal tools (like the prompt generator) to bypass the aggressive schema injection.
		if ( strpos( $prompt, '[SKIP_ENFORCED_SCHEMA]' ) !== false ) {
			return trim( str_replace( '[SKIP_ENFORCED_SCHEMA]', '', $prompt ) );
		}

		// When NeuronAI Structured Output is active, the schema is enforced natively by the provider
		// via the API response_format parameter. Adding JSON formatting instructions here would
		// create redundant/conflicting directives and waste tokens. Just return the clean prompt.
		if ( \jeo_settings()->get_option( 'ai_use_structured_output' ) ) {
			// Safety net: strip any legacy JSON formatting blocks that may have been pasted from
			// old prompts or generated before the assistant was updated. These patterns are specific
			// enough that legitimate editorial instructions are extremely unlikely to collide.
			$prompt = $this->strip_legacy_json_instructions( $prompt );
			return $prompt;
		}

		return $prompt . $this->build_enforced_schema();
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
	 * Strip legacy JSON formatting instructions from a prompt when Structured Output is active.
	 *
	 * @deprecated 3.6.6 Use System_Prompt_Builder::sanitize_prompt() instead.
	 * @param string $prompt The prompt to sanitize.
	 * @return string
	 */
	protected function strip_legacy_json_instructions( $prompt ) {
		return AI\System_Prompt_Builder::sanitize_prompt( $prompt );
	}

	/**
	 * Extract and parse JSON from AI response text.
	 *
	 * @param string $text The raw text from AI.
	 * @return array|\WP_Error
	 */
	protected function parse_json_from_text( $text ) {
		if ( empty( $text ) ) {
			return new \WP_Error( 'empty_response', __( 'Empty response from AI.', 'jeowp' ) );
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
		if ( false !== $start_pos ) {
			$depth     = 0;
			$found_end = false;
			$len       = strlen( $text );

			for ( $i = $start_pos; $i < $len; $i++ ) {
				if ( '[' === $text[ $i ] ) {
					++$depth;
				} elseif ( ']' === $text[ $i ] ) {
					--$depth;
					if ( 0 === $depth ) {
						$text      = substr( $text, $start_pos, ( $i - $start_pos ) + 1 );
						$found_end = true;
						break;
					}
				}
			}
		}

		// Clean up the string to ensure it parses properly.
		$text = trim( $text );

		// Attempt to parse the JSON.
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
