<?php
/**
 * JEO admin menu.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
			__( 'JEO', 'jeowp' ),
			__( 'JEO', 'jeowp' ),
			// phpcs:ignore WordPress.WP.Capabilities.Unknown -- Registered by Maps::add_capabilities().
			'edit_maps',
			'jeo-main-menu',
			array( $this, 'render_welcome_page' ),
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Encodes a bundled local SVG into a menu-icon data URI.
			'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/jeo.svg' ) )
		);

		// 2. Submenu Welcome (Ocupa a primeira posição, slug igual ao pai para ser o default)
		add_submenu_page(
			'jeo-main-menu',
			__( 'Welcome', 'jeowp' ),
			__( 'Welcome', 'jeowp' ),
			'read',
			'jeo-main-menu',
			array( $this, 'render_welcome_page' )
		);

		// 3. Submenu Dashboard (Segunda posição, agora chamado de Experimental)
		add_submenu_page(
			'jeo-main-menu',
			__( 'Dashboard', 'jeowp' ),
			__( 'Dashboard', 'jeowp' ),
			'read',
			'jeo-dashboard',
			array( $this, 'render_dashboard_page' )
		);

		// 4. Submenu AI (new) - Posicionado após Dashboard e antes dos CPTs (Maps, Layers)
		add_submenu_page(
			'jeo-main-menu',
			__( 'AI (new)', 'jeowp' ),
			__( 'AI (new)', 'jeowp' ),
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

		// Reuse the plugin's own `mapgl` runtime bundle (registered on `init`
		// by Jeo::register_assets()) so the dashboard renders with the same
		// runtime as the rest of the plugin. Mapbox GL JS still loads from
		// the Mapbox CDN when (and only when) the mapboxgl runtime is
		// selected with a valid key — it is a script dependency of `mapgl`.
		// The bundle exposes the active runtime as `window.mapboxgl`.
		wp_enqueue_style( 'mapgl' );
		wp_enqueue_script( 'mapgl' );
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
