<?php
/**
 * @package           Jeo
 *
 * @wordpress-plugin
 * Plugin Name:       JEO WP
 * Description:       A professional geojournalism platform for WordPress. Features an AI-powered Georeferencing Co-Pilot, interactive mapping blocks, and a centralized territorial Knowledge Base. Start with our [Welcome Guide](admin.php?page=jeo-welcome) or view your [Geographic Dashboard](admin.php?page=jeo-dashboard).
 * Version:           3.6.3-experimental
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       jeo
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Check PHP Version Compatibility (Requires 8.2+)
 */
if ( version_compare( PHP_VERSION, '8.2', '<' ) ) {
	add_action( 'admin_notices', function () {
		printf(
			'<div class="notice notice-error"><p>%s</p></div>',
			esc_html__( 'JEO Plugin Error: Your PHP version is too old. JEO AI features require PHP 8.2 or higher. The plugin will remain deactivated.', 'jeo' )
		);
	} );

	if ( ! function_exists( 'deactivate_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	
	// Ensure we don't cause infinite loop on activation failure
	if ( is_plugin_active( plugin_basename( __FILE__ ) ) ) {
		deactivate_plugins( plugin_basename( __FILE__ ) );
		if ( isset( $_GET['activate'] ) ) {
			unset( $_GET['activate'] );
		}
	}
	return;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'JEO_VERSION', '3.6.3-experimental' );

define( 'JEO_BASEPATH', plugin_dir_path( __FILE__ ) );
define( 'JEO_BASEURL', plugins_url( '', __FILE__ ) );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require JEO_BASEPATH . 'includes/loaders.php';

/**
 * Register custom rewrites before flushing them on activation.
 */
function jeo_activate() {
	jeo_maps()->register_post_type();
	jeo_storymap()->register_post_type();
	jeo()->register_embed_rewrite();

	flush_rewrite_rules();
}

/**
 * Deactivation Hook
 * Clear ONLY sensitive API Keys upon deactivation for security.
 */
function jeo_deactivate() {
	// Clear ONLY sensitive AI keys
	$options = get_option( 'jeo-settings' );
	if ( is_array( $options ) ) {
		$options['gemini_api_key']   = '';
		$options['openai_api_key']   = '';
		$options['deepseek_api_key'] = '';
		update_option( 'jeo-settings', $options );
	}
	
	// Clear residual debug logs for safety
	$log_file = JEO_BASEPATH . 'jeo-ai-debug.log';
	if ( file_exists( $log_file ) ) { @unlink( $log_file ); }
	
	$upload_dir = wp_upload_dir();
	$log_file_uploads = trailingslashit( $upload_dir['basedir'] ) . 'jeo-ai-debug.log';
	if ( file_exists( $log_file_uploads ) ) { @unlink( $log_file_uploads ); }

	flush_rewrite_rules();
}

register_activation_hook( __FILE__, 'jeo_activate' );
register_deactivation_hook( __FILE__, 'jeo_deactivate' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	\WP_CLI::add_command( 'jeo ai', 'Jeo\CLI\AI_CLI' );
}

jeo();
jeo_bulk_processor();
