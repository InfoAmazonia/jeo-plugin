<?php

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * RAG Worker Class
 *
 * Manages background and manual vectorization of posts.
 */
class RAG_Worker {

	use Singleton;

	/**
	 * Init the worker.
	 */
	protected function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'jeo_rag_index_cron_hook', array( $this, 'process_batch' ) );
		add_action( 'update_option_jeo-settings', array( $this, 'maybe_schedule_cron' ), 10, 2 );
		add_filter( 'cron_schedules', array( $this, 'add_cron_intervals' ) );
	}

	public function add_cron_intervals( $schedules ) {
		if ( ! isset( $schedules['every_minute'] ) ) {
			$schedules['every_minute'] = array( 'interval' => 60, 'display' => __( 'Every Minute', 'jeo' ) );
		}
		if ( ! isset( $schedules['every_5_mins'] ) ) {
			$schedules['every_5_mins'] = array( 'interval' => 300, 'display' => __( 'Every 5 Minutes', 'jeo' ) );
		}
		if ( ! isset( $schedules['every_15_mins'] ) ) {
			$schedules['every_15_mins'] = array( 'interval' => 900, 'display' => __( 'Every 15 Minutes', 'jeo' ) );
		}
		return $schedules;
	}

	private function log_cron_run( $message, $is_error = false ) {
		$logs = get_option( 'jeo_rag_cron_logs', array() );
		if ( ! is_array( $logs ) ) {
			$logs = array();
		}
		
		$time = current_time( 'Y-m-d H:i:s' );
		// Since we might be called manually via REST, check action
		$source = current_action() === 'jeo_rag_index_cron_hook' ? 'Cron' : 'Manual';
		$status = $is_error ? '❌ ' . __( 'Error', 'jeo' ) : '✅ ' . __( 'Success', 'jeo' );
		
		array_unshift( $logs, compact( 'time', 'source', 'status', 'message' ) );
		$logs = array_slice( $logs, 0, 5 ); // Keep top 5
		update_option( 'jeo_rag_cron_logs', $logs, false );
	}

	/**
	 * Register REST API routes.

	 */
	public function register_rest_routes() {
		register_rest_route( 'jeo/v1', '/ai-rag-run-manual', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_run_manual' ),
			'permission_callback' => function() {
				return current_user_can( 'manage_options' );
			},
		) );
	}

	/**
	 * REST Callback: Run one batch manually.
	 */
	public function api_run_manual() {
		$result = $this->process_batch();
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 'success' => false, 'message' => $result->get_error_message() ), 400 );
		}
		return new \WP_REST_Response( array( 'success' => true, 'message' => $result ), 200 );
	}

	/**
	 * Maybe schedule the cron job.
	 */
	public function maybe_schedule_cron( $old_value, $new_value ) {
		$is_active = isset( $new_value['jeo_rag_auto_index'] ) ? (bool) $new_value['jeo_rag_auto_index'] : false;
		$interval  = isset( $new_value['jeo_rag_cron_interval'] ) ? $new_value['jeo_rag_cron_interval'] : 'hourly';

		if ( $is_active ) {
			if ( ! wp_next_scheduled( 'jeo_rag_index_cron_hook' ) ) {
				wp_schedule_event( time(), $interval, 'jeo_rag_index_cron_hook' );
			} else {
				$schedule = wp_get_schedule( 'jeo_rag_index_cron_hook' );
				if ( $schedule !== $interval ) {
					wp_clear_scheduled_hook( 'jeo_rag_index_cron_hook' );
					wp_schedule_event( time(), $interval, 'jeo_rag_index_cron_hook' );
				}
			}
		} else {
			wp_clear_scheduled_hook( 'jeo_rag_index_cron_hook' );
		}
	}

	/**
	 * Process a batch of posts for vectorization.
	 */
	public function process_batch() {
		// If called via cron, check if it's enabled
		if ( current_action() === 'jeo_rag_index_cron_hook' && ! \jeo_settings()->get_option( 'jeo_rag_auto_index', false ) ) {
			return;
		}

		$post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		$batch_size = (int) \jeo_settings()->get_option( 'jeo_rag_batch_size', 10 );

		// Check for model lock
		$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
		$locked_model  = RAG_Agent::get_locked_model( 'jeo_knowledge' );

		// Legacy support: if the locked model doesn't have a provider prefix, but the current model does,
		// compare only the model part.
		$current_model_basename = $current_model;
		if ( ! empty( $current_model ) && strpos( $current_model, ':' ) !== false ) {
			$parts = explode( ':', $current_model, 2 );
			$current_model_basename = $parts[1];
		}

		if ( ! empty( $locked_model ) && ! empty( $current_model ) ) {
			// Check if locked model matches the full name OR the basename
			if ( $locked_model !== $current_model && $locked_model !== $current_model_basename ) {
				$err_msg = sprintf( __( 'Vector Store mismatch! Expected %s, found %s.', 'jeo' ), $locked_model, $current_model );
				$this->log_cron_run( $err_msg, true );
				return new \WP_Error( 'model_mismatch', $err_msg );
			}
		}

		// Setup lock if first time
		if ( empty( $locked_model ) ) {
			RAG_Agent::setup_store_model( 'jeo_knowledge', $current_model );
		}

		$query_args = array(
			'post_type'      => $post_types,
			'post_status'    => 'publish',
			'posts_per_page' => $batch_size,
			'meta_query'     => array(
				array(
					'key'     => '_jeo_vectorized_at',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			$msg = __( 'No more posts to vectorize.', 'jeo' );
			$this->log_cron_run( $msg, false );
			return $msg;
		}

		try {
			$rag = new RAG_Agent();
			$posts = $query->posts;
			$documents = WP_Post_Data_Loader::load( $posts );

			if ( ! empty( $documents ) ) {
				$batch_char_length = 0;
				foreach ( $documents as $doc ) {
					$batch_char_length += strlen( $doc->getContent() );
				}

				$rag->addDocuments( $documents );
				\jeo_ai_logger()->add_embedding_tokens( 'vectorize', $batch_char_length );

				$now = current_time( 'mysql' );
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, '_jeo_vectorized_at', $now );
				}

				$msg = sprintf( __( 'Successfully vectorized %d posts.', 'jeo' ), count( $posts ) );
				$this->log_cron_run( $msg, false );
				return $msg;
			} else {
				// Mark as processed even if no docs loaded (empty content)
				$now = current_time( 'mysql' );
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, '_jeo_vectorized_at', $now );
				}
				$msg = __( 'Batch skipped (no content found in selected posts).', 'jeo' );
				$this->log_cron_run( $msg, false );
				return $msg;
			}
		} catch ( \Exception $e ) {
			$this->log_cron_run( $e->getMessage(), true );
			return new \WP_Error( 'rag_error', $e->getMessage() );
		}
	}
}