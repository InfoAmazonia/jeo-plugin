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
		// No longer adding menu here, moved to Jeo\Menu for ordering
	}

	/**
	 * Return the associative array of AI settings tab slugs and labels.
	 *
	 * @return array
	 */
	public function get_tabs() {
		return array(
			'provider'  => __( 'AI Provider', 'jeo' ),
			'knowledge' => __( 'Knowledge Base', 'jeo' ),
			'embedded'  => __( 'Embedded Data', 'jeo' ),
			'bulk'      => __( 'Bulk Geolocation', 'jeo' ),
		);
	}

	/**
	 * Return the sanitized current tab slug from the query string, defaulting to 'provider'.
	 *
	 * @return string
	 */
	public function get_current_tab() {
		return isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'provider';
	}

	/**
	 * Render the AI settings page with tab navigation and the active tab content.
	 *
	 * @return void
	 */
	public function render_settings_page() {
		$current_tab = $this->get_current_tab();
		$tabs        = $this->get_tabs();

		include JEO_BASEPATH . '/includes/ai/settings/main-page.php';
	}
}
