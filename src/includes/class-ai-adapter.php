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
	 * @return string
	 */
	public static function get_calibration_aware_prompt() {
		$prompt = 'You are a highly skilled geographer API. Analyze the text and extract locations.';

		$rules = array();

		$use_granularity = \jeo_settings()->get_option( 'ai_cal_use_granularity', true );
		if ( $use_granularity ) {
			$granularity = \jeo_settings()->get_option( 'ai_cal_granularity', 'balanced' );
			if ( 'broad' === $granularity ) {
				$rules[] = 'Prefer extracting large-scale locations (countries, regions, states, major cities). Avoid small neighborhoods, streets, or individual landmarks.';
			} elseif ( 'fine' === $granularity ) {
				$rules[] = 'Prioritize extracting specific, fine-grained locations (streets, landmarks, neighborhoods, points of interest). Do not skip detailed addresses or place names.';
			} else {
				$rules[] = 'Extract a balanced mix of locations: cities, neighborhoods, and notable landmarks. Use common sense to determine importance.';
			}
		}

		$use_confidence = \jeo_settings()->get_option( 'ai_cal_use_confidence', true );
		if ( $use_confidence ) {
			$confidence = absint( \jeo_settings()->get_option( 'ai_cal_confidence', 50 ) );
			$rules[]    = "Only output locations with a confidence level of at least {$confidence}. If uncertain, skip the location rather than guessing.";
		}

		$use_title_weight = \jeo_settings()->get_option( 'ai_cal_use_title_weight', true );
		if ( $use_title_weight ) {
			$title_weight = absint( \jeo_settings()->get_option( 'ai_cal_title_weight', 70 ) );
			$rules[]      = "When a location is mentioned in the post title, apply a priority boost of {$title_weight} percent. Title mentions usually indicate the primary geographic focus of the content.";
		}

		$primary_threshold   = absint( \jeo_settings()->get_option( 'ai_cal_primary_threshold', 75 ) );
		$secondary_threshold = absint( \jeo_settings()->get_option( 'ai_cal_secondary_threshold', 35 ) );
		$use_primary         = \jeo_settings()->get_option( 'ai_cal_use_primary_threshold', true );
		$use_secondary       = \jeo_settings()->get_option( 'ai_cal_use_secondary_threshold', true );

		if ( $use_primary ) {
			$rules[] = "Locations with a confidence score of {$primary_threshold} or higher should be classified as PRIMARY (main geographic focus of the content).";
		}

		if ( $use_secondary ) {
			if ( $use_primary ) {
				$rules[] = "Locations with a confidence score below {$primary_threshold} but at least {$secondary_threshold} should be classified as SECONDARY (mentioned but not central).";
			}
			$rules[] = "Locations with a confidence score below {$secondary_threshold} should be discarded entirely (treated as not relevant enough).";
		}

		$use_primary_limit = \jeo_settings()->get_option( 'ai_cal_use_primary_limit', false );
		if ( $use_primary_limit ) {
			$primary_max = absint( \jeo_settings()->get_option( 'ai_cal_primary_max', 10 ) );
			$rules[]     = "Return at most {$primary_max} PRIMARY location(s). Never exceed this limit.";
		}

		$use_secondary_limit = \jeo_settings()->get_option( 'ai_cal_use_secondary_limit', false );
		if ( $use_secondary_limit ) {
			$secondary_max = absint( \jeo_settings()->get_option( 'ai_cal_secondary_max', 10 ) );
			$rules[]       = "Return at most {$secondary_max} SECONDARY location(s). Never exceed this limit.";
		}

		$rules[] = "CRITICAL: Each location object MUST include the boolean field 'is_primary'. Set it to true ONLY for locations that are the MAIN geographic focus of the content (where the story happens, the central territory, or the primary object of the report). Set it to false for all secondary, supporting, or contextual locations. Do NOT rely solely on confidence scores for this classification; use your editorial judgment based on the text analysis.";

		if ( ! empty( $rules ) ) {
			$prompt .= "\n\nFollow these rules:\n- " . implode( "\n- ", $rules );
		}

		return $prompt;
	}

	/**
	 * Build the enforced JSON schema block.
	 *
	 * Adapts the precision instruction based on active calibration settings
	 * to avoid conflicting with confidence rules.
	 *
	 * @return string
	 */
	protected function build_enforced_schema() {
		$use_confidence = \jeo_settings()->get_option( 'ai_cal_use_confidence', true );
		$confidence     = absint( \jeo_settings()->get_option( 'ai_cal_confidence', 50 ) );

		if ( $use_confidence ) {
			$precision_instruction = "Only include locations with a confidence score of at least {$confidence}. Do not include locations below this threshold; our system expects you to filter them at the source.";
		} else {
			$precision_instruction = "Include EVERY possible geographic location found in the text. Even if you have low confidence, include it and set the 'confidence' score accordingly. Do not be overly cautious; our system will handle the final filtering based on your score.";
		}

		return "

		CRITICAL INSTRUCTION: You MUST respond ONLY with a raw, flat JSON array of objects. Do not nest the array inside a parent object.
		Each object inside the array MUST have EXACTLY these keys: 'name', 'lat', 'lon', 'quote', 'confidence', 'is_primary'. Do NOT use any other keys.
			- 'name': The location name.
			- 'lat': Latitude (string or float).
			- 'lon': Longitude (string or float).
			- 'quote': A short relevant snippet (10-15 words) from the provided text.
			- 'confidence': An integer 0-100.
			- 'is_primary': A boolean (true or false) indicating whether this location is the PRIMARY geographic focus of the content. Use true only for the main location(s) central to the story; use false for secondary or supporting locations.

			{$precision_instruction}

			Example: [{\"name\": \"Teatro Amazonas\", \"lat\": -3.1303, \"lon\": -60.0234, \"quote\": \"...localizado no centro...\", \"confidence\": 95, \"is_primary\": true}]

		If no locations are found, return exactly []. Do not use markdown backticks, no conversational text. Output MUST start with [ and end with ].";
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
	 * Serves as a safety net for prompts generated before the assistant update,
	 * or when the LLM ignored the meta-prompt and included the block anyway.
	 *
	 * @param string $prompt The prompt to sanitize.
	 * @return string
	 */
	protected function strip_legacy_json_instructions( $prompt ) {
		// Remove everything from "### OUTPUT FORMAT MANDATE" to the end of the prompt.
		$prompt = preg_replace( '/\s*### OUTPUT FORMAT MANDATE.*$/s', '', $prompt );

		// Remove the legacy CRITICAL INSTRUCTION block if it appears inline.
		$prompt = preg_replace( '/\s*CRITICAL INSTRUCTION: You MUST respond ONLY with a raw, flat JSON array.*$/s', '', $prompt );

		return trim( $prompt );
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
