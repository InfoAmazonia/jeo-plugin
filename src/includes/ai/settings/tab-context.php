<?php
/**
 * AI Context Assistant settings tab.
 *
 * @package Jeo
 */
?>

<table class="form-table">
	<tbody>
		<tr>
			<th scope="row">
				<label for="ai_context_prompt">
					<?php esc_html_e( 'Context Assistant System Prompt', 'jeo' ); ?>
				</label>
			</th>
			<td>
				<textarea
					name="<?php echo esc_html( \jeo_settings()->get_field_name( 'ai_context_prompt' ) ); ?>"
					id="ai_context_prompt"
					rows="20"
					class="large-text code"
					style="font-family: monospace; width: 100%;"
				><?php echo esc_textarea( \jeo_settings()->get_option( 'ai_context_prompt' ) ); ?></textarea>
				<p class="description">
					<?php esc_html_e( 'Custom system prompt for the AI Context Assistant. Leave empty to use the built-in default prompt.', 'jeo' ); ?>
				</p>
			</td>
		</tr>
	</tbody>
</table>
