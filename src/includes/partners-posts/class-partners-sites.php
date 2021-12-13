<?php
namespace Jeo;

require 'class-import-posts.php';

class Partners_Sites {

	use Singleton;

	public $post_type = '_partners_sites';

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
		add_action('admin_init', [ $this, 'add_capabilities' ]);
		add_action( 'admin_init', [ $this, 'load_assets' ] );
		add_action( 'cmb2_init', [ $this, 'add_cmb2_fields'] );
		add_action( 'admin_head', [ $this, 'remove_metaboxes'], 9999 );


	}

	public function remove_metaboxes() {
		global $wp_meta_boxes;

		if( ! is_array( $wp_meta_boxes ) ) {
			return;
		}
		
		if( isset( $wp_meta_boxes[$this->post_type] ) && is_array( $wp_meta_boxes[$this->post_type] ) ) {
			foreach( $wp_meta_boxes[$this->post_type] as $position => $content ) {
				if( $wp_meta_boxes[$this->post_type][ $position ] && is_array( $wp_meta_boxes[$this->post_type][ $position ] ) && ! empty( $wp_meta_boxes[$this->post_type][ $position ] ) ) {
					foreach( $wp_meta_boxes[$this->post_type][ $position ] as $priority => $content ) {
						if ( ! $wp_meta_boxes[$this->post_type][ $position ][ $priority ] ) {
							continue;
						}
						if ( ! is_array( $wp_meta_boxes[$this->post_type][ $position ][ $priority ] ) ) {
							continue;
						}
						if ( empty( $wp_meta_boxes[$this->post_type][ $position ][ $priority ] ) ) {
							continue;
						}
						foreach( $wp_meta_boxes[$this->post_type][ $position ][ $priority ] as $metabox => $content ) {
							if ( 'submitdiv' == $metabox ) {
								continue;
							}
							if ( strpos( $metabox, $this->post_type ) !== false ) {
								continue;
							}
							unset( $wp_meta_boxes[$this->post_type][ $position ][ $priority ][ $metabox ] );

						}
					}
				}
			}
		}
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
			'item_published' => __('Site added.', 'jeo'),
			'item_updated'	=> __( 'Site updated', 'jeo' )
		);

		$args = array(
			'labels' => $labels,
			'hierarchical' => true,
			'description' => __('JEO Partners Sites Sync', 'jeo'),
			'supports' => array( 'title'),
			'rewrite' => false,
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
		$post_id = false;
		if ( isset( $_GET[ 'post'] ) && ! empty( $_GET[ 'post'] ) ) {
			$post_id = $_GET[ 'post'];
		}

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
        $site_info_box->add_field( array(
            'name' => __( 'Import posts published from date', 'jeo' ),
            'id'   => $prefix . '_date',
            'type' => 'text_date_timestamp',
            'date_format' => 'Y-m-d',
			'default' => time()
        ) );
		$current_remote_category = '';
		if ( $post_id ) {
			$current_remote_category = get_post_meta( $post_id, '_remote_category', true );
		}
		$site_info_box->add_field( array(
			'id'   		=> $prefix . '_remote_categorie_value',
			'type' 		=> 'hidden',
			'default' 	=> $current_remote_category,
		) );	

		$post_config_box = \new_cmb2_box( array(
			'id'           => $prefix . '_post_config',
			'title'        => __( 'Post configuration', 'jeo' ),
			'object_types' => array( $this->post_type ),
			'context'      => 'advanced',
			'priority'     => 'high',
		) );

		$post_config_box->add_field( array(
			'name' 				=> __( 'Post category on your site', 'jeo' ),
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
