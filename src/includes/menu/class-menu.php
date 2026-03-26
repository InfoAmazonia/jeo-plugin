<?php

namespace Jeo;

class Menu {

	use Singleton;

	protected function init() {
		add_action( 'admin_menu', array( $this, 'add_main_menu' ) );
	}

	public function add_main_menu() {
		add_menu_page(
			__( 'Jeo', 'jeo' ),
			'Jeo',
			'read',
			'jeo-main-menu',
			array( $this, 'menu_redirect' ),
			'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/jeo.svg' ) ),
			10
		);
	}

	public function menu_redirect() {
		// O menu principal não tem tela própria, redireciona para a lista de Mapas
		wp_safe_redirect( admin_url( 'edit.php?post_type=map' ) );
		exit;
	}
}
