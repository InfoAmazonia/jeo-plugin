<?php

namespace Jeo\Tests;

class Jeo_UnitTestCase extends \WP_UnitTestCase {
	protected $user_id;

	public function setUp(){
		parent::setUp();
		
		$new_admin_user = $this->factory()->user->create(array( 'role' => 'administrator' ));
		wp_set_current_user($new_admin_user);
		$this->user_id = $new_admin_user;
	}
}