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
		add_action( 'jeo_bulk_ai_clear_cron_hook', array( $this, 'process_clear_batch' ) );
		
		add_filter( 'cron_schedules', array( $this, 'add_cron_intervals' ) );
		add_action( 'update_option_jeo-settings', array( $this, 'maybe_schedule_cron' ), 10, 2 );

		// Admin Table Hooks
		add_action( 'admin_init', array( $this, 'admin_hooks' ) );
		add_action( 'admin_print_footer_scripts', array( $this, 'render_bulk_approval_modal' ) );
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

		register_rest_route( 'jeo/v1', '/bulk-ai-clear-batch', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_clear_batch' ),
			'permission_callback' => function() {
				return current_user_can( 'manage_options' );
			},
		) );

		register_rest_route( 'jeo/v1', '/bulk-ai-clear-all', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_clear_all' ),
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

		register_rest_route( 'jeo/v1', '/bulk-ai-preview-approval', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'api_preview_approval' ),
			'permission_callback' => function() {
				return current_user_can( 'edit_posts' );
			},
		) );
	}

	/**
	 * REST Callback: Run batch manually.
	 */
	public function api_run_batch() {
		$result = $this->process_batch( true );
		
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 'success' => false, 'message' => $result->get_error_message() ), 400 );
		}

		return new \WP_REST_Response( array( 'success' => true, 'message' => $result ), 200 );
	}

	/**
	 * REST Callback: Clear one batch manually.
	 */
	public function api_clear_batch() {
		$result = $this->process_clear_batch();
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 'success' => false, 'message' => $result->get_error_message() ), 400 );
		}
		return new \WP_REST_Response( array( 'success' => true, 'message' => $result ), 200 );
	}

	/**
	 * REST Callback: Start clearing all posts via background cron.
	 */
	public function api_clear_all() {
		if ( ! wp_next_scheduled( 'jeo_bulk_ai_clear_cron_hook' ) ) {
			wp_schedule_event( time(), 'every_minute', 'jeo_bulk_ai_clear_cron_hook' );
		}
		
		$this->log_action( __( 'Bulk clearing started (Background).', 'jeo' ) );
		return new \WP_REST_Response( array( 'success' => true, 'message' => __( 'Bulk clearing started in background. Posts will be reset in batches.', 'jeo' ) ), 200 );
	}

	private function log_action( $message, $is_error = false ) {
		$logs = get_option( 'jeo_bulk_ai_cron_logs', array() );
		if ( ! is_array( $logs ) ) { $logs = array(); }
		
		$time = current_time( 'Y-m-d H:i:s' );
		$source = current_action() === 'jeo_bulk_ai_cron_hook' || current_action() === 'jeo_bulk_ai_clear_cron_hook' ? 'Cron' : 'Manual';
		$status = $is_error ? '❌ ' . __( 'Error', 'jeo' ) : '✅ ' . __( 'Success', 'jeo' );
		
		array_unshift( $logs, compact( 'time', 'source', 'status', 'message' ) );
		$logs = array_slice( $logs, 0, 5 ); 
		update_option( 'jeo_bulk_ai_cron_logs', $logs, false );
	}

	/**
	 * REST Callback: Clear logs.
	 */
	public function api_clear_logs() {
		$log_file = JEO_BASEPATH . 'jeo-bulk-ai.log';
		if ( file_exists( $log_file ) ) {
			unlink( $log_file );
		}
		delete_option( 'jeo_bulk_ai_cron_logs' );
		return new \WP_REST_Response( array( 'success' => true ), 200 );
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
	public function process_batch( $force = false ) {
		$active = \jeo_settings()->get_option( 'jeo_bulk_ai_active', false );
		$logging = \jeo_settings()->get_option( 'jeo_bulk_logging', false );

		if ( ! $active && ! $force ) {
			return;
		}

		$post_types = \jeo_settings()->get_option( 'jeo_bulk_post_types', array( 'post' ) );
		$batch_size = (int) \jeo_settings()->get_option( 'jeo_bulk_batch_size', 5 );

		if ( empty( $post_types ) ) {
			$err = __( 'No post types selected for bulk processing.', 'jeo' );
			$this->log_action( $err, true );
			return new \WP_Error( 'no_post_types', $err );
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
			$msg = __( 'No more posts to process. Deactivating worker.', 'jeo' );
			$this->log_action( $msg );
			
			$options = get_option( 'jeo-settings' );
			$options['jeo_bulk_ai_active'] = false;
			update_option( 'jeo-settings', $options );
			wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
			return $msg;
		}

		$adapter = \jeo_ai_handler()->get_active_adapter();
		if ( ! $adapter ) {
			$err = __( 'CRITICAL: No active AI adapter found for bulk processing.', 'jeo' );
			$this->log_action( $err, true );
			return new \WP_Error( 'no_adapter', $err );
		}

		$processed_count = 0;
		foreach ( $query->posts as $post ) {
			try {
				$result = $adapter->georeference( $post->post_title, $post->post_content );

				if ( ! is_wp_error( $result ) && ! empty( $result ) ) {
					update_post_meta( $post->ID, self::META_PENDING, $result );
					update_post_meta( $post->ID, self::META_STATUS, 'pending_approval' );
				} elseif ( is_wp_error( $result ) ) {
					update_post_meta( $post->ID, self::META_STATUS, 'error' );
				} else {
					update_post_meta( $post->ID, self::META_STATUS, 'no_locations' );
				}
			} catch ( \Exception $e ) {
				update_post_meta( $post->ID, self::META_STATUS, 'error' );
			}

			update_post_meta( $post->ID, self::META_PROCESSED, true );
			$processed_count++;
		}

		$msg = sprintf( __( 'Processed batch of %d posts.', 'jeo' ), $processed_count );
		$this->log_action( $msg );
		return $msg;
	}

	/**
	 * Reset/Clear a batch of posts.
	 */
	public function process_clear_batch() {
		$post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		$batch_size = (int) \jeo_settings()->get_option( 'jeo_bulk_batch_size', 10 );

		$query_args = array(
			'post_type'      => $post_types,
			'post_status'    => 'any',
			'posts_per_page' => $batch_size,
			'meta_query'     => array(
				array(
					'key'     => self::META_PROCESSED,
					'compare' => 'EXISTS',
				),
			),
		);

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			$msg = __( 'No more posts to clear.', 'jeo' );
			$this->log_action( $msg );
			wp_clear_scheduled_hook( 'jeo_bulk_ai_clear_cron_hook' );
			return $msg;
		}

		$cleared_count = 0;
		foreach ( $query->posts as $post ) {
			delete_post_meta( $post->ID, self::META_PROCESSED );
			delete_post_meta( $post->ID, self::META_STATUS );
			delete_post_meta( $post->ID, self::META_PENDING );
			// Clear legacy and active geolocations
			delete_post_meta( $post->ID, '_related_point' );
			delete_post_meta( $post->ID, '_jeo_legacy_status' );
			delete_post_meta( $post->ID, '_jeo_ai_pending_point' );
			$cleared_count++;
		}

		$msg = sprintf( __( 'Cleared batch of %d posts.', 'jeo' ), $cleared_count );
		$this->log_action( $msg );
		return $msg;
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
				$conf = isset( $p['confidence'] ) ? (int) $p['confidence'] : 100;
				// Follow the same logic as the UI: 75%+ is primary, below is secondary
				$relevance = ( $conf >= 75 ) ? 'primary' : 'secondary';

				$related_points[] = array(
					'relevance'    => $relevance,
					'_geocode_lat' => (string) $p['lat'],
					'_geocode_lon' => (string) $p['lng'],
					'name'         => $p['name'],
					'quote'        => $p['quote'],
					'_ai_quote'    => $p['quote']
				);
			}

			update_post_meta( $post_id, '_related_point', $related_points );
			
			delete_post_meta( $post_id, self::META_PENDING );
			update_post_meta( $post_id, self::META_STATUS, 'approved' );
			return true;
		}
		return false;
	}

	/**
	 * REST Callback: Preview what posts will be approved in bulk.
	 */
	public function api_preview_approval( $request ) {
		$post_ids = $request->get_param( 'post_ids' );
		if ( empty( $post_ids ) || ! is_array( $post_ids ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'No posts selected.', 'jeo' ) ), 400 );
		}

		$threshold = (int) \jeo_settings()->get_option( 'jeo_bulk_confidence_threshold', 0 );
		$summary = array(
			'threshold'        => $threshold,
			'will_approve'     => 0,
			'ignored_by_score' => 0,
			'not_applicable'   => 0,
			'details'          => array()
		);

		foreach ( $post_ids as $id ) {
			$pending = get_post_meta( $id, self::META_PENDING, true );
			$post    = get_post( $id );
			
			if ( ! empty( $pending ) && is_array( $pending ) ) {
				$total_conf = 0;
				foreach ( $pending as $p ) {
					$total_conf += isset( $p['confidence'] ) ? (int) $p['confidence'] : 100;
				}
				$avg_conf = count( $pending ) > 0 ? round( $total_conf / count( $pending ) ) : 0;
				
				if ( $avg_conf >= $threshold ) {
					$summary['will_approve']++;
					$status = 'ready';
				} else {
					$summary['ignored_by_score']++;
					$status = 'low_score';
				}

				$summary['details'][] = array(
					'id'       => $id,
					'title'    => $post->post_title,
					'avg_conf' => $avg_conf,
					'status'   => $status,
					'count'    => count( $pending )
				);
			} else {
				$summary['not_applicable']++;
			}
		}

		return new \WP_REST_Response( $summary, 200 );
	}

	/**
	 * Render the confirmation modal and JS logic in the admin footer of edit.php.
	 */
	public function render_bulk_approval_modal() {
		global $pagenow, $typenow;
		if ( 'edit.php' !== $pagenow ) {
			return;
		}

		$enabled_post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		if ( ! in_array( $typenow, $enabled_post_types ) ) {
			return;
		}
		?>
		<div id="jeo-bulk-ai-modal" style="display:none; position:fixed; z-index:99999; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); overflow:hidden;">
			<div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; padding:25px; border-radius:8px; width:600px; max-width:90%; max-height:85vh; display:flex; flex-direction:column; box-shadow: 0 5px 20px rgba(0,0,0,0.3);">
				<h2 style="margin-top:0; border-bottom:1px solid #ccc; padding-bottom:10px; font-weight:600; color:#1d2327;">✨ <?php esc_html_e( 'Review Bulk AI Approval', 'jeo' ); ?></h2>
				<div id="jeo-bulk-ai-modal-content" style="overflow-y:auto; flex-grow:1; margin-bottom:20px;">
					<p style="text-align:center; padding:20px; color:#666; font-style:italic;">
						<?php esc_html_e( 'Analyzing selected posts...', 'jeo' ); ?>
					</p>
				</div>
				<div style="border-top:1px solid #ccc; padding-top:15px; text-align:right;">
					<button type="button" class="button button-secondary" id="jeo-bulk-ai-cancel"><?php esc_html_e( 'Cancel', 'jeo' ); ?></button>
					<button type="button" class="button button-primary" id="jeo-bulk-ai-confirm" style="margin-left:10px;"><?php esc_html_e( 'Confirm & Apply', 'jeo' ); ?></button>
				</div>
			</div>
		</div>

		<script>
		jQuery(document).ready(function($) {
			var $form = $('#posts-filter');
			var $modal = $('#jeo-bulk-ai-modal');
			var $content = $('#jeo-bulk-ai-modal-content');
			var isConfirmed = false;

			$form.on('submit', function(e) {
				var action1 = $('select[name="action"]').val();
				var action2 = $('select[name="action2"]').val();
				var action = (action1 === 'jeo_approve_ai') ? action1 : ((action2 === 'jeo_approve_ai') ? action2 : false);

				if ( action === 'jeo_approve_ai' && ! isConfirmed ) {
					e.preventDefault();
					
					var postIds = [];
					$('input[name="post[]"]:checked').each(function() {
						postIds.push($(this).val());
					});

					if (postIds.length === 0) {
						alert('<?php esc_js( __( 'Please select at least one post.', 'jeo' ) ); ?>');
						return;
					}

					$modal.show();
					$content.html('<p style="text-align:center; padding:20px; color:#666; font-style:italic;"><?php esc_js( __( 'Analyzing selected posts...', 'jeo' ) ); ?></p>');

					$.ajax({
						url: '<?php echo esc_url_raw( rest_url( 'jeo/v1/bulk-ai-preview-approval' ) ); ?>',
						method: 'POST',
						data: {
							post_ids: postIds
						},
						beforeSend: function(xhr) {
							xhr.setRequestHeader('X-WP-Nonce', '<?php echo wp_create_nonce("wp_rest"); ?>');
						},
						success: function(res) {
							var html = '<p style="font-size:14px;"><strong>' + res.will_approve + '</strong> posts will be approved.</p>';
							if ( res.ignored_by_score > 0 ) {
								html += '<p style="color:#d63638; font-size:13px;">⚠️ <strong>' + res.ignored_by_score + '</strong> posts have a confidence score below your threshold (' + res.threshold + '%) and will be ignored.</p>';
							}
							if ( res.not_applicable > 0 ) {
								html += '<p style="color:#666; font-size:13px;">ℹ️ <strong>' + res.not_applicable + '</strong> posts are already geolocated or don\'t have AI suggestions.</p>';
							}

							html += '<table class="wp-list-table widefat fixed striped" style="margin-top:15px; border:1px solid #e0e0e0;">';
							html += '<thead><tr><th>Post Title</th><th style="width:80px; text-align:center;">Locs</th><th style="width:100px; text-align:center;">Confidence</th></tr></thead><tbody>';
							
							res.details.forEach(function(d) {
								var color = d.status === 'ready' ? '#46b450' : '#d63638';
								html += '<tr>';
								html += '<td style="font-size:12px;">' + d.title + '</td>';
								html += '<td style="text-align:center; font-size:12px;">' + d.count + '</td>';
								html += '<td style="text-align:center; color:' + color + '; font-weight:bold; font-size:12px;">' + d.avg_conf + '%</td>';
								html += '</tr>';
							});
							html += '</tbody></table>';

							$content.html(html);

							if ( res.will_approve === 0 ) {
								$('#jeo-bulk-ai-confirm').prop('disabled', true).text('Nothing to Approve');
							} else {
								$('#jeo-bulk-ai-confirm').prop('disabled', false).text('Confirm & Apply');
							}
						},
						error: function() {
							$content.html('<p style="color:#d63638; text-align:center; padding:20px;">Error loading preview. Please try again.</p>');
						}
					});
				}
			});

			$('#jeo-bulk-ai-cancel').click(function() {
				$modal.hide();
			});

			$('#jeo-bulk-ai-confirm').click(function() {
				$modal.hide();
				isConfirmed = true;
				$form.submit();
			});
		});
		</script>
		<?php
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

		// 1. Render Status Badge
		if ( $has_points ) {
			echo '<span class="badge badge-success" style="background:#46b450; color:#fff; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">' . esc_html__( 'Geolocated', 'jeo' ) . '</span>';
		} elseif ( 'pending_approval' === $status ) {
			echo '<span class="badge badge-warning" style="background:#ffb900; color:#fff; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">' . esc_html__( 'Pending Approval', 'jeo' ) . '</span>';
		} elseif ( 'no_locations' === $status ) {
			echo '<span class="badge badge-info" style="background:#ccd0d4; color:#32373c; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">' . esc_html__( 'No Locations Found', 'jeo' ) . '</span>';
		} elseif ( 'error' === $status ) {
			echo '<span class="badge badge-error" style="background:#d63638; color:#fff; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">' . esc_html__( 'AI Error', 'jeo' ) . '</span>';
		} else {
			echo '<span class="badge" style="background:#f0f0f1; color:#646970; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:4px;">' . esc_html__( 'Not Processed', 'jeo' ) . '</span>';
		}

		// 2. Render Confidence Score (Below Badge)
		if ( 'pending_approval' === $status || 'approved' === $status ) {
			$pending = get_post_meta( $post_id, self::META_PENDING, true );
			$avg_conf = 0;
			
			// If approved, we might want to calculate from current points if they have confidence meta, 
			// but for now we look at pending to show what was the AI score.
			if ( is_array( $pending ) && ! empty( $pending ) ) {
				$total_conf = 0;
				foreach ( $pending as $p ) {
					$total_conf += isset( $p['confidence'] ) ? (int) $p['confidence'] : 0;
				}
				$avg_conf = round( $total_conf / count( $pending ) );
			}

			if ( $avg_conf > 0 ) {
				$conf_color = '#72aee6'; // Default Blue
				if ( $avg_conf >= 80 ) { $conf_color = '#46b450'; }
				elseif ( $avg_conf < 40 ) { $conf_color = '#d63638'; }

				echo '<div style="font-size:11px; font-weight:600; margin-top:2px; color:' . esc_attr( $conf_color ) . ';">';
				echo 'Precison: ' . $avg_conf . '%';
				echo '</div>';
			}
		}

		// 3. Render Row Actions
		if ( 'pending_approval' === $status && ! $has_points ) {
			echo '<div class="row-actions" style="margin-top:4px;"><span><a href="' . esc_url( add_query_arg( array( 'jeo_approve_ai' => $post_id, 'post' => $post_id, 'action' => 'edit' ), admin_url( 'post.php' ) ) ) . '">' . esc_html__( 'Approve AI', 'jeo' ) . '</a></span></div>';
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