<table class="form-table">
	<tbody>
		<tr>
			<th scope="row"><label for="jeo_bulk_ai_active"><?php esc_html_e( 'Background Processing', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_ai_active' ) ); ?>" type="checkbox" id="jeo_bulk_ai_active" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_bulk_ai_active' ), 1 ); ?>>
				<span class="description"><?php esc_html_e( 'Enable background AI geolocalization for legacy posts.', 'jeo' ); ?></span>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_batch_size"><?php esc_html_e( 'Batch Size', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_batch_size' ) ); ?>" type="number" id="jeo_bulk_batch_size" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_bulk_batch_size' ) ); ?>" min="1" max="50" class="small-text">
				<span class="description"><?php esc_html_e( 'Number of posts to process per cron run.', 'jeo' ); ?></span>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_post_types"><?php esc_html_e( 'Target Post Types', 'jeo' ); ?></label></th>
			<td>
				<?php
				$enabled_post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
				$bulk_post_types = \jeo_settings()->get_option( 'jeo_bulk_post_types', array( 'post' ) );
				foreach ( $enabled_post_types as $pt ) :
					$pt_object = get_post_type_object( $pt );
					if ( ! $pt_object ) continue;
					?>
					<label>
						<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_post_types' ) ); ?>[]" type="checkbox" value="<?php echo esc_attr( $pt ); ?>" <?php checked( in_array( $pt, $bulk_post_types ) ); ?>>
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
			<th scope="row"><label for="jeo_bulk_logging"><?php esc_html_e( 'Enable Logging', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_logging' ) ); ?>" type="checkbox" id="jeo_bulk_logging" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_bulk_logging' ), 1 ); ?>>
				<span class="description"><?php esc_html_e( 'Record successes and errors in a log file.', 'jeo' ); ?></span>
			</td>
		</tr>
		<?php if ( file_exists( JEO_BASEPATH . 'jeo-bulk-ai.log' ) ) : ?>
			<tr>
				<th scope="row"><?php esc_html_e( 'Recent Logs', 'jeo' ); ?></th>
				<td>
					<div style="background:#000; color:#46b450; padding:15px; border-radius:4px; max-height:200px; overflow-y:auto; font-family:monospace; font-size:12px; margin-bottom: 10px;" id="jeo-bulk-log-container">
						<?php
						$log_content = file_get_contents( JEO_BASEPATH . 'jeo-bulk-ai.log' );
						$log_lines = array_reverse( explode( "\n", trim( $log_content ) ) );
						echo nl2br( esc_html( implode( "\n", array_slice( $log_lines, 0, 10 ) ) ) );
						?>
					</div>
					<div style="display:flex; gap:10px; align-items:center;">
						<a href="<?php echo esc_url( JEO_BASEURL . '/jeo-bulk-ai.log' ); ?>" target="_blank" class="button button-secondary"><?php esc_html_e( 'View Full Log File', 'jeo' ); ?></a>
						<button type="button" class="button button-link-delete" id="jeo-bulk-clear-logs-btn"><?php esc_html_e( 'Clear Logs', 'jeo' ); ?></button>
					</div>
				</td>
			</tr>
		<?php endif; ?>
		<tr>
			<th scope="row"><?php esc_html_e( 'Manual Actions', 'jeo' ); ?></th>
			<td>
				<button type="button" class="button button-primary" id="jeo-bulk-run-manual-btn">
					<?php esc_html_e( 'Run 1 Batch Now', 'jeo' ); ?>
				</button>
				<p class="description"><?php esc_html_e( 'Force the AI to process one batch immediately without waiting for the cron schedule.', 'jeo' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="jeo_bulk_confidence_threshold"><?php esc_html_e( 'Bulk Approval Threshold', 'jeo' ); ?></label></th>
			<td>
				<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_bulk_confidence_threshold' ) ); ?>" type="number" id="jeo_bulk_confidence_threshold" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_bulk_confidence_threshold' ) ); ?>" min="0" max="100" class="small-text"> %
				<span class="description"><?php esc_html_e( 'Minimum average confidence required to auto-approve locations during bulk actions.', 'jeo' ); ?></span>
			</td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Processing Status', 'jeo' ); ?></th>
			<td>
				<?php
				$total_query = new \WP_Query( array(
					'post_type'      => $bulk_post_types,
					'post_status'    => 'publish',
					'posts_per_page' => -1,
					'fields'         => 'ids',
				) );
				$processed_query = new \WP_Query( array(
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
				) );
				$total_posts = $total_query->found_posts;
				$processed_posts = $processed_query->found_posts;
				$percent = $total_posts > 0 ? round( ( $processed_posts / $total_posts ) * 100 ) : 0;
				?>
				<div style="width: 100%; background: #e2e4e7; border-radius: 4px; height: 20px; margin-bottom: 10px;">
					<div style="width: <?php echo esc_attr( $percent ); ?>%; background: #46b450; height: 100%; border-radius: 4px;"></div>
				</div>
				<p>
					<?php printf( esc_html__( 'Processed %1$d of %2$d posts (%3$d%%).', 'jeo' ), $processed_posts, $total_posts, $percent ); ?>
				</p>
			</td>
		</tr>
	</tbody>
</table>
