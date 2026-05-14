<?php
/**
 * AI provider settings tab.
 *
 * @package Jeo
 */

?>
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
						<?php echo ( 'ollama' === $slug ) ? esc_html__( 'URL', 'jeo' ) : esc_html__( 'API Key', 'jeo' ); ?>
					</label>
				</th>
				<td>
					<?php
					$key_value     = \jeo_settings()->get_option( $slug . ( 'ollama' === $slug ? '_url' : '_api_key' ) );
					$is_empty      = empty( $key_value );
					$display_value = '';

					if ( ! $is_empty ) {
						if ( 'ollama' === $slug ) {
							$display_value = $key_value;
						} else {
							$display_value = substr( $key_value, 0, 5 ) . '****************' . substr( $key_value, -5 );
						}
					}
					?>
					<div style="display: flex; gap: 10px; align-items: center;" class="jeo-ai-key-container">
						<input 
							name="<?php echo esc_html( \jeo_settings()->get_field_name( $slug . ( 'ollama' === $slug ? '_url' : '_api_key' ) ) ); ?>" 
							type="text" 
							id="<?php echo esc_attr( $slug ); ?>_api_key" 
							value="<?php echo esc_attr( $display_value ); ?>" 
							class="regular-text jeo-ai-key-input" 
							data-original-value="<?php echo esc_attr( $display_value ); ?>"
							<?php echo ! $is_empty ? 'readonly style="background: #f0f0f1; cursor: not-allowed; font-family: monospace;"' : ''; ?>
							placeholder="<?php echo 'ollama' === $slug ? 'http://localhost:11434/api' : esc_attr__( 'Paste your API key here...', 'jeo' ); ?>"
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
				<div style="margin-bottom: 10px;">
					<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_include_taxonomies' ) ); ?>" id="ai_include_taxonomies" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_include_taxonomies' ) ); ?> />
					<span class="description"><?php esc_html_e( 'Include post categories and tags in the AI georeferencing request to improve location accuracy.', 'jeo' ); ?></span>
				</div>

				<div id="ai_system_prompt_wrapper" style="display: <?php echo \jeo_settings()->get_option( 'ai_use_custom_prompt' ) ? 'block' : 'none'; ?>;">
					<textarea name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_system_prompt' ) ); ?>" id="ai_system_prompt" placeholder="<?php echo esc_attr( jeo_ai_handler()->get_default_system_prompt() ); ?>"><?php echo esc_textarea( \jeo_settings()->get_option( 'ai_system_prompt' ) ); ?></textarea>
					<button type="button" class="button jeo-ai-sys-collapse-btn" id="jeo-ai-sys-collapse-btn">⛶ <?php esc_html_e( 'Back', 'jeo' ); ?></button>
					
					<div style="margin-top: 10px; display: flex; gap: 10px; align-items: center;">
						<button type="button" class="button button-secondary" id="jeo-ai-sys-expand-btn">⛶ <?php esc_html_e( 'Expand', 'jeo' ); ?></button>
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

<div id="jeo-prompt-generator-wrapper" style="margin-top: 30px; background: #fff; padding: 25px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 900px;">
	<h3 style="margin-top: 0;">✨ <?php esc_html_e( 'AI Prompt Engineer Assistant', 'jeo' ); ?></h3>
	<p style="font-size: 14px; color: #50575e;"><?php esc_html_e( 'Describe how you want the AI to behave (e.g., "Only map cities in Brazil" or "Ignore street names"). The active LLM will generate a highly optimized System Prompt for you, strictly adhering to JEO formatting rules.', 'jeo' ); ?></p>

	<style>
		#jeo-ai-chat-input {
			width: 100%;
			min-height: 50vh;
			padding: 14px;
			font-size: 14px;
			line-height: 1.6;
			border: 1px solid #c5c5c5;
			border-radius: 6px;
			resize: vertical;
			transition: border-color 0.2s, box-shadow 0.2s;
		}
		#jeo-ai-chat-input:focus {
			border-color: #2271b1;
			box-shadow: 0 0 0 1px #2271b1;
			outline: none;
		}
		#jeo-ai-chat-input.jeo-chat-fullscreen {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			z-index: 100000;
			border-radius: 0;
			font-size: 16px;
			padding: 30px;
		}
		.jeo-ai-toolbar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 8px;
			gap: 10px;
			flex-wrap: wrap;
		}
		.jeo-ai-collapse-btn {
			display: none;
			position: fixed;
			top: 10px;
			right: 10px;
			z-index: 100001;
			background: #fff;
			border: 1px solid #c5c5c5;
			border-radius: 4px;
			padding: 6px 12px;
			font-size: 13px;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(0,0,0,0.15);
		}
		/* Collapse button visibility is controlled by JS */
		#ai_system_prompt {
			width: 100%;
			min-height: 50vh;
			padding: 14px;
			font-size: 14px;
			line-height: 1.6;
			border: 1px solid #c5c5c5;
			border-radius: 6px;
			resize: vertical;
			transition: border-color 0.2s, box-shadow 0.2s;
			font-family: monospace;
		}
		#ai_system_prompt:focus {
			border-color: #2271b1;
			box-shadow: 0 0 0 1px #2271b1;
			outline: none;
		}
		#ai_system_prompt.jeo-sys-fullscreen {
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			z-index: 100000;
			border-radius: 0;
			font-size: 16px;
			padding: 30px;
		}
		.jeo-ai-sys-collapse-btn {
			display: none;
			position: fixed;
			top: 10px;
			right: 80px;
			z-index: 100001;
			background: #fff;
			border: 1px solid #c5c5c5;
			border-radius: 4px;
			padding: 6px 12px;
			font-size: 13px;
			cursor: pointer;
			box-shadow: 0 1px 3px rgba(0,0,0,0.15);
		}
		/* Collapse button visibility is controlled by JS */
		.jeo-ai-calibration {
			background: #f6f7f7;
			padding: 16px;
			border-radius: 6px;
			margin-top: 16px;
			border: 1px solid #dcdcde;
		}
		.jeo-ai-calibration h4 {
			margin: 0 0 12px 0;
			font-size: 13px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: #1d2327;
		}
		.jeo-ai-cal-row {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 10px;
			flex-wrap: wrap;
		}
		.jeo-ai-cal-row label {
			font-size: 13px;
			color: #3c434a;
			min-width: 180px;
		}
		.jeo-ai-cal-row input[type="range"] {
			flex: 1;
			min-width: 120px;
		}
		.jeo-ai-cal-row .jeo-cal-value {
			font-weight: 600;
			color: #2271b1;
			min-width: 30px;
			text-align: right;
		}
		.jeo-ai-cal-toggle-label {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 12px;
			color: #646970;
			cursor: pointer;
			margin-right: 4px;
		}
		.jeo-ai-cal-toggle-label input[type="checkbox"] {
			margin: 0;
		}
		.jeo-ai-cal-row input:disabled,
		.jeo-ai-cal-row select:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.jeo-ai-cal-row.is-disabled > label:not(.jeo-ai-cal-toggle-label) {
			opacity: 0.5;
		}
		.jeo-ai-lang-box {
			background: #f0f6fb;
			padding: 15px;
			border-radius: 6px;
			border-left: 4px solid #72aee6;
			margin-top: 16px;
		}
	</style>

	<div style="position: relative;">
		<textarea id="jeo-ai-chat-input" placeholder="<?php esc_attr_e( 'Ex: I want to map only locations inside Europe. Press Shift+Enter for new line, or Enter to generate.', 'jeo' ); ?>"></textarea>
		<button type="button" class="button jeo-ai-collapse-btn" id="jeo-ai-collapse-btn">⛶ <?php esc_html_e( 'Back', 'jeo' ); ?></button>
		<div class="jeo-ai-toolbar">
			<button type="button" class="button button-secondary" id="jeo-ai-expand-btn">⛶ <?php esc_html_e( 'Expand', 'jeo' ); ?></button>
			<span style="font-size: 12px; color: #646970;"><?php esc_html_e( 'Shift+Enter for new line', 'jeo' ); ?></span>
		</div>
	</div>

	<div class="jeo-ai-calibration">
		<h4>⚙️ <?php esc_html_e( 'Georeferencing Calibration', 'jeo' ); ?></h4>
		<div class="jeo-ai-cal-row">
			<label class="jeo-ai-cal-toggle-label">
				<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_granularity' ) ); ?>" id="jeo-ai-cal-use-granularity" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_granularity' ) ); ?> />
				<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
			</label>
			<label for="jeo-ai-cal-granularity"><?php esc_html_e( 'Location Granularity', 'jeo' ); ?></label>
			<select id="jeo-ai-cal-granularity" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_granularity' ) ); ?>">
				<option value="broad" <?php selected( 'broad', \jeo_settings()->get_option( 'ai_cal_granularity' ) ); ?>><?php esc_html_e( 'Broad (countries, regions, cities)', 'jeo' ); ?></option>
				<option value="balanced" <?php selected( 'balanced', \jeo_settings()->get_option( 'ai_cal_granularity' ) ); ?>><?php esc_html_e( 'Balanced (cities + neighborhoods)', 'jeo' ); ?></option>
				<option value="fine" <?php selected( 'fine', \jeo_settings()->get_option( 'ai_cal_granularity' ) ); ?>><?php esc_html_e( 'Fine (streets, landmarks, POIs)', 'jeo' ); ?></option>
			</select>
		</div>
		<div class="jeo-ai-cal-row">
			<label class="jeo-ai-cal-toggle-label">
				<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_confidence' ) ); ?>" id="jeo-ai-cal-use-confidence" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_confidence' ) ); ?> />
				<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
			</label>
			<label for="jeo-ai-cal-confidence"><?php esc_html_e( 'Minimum Confidence', 'jeo' ); ?></label>
			<input type="range" id="jeo-ai-cal-confidence" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_confidence' ) ); ?>" min="0" max="100" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_cal_confidence' ) ); ?>">
			<span class="jeo-cal-value" id="jeo-ai-cal-confidence-val"><?php echo esc_html( \jeo_settings()->get_option( 'ai_cal_confidence' ) ); ?></span>
		</div>
		<div class="jeo-ai-cal-row">
			<label class="jeo-ai-cal-toggle-label">
				<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_primary_threshold' ) ); ?>" id="jeo-ai-cal-use-primary-threshold" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_primary_threshold' ) ); ?> />
				<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
			</label>
			<label for="jeo-ai-cal-primary-threshold"><?php esc_html_e( 'Primary Threshold', 'jeo' ); ?></label>
			<input type="range" id="jeo-ai-cal-primary-threshold" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_primary_threshold' ) ); ?>" min="0" max="100" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_cal_primary_threshold' ) ); ?>">
			<span class="jeo-cal-value" id="jeo-ai-cal-primary-threshold-val"><?php echo esc_html( \jeo_settings()->get_option( 'ai_cal_primary_threshold' ) ); ?></span>
		</div>
		<div class="jeo-ai-cal-row">
			<label class="jeo-ai-cal-toggle-label">
				<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_secondary_threshold' ) ); ?>" id="jeo-ai-cal-use-secondary-threshold" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_secondary_threshold' ) ); ?> />
				<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
			</label>
			<label for="jeo-ai-cal-secondary-threshold"><?php esc_html_e( 'Secondary Threshold', 'jeo' ); ?></label>
			<input type="range" id="jeo-ai-cal-secondary-threshold" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_secondary_threshold' ) ); ?>" min="0" max="100" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_cal_secondary_threshold' ) ); ?>">
			<span class="jeo-cal-value" id="jeo-ai-cal-secondary-threshold-val"><?php echo esc_html( \jeo_settings()->get_option( 'ai_cal_secondary_threshold' ) ); ?></span>
		</div>
		<div class="jeo-ai-cal-row">
			<label class="jeo-ai-cal-toggle-label">
				<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_title_weight' ) ); ?>" id="jeo-ai-cal-use-title-weight" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_title_weight' ) ); ?> />
				<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
			</label>
			<label for="jeo-ai-cal-title-weight"><?php esc_html_e( 'Prioritize Title Mentions', 'jeo' ); ?></label>
			<input type="range" id="jeo-ai-cal-title-weight" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_title_weight' ) ); ?>" min="0" max="100" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_cal_title_weight' ) ); ?>">
			<span class="jeo-cal-value" id="jeo-ai-cal-title-weight-val"><?php echo esc_html( \jeo_settings()->get_option( 'ai_cal_title_weight' ) ); ?></span>
		</div>
			<div class="jeo-ai-cal-row">
				<label class="jeo-ai-cal-toggle-label">
					<input type="checkbox" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_use_max_tokens' ) ); ?>" id="jeo-ai-cal-use-max-tokens" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_cal_use_max_tokens' ) ); ?> />
					<span class="jeo-ai-cal-toggle-text"><?php esc_html_e( 'Use', 'jeo' ); ?></span>
				</label>
				<label for="jeo-ai-cal-max-tokens"><?php esc_html_e( 'Prompt Token Budget', 'jeo' ); ?></label>
				<input type="range" id="jeo-ai-cal-max-tokens" name="<?php echo esc_attr( \jeo_settings()->get_field_name( 'ai_cal_max_tokens' ) ); ?>" min="1000" max="100000" step="1000" value="<?php echo esc_attr( \jeo_settings()->get_option( 'ai_cal_max_tokens' ) ); ?>">
				<span class="jeo-cal-value" id="jeo-ai-cal-max-tokens-val"><?php echo esc_html( number_format_i18n( \jeo_settings()->get_option( 'ai_cal_max_tokens' ) ) ); ?></span>
			</div>
			<div class="jeo-ai-cal-row jeo-ai-token-ui" style="margin-bottom: 0;">
				<div id="jeo-ai-token-quality" style="flex: 1; font-size: 12px; color: #646970;">
					<?php esc_html_e( 'Higher budgets allow the AI to process longer articles but increase cost and latency.', 'jeo' ); ?>
				</div>
			</div>
			<div class="jeo-ai-cal-row jeo-ai-token-ui" style="margin-bottom: 0; margin-top: 6px;">
				<div style="flex: 1; height: 6px; background: #dcdcde; border-radius: 3px; overflow: hidden;">
					<div id="jeo-ai-token-thermometer" style="width: 8%; height: 100%; background: #72aee6; transition: width 0.2s, background 0.2s;"></div>
				</div>
				<span id="jeo-ai-token-thermo-label" style="font-size: 11px; font-weight: 600; color: #2271b1; min-width: 55px; text-align: right;"><?php esc_html_e( 'Balanced', 'jeo' ); ?></span>
			</div>
			<div class="jeo-ai-cal-row jeo-ai-unlimited-msg" style="margin-bottom: 0; display: none;">
				<div style="flex: 1; font-size: 12px; color: #996b00; background: #fcf9e8; padding: 8px 12px; border-radius: 4px; border-left: 3px solid #f0c33c;">
					⚠️ <?php esc_html_e( 'No token limit set. The LLM will use as many tokens as it deems necessary to produce the result.', 'jeo' ); ?>
				</div>
			</div>
	</div>

	<div class="jeo-ai-lang-box">
		<p style="margin: 0 0 10px 0; font-weight: 600; font-size: 13px; color: #2c3338;">🌍 <?php esc_html_e( 'Output Language', 'jeo' ); ?></p>
		<select id="jeo-ai-chat-lang" style="width: 100%; max-width: 250px; margin-bottom: 10px;">
			<option value="en"><?php esc_html_e( 'English (Optimized)', 'jeo' ); ?></option>
			<option value="site"><?php /* translators: %s: site language */ printf( esc_html__( 'Site Language (%s)', 'jeo' ), esc_html( get_bloginfo( 'language' ) ) ); ?></option>
		</select>
		<p style="margin: 0; font-size: 12px; line-height: 1.4; color: #50575e;">
			<?php esc_html_e( 'LLMs usually follow English instructions with higher precision and lower latency. We recommend English for complex rules, even if your posts are in other languages.', 'jeo' ); ?>
		</p>
	</div>

	<div style="display: flex; align-items: center; gap: 15px; margin-top: 16px;">
		<button type="button" class="button button-primary" id="jeo-ai-generate-prompt-btn" style="min-width: 140px; justify-content: center;"><?php esc_html_e( 'Generate Prompt', 'jeo' ); ?></button>
		<span id="jeo-ai-chat-status" style="font-style:italic; font-weight: 500;"></span>
	</div>
</div>
