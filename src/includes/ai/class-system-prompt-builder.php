<?php
/**
 * Unified system prompt builder for all JEO AI features.
 *
 * Centralises prompt construction, calibration rule generation, and
 * schema injection so that georeferencing, minimap, prompt engineering,
 * and future features share a single source of truth for LLM instructions.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * System Prompt Builder
 *
 * All system prompts in JEO should be built through this class.
 * It ensures calibration settings, language, and formatting rules
 * are applied consistently.
 */
class System_Prompt_Builder {

	/**
	 * Build the calibration-aware georeferencing prompt.
	 *
	 * Reads active calibration settings and incorporates them so that
	 * users who do not use the AI Prompt Assistant still benefit from
	 * their calibration configuration.
	 *
	 * @return string
	 */
	public static function for_georeferencing(): string {
		$prompt = 'You are a highly skilled geographer API. Analyze the text and extract locations.';

		$rules = self::get_calibration_rules();

		$rules[] = "CRITICAL: Each location object MUST include the boolean field 'is_primary'. Set it to true ONLY for locations that are the MAIN geographic focus of the content (where the story happens, the central territory, or the primary object of the report). Set it to false for all secondary, supporting, or contextual locations. Do NOT rely solely on confidence scores for this classification; use your editorial judgment based on the text analysis.";

		if ( ! empty( $rules ) ) {
			$prompt .= "\n\nFollow these rules:\n- " . implode( "\n- ", $rules );
		}

		return $prompt;
	}

	/**
	 * Build the enforced JSON schema block for georeferencing.
	 *
	 * Adapts the precision instruction based on active calibration settings
	 * to avoid conflicting with confidence rules.
	 *
	 * @return string
	 */
	public static function get_georeference_schema_block(): string {
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
	 * Build the system prompt for the AI Prompt Engineer assistant.
	 *
	 * @return string
	 */
	public static function for_prompt_engineer(): string {
		return 'You are an expert AI prompt engineer for georeferencing systems. Your task is to generate highly optimized system prompts for extracting geographic locations from journalistic text. The prompt you generate will be used by a large language model to analyse articles and output JSON arrays of locations. Focus on clarity, specificity, and consistent JSON formatting.';
	}

	/**
	 * Build the system prompt for API key testing.
	 *
	 * @return string
	 */
	public static function for_test_connection(): string {
		return '[SKIP_ENFORCED_SCHEMA] Instruction: Return a JSON array confirming API access. Your ONLY output must be this exact format: [{"name": "SystemCheck", "lat": 0, "lon": 0, "quote": "Status: Ping", "confidence": 100}]';
	}

	/**
	 * Get calibration rules as an array of strings.
	 *
	 * These rules are derived from the JEO AI Settings calibration panel
	 * and can be reused by any feature that needs location-aware instructions.
	 *
	 * @return array
	 */
	public static function get_calibration_rules(): array {
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

		return $rules;
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
	public static function sanitize_prompt( string $prompt ): string {
		// Remove everything from "### OUTPUT FORMAT MANDATE" to the end of the prompt.
		$prompt = preg_replace( '/\s*### OUTPUT FORMAT MANDATE.*$/s', '', $prompt );

		// Remove the legacy CRITICAL INSTRUCTION block if it appears inline.
		$prompt = preg_replace( '/\s*CRITICAL INSTRUCTION: You MUST respond ONLY with a raw, flat JSON array.*$/s', '', $prompt );

		return trim( $prompt );
	}
}
