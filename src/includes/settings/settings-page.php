<form action="options.php" method="post" class="clear prepend-top">
	<?php settings_fields( $this->option_key ); ?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Jeo Settings', 'jeo' ); ?></h1>
		<h2 id="tabs" class="nav-tab-wrapper">
			<a href="#" class="nav-tab" data-target="general">
				<?php esc_html_e( 'General', 'jeo' ); ?>
			</a>
			<a href="#" class="nav-tab" data-target="geocoders">
				<?php esc_html_e( 'Geocoders', 'jeo' ); ?>
			</a>
			<a href="#" class="nav-tab" data-target="ai">
				<?php esc_html_e( 'AI (v3.5)', 'jeo' ); ?>
			</a>
			<a href="#" class="nav-tab" data-target="knowledge">
				<?php esc_html_e( 'Knowledge Base', 'jeo' ); ?>
			</a>
			<a href="#" class="nav-tab" data-target="customize">
				<?php esc_html_e( 'Customize', 'jeo' ); ?>
			</a>
		</h2>

		<style>
			/* Esconde todas as abas inicialmente para o Skeleton Loader brilhar */
			.tabs-content { display: none; }
			
			.jeo-skeleton-container {
				background: #fff;
				border: 1px solid #c3c4c7;
				padding: 30px;
				margin-top: 15px;
				box-shadow: 0 1px 1px rgba(0,0,0,.04);
			}
			.jeo-skeleton-pulse {
				animation: jeo-pulse 1.5s infinite ease-in-out;
			}
			.jeo-skeleton-line {
				height: 20px;
				background: #e2e4e7;
				border-radius: 4px;
				margin-bottom: 20px;
			}
			.jeo-skeleton-line.short { width: 30%; }
			.jeo-skeleton-line.medium { width: 60%; }
			.jeo-skeleton-line.long { width: 90%; }
			.jeo-v4-notice {
				text-align: right;
				font-style: italic;
				color: #646970;
				font-size: 13px;
				margin-top: 30px;
				border-top: 1px dashed #dcdcdc;
				padding-top: 15px;
			}
			@keyframes jeo-pulse {
				0% { opacity: 0.5; }
				50% { opacity: 1; }
				100% { opacity: 0.5; }
			}
		</style>

		<div id="jeo-skeleton" class="jeo-skeleton-container jeo-skeleton-pulse">
			<div class="jeo-skeleton-line short"></div>
			<div class="jeo-skeleton-line long"></div>
			<div class="jeo-skeleton-line medium"></div>
			<div class="jeo-skeleton-line long"></div>
			<div class="jeo-skeleton-line short"></div>
			<div class="jeo-v4-notice">✨ <?php esc_html_e( 'Loading settings... (A completely revamped panel is coming in JEO v4.0)', 'jeo' ); ?></div>
		</div>

		<div id="tab-general" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Map', 'jeo' ); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_runtime"><?php esc_html_e( 'Rendering library', 'jeo' ); ?></label></th>
						<td>
							<select name="<?php echo esc_html( $this->get_field_name( 'map_runtime' ) ); ?>" id="map_runtime">
								<option value="mapboxgl" <?php selected( $this->get_option( 'map_runtime' ), 'mapboxgl' ); ?>>MapboxGL</option>
								<option value="maplibregl" <?php selected( $this->get_option( 'map_runtime' ), 'maplibregl' ); ?>>MapLibreGL</option>
							</select>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lat"><?php esc_html_e( 'Default map latitute', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lat' ) ); ?>" type="number" step=".00000000000001" id="map_default_lat" value="<?php echo esc_html( $this->get_option( 'map_default_lat' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lng"><?php esc_html_e( 'Default map longitude', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lng' ) ); ?>" type="number" step=".00000000000001" id="map_default_lng" value="<?php echo esc_html( $this->get_option( 'map_default_lng' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_zoom"><?php esc_html_e( 'Default map zoom', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'map_default_zoom' ) ); ?>" type="number" step=".00000000000001" id="map_default_zoom" value="<?php echo esc_html( $this->get_option( 'map_default_zoom' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Post types', 'jeo' ); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="show_storymaps_on_post_archives"><?php esc_html_e( 'Show story maps on post archives pages', 'jeo' ); ?></label></th>
						<td>
						<input type="checkbox" name="<?php echo esc_html( $this->get_field_name( 'show_storymaps_on_post_archives' ) ); ?>" value="1" <?php checked( 1, $this->get_option( 'show_storymaps_on_post_archives' ), true ); ?> />
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="enabled_post_types"><?php esc_html_e( 'Enabled Post Types. Default: post,storymap', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'enabled_post_types' ) ); ?>" placeholder="<?php esc_attr_e( 'Post types separated by comma, Ex: map,post,page', 'jeo' ); ?>" type="text" id="enabled_post_types" value="<?php echo esc_textarea( implode( ',', $this->get_option( 'enabled_post_types' ) ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Mapbox', 'jeo' ); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_key"><?php esc_html_e( 'API Key', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'mapbox_key' ) ); ?>" placeholder="<?php esc_attr_e( 'Ex. pk.eyJ3...', 'jeo' ); ?>" type="text" id="mapbox_key" value="<?php echo esc_html( $this->get_option( 'mapbox_key' ) ); ?>" class="regular-text">
						</td>
					</tr>
				</tbody>
			</table>
		</div>


		<div id="tab-geocoders" class="tabs-content">
			<table class="form-table">
				<tbody>

					<tr>
						<th scope="row"><label for="active_geocoder_select"><?php esc_html_e( 'Active Geocoder', 'jeo' ); ?></label></th>
						<td>
							<select name="<?php echo esc_html( $this->get_field_name( 'active_geocoder' ) ); ?>" id="active_geocoder_select">

								<?php foreach ( jeo_geocode_handler()->get_registered_geocoders() as $geocoder ) : ?>

									<option selected="<?php selected( $this->get_option( 'active_geocoder' ), $geocoder['slug'] ); ?>" value="<?php echo esc_html( $geocoder['slug'] ); ?>">
										<?php echo esc_html( $geocoder['name'] ); ?>
									</option>

								<?php endforeach; ?>
							</select>
						</td>
					</tr>


					<?php
					foreach ( jeo_geocode_handler()->get_registered_geocoders() as $gslug => $geocoder ) :
						$geo_object = jeo_geocode_handler()->initialize_geocoder( $gslug );
						?>

						<?php
						if ( false === $geo_object->get_settings() ) {
							continue;}
						?>

						<tr class="geocoder_options" id="geocoder_options_<?php echo esc_attr( $gslug ); ?>">
							<th scope="row">
								<label for="input_id">
									<?php // translators: %s is the geocoder name. Ex: Nominatim options ?>
									<?php printf( esc_html_x( '%s options', 'geocoder_options', 'jeo' ), esc_attr( $geocoder['name'] ) ); ?>
								</label>
							</th>
							<td>
								<?php foreach ( $geo_object->get_settings() as $settings ) : ?>
									<label for="<?php echo esc_html( $settings['slug'] ); ?>">
										<strong><?php echo esc_html( $settings['name'] ); ?></strong> <br/>
									</label>
									<input name="<?php echo esc_html( $this->get_geocoder_option_field_name( $gslug, $settings['slug'] ) ); ?>" type="text" id="<?php echo esc_html( $settings['slug'] ); ?>" value="<?php echo esc_html( $this->get_geocoder_option( $gslug, $settings['slug'] ) ); ?>" class="regular-text">
									<p class="description">
									<?php echo esc_html( $settings['description'] ); ?>
									</p>
								<?php endforeach; ?>

								<?php $geo_object->settings_footer( $this ); ?>

							</td>
						</tr>

					<?php endforeach; ?>

				</tbody>
			</table>
		</div>

		<div id="tab-ai" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><label for="ai_default_provider"><?php esc_html_e( 'Active AI Provider', 'jeo' ); ?></label></th>
						<td>
							<div style="display:flex; align-items:center; gap: 20px;">
								<select name="<?php echo esc_html( $this->get_field_name( 'ai_default_provider' ) ); ?>" id="ai_default_provider">
									<?php foreach ( jeo_ai_handler()->get_adapters() as $slug => $name ) : ?>
										<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $this->get_option( 'ai_default_provider' ), $slug ); ?>><?php echo esc_html( $name ); ?></option>
									<?php endforeach; ?>
								</select>
								<div id="jeo-ai-key-status-wrapper" style="font-size:12px; font-weight: 500; display:flex; align-items:center; gap:8px;">
									<span><?php esc_html_e( 'API Status:', 'jeo' ); ?></span>
									<span id="jeo-ai-key-status-badge" style="padding: 2px 8px; border-radius: 12px; background: #f0f0f1; color: #646970;"><?php esc_html_e( 'Checking...', 'jeo' ); ?></span>
								</div>
								<button type="button" class="button button-secondary" id="jeo-ai-test-key-btn">
									<?php esc_html_e( 'Test API Key', 'jeo' ); ?>
								</button>
							</div>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="gemini_api_key"><?php esc_html_e( 'Gemini API Key', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'gemini_api_key' ) ); ?>" type="text" id="gemini_api_key" value="<?php echo esc_html( $this->get_option( 'gemini_api_key' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="openai_api_key"><?php esc_html_e( 'OpenAI API Key', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'openai_api_key' ) ); ?>" type="text" id="openai_api_key" value="<?php echo esc_html( $this->get_option( 'openai_api_key' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="deepseek_api_key"><?php esc_html_e( 'DeepSeek API Key', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'deepseek_api_key' ) ); ?>" type="text" id="deepseek_api_key" value="<?php echo esc_html( $this->get_option( 'deepseek_api_key' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="ai_use_custom_prompt"><?php esc_html_e( 'System Prompt Configuration', 'jeo' ); ?></label></th>
						<td>
							<div style="margin-bottom: 10px;">
								<label>
									<input type="checkbox" name="<?php echo esc_html( $this->get_field_name( 'ai_use_custom_prompt' ) ); ?>" id="ai_use_custom_prompt" value="1" <?php checked( 1, $this->get_option( 'ai_use_custom_prompt' ) ); ?> />
									<strong><?php esc_html_e( 'Use Custom System Prompt', 'jeo' ); ?></strong>
								</label>
								<p class="description" style="margin-top:4px;">
									<?php esc_html_e( 'Check this to override the default behavior. Uncheck to temporarily disable and return to the optimized default prompt.', 'jeo' ); ?>
								</p>
							</div>

							<div id="ai_system_prompt_wrapper" style="display: <?php echo $this->get_option( 'ai_use_custom_prompt' ) ? 'block' : 'none'; ?>;">
								<textarea name="<?php echo esc_html( $this->get_field_name( 'ai_system_prompt' ) ); ?>" id="ai_system_prompt" rows="8" style="width:100%; max-width: 800px; font-family: monospace;" placeholder="<?php echo esc_attr( jeo_ai_handler()->get_default_system_prompt() ); ?>"><?php echo esc_textarea( $this->get_option( 'ai_system_prompt' ) ); ?></textarea>
								
								<div style="display:flex; align-items:center; gap: 10px; margin-top: 10px;">
									<button type="button" class="button button-secondary" id="jeo-ai-validate-prompt-btn">
										<?php esc_html_e( 'Validate Custom Prompt', 'jeo' ); ?>
									</button>
									<button type="button" class="button button-link-delete" id="jeo-ai-clear-prompt-btn" style="color: #d63638; text-decoration: none;">
										<?php esc_html_e( 'Clear Text', 'jeo' ); ?>
									</button>
									<span id="jeo-ai-validate-status" style="font-size:13px; font-weight: 500;"></span>
								</div>
							</div>

							<p class="description" style="margin-top: 20px;">
								<strong><?php esc_html_e( 'Default Prompt Guide:', 'jeo' ); ?></strong> <em><?php echo esc_html( jeo_ai_handler()->get_default_system_prompt() ); ?></em>
							</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="ai_debug_mode"><?php esc_html_e( 'Enable AI Debug Mode', 'jeo' ); ?></label></th>
						<td>
							<input type="checkbox" name="<?php echo esc_html( $this->get_field_name( 'ai_debug_mode' ) ); ?>" id="ai_debug_mode" value="1" <?php checked( 1, $this->get_option( 'ai_debug_mode' ) ); ?> />
							<p class="description"><?php echo wp_kses_post( sprintf( __( 'If enabled, raw AI inputs and outputs will be saved. You can view them on the <a href="%s">AI Debug Logs page</a>.', 'jeo' ), admin_url( 'admin.php?page=jeo-ai-logs' ) ) ); ?></p>
						</td>
					</tr>
				</tbody>
			</table>

			<hr>
			
			<div id="jeo-prompt-generator-wrapper" style="margin-top: 30px; background: #fff; padding: 25px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 800px;">
				<h3 style="margin-top: 0;">✨ <?php esc_html_e( 'AI Prompt Engineer Assistant', 'jeo' ); ?></h3>
				<p style="font-size: 14px; color: #50575e;"><?php esc_html_e( 'Describe how you want the AI to behave (e.g., "Only map cities in Brazil" or "Ignore street names"). The active LLM will generate a highly optimized System Prompt for you, strictly adhering to JEO formatting rules.', 'jeo' ); ?></p>
				
				<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
					<textarea id="jeo-ai-chat-input" class="large-text" rows="3" placeholder="<?php esc_attr_e( 'Ex: I want to map only locations inside Europe. Press Shift+Enter for new line, or Enter to generate.', 'jeo' ); ?>"></textarea>
					
					<div style="display: flex; align-items: center; gap: 15px;">
						<button type="button" class="button button-primary" id="jeo-ai-generate-prompt-btn" style="min-width: 140px; justify-content: center;"><?php esc_html_e( 'Generate Prompt', 'jeo' ); ?></button>
						<span id="jeo-ai-chat-status" style="font-style:italic; font-weight: 500;"></span>
					</div>
				</div>
			</div>

		</div>
		<!--

		More button font-size
		More button background-color
		More button color


		Close button background-color
		Close button color

		-->
		<div id="tab-knowledge" class="tabs-content">
			<h2 style="margin-bottom: 20px;"><?php esc_html_e( 'Data Dictionaries', 'jeo' ); ?></h2>
			
			<div class="card" style="max-width: 100%; margin-top: 0; padding: 20px; border-radius: 8px;">
				<h3 style="margin-top: 0;">🇧🇷 <?php esc_html_e( 'Embedded Brazilian Territories', 'jeo' ); ?></h3>
				<p class="description"><?php esc_html_e( 'The following geographic dictionaries are available locally to improve AI precision:', 'jeo' ); ?></p>
				
				<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">
					<?php
					$data_dir = JEO_BASEPATH . '/includes/ai/data/';
					
					// Mapeamento manual para PT-BR conforme solicitado
					$friendly_names = array(
						'biomes.json'                     => 'Biomas Brasileiros',
						'indigenous-territories.json'      => 'Terras Indígenas',
						'quilombola-territories.json'      => 'Territórios Quilombolas',
						'extractive-reserves.json'         => 'Reservas Extrativistas (Resex)',
						'conservation-units.json'          => 'Unidades de Conservação',
						'riverside-communities.json'       => 'Comunidades Ribeirinhas',
						'agrarian-reform-settlements.json' => 'Assentamentos de Reforma Agrária',
						'indigenous-peoples.json'          => 'Povos Indígenas (Etnias)',
						'legal-amazon.json'                => 'Amazônia Legal e Limites',
						'hydrographic-basins.json'         => 'Bacias Hidrográficas',
					);

					if ( is_dir( $data_dir ) ) {
						$files = scandir( $data_dir );
						foreach ( $files as $file ) {
							if ( strpos( $file, '.json' ) !== false ) {
								$json_path = $data_dir . $file;
								$json_content = file_get_contents( $json_path );
								$data = json_decode( $json_content, true );
								$count = is_array( $data ) ? count( $data ) : 0;
								
								$file_slug = str_replace( '.json', '', $file );
								$display_name = isset( $friendly_names[ $file ] ) ? $friendly_names[ $file ] : ucwords( str_replace( '-', ' ', $file_slug ) );
								?>
								<div style="background: #f6f7f7; border: 1px solid #dcdcde; padding: 15px; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between;">
									<div>
										<strong style="font-size: 14px; color: #1d2327;"><?php echo esc_html( $display_name ); ?></strong>
										<div style="font-size: 12px; color: #646970; margin-top: 5px; margin-bottom: 15px;">
											<span><?php esc_html_e( 'File:', 'jeo' ); ?> <code><?php echo esc_html( $file ); ?></code></span><br>
											<span><?php esc_html_e( 'Entries found:', 'jeo' ); ?> <strong><?php echo esc_html( $count ); ?></strong></span>
										</div>
									</div>

									<div style="display: flex; gap: 8px; border-top: 1px solid #eee; padding-top: 12px;">
										<button type="button" class="button button-secondary jeo-ai-preview-dict-btn" 
											data-dict-id="dict-modal-<?php echo esc_attr( $file_slug ); ?>">
											<?php esc_html_e( 'Preview', 'jeo' ); ?>
										</button>
										<a href="<?php echo esc_url( admin_url( 'admin-post.php?action=jeo_download_dict&file=' . $file ) ); ?>" class="button button-secondary">
											<?php esc_html_e( 'Download', 'jeo' ); ?>
										</a>
									</div>

									<!-- Modal Preview -->
									<dialog id="dict-modal-<?php echo esc_attr( $file_slug ); ?>" class="jeo-ai-modal jeo-dict-modal">
										<div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #ccc; padding-bottom: 15px; margin-bottom: 20px; position: sticky; top: 0; background: #fff; z-index: 10;">
											<h2 style="margin:0;"><?php echo esc_html( $display_name ); ?></h2>
											<button type="button" class="button jeo-ai-close-modal-btn"><?php esc_html_e( 'Close', 'jeo' ); ?></button>
										</div>

										<div class="jeo-dict-content">
											<h3 style="margin-top: 0;"><?php esc_html_e( 'Item List', 'jeo' ); ?></h3>
											<table class="wp-list-table widefat fixed striped" style="margin-bottom: 30px;">
												<thead>
													<tr>
														<th><?php esc_html_e( 'Name', 'jeo' ); ?></th>
														<th><?php esc_html_e( 'Latitude', 'jeo' ); ?></th>
														<th><?php esc_html_e( 'Longitude', 'jeo' ); ?></th>
													</tr>
												</thead>
												<tbody>
													<?php foreach ( $data as $item ) : ?>
														<tr>
															<td><strong><?php echo esc_html( $item['name'] ); ?></strong></td>
															<td><code><?php echo esc_html( $item['lat'] ); ?></code></td>
															<td><code><?php echo esc_html( $item['lng'] ); ?></code></td>
														</tr>
													<?php endforeach; ?>
												</tbody>
											</table>

											<h3><?php esc_html_e( 'JSON Raw', 'jeo' ); ?></h3>
											<pre style="background: #000; color: #0F0; padding: 20px; border-radius: 4px; overflow-x: auto; font-family: 'Courier New', Courier, monospace; font-size: 13px; line-height: 1.4; border: 2px solid #333; margin-bottom: 20px;"><?php echo esc_html( wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE ) ); ?></pre>
										</div>
									</dialog>
								</div>
								<?php
							}
						}
					}
					?>
				</div>
			</div>

			<style>
				.jeo-dict-modal { 
					width: 90%; 
					max-width: 900px; 
					max-height: 85vh; 
					overflow-y: auto;
					padding: 30px;
					border-radius: 8px;
					box-shadow: 0 10px 30px rgba(0,0,0,0.3);
					border: 1px solid #ccc;
				}
				.jeo-dict-modal::backdrop { background: rgba(0,0,0,0.7); }
				.jeo-dict-content { padding-bottom: 20px; }
			</style>

			<div class="card" style="max-width: 100%; margin-top: 30px; padding: 20px; border-radius: 8px; opacity: 0.7; background: #fafafa; border: 1px dashed #ccd0d4;">
				<h3 style="margin-top: 0; color: #646970;">🔗 <?php esc_html_e( 'Advanced RAG Connections (Coming Soon)', 'jeo' ); ?></h3>
				<p class="description"><?php esc_html_e( 'Connect your own external databases to provide custom context to the LLM.', 'jeo' ); ?></p>
				
				<div style="display: flex; gap: 15px; margin-top: 20px;">
					<button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect Supabase (PostgreSQL)', 'jeo' ); ?></button>
					<button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect SQLite Local', 'jeo' ); ?></button>
					<button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect N8N Webhook', 'jeo' ); ?></button>
				</div>
			</div>
		</div>

		<div id="tab-customize" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th > <h3 style="margin: 0"> <?php esc_html_e( 'Typography', 'jeo' ); ?> </h3> </th>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography"><?php esc_html_e( 'Typography URL', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_typography' ) ); ?>" type="text" id="jeo_typography" value="<?php echo esc_html( $this->get_option( 'jeo_typography' ) ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Open+Sans" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name"><?php esc_html_e( 'Typography name', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_typography-name' ) ); ?>" placeholder="Ex. Open Sans" type="text" id="jeo_typography-name" value="<?php echo esc_html( $this->get_option( 'jeo_typography-name' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-stories"><?php esc_html_e( 'Secondary Typography URL', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_typography-stories' ) ); ?>" type="text" id="jeo_typography-stories" value="<?php echo esc_html( $this->get_option( 'jeo_typography-stories' ) ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name-stories"><?php esc_html_e( 'Secondary Typography name', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_typography-name-stories' ) ); ?>" placeholder="Ex. Libre Baskerville" type="text" id="jeo_typography-name-stories" value="<?php echo esc_html( $this->get_option( 'jeo_typography-name-stories' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-font-size"><?php esc_html_e( 'Info button font-size (rem)', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_more-font-size' ) ); ?>" type="text" id="jeo_more-font-size" value="<?php echo esc_html( $this->get_option( 'jeo_more-font-size' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th > <h3 style="margin: 0"> <?php esc_html_e( 'Colors', 'jeo' ); ?> </h3> </th>
					</tr>

					<tr>
						<th scope="row"><label for="jeo_primary-color"><?php esc_html_e( 'Primary color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_primary-color' ) ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_primary-color" value="<?php echo esc_html( $this->get_option( 'jeo_primary-color' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<!-- <tr>
						<th scope="row"><label for="jeo_text-over-primary-color"><?php esc_html_e( 'Text over primary color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_text-over-primary-color' ) ); ?>" placeholder="Ex. #000000" type="text" id="jeo_text-over-primary-color" value="<?php echo esc_html( $this->get_option( 'jeo_text-over-primary-color' ) ); ?>" class="regular-text">
						</td>
					</tr> -->

					<tr>
						<th scope="row"><label for="jeo_more-bkg-color"><?php esc_html_e( 'Info button background color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_more-bkg-color' ) ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-bkg-color" value="<?php echo esc_html( $this->get_option( 'jeo_more-bkg-color' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-color"><?php esc_html_e( 'Info button color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_more-color' ) ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-color" value="<?php echo esc_html( $this->get_option( 'jeo_more-color' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-bkg-color"><?php esc_html_e( 'Close button background color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-bkg-color' ) ); ?>" type="text" id="jeo_close-bkg-color" value="<?php echo esc_html( $this->get_option( 'jeo_close-bkg-color' ) ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-color"><?php esc_html_e( 'Close button color', 'jeo' ); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-color' ) ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_close-color" value="<?php echo esc_html( $this->get_option( 'jeo_close-color' ) ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th><h3 style="margin: 0"><?php esc_html_e( 'Embed', 'jeo' ); ?></h3></th>
					</tr>

					<tr>
						<th scope="row"><label for="background_image"><?php esc_html_e( 'Company logo', 'jeo' ); ?></label></th>
						<td>
							<input id="background_image" type="text" name="<?php echo esc_html( $this->get_field_name( 'jeo_footer-logo' ) ); ?>" value="<?php echo esc_html( $this->get_option( 'jeo_footer-logo' ) ); ?>" />
							<input id="upload_image_button" type="button" class="button-primary" value="Insert Image" />
						</td>
					</tr>
			</tbody>
			</table>
		</div>


	</div>

	<div class="jeo-settings-submit">
		<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jeo' ); ?>" />
	</div>

</form>

<style>
	.jeo-settings-submit {
		margin-top: 50px;
		display: none; /* Initially hidden, shown by JS after skeleton */
	}
	/* Fix WP standard button spacing slightly */
	.jeo-settings-submit input {
		padding: 6px 24px;
	}
</style>
