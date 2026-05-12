<?php
/**
 * JEO Uninstall
 *
 * Triggered when the plugin is deleted from the WordPress admin.
 * Removes plugin settings, AI logs, cron schedules, vector stores, and cached data.
 *
 * @package Jeo
 */

// If uninstall not called from WordPress, die.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Remove main options.
delete_option( 'jeo-settings' );
delete_option( 'jeo_bulk_ai_cron_logs' );
delete_option( 'jeo_ai_embedding_tokens' );

// Clear scheduled cron hooks.
wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
wp_clear_scheduled_hook( 'jeo_bulk_ai_clear_cron_hook' );

// Delete all AI log posts.
$ai_logs = get_posts(
	array(
		'post_type'      => 'jeo-ai-log',
		'posts_per_page' => -1,
		'post_status'    => 'any',
		'fields'         => 'ids',
	)
);
foreach ( $ai_logs as $log_id ) {
	wp_delete_post( $log_id, true );
}

// Delete Nominatim transients.
global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_jeo_nominatim_%' OR option_name LIKE '_transient_timeout_jeo_nominatim_%'" );

// Remove RAG vector store directory.
$upload_dir = wp_upload_dir();
$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';
if ( is_dir( $store_dir ) ) {
	jeo_recursive_rmdir( $store_dir );
}

/**
 * Recursively remove a directory and its contents.
 *
 * @param string $dir Directory path.
 * @return void
 */
function jeo_recursive_rmdir( $dir ) {
	$files = array_diff( scandir( $dir ), array( '.', '..' ) );
	foreach ( $files as $file ) {
		$path = $dir . DIRECTORY_SEPARATOR . $file;
		is_dir( $path ) ? jeo_recursive_rmdir( $path ) : wp_delete_file( $path );
	}
	rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
}
