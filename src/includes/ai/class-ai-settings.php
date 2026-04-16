<?php

namespace Jeo\AI;

use Jeo\Singleton;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI Settings Class
 * 
 * Manages the new dedicated AI Settings pages.
 */
class AI_Settings {

	use Singleton;

	public $page_slug = 'jeo-ai-settings';

	protected function init() {
		add_action( 'admin_menu', array( $this, 'add_menu_pages' ), 20 );
	}

	public function add_menu_pages() {
		add_menu_page(
			__( 'JEO AI', 'jeo' ),
			__( 'JEO AI', 'jeo' ),
			'manage_options',
			$this->page_slug,
			array( $this, 'render_settings_page' ),
			'dashicons-superhero',
			30
		);

		$tabs = $this->get_tabs();
		foreach ( $tabs as $slug => $label ) {
			add_submenu_page(
				$this->page_slug,
				$label,
				$label,
				'manage_options',
				$this->page_slug . '&tab=' . $slug,
				array( $this, 'render_settings_page' )
			);
		}
	}

	public function get_tabs() {
		return array(
			'provider'  => __( 'AI Provider', 'jeo' ),
			'knowledge' => __( 'Knowledge Base', 'jeo' ),
			'embedded'  => __( 'Embedded Data', 'jeo' ),
			'bulk'      => __( 'Bulk Geolocation', 'jeo' ),
		);
	}

	public function get_current_tab() {
		return isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'provider';
	}

	public function render_settings_page() {
		$current_tab = $this->get_current_tab();
		$tabs = $this->get_tabs();
		
		// Enqueue the same settings logic for API tests and buttons
		wp_enqueue_script( 'jeo-settings' );
		
		include JEO_BASEPATH . '/includes/ai/settings/main-page.php';
	}
}