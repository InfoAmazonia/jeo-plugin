<?php

namespace Jeo;

class Menu {

    use Singleton;

	protected function init() {
		add_action('admin_menu', [$this, 'add_main_menu']);
    }

	public function add_main_menu() {
		add_menu_page(
			__('Jeo', 'jeo'),
			'Jeo',
			'read',
			'jeo-main-menu',
			'',
			'data:image/svg+xml;base64,' . base64_encode(file_get_contents(JEO_BASEPATH . '/js/src/icons/jeo.svg')),
			10
		);
    }
}
