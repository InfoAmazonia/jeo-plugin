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
			<a href="#" class="nav-tab" data-target="bulk">
				<?php esc_html_e( 'Bulk Geolocation', 'jeo' ); ?>
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
						<th scope="row"><label><?php esc_html_e( 'Enabled Post Types', 'jeo' ); ?></label></th>
						<td>
							<fieldset>
								<legend class="screen-reader-text"><span><?php esc_html_e( 'Enabled Post Types', 'jeo' ); ?></span></legend>
								<input type="hidden" name="<?php echo esc_attr( $this->get_field_name( 'enabled_post_types' ) ); ?>" value="" />
								<?php
								$enabled_post_types = $this->get_option( 'enabled_post_types' );
								if ( ! is_array( $enabled_post_types ) ) {
									$enabled_post_types = array();
								}
								$public_post_types  = get_post_types( array( 'public' => true ), 'objects' );
								$excluded_types     = array( 'map', 'map-layer', 'attachment' );

								foreach ( $public_post_types as $post_type ) {
									if ( in_array( $post_type->name, $excluded_types, true ) ) {
										continue;
									}
									?>
									<label>
										<input type="checkbox" name="<?php echo esc_attr( $this->get_field_name( 'enabled_post_types' ) ); ?>[]" value="<?php echo esc_attr( $post_type->name ); ?>" <?php checked( in_array( $post_type->name, $enabled_post_types, true ) ); ?> />
										<?php echo esc_html( $post_type->label ); ?>
									</label><br>
									<?php
								}
								?>
								<p class="description"><?php esc_html_e( 'Select the post types that should have geolocating and AI features enabled.', 'jeo' ); ?></p>
							</fieldset>
						</td>
					</tr>

					<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Mapbox', 'jeo' ); ?></h2></th>
						<td></td>
					</tr>
					<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
						<th scope="row"><label for="mapbox_key"><?php esc_html_e( 'Mapbox API Key', 'jeo' ); ?></label></th>
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
					
					<?php foreach ( jeo_ai_handler()->get_adapters() as $slug => $name ) : ?>
						<tr class="jeo-ai-provider-settings" data-provider="<?php echo esc_attr( $slug ); ?>" style="display: <?php echo $this->get_option( 'ai_default_provider' ) === $slug ? 'table-row' : 'none'; ?>;">
							<th scope="row"><label for="<?php echo esc_attr( $slug ); ?>_api_key"><?php echo esc_html( $name ); ?> <?php echo 'ollama' === $slug ? 'Endpoint URL' : 'API Key'; ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'ollama' === $slug ? 'ollama_url' : $slug . '_api_key' ) ); ?>" type="<?php echo 'ollama' === $slug ? 'url' : 'password'; ?>" id="<?php echo esc_attr( $slug ); ?>_api_key" value="<?php echo esc_html( $this->get_option( 'ollama' === $slug ? 'ollama_url' : $slug . '_api_key' ) ); ?>" class="regular-text" placeholder="<?php echo 'ollama' === $slug ? 'http://localhost:11434/api' : '*******************'; ?>">
							</td>
						</tr>
						<tr class="jeo-ai-provider-settings" data-provider="<?php echo esc_attr( $slug ); ?>" style="display: <?php echo $this->get_option( 'ai_default_provider' ) === $slug ? 'table-row' : 'none'; ?>;">
							<th scope="row"><label for="<?php echo esc_attr( $slug ); ?>_model"><?php echo esc_html( $name ); ?> Model</label></th>
							<td>
								<div class="jeo-ai-model-container" style="display: flex; gap: 10px; align-items: center; max-width: 600px;">
									<?php $current_model = $this->get_option( $slug . '_model' ); ?>
									<div class="jeo-ai-model-readonly-wrapper" style="flex: 1; display: flex;">
										<input type="text" id="<?php echo esc_attr( $slug ); ?>_model_readonly" value="<?php echo esc_html( $current_model ); ?>" class="regular-text" readonly style="flex: 1; background: #f0f0f1; color: #50575e; border-color: #ccd0d4; box-shadow: none;">
										<input type="hidden" name="<?php echo esc_html( $this->get_field_name( $slug . '_model' ) ); ?>" id="<?php echo esc_attr( $slug ); ?>_model_hidden" value="<?php echo esc_html( $current_model ); ?>">
									</div>
									<div class="jeo-ai-model-select-wrapper" style="flex: 1; display: none;">
										<select id="<?php echo esc_attr( $slug ); ?>_model_select" class="regular-text jeo-ai-model-select" style="width: 100%;">
											<?php if ( $current_model ) : ?>
												<option value="<?php echo esc_attr( $current_model ); ?>" selected="selected"><?php echo esc_html( $current_model ); ?></option>
											<?php endif; ?>
										</select>
									</div>
									<button type="button" class="button jeo-ai-fetch-models-btn" data-provider="<?php echo esc_attr( $slug ); ?>"><?php esc_html_e( 'Change Model', 'jeo' ); ?></button>
								</div>
								<p class="description"><?php echo sprintf( esc_html__( 'Model ID for %s. Click "Change Model" to fetch available models from the API or type manually.', 'jeo' ), $name ); ?></p>
							</td>
						</tr>
					<?php endforeach; ?>

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

						<?php
						$rag_feasibility = \Jeo\AI\RAG_Agent::is_feasible();
						$is_rag_blocked = is_wp_error( $rag_feasibility );
						?>

                        <div class="card" style="max-width: 100%; margin-top: 0; padding: 20px; border-radius: 8px; position: relative; <?php echo $is_rag_blocked ? 'background: #f6f7f7; border-color: #dcdcde;' : ''; ?>">
                                
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
													<li><?php esc_html_e( 'Ensure you have an active AI Provider (Gemini, OpenAI, or Ollama) configured in the "AI Settings" tab.', 'jeo' ); ?></li>
													<li><?php esc_html_e( 'Check if the "wp-content/uploads" directory exists and is writable.', 'jeo' ); ?></li>
													<li><?php esc_html_e( 'If you want to use a different vectorized base, explore the Data Dictionaries below.', 'jeo' ); ?></li>
												</ul>
											</div>
											<a href="#tab-ai" class="button button-primary" onclick="window.location.hash='#tab-ai'; window.location.reload();"><?php esc_html_e( 'Go to AI Settings', 'jeo' ); ?></a>
										</div>
									</div>
								<?php endif; ?>

								<h3 style="margin-top: 0; color: #1d2327;">🧠 <?php esc_html_e( 'RAG Knowledge Base (Vector Store)', 'jeo' ); ?></h3>
                                <p class="description"><?php esc_html_e( 'Vectorize your WordPress posts to allow the JEO AI to contextually answer questions and cross-reference territorial data.', 'jeo' ); ?></p>

                                <table class="form-table" style="margin-top: 20px;">
                                        <tbody>
                                                <tr>
                                                        <th scope="row"><label for="ai_embedding_model"><?php esc_html_e( 'Embedding Model (Optional)', 'jeo' ); ?></label></th>
                                                        <td>
                                                                <?php
                                                                $current_embed_model = $this->get_option( 'ai_embedding_model' );
                                                                $known_models = [
                                                                        '', 'text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002',
                                                                        'models/text-embedding-004', 'models/embedding-001', 'nomic-embed-text', 'mxbai-embed-large'
                                                                ];
                                                                ?>
                                                                <select name="<?php echo esc_html( $this->get_field_name( 'ai_embedding_model' ) ); ?>" id="ai_embedding_model" style="width: 100%; max-width: 400px;">
                                                                        <option value="" <?php selected( $current_embed_model, '' ); ?>><?php esc_html_e( 'Auto (Recommended Default for Active Provider)', 'jeo' ); ?></option>

                                                                        <?php if ( ! in_array( $current_embed_model, $known_models ) && ! empty( $current_embed_model ) ) : ?>
                                                                                <option value="<?php echo esc_attr( $current_embed_model ); ?>" selected="selected"><?php echo esc_html( $current_embed_model ); ?> (Custom)</option>
                                                                        <?php endif; ?>

                                                                        <optgroup label="OpenAI">
                                                                                <option value="text-embedding-3-small" <?php selected( $current_embed_model, 'text-embedding-3-small' ); ?>>text-embedding-3-small</option>
                                                                                <option value="text-embedding-3-large" <?php selected( $current_embed_model, 'text-embedding-3-large' ); ?>>text-embedding-3-large</option>
                                                                                <option value="text-embedding-ada-002" <?php selected( $current_embed_model, 'text-embedding-ada-002' ); ?>>text-embedding-ada-002</option>
                                                                        </optgroup>
                                                                        <optgroup label="Google Gemini">
                                                                                <option value="models/text-embedding-004" <?php selected( $current_embed_model, 'models/text-embedding-004' ); ?>>models/text-embedding-004</option>
                                                                                <option value="models/embedding-001" <?php selected( $current_embed_model, 'models/embedding-001' ); ?>>models/embedding-001</option>
                                                                        </optgroup>
                                                                        <optgroup label="Ollama (Local)">
                                                                                <option value="nomic-embed-text" <?php selected( $current_embed_model, 'nomic-embed-text' ); ?>>nomic-embed-text</option>
                                                                                <option value="mxbai-embed-large" <?php selected( $current_embed_model, 'mxbai-embed-large' ); ?>>mxbai-embed-large</option>
                                                                        </optgroup>
                                                                </select>
                                                                <p class="description"><?php esc_html_e( 'Select an embedding model or type a custom one. Leave as "Auto" to use the recommended default for your active provider.', 'jeo' ); ?></p>
                                                        </td>
                                                </tr>
                                        </tbody>
                                </table>

                                <div style="margin-top: 20px; display: flex; align-items: center; gap: 20px;">
                                        <div>
                                                <strong><?php esc_html_e( 'Status:', 'jeo' ); ?></strong>
                                                <span style="color: #46b450; font-weight: bold;">
                                                        <?php esc_html_e( 'Active (Local File Store)', 'jeo' ); ?>
                                                </span>
                                        </div>
                                        <div>
                                                <p style="margin: 0;"><em><?php esc_html_e( 'To vectorize posts, use the following WP-CLI command in your terminal:', 'jeo' ); ?></em></p>
                                                <code style="display: block; margin-top: 5px; background: #000; color: #0f0; padding: 10px; border-radius: 4px;">wp jeo ai vectorize --post_type=post --batch_size=20</code>
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

                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccd0d4;">
                                        <h4 style="margin-top: 0; margin-bottom: 10px;">📖 <?php esc_html_e( 'How to use the Knowledge Base', 'jeo' ); ?></h4>
                                        <p class="description" style="margin-bottom: 15px;"><?php esc_html_e( 'Once your posts are vectorized, the RAG Agent will automatically query this database when it needs context for Georeferencing. For example, if an article mentions "The community we visited in the Amazon", the AI will search the store for coordinates related to that community.', 'jeo' ); ?></p>
                                        
                                        <p style="margin-bottom: 5px;"><strong><?php esc_html_e( 'Document Schema Reference:', 'jeo' ); ?></strong></p>
                                        <pre style="background: #f6f7f7; color: #2c3338; padding: 15px; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 13px; border: 1px solid #dcdcde;">{
  "id": "1412...",
  "content": "Title: The Post Title\n\nContent: The post content without HTML tags...",
  "embedding": [0.012, -0.045, 0.089, ...],
  "metadata": {
    "post_id": 1234,
    "post_type": "post",
    "title": "The Post Title",
    "url": "https://yoursite.com/the-post-title",
    "date": "2026-04-02 14:00:00"
  }
}</pre>
                                </div>

                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccd0d4;">
                                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #d63638;">⚠️ <?php esc_html_e( 'Maintenance & Cleanup', 'jeo' ); ?></h4>
                                        <p class="description" style="margin-bottom: 15px;"><?php esc_html_e( 'Clear your vector databases. Clearing production will require you to run the WP-CLI vectorize command again to rebuild your Knowledge Base.', 'jeo' ); ?></p>
                                        <div style="display: flex; gap: 15px;">
                                                <button type="button" class="button jeo-ai-clear-store-btn" data-store="test"><?php esc_html_e( 'Clear Test Store', 'jeo' ); ?></button>
                                                <button type="button" class="button jeo-ai-clear-store-btn" data-store="production" style="border-color: #d63638; color: #d63638;"><?php esc_html_e( 'Clear Production Store', 'jeo' ); ?></button>
                                        </div>
                                </div>

                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccd0d4;">
                                        <h4 style="margin-top: 0; margin-bottom: 10px;"><?php esc_html_e( 'Advanced Connections', 'jeo' ); ?></h4>
                                        <p class="description" style="margin-bottom: 15px;"><?php esc_html_e( 'By default, embeddings are saved securely in your wp-content folder. You can connect external vector databases below (Coming soon).', 'jeo' ); ?></p>
                                        <div style="display: flex; gap: 15px;">
                                                <button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect Qdrant', 'jeo' ); ?></button>
                                                <button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect Supabase (pgvector)', 'jeo' ); ?></button>
                                                <button type="button" class="button button-secondary" disabled><?php esc_html_e( 'Connect Pinecone', 'jeo' ); ?></button>
                                        </div>
                                </div>
                        </div>




<div class="card" style="max-width: 100%; margin-top: 30px; padding: 20px; border-radius: 8px;">
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

		<div id="tab-bulk" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><label for="jeo_bulk_ai_active"><?php esc_html_e( 'Background Processing', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'jeo_bulk_ai_active' ) ); ?>" type="checkbox" id="jeo_bulk_ai_active" value="1" <?php checked( $this->get_option( 'jeo_bulk_ai_active' ), 1 ); ?>>
							<span class="description"><?php esc_html_e( 'Enable background AI geolocalization for legacy posts.', 'jeo' ); ?></span>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_bulk_batch_size"><?php esc_html_e( 'Batch Size', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'jeo_bulk_batch_size' ) ); ?>" type="number" id="jeo_bulk_batch_size" value="<?php echo esc_attr( $this->get_option( 'jeo_bulk_batch_size' ) ); ?>" min="1" max="50" class="small-text">
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
									<input name="<?php echo esc_html( $this->get_field_name( 'jeo_bulk_post_types' ) ); ?>[]" type="checkbox" value="<?php echo esc_attr( $pt ); ?>" <?php checked( in_array( $pt, $bulk_post_types ) ); ?>>
									<?php echo esc_html( $pt_object->labels->name ); ?>
								</label><br>
							<?php endforeach; ?>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_bulk_cron_interval"><?php esc_html_e( 'Cron Interval', 'jeo' ); ?></label></th>
						<td>
							<select name="<?php echo esc_html( $this->get_field_name( 'jeo_bulk_cron_interval' ) ); ?>" id="jeo_bulk_cron_interval">
								<option value="every_5_mins" <?php selected( $this->get_option( 'jeo_bulk_cron_interval' ), 'every_5_mins' ); ?>><?php esc_html_e( 'Every 5 Minutes', 'jeo' ); ?></option>
								<option value="every_15_mins" <?php selected( $this->get_option( 'jeo_bulk_cron_interval' ), 'every_15_mins' ); ?>><?php esc_html_e( 'Every 15 Minutes', 'jeo' ); ?></option>
								<option value="hourly" <?php selected( $this->get_option( 'jeo_bulk_cron_interval' ), 'hourly' ); ?>><?php esc_html_e( 'Hourly', 'jeo' ); ?></option>
								<option value="twicedaily" <?php selected( $this->get_option( 'jeo_bulk_cron_interval' ), 'twicedaily' ); ?>><?php esc_html_e( 'Twice Daily', 'jeo' ); ?></option>
							</select>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_bulk_logging"><?php esc_html_e( 'Enable Logging', 'jeo' ); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name( 'jeo_bulk_logging' ) ); ?>" type="checkbox" id="jeo_bulk_logging" value="1" <?php checked( $this->get_option( 'jeo_bulk_logging' ), 1 ); ?>>
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
		</div>


	</div>

	<div class="jeo-settings-submit">
		<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jeo' ); ?>" />
	</div>

</form>

<div id="jeo-ai-debug-console" style="position: fixed; bottom: 0; right: 20px; width: 450px; background: #1d2327; color: #fff; border: 1px solid #3c434a; border-bottom: 0; border-radius: 6px 6px 0 0; z-index: 99999; font-family: monospace; display: flex; flex-direction: column; box-shadow: 0 -2px 10px rgba(0,0,0,0.3); transition: transform 0.3s ease;">
	<div id="jeo-ai-debug-header" style="padding: 8px 15px; background: #2c3338; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-radius: 6px 6px 0 0;">
		<span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">🛠️ AI API Debugger</span>
		<div style="display:flex; gap: 10px;">
			<span id="jeo-ai-debug-clear" title="Clear logs" style="cursor:pointer; font-size: 14px;">🧹</span>
			<span id="jeo-ai-debug-toggle" style="font-size: 12px;">▲</span>
		</div>
	</div>
	<div id="jeo-ai-debug-body" style="height: 300px; overflow-y: auto; padding: 10px; font-size: 11px; display: none;">
		<div id="jeo-ai-debug-log-container">
			<div style="color: #8c8f94; font-style: italic;">[System] Console initialized. Awaiting API interactions...</div>
		</div>
	</div>
</div>

<style>
	.jeo-debug-entry { border-bottom: 1px solid #3c434a; padding-bottom: 8px; margin-bottom: 8px; }
	.jeo-debug-label { font-weight: bold; margin-bottom: 3px; display: block; }
	.jeo-debug-request { color: #72aee6; }
	.jeo-debug-response { color: #46b450; }
	.jeo-debug-error { color: #d63638; }
	.jeo-debug-payload { background: #000; padding: 5px; border-radius: 3px; overflow-x: auto; margin-top: 5px; white-space: pre; }
</style>

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
