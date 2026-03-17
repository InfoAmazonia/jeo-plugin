<?php
/**
 * Admin menu bootstrap.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Register the plugin top-level admin menu.
 */
class Menu {

	use Singleton;

	/**
	 * Register admin menu hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'admin_menu', array( $this, 'add_main_menu' ) );
	}

	/**
	 * Add the main JEO admin menu.
	 *
	 * @return void
	 */
	public function add_main_menu() {
		add_menu_page(
			__( 'Jeo', 'jeo' ),
			'Jeo',
			'read',
			'jeo-main-menu',
			'',
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Encodes a bundled local SVG into a menu-icon data URI.
			'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/jeo.svg' ) ),
			10
		);
	}
}
