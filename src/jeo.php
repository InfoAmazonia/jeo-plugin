<?php
/**
 * @package           Jeo
 *
 * @wordpress-plugin
 * Plugin Name:       JEO WP
 * Description:       Interactive Map blocks for Wordpress Gutenberg
 * Version:           0.1
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
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
define( 'JEO_VERSION', '1.0.0' );

define( 'JEO_BASEPATH', plugin_dir_path( __FILE__ ) );
define( 'JEO_BASEURL', plugins_url('', __FILE__) );

/**
 * The core plugin class that is used to define internationalization,
 * admin-specific hooks, and public-facing site hooks.
 */
require JEO_BASEPATH . 'includes/loaders.php';

jeo();
