<?php

namespace Jeo;

class Storymap{

	use Singleton;
	use Rest_Validate_Meta;

	public $post_type = 'storymap';

	protected function init() {
		add_action( 'init', [$this, 'register_post_type'] );
		add_filter( 'single_template', [$this, 'override_template']);
		add_action('admin_init', [ $this, 'add_capabilities' ]);
		$this->register_rest_meta_validation();
	}


    public function register_post_type() {


		$labels = array(
			'name' => __('Story Map', 'jeo'),
			'singular_name' => __('Story Map', 'jeo'),
			'add_new' => __('Add new Story Map', 'jeo'),
			'add_new_item' => __('Add new Story Map', 'jeo'),
			'edit_item' => __('Edit Story Map', 'jeo'),
			'new_item' => __('New Story Map', 'jeo'),
			'view_item' => __('View Story Map', 'jeo'),
			'view_items' => __( 'View Story Map', 'jeo' ),
			'search_items' => __('Search Story Map', 'jeo'),
			'not_found' => __('No Story Map found', 'jeo'),
			'not_found_in_trash' => __('No Story Map found in the trash', 'jeo'),
			'menu_name' => __('Story Map', 'jeo'),
			'item_published' => __('Story Map published.', 'jeo'),
			'item_published_privately' => __('Story Map published privately.', 'jeo'),
			'item_reverted_to_draft' => __('Story Map reverted to draft.', 'jeo'),
			'item_scheduled' => __('Story Map scheduled.', 'jeo'),
			'item_updated' => __('Story Map updated.', 'jeo'),
		);

		$args = array(
			'labels' => $labels,
			'hierarchical' => true,
			'description' => __('JEO Story Map', 'jeo'),
			'supports' => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields'),
			'rewrite' => array('slug' => 'storymap'),
			'public' => true,
			'show_in_menu' => 'jeo-main-menu',
			'show_in_rest' => true,
			'menu_icon' => 'data:image/svg+xml;base64,' . base64_encode(file_get_contents(JEO_BASEPATH . '/js/src/icons/map.svg')),
			'has_archive' => true,
			'exclude_from_search' => true,
			'capabilities' => array(
				'edit_post' => 'edit_storymap',
				'edit_posts' => 'edit_storymap',
				'edit_others_posts' => 'edit_others_storymap',

				'publish_posts' => 'publish_storymap',
				'read_post' => 'read_storymap',
				'read_private_posts' => 'read_private_storymap',

				'delete_post' => 'delete_storymap',
			),
			'template' => array(
				array( 'jeo/storymap' ),
			),
		);

		register_post_type($this->post_type, $args);

    }

    public function add_capabilities() {
		$roles = ['author', 'editor', 'administrator'];
		foreach ($roles as $role) {
			// var_dump($role);
			$role_obj = get_role($role);

			$role_obj->add_cap( 'edit_storymap' );
			$role_obj->add_cap( 'edit_storymap' );
			$role_obj->add_cap( 'edit_others_storymap' );
			$role_obj->add_cap( 'publish_storymap' );
			$role_obj->add_cap( 'read_storymap' );
			$role_obj->add_cap( 'read_private_storymap' );
			$role_obj->add_cap( 'delete_storymap' );
			$role_obj->add_cap( 'edit_published_blocks' );
		}
	}

	public function override_template($template) {
		global $post;

		if (is_singular('storymap')) {
			return JEO_BASEPATH . '/templates/single-storymap.php';
		}

		return $template;
	}
}

?>
