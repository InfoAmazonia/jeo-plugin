<?php

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Bulk Processor Class
 *
 * Manages background AI geolocalization for legacy posts.
 */
class Bulk_Processor {

	use Singleton;

	/**
	 * Meta keys used.
	 */
	const META_PROCESSED = '_jeo_legacy_processed';
	const META_STATUS    = '_jeo_legacy_status';
	const META_PENDING   = '_jeo_ai_pending_point';

	/**
	 * Init the processor.
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_meta' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'jeo_bulk_ai_cron_hook', array( $this, 'process_batch' ) );
		
		add_filter( 'cron_schedules', array( $this, 'add_cron_intervals' ) );
		add_action( 'update_option_jeo-settings', array( $this, 'maybe_schedule_cron' ), 10, 2 );

		// Admin Table Hooks
		add_action( 'admin_init', array( $this, 'admin_hooks' ) );
	}

	/**
	 * Register REST API routes.
	 */
	public function register_rest_routes() {
		register_rest_route( 'jeo/v1', '/bulk-ai-run', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_run_batch' ),
			'permission_callback' => function() {
				return current_user_can( 'manage_options' );
			},
		) );

		register_rest_route( 'jeo/v1', '/bulk-ai-clear-logs', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_clear_logs' ),
			'permission_callback' => function() {
				return current_user_can( 'manage_options' );
			},
		) );
	}

	/**
	 * REST Callback: Run batch manually.
	 */
	public function api_run_batch() {
		// Force active temporarily if it's off, just for this manual run
		$was_active = \jeo_settings()->get_option( 'jeo_bulk_ai_active', false );
		if ( ! $was_active ) {
			// Temporarily override option memory for this execution
			add_filter( 'pre_option_jeo-settings', function( $val ) {
				$options = get_option( 'jeo-settings' );
				$options['jeo_bulk_ai_active'] = true;
				return $options;
			} );
		}

		$this->process_batch();

		return new \WP_REST_Response( array( 'success' => true, 'message' => __( 'Manual batch processed. Check logs for details.', 'jeo' ) ), 200 );
	}

	/**
	 * REST Callback: Clear logs.
	 */
	public function api_clear_logs() {
		$log_file = JEO_BASEPATH . 'jeo-bulk-ai.log';
		if ( file_exists( $log_file ) ) {
			unlink( $log_file );
		}
		return new \WP_REST_Response( array( 'success' => true ), 200 );
	}

	public function add_cron_intervals( $schedules ) {
		$schedules['every_5_mins'] = array(
			'interval' => 300,
			'display'  => __( 'Every 5 Minutes', 'jeo' ),
		);
		$schedules['every_15_mins'] = array(
			'interval' => 900,
			'display'  => __( 'Every 15 Minutes', 'jeo' ),
		);
		return $schedules;
	}

	public function maybe_schedule_cron( $old_value, $new_value ) {
		$is_active = isset( $new_value['jeo_bulk_ai_active'] ) ? (bool) $new_value['jeo_bulk_ai_active'] : false;
		$interval  = isset( $new_value['jeo_bulk_cron_interval'] ) ? $new_value['jeo_bulk_cron_interval'] : 'hourly';

		if ( $is_active ) {
			if ( ! wp_next_scheduled( 'jeo_bulk_ai_cron_hook' ) ) {
				wp_schedule_event( time(), $interval, 'jeo_bulk_ai_cron_hook' );
			} else {
				// Check if interval changed
				$schedule = wp_get_schedule( 'jeo_bulk_ai_cron_hook' );
				if ( $schedule !== $interval ) {
					wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
					wp_schedule_event( time(), $interval, 'jeo_bulk_ai_cron_hook' );
				}
			}
		} else {
			wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
		}
	}

	/**
	 * Register meta keys for REST API visibility.
	 */
	public function register_meta() {
		$post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );

		foreach ( $post_types as $post_type ) {
			register_post_meta( $post_type, self::META_PROCESSED, array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'boolean',
				'auth_callback' => function() { return current_user_can( 'edit_posts' ); }
			) );

			register_post_meta( $post_type, self::META_STATUS, array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
				'auth_callback' => function() { return current_user_can( 'edit_posts' ); }
			) );

			register_post_meta( $post_type, self::META_PENDING, array(
				'show_in_rest' => array(
					'schema' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'name'       => array( 'type' => 'string' ),
								'lat'        => array( 'type' => 'number' ),
								'lng'        => array( 'type' => 'number' ),
								'quote'      => array( 'type' => 'string' ),
								'confidence' => array( 'type' => 'integer' ),
							),
						),
					),
				),
				'single'       => true,
				'type'         => 'array',
				'auth_callback' => function() { return current_user_can( 'edit_posts' ); }
			) );
		}
	}

	/**
	 * Process a batch of posts.
	 */
	public function process_batch() {
		$active = \jeo_settings()->get_option( 'jeo_bulk_ai_active', false );
		$logging = \jeo_settings()->get_option( 'jeo_bulk_logging', false );

		if ( ! $active ) {
			if ( $logging ) $this->log( 'Worker is inactive. Skipping batch.' );
			return;
		}

		$post_types = \jeo_settings()->get_option( 'jeo_bulk_post_types', array( 'post' ) );
		$batch_size = (int) \jeo_settings()->get_option( 'jeo_bulk_batch_size', 5 );

		if ( empty( $post_types ) ) {
			if ( $logging ) $this->log( 'No post types selected for bulk processing.' );
			return;
		}

		$query_args = array(
			'post_type'      => $post_types,
			'post_status'    => 'publish',
			'posts_per_page' => $batch_size,
			'meta_query'     => array(
				array(
					'key'     => self::META_PROCESSED,
					'compare' => 'NOT EXISTS',
				),
			),
		);

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			if ( $logging ) $this->log( 'No more posts to process. Deactivating worker.' );
			$options = get_option( 'jeo-settings' );
			$options['jeo_bulk_ai_active'] = false;
			update_option( 'jeo-settings', $options );
			wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
			return;
		}

		$adapter = \jeo_ai_handler()->get_active_adapter();
		if ( ! $adapter ) {
			if ( $logging ) $this->log( 'CRITICAL: No active AI adapter found for bulk processing.' );
			return;
		}

		if ( $logging ) $this->log( sprintf( 'Processing batch of %d posts.', count( $query->posts ) ) );

		foreach ( $query->posts as $post ) {
			try {
				$result = $adapter->georeference( $post->post_title, $post->post_content );

				if ( ! is_wp_error( $result ) && ! empty( $result ) ) {
					update_post_meta( $post->ID, self::META_PENDING, $result );
					update_post_meta( $post->ID, self::META_STATUS, 'pending_approval' );
					
					$total_conf = 0;
					foreach ( $result as $p ) {
						$total_conf += isset( $p['confidence'] ) ? (int) $p['confidence'] : 0;
					}
					$avg_conf = round( $total_conf / count( $result ) );

					if ( $logging ) $this->log( sprintf( 'Post ID %d: Success. %d locations found. Avg Confidence: %d%%', $post->ID, count( $result ), $avg_conf ) );
				} elseif ( is_wp_error( $result ) ) {
					update_post_meta( $post->ID, self::META_STATUS, 'error' );
					if ( $logging ) $this->log( sprintf( 'Post ID %d: AI Error - %s', $post->ID, $result->get_error_message() ) );
				} else {
					update_post_meta( $post->ID, self::META_STATUS, 'no_locations' );
					if ( $logging ) $this->log( sprintf( 'Post ID %d: No locations found.', $post->ID ) );
				}
			} catch ( \Exception $e ) {
				update_post_meta( $post->ID, self::META_STATUS, 'error' );
				if ( $logging ) $this->log( sprintf( 'Post ID %d: Exception - %s', $post->ID, $e->getMessage() ) );
			}

			update_post_meta( $post->ID, self::META_PROCESSED, true );
		}
	}

	/**
	 * Log a message to a file for debugging.
	 */
	private function log( $message ) {
		$log_file = JEO_BASEPATH . 'jeo-bulk-ai.log';
		$timestamp = current_time( 'mysql' );
		$entry = "[{$timestamp}] {$message}\n";
		@file_put_contents( $log_file, $entry, FILE_APPEND );
	}

	/**
	 * Register Admin UI hooks.
	 */
	public function admin_hooks() {
		$post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );

		foreach ( $post_types as $post_type ) {
			add_filter( "manage_{$post_type}_posts_columns", array( $this, 'add_status_column' ) );
			add_action( "manage_{$post_type}_posts_custom_column", array( $this, 'render_status_column' ), 10, 2 );
			
			add_filter( "bulk_actions-edit-{$post_type}", array( $this, 'add_bulk_actions' ) );
			add_filter( "handle_bulk_actions-edit-{$post_type}", array( $this, 'handle_bulk_actions' ), 10, 3 );
		}

		// Individual approval action
		add_action( 'admin_init', array( $this, 'handle_individual_approval' ) );
	}

	public function handle_individual_approval() {
		if ( ! isset( $_GET['jeo_approve_ai'] ) || ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		$post_id = (int) $_GET['jeo_approve_ai'];
		$this->approve_post( $post_id );

		wp_safe_redirect( remove_query_arg( 'jeo_approve_ai' ) );
		exit;
	}

	private function approve_post( $post_id, $threshold = 0 ) {
		$pending = get_post_meta( $post_id, self::META_PENDING, true );
		if ( ! empty( $pending ) ) {

			// Calculate confidence if threshold is set
			if ( $threshold > 0 ) {
				$total_conf = 0;
				foreach ( $pending as $p ) {
					$total_conf += isset( $p['confidence'] ) ? (int) $p['confidence'] : 0;
				}
				$avg_conf = round( $total_conf / count( $pending ) );
				if ( $avg_conf < $threshold ) {
					return false; // Skip if below threshold
				}
			}

			$related_points = array();
			foreach ( $pending as $p ) {
				$related_points[] = array(
					'relevance'    => 'primary',
					'_geocode_lat' => (string) $p['lat'],
					'_geocode_lng' => (string) $p['lng'],
					'name'         => $p['name'],
					'quote'        => $p['quote'],
					'_ai_quote'    => $p['quote']
				);
			}

			update_post_meta( $post_id, '_related_point', $related_points );
			\jeo_geocode_handler()->save_post( $post_id, get_post( $post_id ), true );

			delete_post_meta( $post_id, self::META_PENDING );
			update_post_meta( $post_id, self::META_STATUS, 'approved' );
			return true;
		}
		return false;
	}

	public function add_status_column( $columns ) {
		$columns['jeo_ai_status'] = __( 'JEO AI Status', 'jeo' );
		return $columns;
	}

	public function render_status_column( $column, $post_id ) {
		if ( 'jeo_ai_status' !== $column ) {
			return;
		}

		$status = get_post_meta( $post_id, self::META_STATUS, true );
		$has_points = ! empty( get_post_meta( $post_id, '_related_point', true ) );

		if ( $has_points ) {
			echo '<span class="badge badge-success" style="background:#46b450; color:#fff; padding:2px 8px; border-radius:4px;">' . esc_html__( 'Geolocated', 'jeo' ) . '</span>';
		} elseif ( 'pending_approval' === $status ) {
			$pending = get_post_meta( $post_id, self::META_PENDING, true );
			$avg_conf = 0;
			if ( is_array( $pending ) && ! empty( $pending ) ) {
				$total_conf = 0;
				foreach ( $pending as $p ) {
					$total_conf += isset( $p['confidence'] ) ? (int) $p['confidence'] : 0;
				}
				$avg_conf = round( $total_conf / count( $pending ) );
			}

			$color = '#ffb900'; // Amber
			if ( $avg_conf >= 80 ) { $color = '#46b450'; } // Greenish
			elseif ( $avg_conf < 50 ) { $color = '#d63638'; } // Reddish

			echo '<span class="badge badge-warning" style="background:' . esc_attr( $color ) . '; color:#fff; padding:2px 8px; border-radius:4px;" title="' . esc_attr__( 'Average AI Confidence', 'jeo' ) . ': ' . $avg_conf . '%">';
			echo esc_html__( 'Pending', 'jeo' ) . ' (' . $avg_conf . '%)';
			echo '</span>';
			echo '<div class="row-actions"><span><a href="' . esc_url( add_query_arg( array( 'jeo_approve_ai' => $post_id, 'post' => $post_id, 'action' => 'edit' ), admin_url( 'post.php' ) ) ) . '">' . esc_html__( 'Approve AI', 'jeo' ) . '</a></span></div>';
		} elseif ( 'no_locations' === $status ) {
			echo '<span class="badge badge-info" style="background:#ccd0d4; color:#32373c; padding:2px 8px; border-radius:4px;">' . esc_html__( 'No Locations Found', 'jeo' ) . '</span>';
		} elseif ( 'error' === $status ) {
			echo '<span class="badge badge-error" style="background:#d63638; color:#fff; padding:2px 8px; border-radius:4px;">' . esc_html__( 'AI Error', 'jeo' ) . '</span>';
		} else {
			echo '<span class="badge" style="background:#f0f0f1; color:#646970; padding:2px 8px; border-radius:4px;">' . esc_html__( 'Not Processed', 'jeo' ) . '</span>';
		}
	}

	public function add_bulk_actions( $bulk_actions ) {
		$bulk_actions['jeo_approve_ai'] = __( 'Approve JEO AI Geolocations', 'jeo' );
		return $bulk_actions;
	}

	public function handle_bulk_actions( $redirect_to, $action, $post_ids ) {
		if ( 'jeo_approve_ai' !== $action ) {
			return $redirect_to;
		}

		$threshold = (int) \jeo_settings()->get_option( 'jeo_bulk_confidence_threshold', 0 );

		$approved_count = 0;
		foreach ( $post_ids as $post_id ) {
			if ( $this->approve_post( $post_id, $threshold ) ) {
				$approved_count++;
			}
		}

		return add_query_arg( 'jeo_bulk_approved', $approved_count, $redirect_to );
	}
}