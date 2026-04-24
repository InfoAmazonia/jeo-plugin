<?php
/**
 * AI request logging.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI Logger Class
 *
 * Manages the Cost Dashboard by storing AI execution data via a private CPT.
 */
class AI_Logger {

	use Singleton;

	const POST_TYPE = 'jeo-ai-log';

	/**
	 * Init the logger.
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ) );
	}

	/**
	 * Register the private Custom Post Type for AI Logs.
	 */
	public function register_post_type() {
		$labels = array(
			'name'          => _x( 'AI Usage Logs', 'Post Type General Name', 'jeo' ),
			'singular_name' => _x( 'AI Usage Log', 'Post Type Singular Name', 'jeo' ),
			'menu_name'     => __( 'AI Logs (Costs)', 'jeo' ),
			'all_items'     => __( 'All AI Logs', 'jeo' ),
			'view_item'     => __( 'View Log', 'jeo' ),
		);

		$args = array(
			'label'               => __( 'AI Usage Log', 'jeo' ),
			'description'         => __( 'Internal logs for AI token usage and costs.', 'jeo' ),
			'labels'              => $labels,
			'supports'            => array( 'title', 'custom-fields' ), // Only title and meta.
			'hierarchical'        => false,
			'public'              => false, // Private CPT.
			'show_ui'             => true,
			'show_in_menu'        => 'jeo-settings', // Render under Settings.
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'capability_type'     => 'page',
			'capabilities'        => array(
				'create_posts' => 'do_not_allow', // Prevents users from manually creating logs.
			),
			'map_meta_cap'        => true,
		);

		register_post_type( self::POST_TYPE, $args );
	}

	/**
	 * Logs the execution, tokens, and model data.
	 *
	 * @param string $provider    Provider name (e.g. 'gemini-2.5-flash').
	 * @param string $prompt      The input prompt sent.
	 * @param string $response    The raw output received.
	 * @param int    $input_tokens  Tokens used for input.
	 * @param int    $output_tokens Tokens generated as output.
	 */
	public function insert_log( $provider, $prompt, $response, $input_tokens = 0, $output_tokens = 0 ) {
		$total_tokens = (int) $input_tokens + (int) $output_tokens;
		$title        = sprintf( 'Log [%s] - %d Tokens', $provider, $total_tokens );

		$post_id = wp_insert_post(
			array(
				'post_type'   => self::POST_TYPE,
				'post_title'  => $title,
				'post_status' => 'private',
			)
		);

		if ( ! is_wp_error( $post_id ) ) {
			// Save metrics for cost dashboard.
			update_post_meta( $post_id, '_jeo_ai_provider', $provider );
			update_post_meta( $post_id, '_jeo_ai_input_tokens', $input_tokens );
			update_post_meta( $post_id, '_jeo_ai_output_tokens', $output_tokens );
			update_post_meta( $post_id, '_jeo_ai_total_tokens', $total_tokens );

			// Save context.
			update_post_meta( $post_id, '_jeo_ai_prompt', wp_json_encode( $prompt, JSON_UNESCAPED_UNICODE ) );
			update_post_meta( $post_id, '_jeo_ai_response', wp_json_encode( $response, JSON_UNESCAPED_UNICODE ) );
		}
	}

	/**
	 * Updates the global token aggregate for RAG operations.
	 * Using a 1 token = ~4 chars heuristic for embedding approximations.
	 *
	 * @param string $type The operation type: 'vectorize' or 'retrieve'.
	 * @param int    $char_length The total number of characters processed.
	 */
	public function add_embedding_tokens( $type, $char_length ) {
		$estimated_tokens = (int) ceil( $char_length / 4 );

		$totals = get_option(
			'jeo_ai_embedding_tokens',
			array(
				'vectorize' => 0,
				'retrieve'  => 0,
			)
		);

		if ( ! isset( $totals[ $type ] ) ) {
			$totals[ $type ] = 0;
		}

		$totals[ $type ] += $estimated_tokens;
		update_option( 'jeo_ai_embedding_tokens', $totals, false );
	}

	/**
	 * Retrieve the aggregate embedding token counts.
	 *
	 * @return array
	 */
	public function get_embedding_tokens() {
		return get_option(
			'jeo_ai_embedding_tokens',
			array(
				'vectorize' => 0,
				'retrieve'  => 0,
			)
		);
	}
}
