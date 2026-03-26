<?php

namespace Jeo;

class Menu {

	use Singleton;

	protected function init() {
		add_action( 'admin_menu', array( $this, 'add_main_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_dashboard_assets' ) );
	}

	public function add_main_menu() {
		// Registra o Menu Principal
		add_menu_page(
			__( 'Jeo', 'jeo' ),
			'Jeo',
			'read',
			'jeo-main-menu',
			array( $this, 'render_dashboard_page' ),
			'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/jeo.svg' ) ),
			10
		);

		// Registra o Submenu 'Home/Dashboard' explicitamente (evita que o WP crie um submenu fantasma ou sobrescreva)
		add_submenu_page(
			'jeo-main-menu',
			__( 'Dashboard', 'jeo' ),
			__( 'Dashboard', 'jeo' ),
			'read',
			'jeo-main-menu', // Usar o mesmo slug do pai o torna o primeiro item oficial
			array( $this, 'render_dashboard_page' )
		);
	}

	public function enqueue_dashboard_assets( $hook ) {
		// Enfileira assets DO MAPA apenas na Dashboard (Home do plugin)
		if ( 'toplevel_page_jeo-main-menu' !== $hook ) {
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

	public function render_dashboard_page() {
		include JEO_BASEPATH . '/includes/admin/dashboard-page.php';
	}
}
