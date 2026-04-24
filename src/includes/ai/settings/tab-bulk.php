<?php
/**
 * Bulk AI processing settings tab.
 *
 * @package Jeo
 */

?>
<table class="form-table">
	<tbody>
		<tr>
			<th scope="row"><label for="jeo_bulk_ai_active"><?php esc_html_e( 'Background Processing', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_ai_active' ) ); ?>" type="checkbox" id="jeo_bulk_ai_active" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_bulk_ai_active' ), 1 ); ?>>
				<strong><?php esc_html_e( 'Enable background AI geolocalization', 'jeo' ); ?></strong>
				<p class="description"><?php esc_html_e( 'When active, JEO will scan legacy posts and suggest locations based on their content.', 'jeo' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_batch_size"><?php esc_html_e( 'Batch Size', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_batch_size' ) ); ?>" type="number" id="jeo_bulk_batch_size" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_bulk_batch_size' ) ); ?>" min="1" max="50" class="small-text">
				<span class="description"><?php esc_html_e( 'Number of posts to process per batch.', 'jeo' ); ?></span>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_post_types"><?php esc_html_e( 'Target Post Types', 'jeo' ); ?></label></th>
			<td>
				<?php
				$enabled_post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
				$bulk_post_types    = \jeo_settings()->get_option( 'jeo_bulk_post_types', array( 'post' ) );
				foreach ( $enabled_post_types as $pt ) :
					$pt_object = get_post_type_object( $pt );
					if ( ! $pt_object ) {
						continue;
					}
					?>
					<label>
						<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_post_types' ) ); ?>[]" type="checkbox" value="<?php echo esc_attr( $pt ); ?>" <?php checked( in_array( $pt, $bulk_post_types, true ) ); ?>>
						<?php echo esc_html( $pt_object->labels->name ); ?>
					</label><br>
				<?php endforeach; ?>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_cron_interval"><?php esc_html_e( 'Cron Interval', 'jeo' ); ?></label></th>
			<td>
				<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_cron_interval' ) ); ?>" id="jeo_bulk_cron_interval">
					<option value="every_minute" <?php selected( \jeo_settings()->get_option( 'jeo_bulk_cron_interval' ), 'every_minute' ); ?>><?php esc_html_e( 'Every Minute', 'jeo' ); ?></option>
					<option value="every_5_mins" <?php selected( \jeo_settings()->get_option( 'jeo_bulk_cron_interval' ), 'every_5_mins' ); ?>><?php esc_html_e( 'Every 5 Minutes', 'jeo' ); ?></option>
					<option value="every_15_mins" <?php selected( \jeo_settings()->get_option( 'jeo_bulk_cron_interval' ), 'every_15_mins' ); ?>><?php esc_html_e( 'Every 15 Minutes', 'jeo' ); ?></option>
					<option value="hourly" <?php selected( \jeo_settings()->get_option( 'jeo_bulk_cron_interval' ), 'hourly' ); ?>><?php esc_html_e( 'Hourly', 'jeo' ); ?></option>
					<option value="twicedaily" <?php selected( \jeo_settings()->get_option( 'jeo_bulk_cron_interval' ), 'twicedaily' ); ?>><?php esc_html_e( 'Twice Daily', 'jeo' ); ?></option>
				</select>
			</td>
		</tr>
		
		<tr>
			<th scope="row"><?php esc_html_e( 'Execution Logs', 'jeo' ); ?></th>
			<td>
				<div style="background: #f6f7f7; border: 1px solid #ccd0d4; border-radius: 4px; padding: 15px; max-width: 800px;">
					<h5 style="margin: 0 0 10px 0;"><?php esc_html_e( 'Recent Background Activity', 'jeo' ); ?></h5>
					<?php
					$bulk_logs = get_option( 'jeo_bulk_ai_cron_logs', array() );
					if ( empty( $bulk_logs ) || ! is_array( $bulk_logs ) ) :
						?>
						<p style="font-size: 11px; color: #8c8f94; font-style: italic; margin: 0;">
							<?php esc_html_e( 'No recent activity recorded.', 'jeo' ); ?>
						</p>
					<?php else : ?>
						<ul style="margin: 0; padding: 0; list-style: none; font-size: 11px; font-family: monospace;">
							<?php foreach ( $bulk_logs as $log ) : ?>
								<li style="margin-bottom: 5px; padding: 5px 8px; background: #fff; border-left: 2px solid #ccc; border-radius: 3px;">
									<span style="color: #8c8f94;">[<?php echo esc_html( $log['time'] ); ?>]</span> 
									<strong><?php echo esc_html( $log['source'] ); ?>:</strong> 
									<?php echo esc_html( $log['status'] ); ?> - 
									<?php echo esc_html( $log['message'] ); ?>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			</td>
		</tr>

		<tr>
			<th scope="row"><?php esc_html_e( 'Manual Control', 'jeo' ); ?></th>
			<td>
				<div style="display: flex; gap: 10px; align-items: center; margin-bottom: 15px;">
					<button type="button" class="button button-primary" id="jeo-bulk-run-manual-btn">
						🚀 <?php esc_html_e( 'Process 1 Batch Now', 'jeo' ); ?>
					</button>
					<button type="button" class="button button-secondary" id="jeo-bulk-clear-batch-btn">
						🧹 <?php esc_html_e( 'Clear 1 Batch', 'jeo' ); ?>
					</button>
					<button type="button" class="button button-link-delete" id="jeo-bulk-clear-all-btn" style="color: #d63638;">
						🗑️ <?php esc_html_e( 'Reset All Posts', 'jeo' ); ?>
					</button>
				</div>
				<p class="description"><?php esc_html_e( 'Manual Batch: Processes legacy posts immediately. Clear Batch: Resets the "processed" flag for a small group. Reset All: Schedules a background task to clear all posts (Double confirmation required).', 'jeo' ); ?></p>
			</td>
		</tr>

		<tr>
			<th scope="row"><?php esc_html_e( 'Processing Status', 'jeo' ); ?></th>
			<td>
				<?php
				$total_posts = 0;
				foreach ( $bulk_post_types as $pt ) {
					$count = wp_count_posts( $pt );
					if ( isset( $count->publish ) ) {
						$total_posts += (int) $count->publish;
					}
				}

				$processed_query = new \WP_Query(
					array(
						'post_type'      => $bulk_post_types,
						'post_status'    => 'publish',
						'posts_per_page' => -1,
						'fields'         => 'ids',
						'meta_query'     => array(
							array(
								'key'     => \Jeo\AI\Bulk_Processor::META_PROCESSED,
								'compare' => 'EXISTS',
							),
						),
					)
				);
				$processed_posts = $processed_query->found_posts;
				$percent         = $total_posts > 0 ? round( ( $processed_posts / $total_posts ) * 100 ) : 0;
				?>
				<div style="width: 100%; background: #e2e4e7; border-radius: 4px; height: 20px; margin-bottom: 10px; max-width: 800px;">
					<div style="width: <?php echo esc_attr( $percent ); ?>%; background: #46b450; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
				</div>
				<p>
					<?php
					/* translators: %1$d: processed posts, %2$d: total posts, %3$d: percentage */
					printf( esc_html__( 'Geolocalization Progress: %1$d of %2$d posts marked as processed (%3$d%%).', 'jeo' ), esc_html( $processed_posts ), esc_html( $total_posts ), esc_html( $percent ) );
					?>
				</p>
			</td>
		</tr>

		<tr>
			<th scope="row"><label for="jeo_bulk_confidence_threshold"><?php esc_html_e( 'Auto-Approval Threshold', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_confidence_threshold' ) ); ?>" type="number" id="jeo_bulk_confidence_threshold" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_bulk_confidence_threshold' ) ); ?>" min="0" max="100" class="small-text"> %
				<p class="description"><?php esc_html_e( 'Minimum average confidence required to auto-approve locations when using bulk approval actions in the post list.', 'jeo' ); ?></p>
			</td>
		</tr>

		<tr>
			<th scope="row"><label for="jeo_bulk_logging"><?php esc_html_e( 'Internal Debug Log', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_logging' ) ); ?>" type="checkbox" id="jeo_bulk_logging" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_bulk_logging' ), 1 ); ?>>
				<span class="description"><?php esc_html_e( 'Enable detailed file-based logging (jeo-bulk-ai.log) for technical troubleshooting.', 'jeo' ); ?></span>
				
				<?php if ( file_exists( JEO_BASEPATH . 'jeo-bulk-ai.log' ) ) : ?>
					<div style="margin-top: 15px; display:flex; gap:10px; align-items:center;">
						<a href="<?php echo esc_url( JEO_BASEURL . '/jeo-bulk-ai.log' ); ?>" target="_blank" class="button button-secondary button-small"><?php esc_html_e( 'Open Log File', 'jeo' ); ?></a>
						<button type="button" class="button button-link-delete button-small" id="jeo-bulk-clear-logs-btn"><?php esc_html_e( 'Delete Log File', 'jeo' ); ?></button>
					</div>
				<?php endif; ?>
			</td>
		</tr>
	</tbody>
</table>
