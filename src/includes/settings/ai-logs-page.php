<div class="wrap">
	<h1><?php esc_html_e( 'AI Cost Dashboard & Debug Logs', 'jeo' ); ?></h1>
	<p><?php esc_html_e( 'Here you can view the most recent AI interactions powered by Neuron AI, along with their detailed token usage (Input/Output).', 'jeo' ); ?></p>
	<hr>

	<?php 
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Unauthorized access.' );
		}

		// Handle "Clear Logs" action
		if ( isset( $_POST['jeo_clear_logs'] ) && check_admin_referer( 'jeo_clear_logs_action' ) ) {
			$posts_to_delete = get_posts( array(
				'post_type'      => \Jeo\AI\AI_Logger::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => 'any',
			) );
			foreach ( $posts_to_delete as $log_post ) {
				wp_delete_post( $log_post->ID, true );
			}
			echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'All AI logs have been permanently deleted.', 'jeo' ) . '</p></div>';
		}

		$search_term = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; 
		$current_page = isset( $_GET['paged'] ) ? max( 1, intval( $_GET['paged'] ) ) : 1;
		$per_page     = 25;

		$query_args = array(
			'post_type'      => \Jeo\AI\AI_Logger::POST_TYPE,
			'posts_per_page' => $per_page,
			'paged'          => $current_page,
			'post_status'    => 'any',
			's'              => $search_term
		);
		$logs_query = new \WP_Query( $query_args );

		$total_items = $logs_query->found_posts;
		$total_pages = $logs_query->max_num_pages;
	?>

	<div style="display:flex; justify-content:space-between; align-items:center;">
		<form method="get" style="display:inline-block;">
			<input type="hidden" name="page" value="jeo-ai-logs" />
			<p class="search-box">
				<label class="screen-reader-text" for="post-search-input"><?php esc_html_e( 'Search logs:', 'jeo' ); ?></label>
				<input type="search" id="post-search-input" name="s" value="<?php echo esc_attr( $search_term ); ?>">
				<input type="submit" id="search-submit" class="button" value="<?php esc_attr_e( 'Search Logs', 'jeo' ); ?>">
			</p>
		</form>

		<form method="post" action="" style="display:inline-block;">
			<?php wp_nonce_field( 'jeo_clear_logs_action' ); ?>
			<input type="hidden" name="jeo_clear_logs" value="1">
			<button type="submit" class="button button-secondary" onclick="return confirm('<?php esc_attr_e( 'Are you sure you want to delete ALL logs?', 'jeo' ); ?>');">
				<?php esc_html_e( 'Clear All Logs', 'jeo' ); ?>
			</button>
		</form>
	</div>

	<div class="tablenav top">
		<div class="tablenav-pages">
			<span class="displaying-num"><?php echo esc_html( sprintf( _n( '%s item', '%s items', $total_items, 'jeo' ), $total_items ) ); ?></span>
			<?php if ( $total_pages > 1 ) : ?>
				<span class="pagination-links">
					<?php 
						echo paginate_links( array(
							'base'      => add_query_arg( 'paged', '%#%' ),
							'format'    => '',
							'prev_text' => __( '&laquo;' ),
							'next_text' => __( '&raquo;' ),
							'total'     => $total_pages,
							'current'   => $current_page
						) );
					?>
				</span>
			<?php endif; ?>
		</div>
	</div>

	<table class="wp-list-table widefat fixed striped">
		<thead>
			<tr>
				<th style="width: 15%;"><?php esc_html_e( 'Date/Time', 'jeo' ); ?></th>
				<th style="width: 15%;"><?php esc_html_e( 'Provider', 'jeo' ); ?></th>
				<th style="width: 20%;"><?php esc_html_e( 'Tokens (In / Out)', 'jeo' ); ?></th>
				<th style="width: 35%;"><?php esc_html_e( 'Status / Output Preview', 'jeo' ); ?></th>
				<th style="width: 15%;"><?php esc_html_e( 'Actions', 'jeo' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php if ( ! $logs_query->have_posts() ) : ?>
				<tr><td colspan="5"><?php esc_html_e( 'No logs found yet. Ensure Debug Mode is enabled and georeference a post.', 'jeo' ); ?></td></tr>
			<?php else : ?>
				<?php while ( $logs_query->have_posts() ) : $logs_query->the_post(); ?>
					<?php 
					$post_id  = get_the_ID();
					$provider = get_post_meta( $post_id, '_jeo_ai_provider', true );
					$in_tok   = get_post_meta( $post_id, '_jeo_ai_input_tokens', true );
					$out_tok  = get_post_meta( $post_id, '_jeo_ai_output_tokens', true );
					$tot_tok  = get_post_meta( $post_id, '_jeo_ai_total_tokens', true );
					
					$prompt   = get_post_meta( $post_id, '_jeo_ai_prompt', true );
					$response = get_post_meta( $post_id, '_jeo_ai_response', true );

					$prompt_decoded = json_decode( $prompt );
					$resp_decoded   = json_decode( $response );

					$raw_input  = $prompt_decoded ? wp_json_encode( $prompt_decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) : $prompt;
					$raw_output = $resp_decoded ? wp_json_encode( $resp_decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) : $response;

					$preview = mb_substr( strip_tags( $raw_output ), 0, 100 ) . '...';
					?>
					<tr>
						<td><?php echo esc_html( get_the_date( 'Y-m-d H:i:s' ) ); ?></td>
						<td><span class="badge" style="background:#0073aa;color:#fff;padding:3px 6px;border-radius:3px;font-size:11px;"><?php echo esc_html( strtoupper( $provider ) ); ?></span></td>
						<td>
							<strong style="font-size: 14px;"><?php echo esc_html( $tot_tok ); ?> Total</strong><br/>
							<small style="color:#555;">Prompt: <?php echo esc_html( $in_tok ); ?> | Completion: <?php echo esc_html( $out_tok ); ?></small>
						</td>
						<td><code><?php echo esc_html( $preview ); ?></code></td>
						<td>
							<button type="button" class="button jeo-ai-view-log-btn" data-log-id="ai-log-modal-<?php echo esc_attr( $post_id ); ?>">
								<?php esc_html_e( 'View Details', 'jeo' ); ?>
							</button>

							<dialog id="ai-log-modal-<?php echo esc_attr( $post_id ); ?>" class="jeo-ai-modal">
								<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">
									<h2 style="margin:0;"><?php esc_html_e( 'AI Interaction Details', 'jeo' ); ?> - <?php echo esc_html( $provider ); ?></h2>
									<button type="button" class="button jeo-ai-close-modal-btn"><?php esc_html_e( 'Close', 'jeo' ); ?></button>
								</div>
								
								<div style="display:flex; gap:20px; margin-bottom: 15px;">
									<div><strong><?php esc_html_e( 'Timestamp', 'jeo' ); ?>:</strong> <?php echo esc_html( get_the_date( 'Y-m-d H:i:s' ) ); ?></div>
									<div><strong><?php esc_html_e( 'Input Tokens', 'jeo' ); ?>:</strong> <?php echo esc_html( $in_tok ); ?></div>
									<div><strong><?php esc_html_e( 'Output Tokens', 'jeo' ); ?>:</strong> <?php echo esc_html( $out_tok ); ?></div>
								</div>

								<h3><?php esc_html_e( 'Input (Prompt sent)', 'jeo' ); ?></h3>
								<pre style="background:#f0f0f1; padding:15px; overflow-x:auto; border:1px solid #ccc; max-height: 250px; overflow-y:auto; font-size:12px;"><?php echo esc_html( $raw_input ); ?></pre>

								<h3><?php esc_html_e( 'Output (Raw Response)', 'jeo' ); ?></h3>
								<pre style="background:#f0f0f1; padding:15px; overflow-x:auto; border:1px solid #ccc; max-height: 250px; overflow-y:auto; font-size:12px;"><?php echo esc_html( $raw_output ); ?></pre>
							</dialog>
						</td>
					</tr>
				<?php endwhile; wp_reset_postdata(); ?>
			<?php endif; ?>
		</tbody>
	</table>

	<style>
		dialog.jeo-ai-modal {
			width: 80%;
			max-width: 900px;
			border: none;
			border-radius: 4px;
			box-shadow: 0 5px 15px rgba(0,0,0,0.5);
			padding: 20px;
		}
		dialog.jeo-ai-modal::backdrop {
			background: rgba(0,0,0,0.6);
		}
	</style>
	<script>
		document.addEventListener('DOMContentLoaded', function() {
			var viewBtns = document.querySelectorAll('.jeo-ai-view-log-btn');
			var closeBtns = document.querySelectorAll('.jeo-ai-close-modal-btn');

			viewBtns.forEach(function(btn) {
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					var dialog = document.getElementById(this.getAttribute('data-log-id'));
					if(dialog) dialog.showModal();
				});
			});

			closeBtns.forEach(function(btn) {
				btn.addEventListener('click', function(e) {
					e.preventDefault();
					var dialog = this.closest('dialog');
					if(dialog) dialog.close();
				});
			});
		});
	</script>
</div>
