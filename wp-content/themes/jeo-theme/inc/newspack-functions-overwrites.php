<?php
/**
 * Custom typography styles for child theme.
 */

require get_stylesheet_directory() . '/inc/child-typography.php';

/**
 * Customizer functions.
 */
require get_stylesheet_directory() . '/inc/child-customizer.php';

/**
 * Newspack Scott functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Newspack Scott
 */

if (!function_exists('newspack_scott_setup')) :
	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * Note that this function is hooked into the after_setup_theme hook, which
	 * runs before the init hook. The init hook is too late for some features, such
	 * as indicating support for post thumbnails.
	 */
	function newspack_scott_setup() {
		// Remove the default editor styles
		remove_editor_styles();
		// Add child theme editor styles, compiled from `style-child-theme-editor.scss`.
		add_editor_style('styles/style-editor.css');
	}
endif;
add_action('after_setup_theme', 'newspack_scott_setup', 12);

/**
 * Function to load style pack's Google Fonts.
 */
function newspack_scott_fonts_url() {
	$fonts_url = '';

	/**
	 * Translators: If there are characters in your language that are not
	 * supported by Roboto , translate this to 'off'. Do not translate
	 * into your own language.
	 */
	$roboto = esc_html_x('on', 'Roboto font: on or off', 'newspack-scott');
	if ('off' !== $roboto) {
		$font_families   = array();
		$font_families[] = 'Roboto:400,400i,600,600i';

		$query_args = array(
			'family'  => urlencode(implode('|', $font_families)),
			'subset'  => urlencode('latin,latin-ext'),
			'display' => urlencode('swap'),
		);

		$fonts_url = add_query_arg($query_args, 'https://fonts.googleapis.com/css');
	}
	return esc_url_raw($fonts_url);
}

/**
 * Display custom color CSS in customizer and on frontend.
 */
function newspack_scott_custom_colors_css_wrap() {
	// Only bother if we haven't customized the color.
	if ((!is_customize_preview() && 'default' === get_theme_mod('theme_colors', 'default')) || is_admin()) {
		return;
	}
	require_once get_stylesheet_directory() . '/inc/child-color-patterns.php';
?>

	<style type="text/css" id="custom-theme-colors-scott">
		<?php echo newspack_scott_custom_colors_css(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
		?>
	</style>
<?php
}
add_action('wp_head', 'newspack_scott_custom_colors_css_wrap');

/**
 * Display custom font CSS in customizer and on frontend.
 */
function newspack_scott_typography_css_wrap() {
	if (is_admin() || (!get_theme_mod('font_body', '') && !get_theme_mod('font_header', '') && !get_theme_mod('accent_allcaps', true))) {
		return;
	}
?>

	<style type="text/css" id="custom-theme-fonts-scott">
		<?php echo newspack_scott_custom_typography_css(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
		?>
	</style>

<?php
}
add_action('wp_head', 'newspack_scott_typography_css_wrap');


/**
 * Enqueue scripts and styles.
 */
function newspack_scott_scripts() {
	// Enqueue Google fonts.
	wp_deregister_script('jquery');
	wp_enqueue_script('jquery', 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js', [], '2.1.4', true);

	wp_enqueue_style('newspack-scott-fonts', newspack_scott_fonts_url(), [], null);
	
	if(is_search()) {
		wp_enqueue_script('momenta', 'https://cdn.jsdelivr.net/momentjs/latest/moment.min.js', ['jquery'], null, true);
		wp_enqueue_style('daterangepicker', 'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.css', [], '0.1.0', 'all');
		wp_enqueue_script('daterangepicker', 'https://cdn.jsdelivr.net/npm/daterangepicker/daterangepicker.min.js', ['jquery', 'momenta'], '0.1.0', true);
	}

	wp_enqueue_style('app', get_stylesheet_directory_uri() . '/dist/app.css', ['newspack-style'], filemtime(get_stylesheet_directory() . '/dist/app.css'), 'all');
	wp_enqueue_script('app', get_stylesheet_directory_uri() . '/dist/app.js', ['jquery'], null, true);
}

function non_blocking_styles() {
	wp_enqueue_style('fontawesome', "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0-2/css/all.min.css", array(), '5.12.0', 'all');
}

function category_deletion_script() {
	wp_enqueue_script('category-deletion-warning', get_stylesheet_directory_uri() . '/assets/javascript/functionalities/category-deletion-warning.js', ['jquery'], true);
}

function featured_image_position_cleaner_script() {
	wp_enqueue_script('featured-image-position', get_stylesheet_directory_uri() . '/assets/javascript/functionalities/featured-image-cleaner.js', '', true);
}

function bullets_metaboxes_script() {
	wp_enqueue_script('bullets-metaboxes', get_stylesheet_directory_uri() . '/assets/javascript/functionalities/bullets-metaboxes.js', ['jquery'], true);
}

add_action('get_footer', 'non_blocking_styles');
add_action('wp_enqueue_scripts', 'newspack_scott_scripts');
add_action('admin_enqueue_scripts', 'category_deletion_script');
add_action('admin_enqueue_scripts', 'featured_image_position_cleaner_script');
add_action('admin_enqueue_scripts', 'bullets_metaboxes_script');





/**
 * Enqueue supplemental block editor styles.
 */
function newspack_scott_editor_customizer_styles() {
	// Enqueue Google fonts.
	wp_enqueue_style('newspack-scott-fonts', newspack_scott_fonts_url(), array(), null);

	// Check for color or font customizations.
	$theme_customizations = '';
	require_once get_stylesheet_directory() . '/inc/child-color-patterns.php';

	if ('custom' === get_theme_mod('theme_colors')) {
		// Include color patterns.
		$theme_customizations .= newspack_scott_custom_colors_css();
	}

	if (get_theme_mod('font_body', '') || get_theme_mod('font_header', '') || get_theme_mod('accent_allcaps', true)) {
		$theme_customizations .= newspack_scott_custom_typography_css();
	}

	// If there are any, add those styles inline.
	if ($theme_customizations) {
		// Enqueue a non-existant file to hook our inline styles to:
		wp_register_style('newspack-scott-editor-inline-styles', false);
		wp_enqueue_style('newspack-scott-editor-inline-styles');
		// Add inline styles:
		wp_add_inline_style('newspack-scott-editor-inline-styles', $theme_customizations);
	}
}
add_action('enqueue_block_editor_assets', 'newspack_scott_editor_customizer_styles');

/**
 * Enqueue scripts and styles.
 */
function newspack_scripts_third_typography() {
	if ( get_theme_mod( 'accent_font_import_code_alternate', '' ) ) {
		wp_enqueue_style( 'newspack-font-accent-import', newspack_custom_typography_link( 'accent_font_import_code_alternate' ), array(), null );
	}

}
add_action( 'wp_enqueue_scripts', 'newspack_scripts_third_typography' );

/**
 * Decides which logo to use, based on Customizer settings and current post.
 */
function newspack_the_sticky_logo() {
	// By default, don't use the alternative logo.
	$use_sticky_logo = false;
	// Check if an sticky logo has been set:
	$has_sticky_logo = ( '' !== get_theme_mod( 'logo_sticky_image', '' ) && 0 !== get_theme_mod( 'logo_sticky_image', '' ) );

	if ( $has_sticky_logo ) : ?>
		<a class="custom-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php
			// echo wp_get_attachment_image(
			// 	get_theme_mod( 'logo_sticky_image', '' ),
			// 	'logo-sticky-image',
			// 	'',
			// 	array( 'class' => 'custom-logo' )
			// );

			$classes = 'custom-logo light-logo ' . (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');
			echo wp_get_attachment_image(
				get_theme_mod( 'logo_sticky_image', '' ),
				'logo-sticky-image',
				'',
				array( 'class' =>  $classes)
			);
			?>

			<?php
				if(!empty(get_theme_mod( 'logo_dark_image', '' ))) {
					echo wp_get_attachment_image(
						get_theme_mod( 'logo_dark_image', '' ),
						'full',
						'',
						array( 'class' => 'custom-logo dark-logo' )
					);
				}
			?>
		</a>
	<?php
	// Otherwise, return the regular logo:
	elseif ( !$has_sticky_logo && has_custom_logo() ):
		?>
		
		<a class="custom-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php

			$classes = 'custom-logo light-logo ' . (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');
			echo wp_get_attachment_image(
				get_theme_mod( 'custom_logo', '' ),
				'logo-sticky-image',
				'',
				array( 'class' =>  $classes)
			);
			?>

			<?php
				if(!empty(get_theme_mod( 'logo_dark_image', '' ))) {
					echo wp_get_attachment_image(
						get_theme_mod( 'logo_dark_image', '' ),
						'logo-sticky-image',
						'',
						array( 'class' => 'custom-logo dark-logo' )
					);
				}
			?>
		</a> <?php
	endif;
}


/**
 * Decides which logo to use, based on Customizer settings and current post.
 */
function newspack_the_mobile_logo() {
	if ( has_custom_logo() ) :?>
		<a class="custom-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php

			$classes = 'custom-logo light-logo ' . (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');
			echo wp_get_attachment_image(
				get_theme_mod( 'custom_logo', '' ),
				'logo-sticky-image',
				'',
				array( 'class' =>  $classes)
			);
			?>

			<?php
				if(!empty(get_theme_mod( 'logo_dark_image', '' ))) {
					echo wp_get_attachment_image(
						get_theme_mod( 'logo_dark_image', '' ),
						'logo-sticky-image',
						'',
						array( 'class' => 'custom-logo dark-logo' )
					);
				}
			?>
		</a>
	<?php endif; 
}

function newspack_author_social_links( $author_id, $size = 24 ) {
	// Get list of available social profiles.
	$social_profiles = array(
		'facebook',
		'twitter',
		'instagram',
		'linkedin',
		'myspace',
		'pinterest',
		'soundcloud',
		'tumblr',
		'youtube',
		'wikipedia',
	);

	// Create empty string for links.
	$links = '';

	// Create array of allowed HTML, including SVG markup.
	$allowed_html = array(
		'a'  => array(
			'href'   => array(),
			'title'  => array(),
			'target' => array(),
		),
		'li' => array(),
	);
	$allowed_html = array_merge( $allowed_html, newspack_sanitize_svgs() );

	foreach ( $social_profiles as $profile ) {
		if ( '' !== get_the_author_meta( $profile, $author_id ) ) {
			if ( 'twitter' === $profile ) {
				$links .= '<li><a href="https://twitter.com/' . esc_attr( get_the_author_meta( $profile, $author_id ) ) . '" target="_blank">' . newspack_get_social_icon_svg( $profile, $size, $profile ) . '</a></li>';
			} else {
				$links .= '<li><a href="' . esc_url( get_the_author_meta( $profile, $author_id ) ) . '" target="_blank">' . newspack_get_social_icon_svg( $profile, $size, $profile ) . '</a></li>';
			}
		}
	}

	if ( '' !== $links && true === get_theme_mod( 'show_author_social', false ) ) {
		echo '<div><ul class="author-social-links">' . wp_kses( $links, $allowed_html ) . '</ul></div>';
	}
}

/**
 * Decides which logo to use, based on Customizer settings and current post.
 */
function child_newspack_the_custom_logo() {
	// By default, don't use the alternative logo.
	$use_alternative_logo = false;
	// Check if the site is set to use the simplified header:
	$simplified_header_subpages = get_theme_mod( 'header_sub_simplified', false );
	// Check if an alternative logo has been set:
	$has_alternative_logo = ( '' !== get_theme_mod( 'newspack_alternative_logo', '' ) && 0 !== get_theme_mod( 'newspack_alternative_logo', '' ) );
	$classes = (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');

	// Check if we're currently on a page where the alternative logo should be used in the short header, if set:
	if ( $simplified_header_subpages && $has_alternative_logo && in_array( newspack_featured_image_position(), array( 'behind', 'beside' ) ) ) :
		$use_alternative_logo = true;
	endif;

	if ( $use_alternative_logo ) : ?>
		<a class="custom-logo-link alternative-logo" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
			<?php
			echo wp_get_attachment_image(
				get_theme_mod( 'newspack_alternative_logo', '' ),
				'newspack-alternative-logo',
				'',
				array( 'class' => $classes )
			);
			?>
		</a>
	<?php
	endif;

	// Otherwise, return the regular logo:
	if ( has_custom_logo() ) { ?>
		<div class="<?= $classes ?>">
			<?php the_custom_logo(); ?>
		</div> <?php

	}
}
