<?php
/**
 * JEO Uninstall Confirmation Page
 *
 * Displays a confirmation screen before uninstalling the plugin,
 * listing all data that will be permanently removed.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$plugin_file = plugin_basename( JEO_BASEPATH . 'jeo.php' );
$delete_url  = wp_nonce_url( self_admin_url( 'plugins.php?action=delete-selected&checked[]=' . rawurlencode( $plugin_file ) ), 'bulk-plugins' );

// Handle confirmed uninstall.
if ( isset( $_POST['jeo_confirm_uninstall'], $_POST['jeo_uninstall_nonce'] ) ) {
	check_admin_referer( 'jeo_uninstall_action', 'jeo_uninstall_nonce' );

	if ( ! current_user_can( 'activate_plugins' ) ) {
		wp_die( esc_html__( 'You do not have permission to uninstall plugins.', 'jeowp' ) );
	}

	// Run the uninstall routine now (before files are deleted).
	if ( file_exists( JEO_BASEPATH . 'uninstall.php' ) ) {
		define( 'WP_UNINSTALL_PLUGIN', $plugin_file );
		require_once JEO_BASEPATH . 'uninstall.php';
	}

	// Delete the plugin files.
	if ( ! function_exists( 'delete_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	$result = delete_plugins( array( $plugin_file ) );
	if ( is_wp_error( $result ) ) {
		wp_die( esc_html( $result->get_error_message() ) );
	}

	wp_safe_redirect( self_admin_url( 'plugins.php?deleted=true' ) );
	exit;
}
?>
<div class="wrap">
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>

	<div class="notice notice-warning">
		<p><strong><?php esc_html_e( 'Warning: This action cannot be undone.', 'jeowp' ); ?></strong></p>
	</div>

	<p><?php esc_html_e( 'Uninstalling JEO will permanently delete the following data from your site:', 'jeowp' ); ?></p>

	<ul class="ul-disc">
		<li><?php esc_html_e( 'All plugin settings stored in the database (map defaults, API keys, appearance settings, etc.).', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'All AI usage logs (private posts of type "jeo-ai-log").', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'All geolocation metadata attached to posts (_related_point, _geocode_* index fields).', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'Cached geocoding results (Nominatim transients).', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'Bulk AI cron logs and embedding token counters.', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'RAG vector store files from the uploads directory (wp-content/uploads/jeo-ai-store/).', 'jeowp' ); ?></li>
		<li><?php esc_html_e( 'Scheduled cron jobs created by the plugin.', 'jeowp' ); ?></li>
	</ul>

	<p><?php esc_html_e( 'Your regular posts, pages, maps, layers, and storymaps will remain, but any geolocation data associated with them will be lost.', 'jeowp' ); ?></p>

	<form method="post" action="">
		<?php wp_nonce_field( 'jeo_uninstall_action', 'jeo_uninstall_nonce' ); ?>
		<p>
			<label>
				<input type="checkbox" name="jeo_confirm_uninstall" value="1" required />
				<?php esc_html_e( 'I understand that all data listed above will be permanently deleted.', 'jeowp' ); ?>
			</label>
		</p>
		<?php submit_button( __( 'Confirm and Uninstall JEO', 'jeowp' ), 'delete', 'submit', true, array( 'onclick' => 'return confirm("' . esc_js( __( 'Are you absolutely sure? This cannot be undone.', 'jeowp' ) ) . '");' ) ); ?>
		<a href="<?php echo esc_url( self_admin_url( 'plugins.php' ) ); ?>" class="button"><?php esc_html_e( 'Cancel', 'jeowp' ); ?></a>
	</form>
</div>
