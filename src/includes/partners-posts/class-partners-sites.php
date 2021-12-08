<?php

namespace Jeo;

class Partners_Sites {

	use Singleton;
	use Rest_Validate_Meta;

	public $post_type = '_partners_sites';

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
		add_action('admin_init', [ $this, 'add_capabilities' ]);
		add_action( 'admin_init', [ $this, 'load_assets' ] );
		add_action( 'cmb2_init', [ $this, 'add_cmb2_fields'] );

		$this->register_rest_meta_validation();

	}

	public function register_post_type() {

		$labels = array(
			'name' => __('Partners Sites', 'jeo'),
			'singular_name' => __('Partner Site', 'jeo'),
			'add_new' => __('Add new site', 'jeo'),
			'add_new_item' => __('Add new site', 'jeo'),
			'edit_item' => __('Edit site', 'jeo'),
			'new_item' => __('New site', 'jeo'),
			'view_item' => __('View site', 'jeo'),
			'view_items' => __( 'View sites', 'jeo' ),
			'search_items' => __('Search sites', 'jeo'),
			'not_found' => __('No site found', 'jeo'),
			'not_found_in_trash' => __('No site found in the trash', 'jeo'),
			'menu_name' => __('Partners Sites', 'jeo'),
			'item_published' => __('Integration added.', 'jeo'),
		);

		$args = array(
			'labels' => $labels,
			'hierarchical' => true,
			'description' => __('JEO Partners Sites', 'jeo'),
			'supports' => array( 'title'),
			'rewrite' => array('slug' => 'sites'),
			'public' => true,
			'show_in_menu' => 'jeo-main-menu',
			'show_in_rest' => false,
			'menu_position' => 4,
			'menu_icon' => 'data:image/svg+xml;base64,' . base64_encode(file_get_contents(JEO_BASEPATH . '/js/src/icons/map.svg')),
			'has_archive' => false,
			'exclude_from_search' => true,
			'capabilities' => array(
				'edit_post' => 'edit_partners_sites',
				'edit_posts' => 'edit_partners_sites',
				'edit_others_posts' => 'edit_partners_sites',

				'publish_posts' => 'publish_partners_sites',
				'read_post' => 'read_partners_sites',
				'read_private_posts' => 'read_private_partners_sites',

				'delete_post' => 'delete_partners_sites',
			),
		);

		register_post_type($this->post_type, $args);

	}
	public function load_assets() {
		if ( ! $this->is_edit_screen_from_post_type( $this->post_type ) ) {
			return;
		}
		//do_action( 'enqueue_block_editor_assets' );
		$styles = [ 'wp-block-editor'];
		foreach( $styles as $style ) {
			wp_enqueue_style( $style );
		}
		$asset_file = include JEO_BASEPATH . 'js/build/partnersPosts.asset.php';

		wp_enqueue_script(
			'jeo-partners-posts',
			JEO_BASEURL . '/js/build/partnersPosts.js',
			array_merge($asset_file['dependencies']),
			$asset_file['version']
		);

		wp_set_script_translations( 'jeo-partners-posts', 'jeo', plugin_dir_path(  dirname( __FILE__ , 2 ) ) . 'languages' );

	}
	public function add_cmb2_fields() {
		$prefix = $this->post_type;

		$site_info_box = \new_cmb2_box( array(
			'id'           => $prefix . '_site_info',
			'title'        => __( 'Site information', 'jeo' ),
			'object_types' => array( $this->post_type ),
			'context'      => 'advanced',
			'priority'     => 'high',
		) );
	
		$site_info_box->add_field( array(
			'name' => __( 'Site URL', 'jeo' ),
			'id' => $prefix . '_site_url',
			'type' => 'text',
		) );
		$site_info_box->add_field( array(
			'name' 				=> __( 'Get posts from a specific category', 'jeo' ),
			'id' 				=> $prefix . '_remote_category',
			'type' 				=> 'select',
			'show_option_none' 	=> true,
			'options'			=> [],
		) );

		$post_config_box = \new_cmb2_box( array(
			'id'           => $prefix . '_post_config',
			'title'        => __( 'Site information', 'jeo' ),
			'object_types' => array( $this->post_type ),
			'context'      => 'advanced',
			'priority'     => 'high',
		) );

		$post_config_box->add_field( array(
			'name' 				=> __( 'Post category after import', 'jeo' ),
			'id' 				=> $prefix . '_local_category',
			'taxonomy'			=> 'category',
			'type'				=> 'taxonomy_select',
		) );

		$test_api = \new_cmb2_box( array(
			'id'           => $prefix . '_test_api',
			'title'        => __( 'Preview import', 'jeo' ),
			'object_types' => array( $this->post_type ),
			'context'      => 'side',
			'priority'     => 'default',
		) );

	}

	public function sanitize_meta_center($meta_value, $meta_key, $object_type, $object_subtype) {
		return intval($meta_value);
	}

	public function sanitize_meta_initial_zoom($meta_value, $meta_key, $object_type, $object_subtype) {
		return intval($meta_value);
	}


	public function add_capabilities() {
		$roles = ['editor', 'administrator'];
		foreach ($roles as $role) {
			// var_dump($role);
			$role_obj = get_role($role);

			$role_obj->add_cap( 'edit_partner_site' );
			$role_obj->add_cap( 'edit_partners_sites' );
			$role_obj->add_cap( 'edit_others_partner_sites' );
			$role_obj->add_cap( 'publish_partners_sites' );
			$role_obj->add_cap( 'read_partners_site' );
			$role_obj->add_cap( 'read_private_partners_sites' );
			$role_obj->add_cap( 'delete_partners_site' );
			$role_obj->add_cap( 'edit_published_blocks' );
		}
	}

}
