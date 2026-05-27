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
					<?php esc_html_e( 'Context Assistant System Prompt', 'jeo' ); ?>
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
						<?php esc_html_e( 'Check this to use a custom system prompt. Uncheck to use the built-in default prompt.', 'jeo' ); ?>
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
						<?php esc_html_e( 'Custom system prompt used by the AI Context Assistant. Leave empty to use the built-in default.', 'jeo' ); ?>
					</p>
				</div>

				<div id="ai_context_default_prompt_wrapper" style="display: <?php echo $use_custom ? 'none' : 'block'; ?>;">
					<label for="ai_context_default_prompt" style="display: block; margin-bottom: 4px; font-weight: 600;">
						<?php esc_html_e( 'Default System Prompt (reference)', 'jeo' ); ?>
					</label>
					<textarea
						id="ai_context_default_prompt"
						rows="20"
						class="large-text code"
						style="font-family: monospace; width: 100%; background: #f0f0f1;"
						readonly
					><?php echo esc_textarea( Context_Agent::default_system_prompt() ); ?></textarea>
					<p class="description">
						<?php esc_html_e( 'This is the built-in default prompt. Enable the custom prompt checkbox above to override it.', 'jeo' ); ?>
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
	} );
</script>
