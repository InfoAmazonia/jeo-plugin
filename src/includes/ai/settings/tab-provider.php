<table class="form-table">
	<tbody>
		<tr>
			<th scope="row"><label for="ai_default_provider"><?php esc_html_e( 'AI Provider', 'jeo' ); ?></label></th>
			<td>
				<select name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_default_provider' ) ); ?>" id="ai_default_provider">
					<?php foreach ( jeo_ai_handler()->get_adapters() as $slug => $name ) : ?>
						<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( \jeo_settings()->get_option( 'ai_default_provider' ), $slug ); ?>><?php echo esc_html( $name ); ?></option>
					<?php endforeach; ?>
				</select>
			</td>
		</tr>

		<?php foreach ( jeo_ai_handler()->get_adapters() as $slug => $name ) : ?>
			<tr class="jeo-ai-provider-settings" data-provider="<?php echo esc_attr( $slug ); ?>" style="display: <?php echo \jeo_settings()->get_option( 'ai_default_provider' ) === $slug ? 'table-row' : 'none'; ?>;">
				<th scope="row">
					<label for="<?php echo esc_attr( $slug ); ?>_api_key">
						<?php echo esc_html( $name ); ?> 
						<?php echo ( $slug === 'ollama' ) ? esc_html__( 'URL', 'jeo' ) : esc_html__( 'API Key', 'jeo' ); ?>
					</label>
				</th>
				<td>
					<?php
					$key_value = \jeo_settings()->get_option( $slug . ( $slug === 'ollama' ? '_url' : '_api_key' ) );
					$is_empty = empty( $key_value );
					$display_value = '';
					
					if ( ! $is_empty ) {
						if ( $slug === 'ollama' ) {
							$display_value = $key_value;
						} else {
							$display_value = substr( $key_value, 0, 5 ) . '****************' . substr( $key_value, -5 );
						}
					}
					?>
					<div style="display: flex; gap: 10px; align-items: center;" class="jeo-ai-key-container">
						<input 
							name="<?php echo esc_html( \jeo_settings()->get_field_name( $slug . ( $slug === 'ollama' ? '_url' : '_api_key' ) ) ); ?>" 
							type="text" 
							id="<?php echo esc_attr( $slug ); ?>_api_key" 
							value="<?php echo esc_attr( $display_value ); ?>" 
							class="regular-text jeo-ai-key-input" 
							data-original-value="<?php echo esc_attr( $display_value ); ?>"
							<?php echo ! $is_empty ? 'readonly style="background: #f0f0f1; cursor: not-allowed; font-family: monospace;"' : ''; ?>
							placeholder="<?php echo $slug === 'ollama' ? 'http://localhost:11434/api' : 'Paste your API key here...'; ?>"
						>
						
						<?php if ( ! $is_empty ) : ?>
							<button type="button" class="button button-secondary jeo-ai-unlock-key-btn">
								<?php esc_html_e( 'Set New Key', 'jeo' ); ?>
							</button>
						<?php endif; ?>

						<div class="jeo-ai-key-status-wrapper" style="display: flex; align-items: center; gap: 8px;">
							<span class="jeo-ai-key-status-badge" style="padding: 2px 8px; border-radius: 12px; background: #f0f0f1; color: #646970;"><?php esc_html_e( 'Status: Unknown', 'jeo' ); ?></span>
						</div>
						<button type="button" class="button button-secondary jeo-ai-test-key-btn">
							<?php esc_html_e( 'Test Connection', 'jeo' ); ?>
						</button>
					</div>
					<div class="jeo-ai-key-test-detail" style="margin-top: 10px; display: none; background: #fff; padding: 12px; border: 1px solid #dcdcde; border-radius: 6px; font-family: monospace; font-size: 12px; line-height: 1.4; max-width: 800px; white-space: pre-wrap; word-break: break-all;"></div>
				</td>
			</tr>
			<tr class="jeo-ai-provider-settings" data-provider="<?php echo esc_attr( $slug ); ?>" style="display: <?php echo \jeo_settings()->get_option( 'ai_default_provider' ) === $slug ? 'table-row' : 'none'; ?>;">
				<th scope="row"><label for="<?php echo esc_attr( $slug ); ?>_model"><?php esc_html_e( 'Model', 'jeo' ); ?></label></th>
				<td>
					<div style="display: flex; gap: 10px; align-items: center;" class="jeo-ai-model-container">
						<input type="text" id="<?php echo esc_attr( $slug ); ?>_model_readonly" value="<?php echo esc_html( \jeo_settings()->get_option( $slug . '_model' ) ); ?>" class="regular-text" readonly>
						<input type="hidden" name="<?php echo esc_html( \jeo_settings()->get_field_name( $slug . '_model' ) ); ?>" id="<?php echo esc_attr( $slug ); ?>_model_hidden" value="<?php echo esc_html( \jeo_settings()->get_option( $slug . '_model' ) ); ?>">
						<button type="button" class="button button-secondary jeo-ai-fetch-models-btn" data-provider="<?php echo esc_attr( $slug ); ?>">
							<?php esc_html_e( 'Change Model', 'jeo' ); ?>
						</button>
					</div>
				</td>
			</tr>
		<?php endforeach; ?>

		<tr>
			<th scope="row"><label for="ai_use_custom_prompt"><?php esc_html_e( 'System Prompt Configuration', 'jeo' ); ?></label></th>
			<td>
				<div style="margin-bottom: 10px;">
					<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_use_custom_prompt' ) ); ?>" id="ai_use_custom_prompt" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_use_custom_prompt' ) ); ?> />
					<span class="description"><?php esc_html_e( 'Check this to override the default behavior. Uncheck to temporarily disable and return to the optimized default prompt.', 'jeo' ); ?></span>
				</div>

				<div id="ai_system_prompt_wrapper" style="display: <?php echo \jeo_settings()->get_option( 'ai_use_custom_prompt' ) ? 'block' : 'none'; ?>;">
					<textarea name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_system_prompt' ) ); ?>" id="ai_system_prompt" rows="8" style="width:100%; max-width: 800px; font-family: monospace;" placeholder="<?php echo esc_attr( jeo_ai_handler()->get_default_system_prompt() ); ?>"><?php echo esc_textarea( \jeo_settings()->get_option( 'ai_system_prompt' ) ); ?></textarea>
					
					<div style="margin-top: 10px; display: flex; gap: 10px; align-items: center;">
						<button type="button" class="button button-secondary" id="jeo-ai-validate-prompt-btn"><?php esc_html_e( 'Validate Custom Prompt', 'jeo' ); ?></button>
						<button type="button" class="button button-link" id="jeo-ai-clear-prompt-btn" style="color: #d63638;"><?php esc_html_e( 'Clear Text', 'jeo' ); ?></button>
						<span id="jeo-ai-validate-status" style="font-style:italic; font-weight: 500;"></span>
					</div>
				</div>
			</td>
		</tr>

		<tr>
			<th scope="row"><label for="ai_debug_mode"><?php esc_html_e( 'Debug Mode', 'jeo' ); ?></label></th>
			<td>
				<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_debug_mode' ) ); ?>" id="ai_debug_mode" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_debug_mode' ) ); ?> />
				<span class="description"><?php esc_html_e( 'Enable internal logging of all AI calls (Inputs/Outputs) for 24 hours. Useful for debugging prompt regressions.', 'jeo' ); ?></span>
			</td>
		</tr>
	</tbody>
</table>

<div id="jeo-prompt-generator-wrapper" style="margin-top: 30px; background: #fff; padding: 25px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 800px;">
	<h3 style="margin-top: 0;">✨ <?php esc_html_e( 'AI Prompt Engineer Assistant', 'jeo' ); ?></h3>
	<p style="font-size: 14px; color: #50575e;"><?php esc_html_e( 'Describe how you want the AI to behave (e.g., "Only map cities in Brazil" or "Ignore street names"). The active LLM will generate a highly optimized System Prompt for you, strictly adhering to JEO formatting rules.', 'jeo' ); ?></p>
	
	<div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
		<textarea id="jeo-ai-chat-input" class="large-text" rows="3" placeholder="<?php esc_attr_e( 'Ex: I want to map only locations inside Europe. Press Shift+Enter for new line, or Enter to generate.', 'jeo' ); ?>"></textarea>
		
		<div style="background: #f0f6fb; padding: 15px; border-radius: 6px; border-left: 4px solid #72aee6;">
			<p style="margin: 0 0 10px 0; font-weight: 600; font-size: 13px; color: #2c3338;">🌍 <?php esc_html_e( 'Output Language', 'jeo' ); ?></p>
			<select id="jeo-ai-chat-lang" style="width: 100%; max-width: 250px; margin-bottom: 10px;">
				<option value="en"><?php esc_html_e( 'English (Optimized)', 'jeo' ); ?></option>
				<option value="site"><?php printf( esc_html__( 'Site Language (%s)', 'jeo' ), get_bloginfo( 'language' ) ); ?></option>
			</select>
			<p style="margin: 0; font-size: 12px; line-height: 1.4; color: #50575e;">
				<?php esc_html_e( 'LLMs usually follow English instructions with higher precision and lower latency. We recommend English for complex rules, even if your posts are in other languages.', 'jeo' ); ?>
			</p>
		</div>

		<div style="display: flex; align-items: center; gap: 15px;">
			<button type="button" class="button button-primary" id="jeo-ai-generate-prompt-btn" style="min-width: 140px; justify-content: center;"><?php esc_html_e( 'Generate Prompt', 'jeo' ); ?></button>
			<span id="jeo-ai-chat-status" style="font-style:italic; font-weight: 500;"></span>
		</div>
	</div>
</div>
