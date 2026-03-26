<?php

/**
 * JEO Uninstall
 *
 * Triggered when the plugin is deleted from the WordPress admin.
 * Removes all settings but preserves post metadata.
 */

// If uninstall not called from WordPress, die.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}

// Remove main options
delete_option( 'jeo-settings' );

// Note: Post metadata (_related_point) is preserved as requested by the user.
