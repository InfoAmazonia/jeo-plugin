<?php
/**
 * WP-CLI commands for AI features.
 *
 * @package Jeo
 */

namespace Jeo\CLI;

use Jeo\AI\RAG_Agent;
use Jeo\AI\WP_Post_Data_Loader;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * WP-CLI commands for JEO AI features.
 */
class AI_CLI {

	/**
	 * Vectorize WordPress posts into the RAG Knowledge Base.
	 *
	 * ## OPTIONS
	 *
	 * [--post_type=<type>]
	 * : The post type to vectorize. Defaults to 'post'.
	 *
	 * [--batch_size=<size>]
	 * : Number of posts to process per batch. Defaults to 20.
	 *
	 * [--force]
	 * : Re-index posts even if they are already vectorized.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jeo ai vectorize
	 *     wp jeo ai vectorize --post_type=page --batch_size=10
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function vectorize( $args, $assoc_args ) {
		$post_type  = \WP_CLI\Utils\get_flag_value( $assoc_args, 'post_type', 'post' );
		$batch_size = (int) \WP_CLI\Utils\get_flag_value( $assoc_args, 'batch_size', 20 );
		$force      = \WP_CLI\Utils\get_flag_value( $assoc_args, 'force', false );

		\WP_CLI::log( "Starting vectorization for post type: {$post_type}" );

		// Check for model lock.
		$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
		$locked_model  = RAG_Agent::get_locked_model( 'jeo_knowledge' );

		if ( ! empty( $locked_model ) && ! empty( $current_model ) && $current_model !== $locked_model ) {
			\WP_CLI::error( "Vector Store mismatch! This store was initialized with '{$locked_model}', but your settings use '{$current_model}'. Please clear the store or revert the model before proceeding." );
		}

		// Setup lock if first time.
		if ( empty( $locked_model ) ) {
			RAG_Agent::setup_store_model( 'jeo_knowledge', $current_model );
		}

		$query_args = array(
			'post_type'      => $post_type,
			'post_status'    => 'publish',
			'posts_per_page' => $batch_size,
			'paged'          => 1,
		);

		if ( ! $force ) {
			// Only get posts that haven't been vectorized yet.
			$query_args['meta_query'] = array(
				array(
					'key'     => '_jeo_vectorized_at',
					'compare' => 'NOT EXISTS',
				),
			);
		}

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			\WP_CLI::success( 'No posts to vectorize.' );
			return;
		}

		$total_pages = $query->max_num_pages;
		$total_posts = $query->found_posts;

		\WP_CLI::log( "Found {$total_posts} posts. Processing in {$total_pages} batches of {$batch_size}." );

		try {
			$rag = new RAG_Agent();
		} catch ( \Exception $e ) {
			\WP_CLI::error( 'Failed to initialize RAG Agent: ' . $e->getMessage() );
		}

		$progress = \WP_CLI\Utils\make_progress_bar( 'Vectorizing posts', $total_posts );

		for ( $page = 1; $page <= $total_pages; $page++ ) {
			if ( $page > 1 ) {
				$query_args['paged'] = $page;
				$query               = new \WP_Query( $query_args );
			}

			$posts = $query->posts;
			if ( empty( $posts ) ) {
				continue;
			}

			// Load documents.
			$documents = WP_Post_Data_Loader::load( $posts );

			if ( ! empty( $documents ) ) {
				try {
					// Approximate tokens processed (string length of all document contents combined).
					$batch_char_length = 0;
					foreach ( $documents as $doc ) {
						$batch_char_length += strlen( $doc->getContent() );
					}

					// Add documents to Vector Store.
					$rag->addDocuments( $documents );

					// Log estimated embedding tokens.
					\jeo_ai_logger()->add_embedding_tokens( 'vectorize', $batch_char_length );

					// Mark as vectorized.
					$now = current_time( 'mysql' );
					foreach ( $posts as $post ) {
						update_post_meta( $post->ID, '_jeo_vectorized_at', $now );
						$progress->tick();
					}
				} catch ( \Exception $e ) {
					\WP_CLI::warning( "Batch {$page} failed: " . $e->getMessage() );
				}
			} else {
				// Documents might be empty if content was empty.
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, '_jeo_vectorized_at', current_time( 'mysql' ) ); // Mark to skip next time.
					$progress->tick();
				}
			}
		}

		$progress->finish();
		\WP_CLI::success( 'Vectorization completed.' );
	}
}
