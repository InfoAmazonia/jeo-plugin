<?php

namespace Jeo;

trait Singleton {

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

	private function __clone() {

	}

	private function __wakeup() {

	}

	public function should_load_assets() {
		// This is a workarround! The right way is to refractor all enqueues to have their individuals enqueues for admin and a custom condicioned one to front-end
		if(is_admin( )) {
			return true;
		}

		$mapblocks = [
			'jeo/map',
			'jeo/onetime-map',
			'jeo/storymap'
		];

		$use_any_block = false;
		$post_id = get_the_ID();

		foreach($mapblocks as $block) {
			// echo $block;
			if(has_block( $block, $post_id )) {
				$use_any_block = true;
				break;
			}
		}

		$should_load_assets = $use_any_block;

		if(in_array(get_post_type(), array_merge(\jeo_settings()->get_option( 'enabled_post_types' ), [ 'map' ]))) {
			$should_load_assets = true;
		}

		if(get_page_template_slug() === 'discovery.php') {
			$should_load_assets = true;
		}

		return $should_load_assets;
	}

	final public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	protected abstract function init();

}
