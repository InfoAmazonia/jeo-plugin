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
			</td>
		</tr>
	</tbody>
</table>
