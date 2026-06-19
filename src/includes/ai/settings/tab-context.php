<?php
/**
 * AI Context Assistant settings tab.
 *
 * @package Jeo
 */

use Jeo\AI\Context_Agent;

$use_custom = (bool) \jeo_settings()->get_option( 'ai_use_context_custom_prompt', false );
?>

<table class="form-table">
	<tbody>
		<tr>
			<th scope="row">
				<label for="ai_use_context_custom_prompt">
					<?php esc_html_e( 'Context Assistant System Prompt', 'jeowp' ); ?>
				</label>
			</th>
			<td>
				<div style="margin-bottom: 10px;">
					<input
						type="checkbox"
						name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_use_context_custom_prompt' ) ); ?>"
						id="ai_use_context_custom_prompt"
						value="1"
						<?php checked( 1, $use_custom ); ?>
					/>
					<span class="description">
						<?php esc_html_e( 'Check this to use a custom system prompt. Uncheck to use the built-in default prompt.', 'jeowp' ); ?>
					</span>
				</div>

				<div id="ai_context_prompt_wrapper" style="display: <?php echo $use_custom ? 'block' : 'none'; ?>;">
					<textarea
						name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_context_prompt' ) ); ?>"
						id="ai_context_prompt"
						rows="20"
						class="large-text code"
						style="font-family: monospace; width: 100%;"
					><?php echo esc_textarea( \jeo_settings()->get_option( 'ai_context_prompt' ) ); ?></textarea>
					<p class="description">
						<?php esc_html_e( 'Custom system prompt used by the AI Context Assistant. Leave empty to use the built-in default.', 'jeowp' ); ?>
					</p>
					<div style="margin-top: 10px;">
						<button
							type="button"
							id="ai_context_suggest_prompt"
							class="button"
							style="margin-right: 8px;"
						>
							<?php esc_html_e( 'Suggest initial prompt', 'jeowp' ); ?>
						</button>
						<button
							type="button"
							id="ai_context_engineer_prompt"
							class="button"
						>
							<?php esc_html_e( 'Optimize prompt with AI', 'jeowp' ); ?>
						</button>
						<span id="ai_context_engineer_status" class="description" style="margin-left: 10px; display: none;"></span>
					</div>
				</div>

				<div id="ai_context_default_prompt_wrapper" style="display: <?php echo $use_custom ? 'none' : 'block'; ?>;">
					<label for="ai_context_default_prompt" style="display: block; margin-bottom: 4px; font-weight: 600;">
						<?php esc_html_e( 'Default System Prompt (reference)', 'jeowp' ); ?>
					</label>
					<textarea
						id="ai_context_default_prompt"
						rows="20"
						class="large-text code"
						style="font-family: monospace; width: 100%; background: #f0f0f1;"
						readonly
					><?php echo esc_textarea( Context_Agent::default_system_prompt() ); ?></textarea>
					<p class="description">
						<?php esc_html_e( 'This is the built-in default prompt. Enable the custom prompt checkbox above to override it.', 'jeowp' ); ?>
					</p>
				</div>
			</td>
		</tr>
	</tbody>
</table>

<script>
	document.addEventListener( 'DOMContentLoaded', function() {
		var toggle = document.getElementById( 'ai_use_context_custom_prompt' );
		var customWrapper = document.getElementById( 'ai_context_prompt_wrapper' );
		var defaultWrapper = document.getElementById( 'ai_context_default_prompt_wrapper' );

		if ( toggle && customWrapper && defaultWrapper ) {
			toggle.addEventListener( 'change', function() {
				if ( toggle.checked ) {
					customWrapper.style.display = 'block';
					defaultWrapper.style.display = 'none';
				} else {
					customWrapper.style.display = 'none';
					defaultWrapper.style.display = 'block';
				}
			} );
		}

		var suggestButton = document.getElementById( 'ai_context_suggest_prompt' );
		var engineerButton = document.getElementById( 'ai_context_engineer_prompt' );
		var promptTextarea = document.getElementById( 'ai_context_prompt' );
		var defaultPromptTextarea = document.getElementById( 'ai_context_default_prompt' );
		var statusSpan = document.getElementById( 'ai_context_engineer_status' );

		if ( suggestButton && promptTextarea && defaultPromptTextarea && toggle && customWrapper && defaultWrapper ) {
			suggestButton.addEventListener( 'click', function() {
				promptTextarea.value = defaultPromptTextarea.value;
				toggle.checked = true;
				customWrapper.style.display = 'block';
				defaultWrapper.style.display = 'none';
				statusSpan.textContent = '<?php echo esc_js( __( 'Initial prompt loaded. Edit and save the settings.', 'jeowp' ) ); ?>';
				statusSpan.style.display = 'inline';
				statusSpan.style.color = '#008a20';
			} );
		}

		if ( engineerButton && promptTextarea && statusSpan ) {
			engineerButton.addEventListener( 'click', function() {
				var prompt = promptTextarea.value.trim();
				if ( ! prompt ) {
					statusSpan.textContent = '<?php echo esc_js( __( 'Please write a custom prompt first.', 'jeowp' ) ); ?>';
					statusSpan.style.display = 'inline';
					statusSpan.style.color = '#d63638';
					return;
				}

				engineerButton.disabled = true;
				statusSpan.textContent = '<?php echo esc_js( __( 'Optimizing...', 'jeowp' ) ); ?>';
				statusSpan.style.display = 'inline';
				statusSpan.style.color = '#2271b1';

				wp.apiFetch( {
					path: '/jeo/v1/context/engineer-prompt',
					method: 'POST',
					data: { prompt: prompt }
				} ).then( function( response ) {
					if ( response.success && response.prompt ) {
						promptTextarea.value = response.prompt;
						statusSpan.textContent = '<?php echo esc_js( __( 'Prompt optimized. Remember to save the settings.', 'jeowp' ) ); ?>';
						statusSpan.style.color = '#008a20';
					} else {
						statusSpan.textContent = response.message || '<?php echo esc_js( __( 'Optimization failed.', 'jeowp' ) ); ?>';
						statusSpan.style.color = '#d63638';
					}
				} ).catch( function( error ) {
					statusSpan.textContent = error.message || '<?php echo esc_js( __( 'Optimization failed.', 'jeowp' ) ); ?>';
					statusSpan.style.color = '#d63638';
				} ).finally( function() {
					engineerButton.disabled = false;
				} );
			} );
		}
	} );
</script>
