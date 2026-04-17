<?php
$rag_feasibility = \Jeo\AI\RAG_Agent::is_feasible();
$is_rag_blocked = is_wp_error( $rag_feasibility );
?>

<div class="card" style="max-width: 100%; margin-top: 0; padding: 20px; border-radius: 8px; position: relative;">
	
	<h3 style="margin-top: 0; color: #1d2327;">🧠 <?php esc_html_e( 'RAG Knowledge Base (Vector Store)', 'jeo' ); ?></h3>
	<p class="description"><?php esc_html_e( 'Vectorize your WordPress posts to allow the JEO AI to contextually answer questions and cross-reference territorial data.', 'jeo' ); ?></p>

	<table class="form-table" style="margin-top: 20px;">
			<tbody>
					<tr>
							<th scope="row"><label for="ai_embedding_model"><?php esc_html_e( 'Embedding Model', 'jeo' ); ?></label></th>
							<td>
									<?php
									$current_embed_model = \jeo_settings()->get_option( 'ai_embedding_model' );
									$locked_model = \Jeo\AI\RAG_Agent::get_locked_model( 'jeo_knowledge' );
									
									if ( empty( $current_embed_model ) && ! empty( $locked_model ) ) {
										$current_embed_model = $locked_model;
									}

									$is_locked = ! empty( $locked_model );
									?>
									
									<?php if ( $is_locked ) : ?>
										<div style="background: #fff8e1; border-left: 4px solid #ffb900; padding: 10px 15px; margin-bottom: 15px; border-radius: 4px;">
											<p style="margin: 0; font-weight: 600; color: #856404;">
												🔒 <?php esc_html_e( 'Model selection is locked.', 'jeo' ); ?>
											</p>
											<p style="margin: 5px 0 0 0; font-size: 13px;">
												<?php printf( esc_html__( 'This Vector Store was initialized with %s. To use a different model, you must clear the current store first.', 'jeo' ), '<code>' . esc_html( $locked_model ) . '</code>' ); ?>
											</p>
										</div>
										<input type="hidden" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_embedding_model' ) ); ?>" value="<?php echo esc_attr( $current_embed_model ); ?>">
									<?php endif; ?>

									<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_embedding_model' ) ); ?>" id="ai_embedding_model" style="width: 100%; max-width: 400px;" <?php disabled( $is_locked ); ?> required>
											<option value="" disabled <?php selected( $current_embed_model, '' ); ?>><?php esc_html_e( 'Select an embedding model...', 'jeo' ); ?></option>

											<?php if ( ! empty( $current_embed_model ) && strpos( $current_embed_model, ':' ) === false ) : ?>
													<option value="<?php echo esc_attr( $current_embed_model ); ?>" selected="selected"><?php echo esc_html( $current_embed_model ); ?> (Legacy/Custom)</option>
											<?php endif; ?>

											<?php if ( ! empty( \jeo_settings()->get_option( 'openai_api_key' ) ) ) : ?>
											<optgroup label="OpenAI">
													<option value="openai:text-embedding-3-small" <?php selected( $current_embed_model, 'openai:text-embedding-3-small' ); ?>>text-embedding-3-small</option>
													<option value="openai:text-embedding-3-large" <?php selected( $current_embed_model, 'openai:text-embedding-3-large' ); ?>>text-embedding-3-large</option>
													<option value="openai:text-embedding-ada-002" <?php selected( $current_embed_model, 'openai:text-embedding-ada-002' ); ?>>text-embedding-ada-002</option>
											</optgroup>
											<?php endif; ?>

											<?php if ( ! empty( \jeo_settings()->get_option( 'gemini_api_key' ) ) ) : ?>
											<optgroup label="Google Gemini">
													<option value="gemini:gemini-embedding-001" <?php selected( $current_embed_model, 'gemini:gemini-embedding-001' ); ?>>gemini-embedding-001</option>
													<option value="gemini:gemini-embedding-2-preview" <?php selected( $current_embed_model, 'gemini:gemini-embedding-2-preview' ); ?>>gemini-embedding-2-preview</option>
											</optgroup>
											<?php endif; ?>

											<?php if ( ! empty( \jeo_settings()->get_option( 'ollama_url' ) ) ) : ?>
											<optgroup label="Ollama (Local)">
													<option value="ollama:nomic-embed-text" <?php selected( $current_embed_model, 'ollama:nomic-embed-text' ); ?>>nomic-embed-text</option>
													<option value="ollama:mxbai-embed-large" <?php selected( $current_embed_model, 'ollama:mxbai-embed-large' ); ?>>mxbai-embed-large</option>
											</optgroup>
											<?php endif; ?>
									</select>
									<p class="description"><?php esc_html_e( 'Select the specific embedding model. You can mix providers (e.g. use Gemini for chat and OpenAI for embeddings).', 'jeo' ); ?></p>
							</td>
					</tr>
			</tbody>
	</table>

	<div style="position: relative; <?php echo $is_rag_blocked ? 'background: #f6f7f7; border-color: #dcdcde;' : ''; ?> padding: 20px; border-radius: 8px;">
	
		<?php if ( $is_rag_blocked ) : ?>
			<div class="jeo-rag-blocked-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; border-radius: 8px; text-align: center; padding: 40px; box-sizing: border-box;">
				<div style="background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #dcdcde; max-width: 500px;">
					<span style="font-size: 40px; display: block; margin-bottom: 15px;">🚧</span>
					<h3 style="margin-top: 0; color: #d63638;"><?php esc_html_e( 'RAG Knowledge Base is not available', 'jeo' ); ?></h3>
					<p style="font-size: 14px; line-height: 1.6; color: #50575e; margin-bottom: 20px;">
						<?php echo esc_html( $rag_feasibility->get_error_message() ); ?>
					</p>
					<div style="background: #f0f6fb; padding: 15px; border-left: 4px solid #2271b1; border-radius: 4px; text-align: left; margin-bottom: 20px;">
						<strong><?php esc_html_e( 'How to fix this:', 'jeo' ); ?></strong>
						<ul style="margin: 10px 0 0 20px; list-style: disc; font-size: 13px;">
							<?php if ( $rag_feasibility->get_error_code() === 'rag_no_embedding_model' ) : ?>
								<li><?php esc_html_e( 'Please select an Embedding Model from the dropdown above and click "Save AI Settings".', 'jeo' ); ?></li>
							<?php else : ?>
								<li><?php esc_html_e( 'Ensure you have an active AI Provider (Gemini, OpenAI, or Ollama) configured in the "AI Provider" tab.', 'jeo' ); ?></li>
								<li><?php esc_html_e( 'Check if the "wp-content/uploads" directory exists and is writable.', 'jeo' ); ?></li>
							<?php endif; ?>
						</ul>
					</div>
					<?php if ( $rag_feasibility->get_error_code() !== 'rag_no_embedding_model' ) : ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=jeo-ai-settings&tab=provider' ) ); ?>" class="button button-primary"><?php esc_html_e( 'Go to AI Provider Settings', 'jeo' ); ?></a>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>

	<div style="margin-top: 20px; display: flex; align-items: flex-start; gap: 20px; background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 6px;">
			<div style="flex: 1;">
					<h4 style="margin-top: 0;"><?php esc_html_e( 'Background Indexing', 'jeo' ); ?></h4>
					<p class="description"><?php esc_html_e( 'Automatically vectorize your posts in small batches using WP-Cron.', 'jeo' ); ?></p>
					
					<div style="margin-top: 15px;">
						<label>
							<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_auto_index' ) ); ?>" type="checkbox" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_rag_auto_index' ), 1 ); ?>>
							<strong><?php esc_html_e( 'Enable Auto-indexing', 'jeo' ); ?></strong>
						</label>
						<p style="font-size: 11px; margin-top: 5px; color: #8c8f94; font-style: italic;">
							<?php esc_html_e( 'Note: WP-Cron only runs when your site receives visitor traffic. If you are on a local development server with no traffic, indexing will pause until pages are loaded.', 'jeo' ); ?>
						</p>
					</div>

					<div style="margin-top: 15px; display: flex; gap: 20px;">
						<div class="jeo-filter-group">
							<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Batch Size', 'jeo' ); ?></label>
							<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_batch_size' ) ); ?>" type="number" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_rag_batch_size' ) ); ?>" min="1" max="100" class="small-text">
						</div>
						<div class="jeo-filter-group">
							<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Cron Interval', 'jeo' ); ?></label>
							<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_cron_interval' ) ); ?>">
								<option value="every_minute" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_minute' ); ?>><?php esc_html_e( 'Every Minute', 'jeo' ); ?></option>
								<option value="every_5_mins" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_5_mins' ); ?>><?php esc_html_e( 'Every 5 Minutes', 'jeo' ); ?></option>
								<option value="every_15_mins" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_15_mins' ); ?>><?php esc_html_e( 'Every 15 Minutes', 'jeo' ); ?></option>
								<option value="hourly" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'hourly' ); ?>><?php esc_html_e( 'Hourly', 'jeo' ); ?></option>
							</select>
						</div>
					</div>

					<div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
						<h5 style="margin: 0 0 10px 0;"><?php esc_html_e( 'Recent Background Logs', 'jeo' ); ?></h5>
						<?php
						$cron_logs = get_option( 'jeo_rag_cron_logs', array() );
						if ( empty( $cron_logs ) || ! is_array( $cron_logs ) ) : ?>
							<p style="font-size: 11px; color: #8c8f94; font-style: italic; margin: 0;">
								<?php esc_html_e( 'No indexing jobs have run recently.', 'jeo' ); ?>
							</p>
						<?php else : ?>
							<ul style="margin: 0; padding: 0; list-style: none; font-size: 11px; font-family: monospace;">
								<?php foreach ( $cron_logs as $log ) : ?>
									<li style="margin-bottom: 5px; padding: 5px 8px; background: #f6f7f7; border-left: 2px solid #ccc; border-radius: 3px;">
										<span style="color: #8c8f94;">[<?php echo esc_html( $log['time'] ); ?>]</span> 
										<strong><?php echo esc_html( $log['source'] ); ?>:</strong> 
										<?php echo esc_html( $log['status'] ); ?> - 
										<?php echo esc_html( $log['message'] ); ?>
									</li>
								<?php endforeach; ?>
							</ul>
						<?php endif; ?>
					</div>
			</div>
			<div style="flex: 1; border-left: 1px solid #eee; padding-left: 20px;">
					<h4 style="margin-top: 0;"><?php esc_html_e( 'Manual Indexing', 'jeo' ); ?></h4>
					<p class="description"><?php esc_html_e( 'Trigger a single batch vectorization immediately.', 'jeo' ); ?></p>
					
					<button type="button" class="button button-primary" id="jeo-ai-rag-manual-btn" style="margin-top: 15px;">
						🚀 <?php esc_html_e( 'Vectorize 1 Batch Now', 'jeo' ); ?>
					</button>

					<?php
					$enabled_post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
					$total_posts = 0;
					foreach ( $enabled_post_types as $pt ) {
						$count = wp_count_posts( $pt );
						if ( isset( $count->publish ) ) {
							$total_posts += (int) $count->publish;
						}
					}
					
					$vectorized_query = new \WP_Query( array(
						'post_type'      => $enabled_post_types,
						'post_status'    => 'publish',
						'posts_per_page' => -1,
						'fields'         => 'ids',
						'meta_query'     => array(
							array(
								'key'     => '_jeo_vectorized_at',
								'compare' => 'EXISTS',
							),
						),
					) );
					$vectorized_count = $vectorized_query->found_posts;
					$rag_percent = $total_posts > 0 ? round( ( $vectorized_count / $total_posts ) * 100 ) : 0;
					?>
					<div style="margin-top: 20px;">
						<div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
							<span><?php esc_html_e( 'Indexing Progress', 'jeo' ); ?></span>
							<span><?php echo $rag_percent; ?>%</span>
						</div>
						<div style="width: 100%; background: #e2e4e7; border-radius: 4px; height: 10px;">
							<div style="width: <?php echo $rag_percent; ?>%; background: #2271b1; height: 100%; border-radius: 4px;"></div>
						</div>
						<p style="font-size: 11px; color: #646970; margin-top: 8px;">
							<?php printf( esc_html__( '%d of %d posts indexed.', 'jeo' ), $vectorized_count, $total_posts ); ?>
						</p>
					</div>
			</div>
	</div>

	<div style="margin-top: 20px; display: flex; align-items: center; gap: 20px;">
			<div>
					<strong><?php esc_html_e( 'Status:', 'jeo' ); ?></strong>
					<span style="color: #46b450; font-weight: bold;">
							<?php esc_html_e( 'Active (Local File Store)', 'jeo' ); ?>
					</span>
			</div>
			<div>
					<p style="margin: 0;"><em><?php esc_html_e( 'Alternative: Use WP-CLI for large databases:', 'jeo' ); ?></em></p>
					<code style="display: block; margin-top: 5px; background: #000; color: #0f0; padding: 10px; border-radius: 4px;">wp jeo ai vectorize --post_type=post --batch_size=20</code>
			</div>
			<div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
				<button type="button" class="button button-secondary" id="jeo-ai-backup-store-btn">
					📦 <?php esc_html_e( 'Backup Store', 'jeo' ); ?>
				</button>
				<button type="button" class="button jeo-ai-clear-store-btn" data-store="production" style="border-color: #d63638; color: #d63638;">
					🗑️ <?php esc_html_e( 'Clear & Reset Model', 'jeo' ); ?>
				</button>
			</div>
	</div>

	<div id="jeo-ai-backups-container" style="margin-top: 20px; border-top: 1px dashed #ccd0d4; padding-top: 20px;">
		<h4 style="margin-top: 0;"><?php esc_html_e( 'Available Backups (Last 3)', 'jeo' ); ?></h4>
		<div id="jeo-ai-backups-list">
			<p style="color: #8c8f94; font-style: italic;"><?php esc_html_e( 'No backups found.', 'jeo' ); ?></p>
		</div>
	</div>

</div>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccd0d4;">
		<h4 style="margin-top: 0; margin-bottom: 10px;"><?php esc_html_e( 'Test Embeddings & RAG Retrieval', 'jeo' ); ?></h4>
		<p class="description" style="margin-bottom: 15px;"><?php esc_html_e( 'Test your configured Embedding Model on a random post to ensure it works correctly before indexing your entire database. This uses a temporary testing store.', 'jeo' ); ?></p>

		<div style="display: flex; gap: 15px; align-items: center;">
				<button type="button" class="button button-primary" id="jeo-ai-test-embedding-btn"><?php esc_html_e( 'Run Test on Random Post', 'jeo' ); ?></button>
				<button type="button" class="button button-secondary" id="jeo-ai-test-retrieval-btn"><?php esc_html_e( 'Test Vector Retrieval', 'jeo' ); ?></button>
				<span id="jeo-ai-test-embedding-status" style="font-style:italic; font-weight: 500;"></span>
		</div>
		<div id="jeo-ai-test-embedding-results" style="margin-top: 15px; display: none; background: #f6f7f7; padding: 15px; border: 1px solid #dcdcde; border-radius: 6px;"></div>

		<!-- RAG Retrieval Modal -->
		<dialog id="rag-retrieval-modal" class="jeo-ai-modal jeo-dict-modal" style="width: 90%; max-width: 1000px;">
				<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 15px; margin-bottom: 20px; position: sticky; top: 0; background: #fff; z-index: 10;">
						<h2 style="margin:0;">🔍 <?php esc_html_e( 'Test Local Vector Retrieval', 'jeo' ); ?></h2>
						<button type="button" class="button jeo-ai-close-retrieval-modal-btn"><?php esc_html_e( 'Close', 'jeo' ); ?></button>
				</div>

				<div class="jeo-dict-content">
						<div style="display: flex; gap: 10px; margin-bottom: 20px;">
								<select id="rag-search-store" class="regular-text" style="width: auto;">
										<option value="production"><?php esc_html_e( 'Search Production Store', 'jeo' ); ?></option>
										<option value="test"><?php esc_html_e( 'Search Test Store', 'jeo' ); ?></option>
								</select>
								<input type="text" id="rag-search-input" class="regular-text" style="flex: 1; padding: 8px;" placeholder="<?php esc_attr_e( 'Search the Vector Store for semantic meaning (e.g., "Indigenous lands in Amazon")', 'jeo' ); ?>">
								<button type="button" class="button button-primary" id="rag-search-submit" style="padding: 0 20px;"><?php esc_html_e( 'Search', 'jeo' ); ?></button>
						</div>
						<div id="rag-search-results" style="min-height: 100px;">
								<p style="color: #646970; font-style: italic;"><?php esc_html_e( 'Enter a semantic search query to retrieve similar vectors from your local store.', 'jeo' ); ?></p>
						</div>
				</div>
		</dialog>
</div>
