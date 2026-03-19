<?php
/**
 * Storymap post-type registration.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Register and manage storymap posts.
 */
class Storymap {

	use Singleton;
	use Rest_Validate_Meta;

	/**
	 * Storymap post type slug.
	 *
	 * @var string
	 */
	public $post_type = 'storymap';

	/**
	 * Register storymap hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ) );
		add_filter( 'single_template', array( $this, 'override_template' ) );
		add_action( 'admin_init', array( $this, 'add_capabilities' ) );

		add_action( 'pre_get_posts', array( $this, 'show_on_archives' ) );

		add_filter( 'rest_prepare_storymap', array( $this, 'prepare_rest_response' ), 10, 2 );

		$this->register_rest_meta_validation();
	}

	/**
	 * Register the storymap post type.
	 *
	 * @return void
	 */
	public function register_post_type() {
		$labels = array(
			'name'                     => __( 'Story Map', 'jeo' ),
			'singular_name'            => __( 'Story Map', 'jeo' ),
			'add_new'                  => __( 'Add new Story Map', 'jeo' ),
			'add_new_item'             => __( 'Add new Story Map', 'jeo' ),
			'edit_item'                => __( 'Edit Story Map', 'jeo' ),
			'new_item'                 => __( 'New Story Map', 'jeo' ),
			'view_item'                => __( 'View Story Map', 'jeo' ),
			'view_items'               => __( 'View Story Maps', 'jeo' ),
			'search_items'             => __( 'Search Story Maps', 'jeo' ),
			'not_found'                => __( 'No Story Map found', 'jeo' ),
			'not_found_in_trash'       => __( 'No Story Map found in the trash', 'jeo' ),
			'menu_name'                => __( 'Story Maps', 'jeo' ),
			'item_published'           => __( 'Story Map published.', 'jeo' ),
			'item_published_privately' => __( 'Story Map published privately.', 'jeo' ),
			'item_reverted_to_draft'   => __( 'Story Map reverted to draft.', 'jeo' ),
			'item_scheduled'           => __( 'Story Map scheduled.', 'jeo' ),
			'item_updated'             => __( 'Story Map updated.', 'jeo' ),
		);

		$args = array(
			'labels'              => $labels,
			'hierarchical'        => true,
			'description'         => __( 'JEO Story Map', 'jeo' ),
			'supports'            => array( 'author', 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes', 'custom-fields', 'newspack_blocks', 'revisions' ),
			'rewrite'             => array( 'slug' => 'storymap' ),
			'public'              => true,
			'show_in_menu'        => 'jeo-main-menu',
			'show_in_rest'        => true,
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Encodes a bundled local SVG into a menu-icon data URI.
			'menu_icon'           => 'data:image/svg+xml;base64,' . base64_encode( file_get_contents( JEO_BASEPATH . '/js/src/icons/map.svg' ) ),
			'has_archive'         => true,
			'exclude_from_search' => true,
			'capabilities'        => array(
				'edit_post'          => 'edit_storymap',
				'edit_posts'         => 'edit_storymap',
				'edit_others_posts'  => 'edit_others_storymap',

				'publish_posts'      => 'publish_storymap',
				'read_post'          => 'read_storymap',
				'read_private_posts' => 'read_private_storymap',

				'delete_post'        => 'delete_storymap',
			),
			'template'            => array(
				array( 'jeo/storymap' ),
			),
		);
		if ( \jeo_settings()->get_option( 'show_storymaps_on_post_archives' ) === 1 ) {
			$args['taxonomies'] = array( 'category', 'post_tag' );
		}

		register_post_type( $this->post_type, $args );
	}

	/**
	 * Grant storymap capabilities to supported roles.
	 *
	 * @return void
	 */
	public function add_capabilities() {
		$roles = array( 'author', 'editor', 'administrator' );
		foreach ( $roles as $role ) {
			$role_obj = get_role( $role );

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

	/**
	 * Override the single template for storymaps.
	 *
	 * @param string $template Current single template path.
	 * @return string
	 */
	public function override_template( $template ) {
		global $post;

		if ( is_singular( 'storymap' ) ) {
			return JEO_BASEPATH . '/templates/single-storymap.php';
		}

		return $template;
	}

	/**
	 * Include storymaps in archive queries when enabled.
	 *
	 * @param \WP_Query $query Main query instance.
	 * @return void
	 */
	public function show_on_archives( $query ) {
		if ( ! $query->is_main_query() ) {
			return;
		}
		if ( ! is_home() && ! is_category() && ! is_tag() && ! is_search() && ! is_date() ) {
			return;
		}
		if ( \jeo_settings()->get_option( 'show_storymaps_on_post_archives' ) !== 1 ) {
			return;
		}

		if ( empty( $query->get( 'post_type' ) ) ) {
			$query->set( 'post_type', array( 'post', $this->post_type ) );
		} elseif ( is_array( $query->get( 'post_type' ) ) ) {
				$types   = $query->get( 'post_type' );
				$types[] = $this->post_type;
				$query->set( 'post_types', $types );
		}
	}

	/**
	 * Append co-author data to the REST response when available.
	 *
	 * @param \WP_REST_Response $response REST response.
	 * @param \WP_Post          $post Storymap post object.
	 * @return \WP_REST_Response
	 */
	public function prepare_rest_response( $response, $post ) {
		if ( function_exists( 'get_coauthors' ) ) {
			$authors = \get_coauthors( $post->ID );

			if ( ! empty( $authors ) ) {
				$response_authors = array();

				foreach ( $authors as $author ) {
					if ( $author instanceof \WP_User ) {
						$response_authors[] = array(
							'ID'        => $author->ID,
							'name'      => $author->display_name,
							'permalink' => get_author_posts_url( $author->ID ),
						);
					}
				}

				$response->data['jeo_authors'] = $response_authors;
			}
		}
		return $response;
	}
}
