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
	$css_variables = "";
	if (!empty(\jeo_settings()->get_option( 'jeo_more-bkg-color', ''))) {
		$color =\jeo_settings()->get_option( 'jeo_more-bkg-color');
		$color_css = '--jeo_more-bkg-color '. $color . ';';
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
		//wp_enqueue_style( 'jeo-font', \jeo_settings()->get_option( 'jeo_typography' ) , array(), null );
    }
    wp_enqueue_style( 'jeo-font-test', "https://fonts.googleapis.com/css2?family=Open+Sans+Condensed:wght@300&display=swap" , array(), null );
}
add_action( 'wp_enqueue_scripts', 'jeo_scripts_typography' );