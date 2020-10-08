<?php
/**
 * Generate the CSS for custom settings.
 */
function jeo_custom_settings_css() {

	$theme_css = '';
	

	if (!empty(sanitize_text_field($this->get_option( 'jeo_typography' ) ))) {
		$jeo_font = wp_kses($this->get_option( 'jeo_typography'), null );

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
	if (!empty($this->get_option( 'jeo_more-bkg-color', ''))) {
		$color = $this->get_option( 'jeo_more-bkg-color');
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
?>