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
			'dashicons-admin-site',
			10
		);
    }
}
