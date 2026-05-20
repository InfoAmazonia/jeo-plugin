<?php
/**
 * AI General settings tab.
 *
 * Concentrates generic AI configuration options for better usability.
 *
 * @package Jeo
 */

?>
<table class="form-table">
	<tbody>
		<tr>
			<th scope="row"><label for="ai_debug_mode"><?php esc_html_e( 'Debug Mode', 'jeo' ); ?></label></th>
			<td>
				<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_debug_mode' ) ); ?>" id="ai_debug_mode" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_debug_mode' ) ); ?> />
				<span class="description"><?php esc_html_e( 'Enable internal logging of all AI calls (Inputs/Outputs) for 24 hours. Useful for debugging prompt regressions.', 'jeo' ); ?></span>
			</td>
		</tr>

		<tr>
			<th scope="row"><label for="ai_debug_console"><?php esc_html_e( 'JEO AI API Debugger', 'jeo' ); ?></label></th>
			<td>
				<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_debug_console' ) ); ?>" id="ai_debug_console" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_debug_console' ) ); ?> />
				<span class="description"><?php esc_html_e( 'Show the floating API debugger console on AI settings pages. Displays real-time request/response logs.', 'jeo' ); ?></span>
			</td>
		</tr>

		<tr>
			<th scope="row"><label for="ai_use_structured_output"><?php esc_html_e( 'NeuronAI Structured Output', 'jeo' ); ?></label></th>
			<td>
				<input type="checkbox" name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_use_structured_output' ) ); ?>" id="ai_use_structured_output" value="1" <?php checked( 1, \jeo_settings()->get_option( 'ai_use_structured_output' ) ); ?> />
				<span class="description"><?php esc_html_e( 'Use native schema enforcement instead of prompt-based JSON extraction. Falls back to text parsing if structured output fails.', 'jeo' ); ?></span>

				<div class="notice notice-warning inline" style="margin: 12px 0 6px;">
					<p><strong><?php esc_html_e( 'Limitations:', 'jeo' ); ?></strong></p>
					<ul style="list-style:disc;margin-left:20px;">
						<li><?php esc_html_e( 'Token usage tracking is unavailable when structured output is active (shows 0 in logs).', 'jeo' ); ?></li>
						<li><?php esc_html_e( 'If the provider does not support native schema enforcement, the system will automatically fall back to text parsing.', 'jeo' ); ?></li>
						<li><?php esc_html_e( 'Some internal tools (e.g. prompt generator test connection) automatically bypass structured output.', 'jeo' ); ?></li>
					</ul>
				</div>

				<div class="notice notice-info inline" style="margin: 6px 0;">
					<p><strong><?php esc_html_e( 'Recommendations by provider:', 'jeo' ); ?></strong></p>
					<ul style="list-style:disc;margin-left:20px;">
						<li><strong>OpenAI</strong>, <strong>Gemini</strong>, <strong>Anthropic</strong> — <?php esc_html_e( 'Full support. Recommended to keep this option enabled.', 'jeo' ); ?></li>
						<li><strong>Deepseek</strong>, <strong>Mistral</strong>, <strong>xAI (Grok)</strong>, <strong>Cohere</strong> — <?php esc_html_e( 'Supported via NeuronAI. Test with your model to confirm.', 'jeo' ); ?></li>
						<li><strong>Ollama</strong>, <strong>HuggingFace</strong> — <?php esc_html_e( 'Variable support depending on model and local configuration. Disable if you encounter errors.', 'jeo' ); ?></li>
					</ul>
				</div>
			</td>
		</tr>
	</tbody>
</table>
