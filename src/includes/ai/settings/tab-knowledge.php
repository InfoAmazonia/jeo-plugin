<?php
/**
 * AI knowledge base / RAG settings tab.
 *
 * @package Jeo
 */

$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );

// Early exit: show friendly CTA when no AI provider is configured at all.
if ( empty( $active_provider ) ) :
	?>
	<style>
		#jeo-skeleton { display: none !important; }
		.jeo-tab-content-wrapper { display: block !important; }
	</style>
	<div class="card" style="max-width: 100%; margin-top: 0; padding: 40px; border-radius: 8px; text-align: center;">
		<span style="font-size: 48px; display: block; margin-bottom: 20px;">🔌</span>
		<h2 style="margin-top: 0; color: #1d2327;"><?php esc_html_e( 'AI Provider Required', 'jeowp' ); ?></h2>
		<p style="font-size: 15px; color: #50575e; max-width: 500px; margin: 0 auto 25px; line-height: 1.6;">
			<?php esc_html_e( 'You need to configure an AI Provider before you can use the Knowledge Base. Set up your API key and choose a model in the Provider tab first.', 'jeowp' ); ?>
		</p>
		<a href="<?php echo esc_url( admin_url( 'admin.php?page=jeo-ai-settings&tab=provider' ) ); ?>" class="button button-primary button-hero">
			<?php esc_html_e( 'Configure AI Provider', 'jeowp' ); ?>
		</a>
	</div>
	<?php
	return;
endif;

$rag_feasibility = \Jeo\AI\RAG_Agent::is_feasible();
$is_rag_blocked  = is_wp_error( $rag_feasibility );
?>

<div class="card" style="max-width: 100%; margin-top: 0; padding: 20px; border-radius: 8px; position: relative;">
	
	<h3 style="margin-top: 0; color: #1d2327;">🧠 <?php esc_html_e( 'RAG Knowledge Base (Vector Store)', 'jeowp' ); ?></h3>
	<p class="description"><?php esc_html_e( 'Vectorize your WordPress posts to allow the JEO AI to contextually answer questions and cross-reference territorial data.', 'jeowp' ); ?></p>

	<table class="form-table" style="margin-top: 20px;">
			<tbody>
					<tr>
							<th scope="row"><label for="ai_embedding_model"><?php esc_html_e( 'Embedding Model', 'jeowp' ); ?></label></th>
							<td>
									<?php
									$current_embed_model = \jeo_settings()->get_option( 'ai_embedding_model' );
									$locked_model        = \Jeo\AI\RAG_Agent::get_locked_model( 'jeo_knowledge' );

									if ( empty( $current_embed_model ) && ! empty( $locked_model ) ) {
										$current_embed_model = $locked_model;
									}

									$is_locked = ! empty( $locked_model );
									?>
									
									<?php if ( $is_locked ) : ?>
										<div style="background: #fff8e1; border-left: 4px solid #ffb900; padding: 10px 15px; margin-bottom: 15px; border-radius: 4px;">
											<p style="margin: 0; font-weight: 600; color: #856404;">
												🔒 <?php esc_html_e( 'Model selection is locked.', 'jeowp' ); ?>
											</p>
											<p style="margin: 5px 0 0 0; font-size: 13px;">
												<?php
												/* translators: %s: locked embedding model name */
												printf( esc_html__( 'This Vector Store was initialized with %s. To use a different model, you must clear the current store first.', 'jeowp' ), '<code>' . esc_html( $locked_model ) . '</code>' );
												?>
											</p>
										</div>
										<input type="hidden" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_embedding_model' ) ); ?>" value="<?php echo esc_attr( $current_embed_model ); ?>">
									<?php endif; ?>

									<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_embedding_model' ) ); ?>" id="ai_embedding_model" style="width: 100%; max-width: 400px;" <?php disabled( $is_locked ); ?> required>
											<option value="" disabled <?php selected( $current_embed_model, '' ); ?>><?php esc_html_e( 'Select an embedding model...', 'jeowp' ); ?></option>

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
									<p class="description"><?php esc_html_e( 'Select the specific embedding model. You can mix providers (e.g. use Gemini for chat and OpenAI for embeddings).', 'jeowp' ); ?></p>
							</td>
					</tr>
			</tbody>
	</table>

	<div style="position: relative; <?php echo $is_rag_blocked ? 'background: #f6f7f7; border-color: #dcdcde;' : ''; ?> padding: 20px; border-radius: 8px;">
	
		<?php if ( $is_rag_blocked ) : ?>
			<div class="jeo-rag-blocked-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; border-radius: 8px; text-align: center; padding: 40px; box-sizing: border-box;">
				<div style="background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #dcdcde; max-width: 500px;">
					<span style="font-size: 40px; display: block; margin-bottom: 15px;">🚧</span>
					<h3 style="margin-top: 0; color: #d63638;"><?php esc_html_e( 'RAG Knowledge Base is not available', 'jeowp' ); ?></h3>
					<p style="font-size: 14px; line-height: 1.6; color: #50575e; margin-bottom: 20px;">
						<?php echo esc_html( $rag_feasibility->get_error_message() ); ?>
					</p>
					<div style="background: #f0f6fb; padding: 15px; border-left: 4px solid #2271b1; border-radius: 4px; text-align: left; margin-bottom: 20px;">
						<strong><?php esc_html_e( 'How to fix this:', 'jeowp' ); ?></strong>
						<ul style="margin: 10px 0 0 20px; list-style: disc; font-size: 13px;">
							<?php if ( $rag_feasibility->get_error_code() === 'rag_no_embedding_model' ) : ?>
								<li><?php esc_html_e( 'Please select an Embedding Model from the dropdown above and click "Save AI Settings".', 'jeowp' ); ?></li>
							<?php else : ?>
								<li><?php esc_html_e( 'Ensure you have an active AI Provider (Gemini, OpenAI, or Ollama) configured in the "AI Provider" tab.', 'jeowp' ); ?></li>
								<li><?php esc_html_e( 'Check if the "wp-content/uploads" directory exists and is writable.', 'jeowp' ); ?></li>
							<?php endif; ?>
						</ul>
					</div>
					<?php if ( $rag_feasibility->get_error_code() !== 'rag_no_embedding_model' ) : ?>
						<a href="<?php echo esc_url( admin_url( 'admin.php?page=jeo-ai-settings&tab=provider' ) ); ?>" class="button button-primary"><?php esc_html_e( 'Go to AI Provider Settings', 'jeowp' ); ?></a>
					<?php endif; ?>
				</div>
			</div>
		<?php endif; ?>

	<div style="margin-top: 20px; display: flex; align-items: flex-start; gap: 20px; background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 6px;">
			<div style="flex: 1;">
					<h4 style="margin-top: 0;"><?php esc_html_e( 'Background Indexing', 'jeowp' ); ?></h4>
					<p class="description"><?php esc_html_e( 'Automatically vectorize your posts in small batches using WP-Cron.', 'jeowp' ); ?></p>
					
					<div style="margin-top: 15px;">
						<label>
							<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_auto_index' ) ); ?>" type="checkbox" value="1" <?php checked( \jeo_settings()->get_option( 'jeo_rag_auto_index' ), 1 ); ?>>
							<strong><?php esc_html_e( 'Enable Auto-indexing', 'jeowp' ); ?></strong>
						</label>
						<p style="font-size: 11px; margin-top: 5px; color: #8c8f94; font-style: italic;">
							<?php esc_html_e( 'Note: WP-Cron only runs when your site receives visitor traffic. If you are on a local development server with no traffic, indexing will pause until pages are loaded.', 'jeowp' ); ?>
						</p>
					</div>

					<div style="margin-top: 15px; display: flex; gap: 20px;">
						<div class="jeo-filter-group">
							<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Batch Size', 'jeowp' ); ?></label>
							<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_batch_size' ) ); ?>" type="number" value="<?php echo esc_attr( \jeo_settings()->get_option( 'jeo_rag_batch_size' ) ); ?>" min="1" max="100" class="small-text">
						</div>
						<div class="jeo-filter-group">
							<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Cron Interval', 'jeowp' ); ?></label>
							<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'jeo_rag_cron_interval' ) ); ?>">
								<option value="every_minute" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_minute' ); ?>><?php esc_html_e( 'Every Minute', 'jeowp' ); ?></option>
								<option value="every_5_mins" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_5_mins' ); ?>><?php esc_html_e( 'Every 5 Minutes', 'jeowp' ); ?></option>
								<option value="every_15_mins" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'every_15_mins' ); ?>><?php esc_html_e( 'Every 15 Minutes', 'jeowp' ); ?></option>
								<option value="hourly" <?php selected( \jeo_settings()->get_option( 'jeo_rag_cron_interval' ), 'hourly' ); ?>><?php esc_html_e( 'Hourly', 'jeowp' ); ?></option>
							</select>
						</div>
						<div class="jeo-filter-group">
							<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Search Results (topK)', 'jeowp' ); ?></label>
							<input name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_rag_topk' ) ); ?>" type="number" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_rag_topk' ) ); ?>" min="1" max="50" class="small-text">
							<p class="description" style="font-size: 11px; margin-top: 4px;"><?php esc_html_e( 'Max semantic matches returned per search.', 'jeowp' ); ?></p>
						</div>
					</div>

					<div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
						<h5 style="margin: 0 0 10px 0;"><?php esc_html_e( 'Recent Background Logs', 'jeowp' ); ?></h5>
						<?php
						$cron_logs = get_option( 'jeo_rag_cron_logs', array() );
						if ( empty( $cron_logs ) || ! is_array( $cron_logs ) ) :
							?>
							<p style="font-size: 11px; color: #8c8f94; font-style: italic; margin: 0;">
								<?php esc_html_e( 'No indexing jobs have run recently.', 'jeowp' ); ?>
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
					<h4 style="margin-top: 0;"><?php esc_html_e( 'Manual Indexing', 'jeowp' ); ?></h4>
					<p class="description"><?php esc_html_e( 'Trigger a single batch vectorization immediately.', 'jeowp' ); ?></p>
					
					<button type="button" class="button button-primary" id="jeo-ai-rag-manual-btn" style="margin-top: 15px;">
						🚀 <?php esc_html_e( 'Vectorize 1 Batch Now', 'jeowp' ); ?>
					</button>

					<?php
					$enabled_post_types = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
					$total_posts        = 0;
					foreach ( $enabled_post_types as $pt ) {
						$count = wp_count_posts( $pt );
						if ( isset( $count->publish ) ) {
							$total_posts += (int) $count->publish;
						}
					}

					$vectorized_query = new \WP_Query(
						array(
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
						)
					);
					$vectorized_count = $vectorized_query->found_posts;
					$rag_percent      = $total_posts > 0 ? round( ( $vectorized_count / $total_posts ) * 100 ) : 0;
					?>
					<div style="margin-top: 20px;">
						<div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
							<span><?php esc_html_e( 'Indexing Progress', 'jeowp' ); ?></span>
							<span><?php echo esc_html( $rag_percent ); ?>%</span>
						</div>
						<div style="width: 100%; background: #e2e4e7; border-radius: 4px; height: 10px;">
							<div style="width: <?php echo esc_html( $rag_percent ); ?>%; background: #2271b1; height: 100%; border-radius: 4px;"></div>
						</div>
						<p style="font-size: 11px; color: #646970; margin-top: 8px;">
							<?php
							/* translators: %1$d: vectorized count, %2$d: total posts count */
							printf( esc_html__( '%1$d of %2$d posts indexed.', 'jeowp' ), esc_html( $vectorized_count ), esc_html( $total_posts ) );
							?>
						</p>
					</div>
			</div>
	</div>

	<div style="margin-top: 20px; display: flex; align-items: center; gap: 20px;">
			<div>
					<strong><?php esc_html_e( 'Status:', 'jeowp' ); ?></strong>
					<span style="color: #46b450; font-weight: bold;">
							<?php esc_html_e( 'Active (Local File Store)', 'jeowp' ); ?>
					</span>
			</div>
			<div>
					<p style="margin: 0;"><em><?php esc_html_e( 'Alternative: Use WP-CLI for large databases:', 'jeowp' ); ?></em></p>
					<code style="display: block; margin-top: 5px; background: #000; color: #0f0; padding: 10px; border-radius: 4px;">wp jeo ai vectorize --post_type=post --batch_size=20</code>
			</div>
			<div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
				<button type="button" class="button button-secondary" id="jeo-ai-backup-store-btn">
					📦 <?php esc_html_e( 'Backup Store', 'jeowp' ); ?>
				</button>
				<button type="button" class="button jeo-ai-clear-store-btn" data-store="production" style="border-color: #d63638; color: #d63638;">
					🗑️ <?php esc_html_e( 'Clear & Reset Model', 'jeowp' ); ?>
				</button>
			</div>
	</div>

	<div id="jeo-ai-backups-container" style="margin-top: 20px; border-top: 1px dashed #ccd0d4; padding-top: 20px;">
		<h4 style="margin-top: 0;"><?php esc_html_e( 'Available Backups (Last 3)', 'jeowp' ); ?></h4>
		<div id="jeo-ai-backups-list">
			<p style="color: #8c8f94; font-style: italic;"><?php esc_html_e( 'No backups found.', 'jeowp' ); ?></p>
		</div>
	</div>

</div>

<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccd0d4;">
		<h4 style="margin-top: 0; margin-bottom: 10px;"><?php esc_html_e( 'Test Embeddings & RAG Retrieval', 'jeowp' ); ?></h4>
		<p class="description" style="margin-bottom: 15px;"><?php esc_html_e( 'Test your configured Embedding Model on a random post to ensure it works correctly before indexing your entire database. This uses a temporary testing store.', 'jeowp' ); ?></p>

		<div style="display: flex; gap: 15px; align-items: center;">
				<button type="button" class="button button-primary" id="jeo-ai-test-embedding-btn"><?php esc_html_e( 'Run Test on Random Post', 'jeowp' ); ?></button>
				<button type="button" class="button button-secondary" id="jeo-ai-test-retrieval-btn"><?php esc_html_e( 'Test Vector Retrieval', 'jeowp' ); ?></button>
				<span id="jeo-ai-test-embedding-status" style="font-style:italic; font-weight: 500;"></span>
		</div>
		<div id="jeo-ai-test-embedding-results" style="margin-top: 15px; display: none; background: #f6f7f7; padding: 15px; border: 1px solid #dcdcde; border-radius: 6px;"></div>

		<!-- RAG Retrieval Modal -->
		<dialog id="rag-retrieval-modal" class="jeo-ai-modal jeo-dict-modal" style="width: 90%; max-width: 1000px;">
				<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 15px; margin-bottom: 20px; position: sticky; top: 0; background: #fff; z-index: 10;">
						<h2 style="margin:0;">🔍 <?php esc_html_e( 'Test Local Vector Retrieval', 'jeowp' ); ?></h2>
						<button type="button" class="button jeo-ai-close-retrieval-modal-btn"><?php esc_html_e( 'Close', 'jeowp' ); ?></button>
				</div>

				<div class="jeo-dict-content">
						<div style="display: flex; gap: 10px; margin-bottom: 20px;">
								<select id="rag-search-store" class="regular-text" style="width: auto;">
										<option value="production"><?php esc_html_e( 'Search Production Store', 'jeowp' ); ?></option>
										<option value="test"><?php esc_html_e( 'Search Test Store', 'jeowp' ); ?></option>
								</select>
								<input type="text" id="rag-search-input" class="regular-text" style="flex: 1; padding: 8px;" placeholder="<?php esc_attr_e( 'Search the Vector Store for semantic meaning (e.g., "Indigenous lands in Amazon")', 'jeowp' ); ?>">
								<button type="button" class="button button-primary" id="rag-search-submit" style="padding: 0 20px;"><?php esc_html_e( 'Search', 'jeowp' ); ?></button>
						</div>
						<div id="rag-search-results" style="min-height: 100px;">
								<p style="color: #646970; font-style: italic;"><?php esc_html_e( 'Enter a semantic search query to retrieve similar vectors from your local store.', 'jeowp' ); ?></p>
						</div>
				</div>
		</dialog>
</div>

<!-- Layer Store Section -->
<div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid #ccd0d4;">
		<h3 style="margin-top: 0; color: #1d2327;"><?php esc_html_e( 'Layer Store (Vectorized Map Layers)', 'jeowp' ); ?></h3>
		<p class="description"><?php esc_html_e( 'Vectorize your map layers to enable AI-powered semantic search and layer suggestions based on post content.', 'jeowp' ); ?></p>

		<div style="margin-top: 20px; display: flex; align-items: flex-start; gap: 20px; background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 6px;">
				<div style="flex: 1;">
						<h4 style="margin-top: 0;"><?php esc_html_e( 'Manual Layer Indexing', 'jeowp' ); ?></h4>
						<p class="description"><?php esc_html_e( 'Trigger a single batch vectorization for map layers. Layers are also auto-indexed on the background cron schedule and when saved.', 'jeowp' ); ?></p>

						<button type="button" class="button button-primary" id="jeo-ai-layer-rag-manual-btn" style="margin-top: 15px;">
								🚀 <?php esc_html_e( 'Vectorize 1 Batch Now', 'jeowp' ); ?>
						</button>

						<?php
						$total_layers           = wp_count_posts( 'map-layer' );
						$total_layer_count      = isset( $total_layers->publish ) ? (int) $total_layers->publish : 0;
						$layer_vectorized_q     = new \WP_Query(
							array(
								'post_type'      => 'map-layer',
								'post_status'    => 'publish',
								'posts_per_page' => -1,
								'fields'         => 'ids',
								'meta_query'     => array(
									array(
										'key'     => '_jeo_layer_vectorized_at',
										'compare' => 'EXISTS',
									),
								),
							)
						);
						$layer_vectorized_count = $layer_vectorized_q->found_posts;
						$layer_rag_percent      = $total_layer_count > 0 ? round( ( $layer_vectorized_count / $total_layer_count ) * 100 ) : 0;
						?>
						<div style="margin-top: 20px;">
								<div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
										<span><?php esc_html_e( 'Layer Indexing Progress', 'jeowp' ); ?></span>
										<span><?php echo esc_html( $layer_rag_percent ); ?>%</span>
								</div>
								<div style="width: 100%; background: #e2e4e7; border-radius: 4px; height: 10px;">
										<div style="width: <?php echo esc_html( $layer_rag_percent ); ?>%; background: #d63638; height: 100%; border-radius: 4px;"></div>
								</div>
								<p style="font-size: 11px; color: #646970; margin-top: 8px;">
										<?php
										/* translators: %1$d: vectorized count, %2$d: total layers count */
										printf( esc_html__( '%1$d of %2$d layers indexed.', 'jeowp' ), esc_html( $layer_vectorized_count ), esc_html( $total_layer_count ) );
										?>
								</p>
						</div>

						<div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;">
								<h5 style="margin: 0 0 10px 0;"><?php esc_html_e( 'Recent Layer Logs', 'jeowp' ); ?></h5>
								<?php
								$layer_cron_logs = get_option( 'jeo_layer_rag_cron_logs', array() );
								if ( empty( $layer_cron_logs ) || ! is_array( $layer_cron_logs ) ) :
									?>
									<p style="font-size: 11px; color: #8c8f94; font-style: italic; margin: 0;">
										<?php esc_html_e( 'No layer indexing jobs have run recently.', 'jeowp' ); ?>
									</p>
								<?php else : ?>
									<ul style="margin: 0; padding: 0; list-style: none; font-size: 11px; font-family: monospace;">
										<?php foreach ( $layer_cron_logs as $log ) : ?>
											<li style="margin-bottom: 5px; padding: 5px 8px; background: #f6f7f7; border-left: 2px solid #d63638; border-radius: 3px;">
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
						<h4 style="margin-top: 0;"><?php esc_html_e( 'Suggest Layers', 'jeowp' ); ?></h4>
						<p class="description"><?php esc_html_e( 'Test semantic layer matching. Enter a post ID or text to find layers that match the content.', 'jeowp' ); ?></p>

						<div style="margin-top: 15px; display: flex; gap: 10px; align-items: flex-end;">
								<div>
										<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Post ID', 'jeowp' ); ?></label>
										<input type="number" id="jeo-ai-suggest-layers-post-id" class="small-text" placeholder="<?php esc_attr_e( 'e.g. 123', 'jeowp' ); ?>" min="1">
								</div>
								<div style="flex: 1;">
										<label style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8c8f94; display: block; margin-bottom: 5px;"><?php esc_html_e( 'Or search text', 'jeowp' ); ?></label>
										<input type="text" id="jeo-ai-suggest-layers-query" class="regular-text" style="width: 100%;" placeholder="<?php esc_attr_e( 'e.g., deforestation in Amazon rainforest', 'jeowp' ); ?>">
								</div>
								<button type="button" class="button button-primary" id="jeo-ai-suggest-layers-btn"><?php esc_html_e( 'Find Layers', 'jeowp' ); ?></button>
						</div>

						<div id="jeo-ai-suggest-layers-results" style="margin-top: 15px; display: none;"></div>
				</div>
		</div>

		<div style="margin-top: 20px; display: flex; align-items: center; gap: 20px;">
				<div>
						<strong><?php esc_html_e( 'Status:', 'jeowp' ); ?></strong>
						<span style="color: #d63638; font-weight: bold;">
								<?php esc_html_e( 'Active (Shared embedding model with Posts Store)', 'jeowp' ); ?>
						</span>
				</div>
				<div>
						<p style="margin: 0;"><em><?php esc_html_e( 'WP-CLI:', 'jeowp' ); ?></em></p>
						<code style="display: block; margin-top: 5px; background: #000; color: #0f0; padding: 10px; border-radius: 4px;">wp jeo ai vectorize-layers --batch_size=20</code>
				</div>
				<div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
						<button type="button" class="button jeo-ai-clear-layer-store-btn" style="border-color: #d63638; color: #d63638;">
								🗑️ <?php esc_html_e( 'Clear Layer Store', 'jeowp' ); ?>
						</button>
				</div>
		</div>
</div>
