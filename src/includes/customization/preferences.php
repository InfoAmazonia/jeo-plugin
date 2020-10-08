<?php
/**
 * Custom typography styles for child theme.
 */
// require get_stylesheet_directory() . '/apply-user-preferences.php';
function jeo_custom_settings_css() {
	$theme_css = '';
	if (!empty(sanitize_text_field(\jeo_settings()->get_option( 'jeo_typography-name' ) ))) {
		$jeo_font = wp_kses(\jeo_settings()->get_option( 'jeo_typography-name'), null );

		$theme_css .= '
		.jeomap .legend-container a.more-info-button  {
			font-family: "' . $jeo_font . '", "sans-serif";
		}
		:root {
			--jeo-font: "' . $jeo_font . '", "sans-serif";
		}
		';
	}

	if (!empty(sanitize_text_field(\jeo_settings()->get_option( 'jeo_typography-name' ) ))) {
		$jeo_font = wp_kses(\jeo_settings()->get_option( 'jeo_typography-name'), null );

		$theme_css .= '
		.jeomap .legend-container a.more-info-button  {
			font-family: "' . $jeo_font . '", "sans-serif";
		}
		';
	}

	if (!empty(\jeo_settings()->get_option( 'jeo_more-font-size', ''))) {
		$jeo_info_font_size = \jeo_settings()->get_option('jeo_more-font-size', '');
		$font_unit = 'rem';

		$theme_css .= '
		.jeomap div.legend-container a.more-info-button {
			font-size: ' . $jeo_info_font_size . $font_unit . ';
		}';
	}

	$css_variables = "";
	if (!empty(\jeo_settings()->get_option( 'jeo_more-bkg-color', ''))) {
		$colorMoreBkg =\jeo_settings()->get_option( 'jeo_more-bkg-color');
		
		$color_css = '--jeo_more-bkg-color: '. $colorMoreBkg . ';';
		$color_css_hover = '--jeo_more-bkg-color-darker-15: ' . color_luminance($colorMoreBkg, -0.15) . ';';
		$css_variables .= $color_css . ' ' . $color_css_hover;
	}

	if (!empty(\jeo_settings()->get_option( 'jeo_more-color', ''))) {
		$color =\jeo_settings()->get_option( 'jeo_more-color');
		$color_css = '--jeo_more-color: '. $color . ';';
		$css_variables .= $color_css;
	}


	if (!empty(\jeo_settings()->get_option( 'jeo_close-bkg-color', ''))) {
		$color =\jeo_settings()->get_option('jeo_close-bkg-color');
		$color_css = '--jeo_close-bkg-color: '. $color . ';';
		$css_variables .= $color_css;
	}

	if (!empty(\jeo_settings()->get_option( 'jeo_close-color', ''))) {
		$color =\jeo_settings()->get_option('jeo_close-color');
		$color_css = '--jeo_close-color: '. $color . ';';
		$css_variables .= $color_css;
	}

	$theme_css .= '
		:root {'.
			$css_variables; '
		}
	';

	return $theme_css;
}
function jeo_custom_settings_css_wrap() {
	/*if (is_admin() || (!\jeo_settings()->get_option( 'jeo_typography') ) {
		return;
	}*/
?>
	<style type="text/css" id="custom-jeo-css">
		<?php echo jeo_custom_settings_css(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
		?>
	</style>
<?php
}
add_action('wp_head', 'jeo_custom_settings_css_wrap');

function jeo_scripts_typography() {
	if ( \jeo_settings()->get_option( 'jeo_typography' ) ) {
		wp_enqueue_style( 'jeo-font', \jeo_settings()->get_option( 'jeo_typography' ) , array(), null );
    }
}
add_action( 'wp_enqueue_scripts', 'jeo_scripts_typography' );


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
