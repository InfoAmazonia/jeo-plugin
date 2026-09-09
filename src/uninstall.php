<?php
/**
 * JEO Uninstall
 *
 * Triggered when the plugin is deleted from the WordPress admin.
 * This routine permanently removes all plugin-specific data.
 *
 * DATA REMOVED:
 * - All options: jeo-settings, jeo_bulk_ai_cron_logs, jeo_ai_embedding_tokens
 * - All AI usage logs (CPT jeo-ai-log)
 * - All geolocation post metadata (_related_point and derived _geocode_* fields)
 * - All Nominatim geocoding transients
 * - Scheduled cron hooks (jeo_bulk_ai_cron_hook, jeo_bulk_ai_clear_cron_hook)
 * - RAG vector store directory (wp-content/uploads/jeo-ai-store/)
 *
 * PRESERVED:
 * - Regular posts, pages, maps, layers, and storymap posts remain in the database.
 * - Their content and titles are preserved; only geolocation meta is deleted.
 *
 * @package Jeo
 */

// Security: abort if not called by WordPress uninstall process.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// ------------------------------------------------------------------
// 1. OPTIONS
// ------------------------------------------------------------------
// Main plugin configuration (settings page, API keys, appearance, etc.)
delete_option( 'jeo-settings' );

// Bulk AI background processing logs.
delete_option( 'jeo_bulk_ai_cron_logs' );

// AI embedding token usage counters.
delete_option( 'jeo_ai_embedding_tokens' );

// ------------------------------------------------------------------
// 2. CRON SCHEDULES
// ------------------------------------------------------------------
wp_clear_scheduled_hook( 'jeo_bulk_ai_cron_hook' );
wp_clear_scheduled_hook( 'jeo_bulk_ai_clear_cron_hook' );

// ------------------------------------------------------------------
// 3. AI LOG POSTS (private CPT)
// ------------------------------------------------------------------
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

// ------------------------------------------------------------------
// 4. POST METADATA
// ------------------------------------------------------------------
// Remove _related_point and all derived _geocode_* index meta from posts.
$meta_keys = array(
	'_related_point',
	'_geocode_lat',
	'_geocode_lon',
	'_geocode_lat_p',
	'_geocode_lon_p',
	'_geocode_lat_s',
	'_geocode_lon_s',
	'_geocode_city_level_1',
	'_geocode_city',
	'_geocode_region_level_3',
	'_geocode_region_level_2',
	'_geocode_region_level_1',
	'_geocode_country_code',
	'_geocode_country',
	'_geocode_address',
	'_geocode_address_number',
	'_geocode_postcode',
	'_geocode_full_address',
	'_jeo_ai_context_conversation_id',
	'_jeo_ai_context_last_response',
	'_jeo_ai_context_chat_messages',
	'_jeo_ai_context_suggestion_history',
);

global $wpdb;
foreach ( $meta_keys as $key ) {
	$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $key ), array( '%s' ) );
}

// ------------------------------------------------------------------
// 5. TRANSIENTS
// ------------------------------------------------------------------
// Nominatim geocoding cache entries.
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_jeo_nominatim_%' OR option_name LIKE '_transient_timeout_jeo_nominatim_%'" );

// ------------------------------------------------------------------
// 6. RAG VECTOR STORE
// ------------------------------------------------------------------
// Remove the local filesystem vector store directory.
$upload_dir = wp_upload_dir();
$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';
if ( is_dir( $store_dir ) ) {
	jeo_recursive_rmdir_uninstall( $store_dir );
}

/**
 * Recursively remove a directory and its contents.
 *
 * @param string $dir Directory path.
 * @return void
 */
function jeo_recursive_rmdir_uninstall( $dir ) {
	$files = array_diff( scandir( $dir ), array( '.', '..' ) );
	foreach ( $files as $file ) {
		$path = $dir . DIRECTORY_SEPARATOR . $file;
		is_dir( $path ) ? jeo_recursive_rmdir_uninstall( $path ) : wp_delete_file( $path );
	}
	rmdir( $dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
}
