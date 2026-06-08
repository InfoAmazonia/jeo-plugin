<?php
/**
 * Storymap post-type registration.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
	 * Post IDs cached with lightweight admin-list objects during this request.
	 *
	 * @var int[]
	 */
	private $lightweight_admin_list_cache_ids = array();

	/**
	 * Register storymap hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_type' ), 20 );
		add_filter( 'single_template', array( $this, 'override_template' ) );
		add_action( 'admin_init', array( $this, 'add_capabilities' ) );

		add_action( 'pre_get_posts', array( $this, 'show_on_archives' ) );
		add_action( 'pre_get_posts', array( $this, 'prepare_admin_list_query' ) );
		add_filter( 'request', array( $this, 'paginate_admin_list_request' ) );
		add_filter( 'posts_fields', array( $this, 'lightweight_admin_list_fields' ), 10, 2 );
		add_filter( 'the_posts', array( $this, 'prime_lightweight_admin_list_cache' ), 10, 2 );
		add_filter( 'manage_' . $this->post_type . '_posts_columns', array( $this, 'remove_expensive_admin_list_columns' ), 20 );
		add_filter( 'quick_edit_dropdown_pages_args', array( $this, 'disable_admin_parent_dropdown' ) );
		add_action( 'shutdown', array( $this, 'clear_lightweight_admin_list_cache' ) );

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
			// translators: Story Map is the name of JEO's storytelling map feature.
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
			if ( ! $role_obj ) {
				continue;
			}

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
	 * Keep the storymap admin list paginated.
	 *
	 * WordPress treats hierarchical post types like pages and loads every item
	 * to build the tree. Storymaps can contain large serialized block payloads,
	 * so the default list table query can exhaust memory on content-heavy sites.
	 *
	 * @param array $query_vars Request query vars.
	 * @return array
	 */
	public function paginate_admin_list_request( $query_vars ) {
		if ( ! is_admin() ) {
			return $query_vars;
		}
		if ( 'edit.php' !== ( $GLOBALS['pagenow'] ?? '' ) ) {
			return $query_vars;
		}
		if ( ( $query_vars['post_type'] ?? '' ) !== $this->post_type ) {
			return $query_vars;
		}
		if ( 'menu_order title' !== ( $query_vars['orderby'] ?? '' ) ) {
			return $query_vars;
		}
		if ( -1 !== (int) ( $query_vars['posts_per_page'] ?? 0 ) ) {
			return $query_vars;
		}
		if ( 'id=>parent' !== ( $query_vars['fields'] ?? '' ) ) {
			return $query_vars;
		}

		$posts_per_page = (int) get_user_option( 'edit_' . $this->post_type . '_per_page' );
		if ( $posts_per_page < 1 ) {
			$posts_per_page = 20;
		}

		/** This filter is documented in wp-admin/includes/post.php */
		$posts_per_page = (int) apply_filters( "edit_{$this->post_type}_per_page", $posts_per_page );

		/** This filter is documented in wp-admin/includes/post.php */
		$posts_per_page = (int) apply_filters( 'edit_posts_per_page', $posts_per_page, $this->post_type );
		$posts_per_page = max( 1, $posts_per_page );

		$query_vars['orderby']                = 'date';
		$query_vars['order']                  = 'DESC';
		$query_vars['posts_per_page']         = $posts_per_page;
		$query_vars['posts_per_archive_page'] = $posts_per_page;
		unset( $query_vars['fields'] );

		return $query_vars;
	}

	/**
	 * Mark storymap admin list queries to avoid loading full post content.
	 *
	 * @param \WP_Query $query Query instance.
	 * @return void
	 */
	public function prepare_admin_list_query( $query ) {
		if ( ! $this->is_admin_list_query( $query ) ) {
			return;
		}

		$query->set( 'cache_results', false );
		$query->set( 'update_post_meta_cache', false );
		$query->set( 'jeo_lightweight_storymap_admin_list', true );
	}

	/**
	 * Select only lightweight post fields for the storymap admin list.
	 *
	 * @param string    $fields Current SELECT fields.
	 * @param \WP_Query $query Query instance.
	 * @return string
	 */
	public function lightweight_admin_list_fields( $fields, $query ) {
		if ( ! $query->get( 'jeo_lightweight_storymap_admin_list' ) ) {
			return $fields;
		}

		global $wpdb;

		return "{$wpdb->posts}.ID,
			{$wpdb->posts}.post_author,
			{$wpdb->posts}.post_date,
			{$wpdb->posts}.post_date_gmt,
			'' AS post_content,
			{$wpdb->posts}.post_title,
			{$wpdb->posts}.post_excerpt,
			{$wpdb->posts}.post_status,
			{$wpdb->posts}.comment_status,
			{$wpdb->posts}.ping_status,
			{$wpdb->posts}.post_password,
			{$wpdb->posts}.post_name,
			{$wpdb->posts}.to_ping,
			{$wpdb->posts}.pinged,
			{$wpdb->posts}.post_modified,
			{$wpdb->posts}.post_modified_gmt,
			'' AS post_content_filtered,
			{$wpdb->posts}.post_parent,
			{$wpdb->posts}.guid,
			{$wpdb->posts}.menu_order,
			{$wpdb->posts}.post_type,
			{$wpdb->posts}.post_mime_type,
			{$wpdb->posts}.comment_count";
	}

	/**
	 * Cache lightweight row objects so admin-list callbacks do not fetch content.
	 *
	 * Core and plugin columns can call get_post( $id ) while rendering each row.
	 * Without a cache entry, WordPress reloads the full storymap row, including
	 * the heavy post_content this screen deliberately avoids.
	 *
	 * @param \WP_Post[] $posts List query results.
	 * @param \WP_Query  $query Query instance.
	 * @return \WP_Post[]
	 */
	public function prime_lightweight_admin_list_cache( $posts, $query ) {
		if ( ! $query->get( 'jeo_lightweight_storymap_admin_list' ) ) {
			return $posts;
		}

		foreach ( $posts as $post ) {
			if ( ! $post instanceof \WP_Post || $this->post_type !== $post->post_type ) {
				continue;
			}
			if ( wp_cache_add( $post->ID, $post, 'posts' ) ) {
				$this->lightweight_admin_list_cache_ids[] = (int) $post->ID;
			}
		}

		return $posts;
	}

	/**
	 * Clear request-local lightweight post cache entries.
	 *
	 * @return void
	 */
	public function clear_lightweight_admin_list_cache() {
		foreach ( array_unique( $this->lightweight_admin_list_cache_ids ) as $post_id ) {
			wp_cache_delete( $post_id, 'posts' );
		}

		$this->lightweight_admin_list_cache_ids = array();
	}

	/**
	 * Determine whether the query belongs to the storymap admin list screen.
	 *
	 * @param \WP_Query $query Query instance.
	 * @return bool
	 */
	private function is_admin_list_query( $query ) {
		if ( ! is_admin() ) {
			return false;
		}
		if ( 'edit.php' !== ( $GLOBALS['pagenow'] ?? '' ) ) {
			return false;
		}
		if ( ! $query->is_main_query() ) {
			return false;
		}

		return $this->post_type === $query->get( 'post_type' );
	}

	/**
	 * Remove columns that force full storymap content parsing in the admin list.
	 *
	 * Yoast SEO columns recalculate meta context in the posts table and parse
	 * full block content, which defeats the lightweight list query.
	 *
	 * @param array $columns Admin list columns.
	 * @return array
	 */
	public function remove_expensive_admin_list_columns( $columns ) {
		foreach ( array_keys( $columns ) as $column_name ) {
			if ( strpos( $column_name, 'wpseo-' ) === 0 ) {
				unset( $columns[ $column_name ] );
			}
		}

		return $columns;
	}

	/**
	 * Avoid loading every storymap into the Quick Edit parent dropdown.
	 *
	 * Storymaps do not use parent/child relationships in JEO, and loading all
	 * storymap content for this hidden dropdown can exhaust memory.
	 *
	 * @param array $dropdown_args Arguments passed to wp_dropdown_pages().
	 * @return array
	 */
	public function disable_admin_parent_dropdown( $dropdown_args ) {
		if ( ! is_admin() ) {
			return $dropdown_args;
		}
		if ( ( $dropdown_args['post_type'] ?? '' ) !== $this->post_type ) {
			return $dropdown_args;
		}

		$dropdown_args['post_type'] = '__jeo_no_storymap_parent_options';

		return $dropdown_args;
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
