<?php
/**
 * @package           Jeo
 *
 * @wordpress-plugin
 * Plugin Name:       JEO WP
 * Description:       Interactive map blocks for Gutenberg
 * Version:           3.0.0-rc.3
 * Author:            InfoAmazonia
 * Author URI:        https://www.jeowp.org/
 * Requires at least: 6.6
 * Requires PHP:      8.0
 * License:           GPL-3.0-only
 * License URI:       https://github.com/InfoAmazonia/jeo-plugin/blob/main/LICENSE
 * Text Domain:       jeo
 * Domain Path:       /languages
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'JEO_VERSION', '3.0.0-rc.3' );

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

register_activation_hook( __FILE__, 'jeo_activate' );

jeo();
