<?php
/**
 * Shared singleton behavior for JEO services.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Provide a simple singleton pattern plus shared asset-loading helpers.
 */
trait Singleton {

	/**
	 * Singleton instance.
	 *
	 * @var object|null
	 */
	protected static $instance;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	private function __construct() {
		$this->init();
	}

	/**
	 * Determine whether shared assets should load for the current request.
	 *
	 * @return bool
	 */
	public function should_load_assets() {
		// This is a workaround. The right fix is to separate admin and frontend enqueue conditions.
		if ( is_admin() ) {
			return true;
		}

		$mapblocks = array(
			'jeo/map',
			'jeo/onetime-map',
			'jeo/storymap',
			'jeo/embedded-storymap',
		);

		$should_load_assets = false;
		$post_id            = get_the_ID();
		$post_type          = get_post_type();

		foreach ( $mapblocks as $block ) {
			if ( has_block( $block, $post_id ) ) {
				$should_load_assets = true;
				break;
			}
		}

		if ( in_array( $post_type, array_merge( \jeo_settings()->get_option( 'enabled_post_types' ), array( 'map' ) ), true ) ) {
			$should_load_assets = true;
		}

		if ( $this->should_load_discovery_assets() ) {
			$should_load_assets = true;
		}

		if ( get_query_var( 'jeo_embed' ) === 'map' ) {
			$should_load_assets = true;
		}

		return apply_filters( 'jeo_should_load_assets', $should_load_assets );
	}

	/**
	 * Determine whether Discovery assets should load.
	 *
	 * @return bool
	 */
	public function should_load_discovery_assets() {
		return is_page_template( 'discovery.php' );
	}

	/**
	 * Determine whether storymap assets should load.
	 *
	 * @return bool
	 */
	public function should_log_storymap_assets() {
		$mapblocks = array(
			'jeo/storymap',
			'jeo/embedded-storymap',
		);

		$should_load_assets = false;
		$post_id            = get_the_ID();

		foreach ( $mapblocks as $block ) {
			if ( has_block( $block, $post_id ) ) {
				$should_load_assets = true;
				break;
			}
		}

		return apply_filters( 'jeo_should_load_storymap_assets', $should_load_assets );
	}

	/**
	 * Return the singleton instance.
	 *
	 * @return static
	 */
	final public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Initialize the singleton implementation.
	 *
	 * @return void
	 */
	abstract protected function init();
}
