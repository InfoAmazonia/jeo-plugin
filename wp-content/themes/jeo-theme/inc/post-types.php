<?php
// Register Custom Post Type
function project_type() {

	$labels = array(
		'name'                  => _x( 'Projects', 'Post Type General Name', 'jeo' ),
		'singular_name'         => _x( 'Project', 'Post Type Singular Name', 'jeo' ),
		'menu_name'             => __( 'Projects', 'jeo' ),
		'name_admin_bar'        => __( 'Projects', 'jeo' ),
		'archives'              => __( 'Item Archives', 'jeo' ),
		'attributes'            => __( 'Item Attributes', 'jeo' ),
		'parent_item_colon'     => __( 'Parent Item:', 'jeo' ),
		'all_items'             => __( 'All Items', 'jeo' ),
		'add_new_item'          => __( 'Add New Item', 'jeo' ),
		'add_new'               => __( 'Add New', 'jeo' ),
		'new_item'              => __( 'New Item', 'jeo' ),
		'edit_item'             => __( 'Edit Item', 'jeo' ),
		'update_item'           => __( 'Update Item', 'jeo' ),
		'view_item'             => __( 'View Item', 'jeo' ),
		'view_items'            => __( 'View Items', 'jeo' ),
		'search_items'          => __( 'Search Item', 'jeo' ),
		'not_found'             => __( 'Not found', 'jeo' ),
		'not_found_in_trash'    => __( 'Not found in Trash', 'jeo' ),
		'featured_image'        => __( 'Featured Image', 'jeo' ),
		'set_featured_image'    => __( 'Set featured image', 'jeo' ),
		'remove_featured_image' => __( 'Remove featured image', 'jeo' ),
		'use_featured_image'    => __( 'Use as featured image', 'jeo' ),
		'insert_into_item'      => __( 'Insert into item', 'jeo' ),
		'uploaded_to_this_item' => __( 'Uploaded to this item', 'jeo' ),
		'items_list'            => __( 'Items list', 'jeo' ),
		'items_list_navigation' => __( 'Items list navigation', 'jeo' ),
		'filter_items_list'     => __( 'Filter items list', 'jeo' ),
	);
	$args = array(
		'label'                 => __( 'Project', 'jeo' ),
		'labels'                => $labels,
		'supports'              => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'page-attributes' ),
		'taxonomies'            => array( 'category', 'post_tag' ),
		'hierarchical'          => false,
		'public'                => true,
		'show_ui'               => true,
		'show_in_menu'          => true,
		'menu_position'         => 5,
		'show_in_admin_bar'     => true,
		'show_in_nav_menus'     => true,
		'can_export'            => true,
		'has_archive'           => 'projects',
		'exclude_from_search'   => false,
		'publicly_queryable'    => true,
		'capability_type'       => 'page',
		'show_in_rest'          => true,
	);
	register_post_type( 'project', $args );

}
add_action( 'init', 'project_type', 0 );