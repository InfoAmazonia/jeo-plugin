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
					<label for="ai_context_prompt" style="display: block; margin-bottom: 4px; font-weight: 600;">
						<?php esc_html_e( 'Custom System Prompt', 'jeowp' ); ?>
					</label>
					<?php $stored_custom_prompt = (string) \jeo_settings()->get_option( 'ai_context_prompt' ); ?>
					<textarea
						name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_context_prompt' ) ); ?>"
						id="ai_context_prompt"
						rows="20"
						class="large-text code"
						style="font-family: monospace; width: 100%;"
						data-structured-output="true"
					><?php echo esc_textarea( Context_Agent::extract_prompt_text( $stored_custom_prompt ) ); ?></textarea>
					<p class="description">
						<?php esc_html_e( 'Custom system prompt used by the AI Context Assistant. Use the assistant below to generate or refine it. This value is stored as structured output JSON internally, but shown here as plain text for editing.', 'jeowp' ); ?>
					</p>
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

<div id="jeo-context-prompt-generator-wrapper" style="margin-top: 30px; background: #fff; padding: 25px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04); max-width: 900px;">
	<h3 style="margin-top: 0;">✨ <?php esc_html_e( 'AI Context Prompt Engineer Assistant', 'jeowp' ); ?></h3>
	<p style="font-size: 14px; color: #50575e;">
		<?php esc_html_e( 'Describe how you want the Context Assistant to behave (e.g., "Always link place names to the original article" or "Ground every claim with a verbatim quote"). The active LLM will generate a highly optimized system prompt for you, strictly adhering to JEO formatting rules.', 'jeowp' ); ?>
	</p>

	<style>
		#ai_context_prompt_description {
			width: 100%;
			min-height: 160px;
			padding: 14px;
			font-size: 14px;
			line-height: 1.6;
			border: 1px solid #c5c5c5;
			border-radius: 6px;
			resize: vertical;
			transition: border-color 0.2s, box-shadow 0.2s;
		}
		#ai_context_prompt_description:focus {
			border-color: #2271b1;
			box-shadow: 0 0 0 1px #2271b1;
			outline: none;
		}
		.jeo-context-ai-toolbar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 8px;
			gap: 10px;
			flex-wrap: wrap;
		}
		.jeo-context-ai-actions {
			display: flex;
			align-items: center;
			gap: 15px;
			margin-top: 16px;
		}
	</style>

	<div style="position: relative;">
		<textarea id="ai_context_prompt_description" placeholder="<?php esc_attr_e( 'Ex: I want the assistant to always include inline contextual links and cite the exact sentence from the article that supports each location.', 'jeowp' ); ?>"></textarea>
		<div class="jeo-context-ai-toolbar">
			<span style="font-size: 12px; color: #646970;"><?php esc_html_e( 'Your description is saved automatically in this browser.', 'jeowp' ); ?></span>
		</div>
	</div>

	<div class="jeo-context-ai-actions">
		<button type="button" class="button button-primary" id="ai_context_engineer_prompt" style="min-width: 160px; justify-content: center;">
			<?php esc_html_e( 'Generate Custom Prompt', 'jeowp' ); ?>
		</button>
		<button type="button" class="button button-secondary" id="ai_context_suggest_prompt">
			<?php esc_html_e( 'Suggest initial prompt', 'jeowp' ); ?>
		</button>
		<span id="ai_context_engineer_status" class="description" style="display: none;"></span>
	</div>
</div>

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
		var descriptionTextarea = document.getElementById( 'ai_context_prompt_description' );
		var defaultPromptTextarea = document.getElementById( 'ai_context_default_prompt' );
		var statusSpan = document.getElementById( 'ai_context_engineer_status' );
		var storageKey = 'jeo_context_prompt_description';

		// Restore saved natural-language description.
		if ( descriptionTextarea ) {
			try {
				var saved = window.localStorage.getItem( storageKey );
				if ( saved ) {
					descriptionTextarea.value = saved;
				}
			} catch ( e ) {
				// localStorage may be unavailable in private mode.
			}

			descriptionTextarea.addEventListener( 'input', function() {
				try {
					window.localStorage.setItem( storageKey, descriptionTextarea.value );
				} catch ( e ) {
					// Ignore storage errors.
				}
			} );
		}

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

		if ( engineerButton && promptTextarea && descriptionTextarea && statusSpan ) {
			engineerButton.addEventListener( 'click', function() {
				var description = descriptionTextarea.value.trim();
				if ( ! description ) {
					statusSpan.textContent = '<?php echo esc_js( __( 'Please describe how you want the assistant to behave first.', 'jeowp' ) ); ?>';
					statusSpan.style.display = 'inline';
					statusSpan.style.color = '#d63638';
					return;
				}

				engineerButton.disabled = true;
				statusSpan.textContent = '<?php echo esc_js( __( 'Generating...', 'jeowp' ) ); ?>';
				statusSpan.style.display = 'inline';
				statusSpan.style.color = '#2271b1';

				// Ensure the custom prompt section is visible so the user sees the result.
				if ( toggle && customWrapper && defaultWrapper ) {
					toggle.checked = true;
					customWrapper.style.display = 'block';
					defaultWrapper.style.display = 'none';
				}

				wp.apiFetch( {
					path: '/jeo/v1/context/engineer-prompt',
					method: 'POST',
					data: { prompt: description }
				} ).then( function( response ) {
					if ( response.success && response.prompt ) {
						promptTextarea.value = response.prompt;
						statusSpan.textContent = '<?php echo esc_js( __( 'Custom prompt generated. Remember to save the settings.', 'jeowp' ) ); ?>';
						statusSpan.style.color = '#008a20';
					} else {
						statusSpan.textContent = response.message || '<?php echo esc_js( __( 'Generation failed.', 'jeowp' ) ); ?>';
						statusSpan.style.color = '#d63638';
					}
				} ).catch( function( error ) {
					statusSpan.textContent = error.message || '<?php echo esc_js( __( 'Generation failed.', 'jeowp' ) ); ?>';
					statusSpan.style.color = '#d63638';
				} ).finally( function() {
					engineerButton.disabled = false;
				} );
			} );
		}

		// Convert the human-readable custom prompt into structured-output JSON before saving.
		var settingsForm = promptTextarea ? promptTextarea.closest( 'form' ) : null;
		if ( settingsForm ) {
			settingsForm.addEventListener( 'submit', function() {
				var plainText = promptTextarea.value;
				try {
					promptTextarea.value = JSON.stringify( { prompt: plainText } );
				} catch ( e ) {
					// Fallback: keep plain text if JSON.stringify fails unexpectedly.
				}
			} );
		}
	} );
</script>
