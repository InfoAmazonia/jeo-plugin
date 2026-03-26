<div class="wrap">
	<h1><?php esc_html_e( 'JEO AI Debug Logs', 'jeo' ); ?></h1>
	<p><?php esc_html_e( 'Here you can view the most recent AI interactions, raw inputs, and raw outputs for debugging.', 'jeo' ); ?></p>
	<hr>

	<?php 
		$search_term = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; 
		$all_logs    = jeo_ai_handler()->get_last_logs( 1000 ); // Load up to 1000 to allow search and paginate manually
		$filtered    = array();

		// Apply simple search filter
		foreach ( $all_logs as $log ) {
			if ( empty( $search_term ) || stripos( wp_json_encode($log), $search_term ) !== false ) {
				$filtered[] = $log;
			}
		}

		// Simple pagination logic
		$per_page     = 25;
		$current_page = isset( $_GET['paged'] ) ? max( 1, intval( $_GET['paged'] ) ) : 1;
		$total_items  = count( $filtered );
		$total_pages  = ceil( $total_items / $per_page );
		$offset       = ( $current_page - 1 ) * $per_page;
		$paged_logs   = array_slice( $filtered, $offset, $per_page );
	?>

	<form method="get">
		<input type="hidden" name="page" value="jeo-ai-logs" />
		<p class="search-box">
			<label class="screen-reader-text" for="post-search-input"><?php esc_html_e( 'Search logs:', 'jeo' ); ?></label>
			<input type="search" id="post-search-input" name="s" value="<?php echo esc_attr( $search_term ); ?>">
			<input type="submit" id="search-submit" class="button" value="<?php esc_attr_e( 'Search Logs', 'jeo' ); ?>">
		</p>
	</form>

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
				<th><?php esc_html_e( 'Date/Time', 'jeo' ); ?></th>
				<th><?php esc_html_e( 'Provider', 'jeo' ); ?></th>
				<th><?php esc_html_e( 'Status / Output Preview', 'jeo' ); ?></th>
				<th style="width: 150px;"><?php esc_html_e( 'Actions', 'jeo' ); ?></th>
			</tr>
		</thead>
		<tbody>
			<?php if ( empty( $paged_logs ) ) : ?>
				<tr><td colspan="4"><?php esc_html_e( 'No logs found yet. Try georeferencing a post with AI first.', 'jeo' ); ?></td></tr>
			<?php else : ?>
				<?php foreach ( $paged_logs as $index => $log ) : ?>
					<?php 
					$preview = mb_substr( strip_tags( $log['output'] ), 0, 100 ) . '...';
					$raw_input = json_decode( $log['input'] ) ? wp_json_encode( json_decode( $log['input'] ), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) : $log['input'];
					$raw_output = json_decode( $log['output'] ) ? wp_json_encode( json_decode( $log['output'] ), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) : $log['output'];
					?>
					<tr>
						<td><?php echo esc_html( $log['timestamp'] ); ?></td>
						<td><strong><?php echo esc_html( $log['provider'] ); ?></strong></td>
						<td><code><?php echo esc_html( $preview ); ?></code></td>
						<td>
							<button type="button" class="button jeo-ai-view-log-btn" data-log-id="ai-log-modal-<?php echo esc_attr( $index ); ?>">
								<?php esc_html_e( 'View Details', 'jeo' ); ?>
							</button>

							<dialog id="ai-log-modal-<?php echo esc_attr( $index ); ?>" class="jeo-ai-modal">
								<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px;">
									<h2 style="margin:0;"><?php esc_html_e( 'AI Interaction Details', 'jeo' ); ?> - <?php echo esc_html( $log['provider'] ); ?></h2>
									<button type="button" class="button jeo-ai-close-modal-btn"><?php esc_html_e( 'Close', 'jeo' ); ?></button>
								</div>
								
								<h3><?php esc_html_e( 'Timestamp', 'jeo' ); ?></h3>
								<p><?php echo esc_html( $log['timestamp'] ); ?></p>

								<h3><?php esc_html_e( 'Input (Prompt sent)', 'jeo' ); ?></h3>
								<pre style="background:#f0f0f1; padding:15px; overflow-x:auto; border:1px solid #ccc; max-height: 350px; overflow-y:auto; font-size:12px;"><?php echo esc_html( $raw_input ); ?></pre>

								<h3><?php esc_html_e( 'Output (Raw Response)', 'jeo' ); ?></h3>
								<pre style="background:#f0f0f1; padding:15px; overflow-x:auto; border:1px solid #ccc; max-height: 350px; overflow-y:auto; font-size:12px;"><?php echo esc_html( $raw_output ); ?></pre>
							</dialog>
						</td>
					</tr>
				<?php endforeach; ?>
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
