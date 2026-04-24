<?php
/**
 * JEO admin menu.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Manages the JEO admin menu structure and dashboard/welcome page assets.
 */
class Menu {

	use Singleton;

	/** {@inheritDoc} */
	protected function init() {
		add_action( 'admin_menu', array( $this, 'add_main_menu' ), 5 ); // Priority 5 to run before CPTs if possible.
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_dashboard_assets' ) );
	}

	/**
	 * Register the JEO top-level admin menu and its submenus (Welcome, Dashboard, AI Settings).
	 *
	 * @return void
	 */
	public function add_main_menu() {
		// 1. O Menu Principal (Pai) agora aponta para a Welcome Page por padrão
		add_menu_page(
			__( 'Jeo', 'jeo' ),
			'Jeo',
			'read',
			'jeo-main-menu',
			array( $this, 'render_welcome_page' ),
			'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/jeo.svg' ) ),
			10
		);

		// 2. Submenu Welcome (Ocupa a primeira posição, slug igual ao pai para ser o default)
		add_submenu_page(
			'jeo-main-menu',
			__( 'Welcome', 'jeo' ),
			__( 'Welcome', 'jeo' ),
			'read',
			'jeo-main-menu',
			array( $this, 'render_welcome_page' )
		);

		// 3. Submenu Dashboard (Segunda posição, agora chamado de Experimental)
		add_submenu_page(
			'jeo-main-menu',
			__( 'Dashboard', 'jeo' ),
			__( 'Dashboard', 'jeo' ),
			'read',
			'jeo-dashboard',
			array( $this, 'render_dashboard_page' )
		);

		// 4. Submenu AI (novo) - Posicionado após Dashboard e antes dos CPTs (Maps, Layers)
		add_submenu_page(
			'jeo-main-menu',
			__( 'AI (novo)', 'jeo' ),
			__( 'AI (novo)', 'jeo' ),
			'manage_options',
			'jeo-ai-settings',
			array( \jeo_ai_settings(), 'render_settings_page' )
		);

		// Nota: Maps, Layers e Story Maps são injetados via seus respectivos arquivos class-*.php
		// usando o slug 'jeo-main-menu' como 'show_in_menu'.
		// Para garantir a ordem, precisamos ajustar as prioridades nesses arquivos.
	}

	/**
	 * Enqueue MapLibre or Mapbox GL JS assets on the dashboard and welcome admin pages.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public function enqueue_dashboard_assets( $hook ) {
		// Enfileira assets DO MAPA apenas na Dashboard.
		if ( strpos( $hook, 'jeo-dashboard' ) === false && strpos( $hook, 'jeo-main-menu' ) === false ) {
			return;
		}

		$map_runtime = \jeo_settings()->get_option( 'map_runtime' );

		if ( 'maplibregl' === $map_runtime ) {
			wp_enqueue_style( 'maplibregl-css', 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css', array(), '3.6.2' );
			wp_enqueue_script( 'maplibregl', 'https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js', array(), '3.6.2', true );
		} else {
			wp_enqueue_style( 'mapboxgl-css', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css', array(), '2.15.0' );
			wp_enqueue_script( 'mapboxgl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', array(), '2.15.0', true );
		}
	}

	/**
	 * Render the JEO dashboard admin page from its template.
	 *
	 * @return void
	 */
	public function render_dashboard_page() {
		include JEO_BASEPATH . '/includes/admin/dashboard-page.php';
	}

	/**
	 * Render the JEO welcome admin page from its template.
	 *
	 * @return void
	 */
	public function render_welcome_page() {
		include JEO_BASEPATH . '/includes/admin/welcome-page.php';
	}
}
