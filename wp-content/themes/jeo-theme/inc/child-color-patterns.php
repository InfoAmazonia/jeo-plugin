<?php

/**
 * Newspack Scott: Color Patterns
 *
 * @package Newspack Scott
 */
/**
 * Add child theme-specific custom colours.
 */
function newspack_scott_custom_colors_css() {
	$primary_color   = newspack_get_primary_color();
	$secondary_color = newspack_get_secondary_color();

	if ('default' !== get_theme_mod('theme_colors', 'default')) {
		$primary_color   = get_theme_mod('primary_color_hex', $primary_color);
		$secondary_color = get_theme_mod('secondary_color_hex', $secondary_color);

		if ('default' !== get_theme_mod('header_color', 'default')) {
			$header_color          = get_theme_mod('header_color_hex', '#666666');
			$header_color_contrast = newspack_get_color_contrast($header_color);
		} else {
			$header_color          = $primary_color;
			$header_color_contrast = newspack_get_color_contrast($primary_color);
		}
	}

	$theme_css = "";

	// Set colour contrasts.
	$primary_color_contrast   = newspack_get_color_contrast($primary_color);
	$secondary_color_contrast = newspack_get_color_contrast($secondary_color);
	$search_icon_bg_option = get_theme_mod('search_background_option', 'default');
	if($search_icon_bg_option !== 'default') {
		$theme_css .= '
			:root {
				--search-icon-bg-color:' . get_theme_mod('search_icon_bg_color', '#fff'). ';
			}
		';
	}

	$theme_css .= '
		:root {
			--primary: ' . esc_html($primary_color) . ';
			--primary-lighter-65: ' . color_luminance($primary_color, 0.65) . ';
			--primary-lighter-75: ' . color_luminance($primary_color, 0.75) . ';
			--primary-lighter-85: ' . color_luminance($primary_color, 0.85) . ';
			--primary-darker-15: ' . color_luminance($primary_color, -0.15) . ';
			--primary-opacity-1: ' . $primary_color . '1a;
			--primary-opacity-15: ' . $primary_color . '26;
			--secondary: ' . esc_html($secondary_color) . ';
		}
		.accent-header:not(.widget-title):before,
		.article-section-title:before,
		.cat-links:before,
		.page-title:before,
		.site-breadcrumb .wrapper > span::before {
			background-color: ' . esc_html($primary_color) . ';
		}

		.wp-block-pullquote blockquote p:first-of-type:before,
		.wp-block-cover .wp-block-pullquote cite::before {
			color: ' . esc_html($primary_color) . ';
		}

		@media only screen and (max-width: 782px) {
			.bottom-header-contain.post-header {
				background-color:' . get_theme_mod('header_background_color_hex', '#fff	') . ';
				background-image: url(' . wp_get_attachment_url(get_theme_mod('header_background_image')) . ');
			}
		}

		@media only screen and (min-width: 782px) {
			/* Header default background */
			.h-db .featured-image-beside .cat-links:before {
				background-color: ' . esc_html($primary_color_contrast) . ';
			}
		}
	';

	$theme_css .= '.middle-header-contain {
		background-color:' . get_theme_mod('header_background_color_hex', '#fff	') . ';
		background-image: url(' . wp_get_attachment_url(get_theme_mod('header_background_image')) . ');
	}
	';

	if(!get_theme_mod( 'header_image_bg_dark_mode', true )) {
		$theme_css .= '.dark-theme .middle-header-contain {
				background-color:' . get_theme_mod('header_background_color_hex', '#fff	') . ';
				background-image: none;
			}

		@media only screen and (max-width: 782px) {
			.dark-theme .bottom-header-contain.post-header {
				background-color: #191E23 ;
				background-image: none !important;
			}

			.dark-theme header.site-header .bottom-header-contain.post-header {
				background-color: #191E23;
				background-image: none !important;
			}
		}
		';
	}

	if (true === get_theme_mod('header_solid_background', false)) {
		$theme_css .= '
			/* Header solid background */
			.h-sb .middle-header-contain {
				background-color: ' . esc_html($header_color) . ';
			}
			.h-sb .top-header-contain {
				background-color: ' . esc_html(newspack_adjust_brightness($header_color, -10)) . ';
				border-bottom-color: ' . esc_html(newspack_adjust_brightness($header_color, -15)) . ';
			}

			/* Header solid background */
			.h-sb .site-header,
			.h-sb .site-title,
			.h-sb .site-title a:link,
			.h-sb .site-title a:visited,
			.h-sb .site-description,
			/* Header solid background; short height */
			.h-sb.h-sh .nav1 .main-menu > li,
			.h-sb.h-sh .nav1 ul.main-menu > li > a,
			.h-sb.h-sh .nav1 ul.main-menu > li > a:hover,
			.h-sb .top-header-contain,
			.h-sb .middle-header-contain {
				color: ' . esc_html($header_color_contrast) . ';
			}
		';
	}

	$editor_css = '
		.block-editor-block-list__layout .block-editor-block-list__block .accent-header:not(.widget-title):before,
		.block-editor-block-list__layout .block-editor-block-list__block .article-section-title:before {
			background-color: ' . esc_html($primary_color) . ';
		}
		.editor-styles-wrapper .wp-block[data-type="core/pullquote"] .wp-block-pullquote:not(.is-style-solid-color) blockquote > .editor-rich-text__editable:first-child:before {
			color: ' . esc_html($primary_color) . ';
		}

		:root {
			--primary: ' . esc_html($primary_color) . ';
			--primary-lighter-75: ' . color_luminance($primary_color, 0.75) . ';
			--primary-darker-15: ' . color_luminance($primary_color, -0.15) . ';
			--secondary: ' . esc_html($secondary_color) . ';			
		}
	';

	if (function_exists('register_block_type') && is_admin()) {
		$theme_css = $editor_css;
	}

	return $theme_css;
}


function color_luminance($hexcolor, $percent) {
	if (strlen($hexcolor) < 6) {
		$hexcolor = $hexcolor[0] . $hexcolor[0] . $hexcolor[1] . $hexcolor[1] . $hexcolor[2] . $hexcolor[2];
	}
	$hexcolor = array_map('hexdec', str_split(str_pad(str_replace('#', '', $hexcolor), 6, '0'), 2));

	foreach ($hexcolor as $i => $color) {
		$from = $percent < 0 ? 0 : $color;
		$to = $percent < 0 ? $color : 255;
		$pvalue = ceil(($to - $from) * $percent);
		$hexcolor[$i] = str_pad(dechex($color + $pvalue), 2, '0', STR_PAD_LEFT);
	}

	return '#' . implode($hexcolor);
}
