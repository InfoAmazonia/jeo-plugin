<?php
/**
 * Image box
 */
function custom_image_block() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/imageBlock.asset.php');

	wp_register_script(
		'custom-image-block-editor',
		get_stylesheet_directory_uri() . '/dist/imageBlock.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-image-block-editor',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/imageBlock/imageBlock.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/imageBlock/imageBlock.css'),
	);

	// wp_register_style(
	// 	'custom-image-block-block',
	// 	get_stylesheet_directory_uri() . '/assets/javascript/blocks/imageBlock/style.css',
	// 	array(),
	// 	filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/imageBlock/style.css'),
	// 	'all',
	// );

	register_block_type('jeo-theme/custom-image-block-editor', array(
		'editor_script' => 'custom-image-block-editor',
		'editor_style'  => 'custom-image-block-editor',
		// 'style'         => 'custom-image-block-block',
	));
}

add_action('init', 'custom_image_block');


function custom_pullquote_scripts() {
	wp_enqueue_script(
		'be-editor',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/pullquoteBlock/index.js',
		array('wp-blocks', 'wp-dom'),
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/pullquoteBlock/index.js'),
		true
	);

	wp_enqueue_style(
		'custom-pullquote-block',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/pullquoteBlock/style.css',
		array(),
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/pullquoteBlock/style.css'),
		'all',
	);
}
add_action('enqueue_block_editor_assets', 'custom_pullquote_scripts');


function custom_group_block_scripts() {
	wp_enqueue_script(
		'be-editor-group',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/groupBlock/index.js',
		array('wp-blocks', 'wp-dom'),
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/groupBlock/index.js'),
		true
	);

	wp_enqueue_style(
		'custom-group-block',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/groupBlock/style.css',
		array(),
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/groupBlock/style.css'),
		'all',
	);
}
add_action('enqueue_block_editor_assets', 'custom_group_block_scripts');

/**
 * Newsletter
 */
function custom_newsletter_block() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/newsletter.asset.php');

	wp_register_script(
		'custom-newsletter-block',
		get_stylesheet_directory_uri() . '/dist/newsletter.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-newsletter-block',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/newsletter/newsletter.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/newsletter/newsletter.css'),
		'all'
	);

	register_block_type('jeo-theme/custom-newsletter-block', array(
		'editor_script' => 'custom-newsletter-block',
		'editor_style'  => 'custom-newsletter-block',
		//'style'         => 'custom-newsletter-block',
	));
}

add_action('init', 'custom_newsletter_block');

/**
 * Link Dropdown
 */
function custom_link_dropdown() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/linkDropdown.asset.php');

	wp_register_script(
		'custom-link-dropdown',
		get_stylesheet_directory_uri() . '/dist/linkDropdown.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-link-dropdown',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/linkDropdown/linkDropdown.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/linkDropdown/linkDropdown.css'),
		'all'
	);

	register_block_type('jeo-theme/custom-link-dropdown', array(
		'editor_script' => 'custom-link-dropdown',
		'editor_style'  => 'custom-link-dropdown',
		'style'         => 'custom-link-dropdown',
	));
}

add_action('init', 'custom_link_dropdown');

function custom_team_block() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/teamBlock.asset.php');

	wp_register_script(
		'custom-team-block',
		get_stylesheet_directory_uri() . '/dist/teamBlock.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-team-block',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/teamBlock/teamBlock.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/teamBlock/teamBlock.css'),
		'all'
	);

	register_block_type('jeo-theme/custom-team-block', array(
		'editor_script' => 'custom-team-block',
		'editor_style'  => 'custom-team-block',
		'style'         => 'custom-team-block',
	));
}

add_action('init', 'custom_team_block');


/**
 * Video gallery
 */
function custom_video_gallery() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/videoGallery.asset.php');

	wp_register_script(
		'custom-video-gallery',
		get_stylesheet_directory_uri() . '/dist/videoGallery.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-video-gallery',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/videoGallery/style.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/videoGallery/style.css'),
		'all'
	);

	register_block_type('jeo-theme/custom-video-gallery', array(
		'editor_script' => 'custom-video-gallery',
		'editor_style'  => 'custom-video-gallery',
		//'style'         => 'custom-newsletter-block',
	));
}

add_action('init', 'custom_video_gallery');


/**
 * Team member
 */
function team_member_block() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/teamMember.asset.php');

	wp_register_script(
		'team-member',
		get_stylesheet_directory_uri() . '/dist/teamMember.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'team-member',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/teamMember/style.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/teamMember/style.css'),
		'all'
	);

	register_block_type('jeo-theme/team-member', array(
		'editor_script' => 'team-member',
		'editor_style'  => 'team-member',
		//'style'         => 'custom-newsletter-block',
	));
}

add_action('init', 'team_member_block');


/**
 * Embed template
 */
function custom_embed_template() {
	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/embedTemplate.asset.php');

	wp_register_script(
		'custom-embed-template',
		get_stylesheet_directory_uri() . '/dist/embedTemplate.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-embed-template',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/embedTemplate/style.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/embedTemplate/style.css'),
		'all'
	);

	register_block_type('jeo-theme/embed-template', array(
		'editor_script' => 'custom-embed-template',
		'editor_style'  => 'custom-embed-template',
		//'style'         => 'custom-newsletter-block',
	));
}

add_action('init', 'custom_embed_template');


/**
 * Content box
 */
function content_box_template() {
	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/contentBox.asset.php');

	wp_register_script(
		'content-box',
		get_stylesheet_directory_uri() . '/dist/contentBox.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'content-box',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/contentBox/style.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/contentBox/style.css'),
		'all'
	);

	register_block_type('jeo-theme/content-box', array(
		'render_callback' => 'content_box_render_callback',
		'editor_script' => 'content-box',
		'editor_style'  => 'content-box',
	));
}

function content_box_render_callback($block_attributes, $content) {
	$final_result = '<div class="content-box">';
	$final_result .= '	<h2 class="content-box--title">'. get_theme_mod('content_box_title') .'</h2>';
	$final_result .= '	'. $content;
	$final_result .= '</div>';

	return $final_result;
}

add_action('init', 'content_box_template');

/**
 * Image Gallery
 */
function custom_image_gallery_block() {

	// automatically load dependencies and version
	$asset_file = include(get_stylesheet_directory() . '/dist/imageGallery.asset.php');

	wp_register_script(
		'custom-image-gallery-block',
		get_stylesheet_directory_uri() . '/dist/imageGallery.js',
		$asset_file['dependencies'],
		$asset_file['version']
		//filemtime(get_stylesheet_directory() . '/dist/imageBlock.js')
	);

	wp_register_style(
		'custom-image-gallery-block',
		get_stylesheet_directory_uri() . '/assets/javascript/blocks/imageGallery/dashboard.css',
		[],
		filemtime(get_stylesheet_directory() . '/assets/javascript/blocks/imageGallery/dashboard.css'),
		'all'
	);


	register_block_type('jeo-theme/custom-image-gallery-block', array(
		'editor_script' => 'custom-image-gallery-block',
		'editor_style'  => 'custom-image-gallery-block',
	));
}

add_action('init', 'custom_image_gallery_block');

/**
 * Toolbar tooltip
 */

add_action('enqueue_block_editor_assets', 'toolbar_tooltip');

function toolbar_tooltip() {
	wp_enqueue_script(
		'toolbar-tooltip',
		get_stylesheet_directory_uri() . '/dist/tooltip.js',
		array( 'wp-compose', 'wp-data', 'wp-blocks', 'wp-element', 'wp-components', 'wp-editor' ),
		'',
		true
	);

	wp_enqueue_style(
		'text-highlight-button-editor-css',
		get_stylesheet_directory_uri() . '/assets/javascript/toolbar/tooltip/dashboard.css',
		array( 'wp-edit-blocks' )
	);
}