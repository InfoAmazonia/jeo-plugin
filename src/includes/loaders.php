<?php
spl_autoload_register('jeo_autoload');

function jeo_autoload($class_name) {

	$class_path = explode('\\', $class_name);

	$subfolder = '';
	if ( sizeof($class_path) > 2 ) {
		$subfolder = strtolower( $class_path[ sizeof($class_path) -2 ] ) . DIRECTORY_SEPARATOR;
	}

	$class_name = end($class_path);

	$filename = 'class-'. strtolower(str_replace('_', '-' , $class_name)) . '.php';

	$folders = ['.', 'traits', 'maps', 'layers', 'modules', 'admin', 'geocode', 'settings', 'layer-types', 'cli', 'legend-types', 'sidebars', 'menu', 'storymap', 'customization'];

	foreach ($folders as $folder) {
		$check = __DIR__ . DIRECTORY_SEPARATOR . $folder . DIRECTORY_SEPARATOR . $subfolder . $filename;
		if ( \file_exists($check) ) {
			require_once($check);
			break;
		}
	}

}

/**
 * Gets the instance of the main Jeo Class
 * @return \Jeo Jeo instance
 */
function jeo() {
	return \Jeo::get_instance();
}

/**
 * Gets the instance of the main Maps Class
 * @return \Jeo\Maps Maps instance
 */
function jeo_maps() {
	return \Jeo\Maps::get_instance();
}

/**
 * Gets the instance of the main Layers Class
 * @return \Jeo\Layers Layers instance
 */
function jeo_layers() {
	return \Jeo\Layers::get_instance();
}

/**
 * Gets the instance of the main Geocode_Handler Class
 * @return \Jeo\Geocode_Handler Geocode_Handler instance
 */
function jeo_geocode_handler() {
	return \Jeo\Geocode_Handler::get_instance();
}

/**
 * Gets the instance of the main Settings Class
 * @return \Jeo\Settings Settings instance
 */
function jeo_settings() {
	return \Jeo\Settings::get_instance();
}

/**
 * Gets the instance of the Layer Types Class
 * @return \Jeo\Layer_Types Layer Types instance
 */
function jeo_layer_types() {
	return \Jeo\Layer_Types::get_instance();
}

/**
 * Gets the instance of the Legend Types Class
 * @return \Jeo\Legend_Types Legend Types instance
 */
function jeo_legend_types() {
	return \Jeo\Legend_Types::get_instance();
}

/**
 * Gets the instance of the Sidebars Class
 * @return \Sidebars Sidebars instance
 */
function jeo_sidebars() {
	return \Jeo\Sidebars::get_instance();
}

/**
 * Gets the instance of the Menu Class
 * @return \Menu Menu instance
 */
function jeo_menu() {
	return \Jeo\Menu::get_instance();
}

/**
 * Gets the instance of the Storymap
 * @return \Storymap Storymap instance
 */
function jeo_storymap() {
	return \Jeo\Storymap::get_instance();
}

/**
 * Returns the URL to a JEO template file
 *
 * It can be overriden by a `jeo_get_template` filter, that receives two parameters:
 * * The pre-computed `$template_uri`
 * * The original `$template_name`
 *
 * @param string $template_name The name of the template (e.g. `some-template.php`)
 * @return string The URL for the template file
 */
function jeo_get_template( $template_name ) {
	$template_uri = false;

	if ( file_exists( get_stylesheet_directory() . '/jeo/templates/' . $template_name ) ) {
		$template_uri = get_stylesheet_directory() . '/jeo/templates/' . $template_name;
	}

	if ( file_exists( get_template_directory() . '/jeo/templates/' . $template_name ) ) {
		$template_uri = get_template_directory() . '/jeo/templates/' . $template_name;
	}

	if ( file_exists( JEO_BASEPATH . '/templates/' . $template_name ) ) {
		$template_uri = JEO_BASEPATH . '/templates/' . $template_name;
	}

	return apply_filters( 'jeo_get_template', $template_uri, $template_name );
}

/**
 * Register an embedder for a JEO-capable site
 *
 * @param string $id Unique ID for the source
 * @param string $base_url Site URL (e.g.` http://example.org`)
 */
function jeo_register_embedder($id, $base_url) {
	$regex = '#' . preg_quote($base_url, '/') . '\/embed\/.*#';

	$get_param = function($url, $param) {
		$matches = [];
		preg_match("/$param=(\d*)/", $url, $matches);
		return empty($matches) ? null : $matches[1];
	};

	$embedder = function($matches) use ($get_param) {
		$url = $matches[0];
		$height = $get_param($url, 'height');
		$width = $get_param($url, 'width');

		$html = "<iframe src='$url'";
		if (!empty($height)) {
			$html .= " height='$height'";
		}
		if (!empty($width)) {
			$html .= " width='$width'";
		}
		if (!empty($get_param($url, 'storymap_id'))) {
			$html .= " class='embed-storymap' seamless scrolling='yes'";
		}
		$html .= " frameborder='0' loading='lazy'></iframe>";

		return $html;
	};

	wp_embed_register_handler($id, $regex, $embedder);
}

/* New JEO Plugin Settings */
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
	if (!empty(sanitize_text_field(\jeo_settings()->get_option( 'jeo_typography-name-stories' ) ))) {
		$jeo_font_stories = wp_kses(\jeo_settings()->get_option( 'jeo_typography-name-stories'), null );

		$theme_css .= '
		:root {
			--jeo-font-stories: "' . $jeo_font_stories . '", "sans-serif";
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

	if (!empty(\jeo_settings()->get_option( 'jeo_more-font-size', '1'))) {
		$jeo_info_font_size = \jeo_settings()->get_option('jeo_more-font-size', '1');
		$font_unit = 'rem';

		$theme_css .= '
		.jeomap div.legend-container a.more-info-button {
			font-size: ' . $jeo_info_font_size . $font_unit . ';
		}';
	}

	$css_variables = "";
	if (!empty(\jeo_settings()->get_option( 'jeo_more-bkg-color', '#fff'))) {
		$colorMoreBkg =\jeo_settings()->get_option( 'jeo_more-bkg-color', '#fff');

		$color_css = '--jeo_more-bkg-color: '. $colorMoreBkg . ';';
		$color_css_hover = '--jeo_more-bkg-color-darker-15: ' . color_luminance_jeo($colorMoreBkg, -0.15) . ';';
		$css_variables .= $color_css . ' ' . $color_css_hover;
	}

	if(!empty(\jeo_settings()->get_option( 'jeo_primary-color', '#ffffff'))) {
		$primary_color =\jeo_settings()->get_option( 'jeo_primary-color', '#0073aa');
		$color_css_primary = '--jeo-primary-color: '. $primary_color . ';';
		$color_css_primary_dark = '--jeo-primary-color-darker-15: ' . color_luminance_jeo($primary_color, -0.15) . ';';
		$css_variables .= $color_css_primary . ' ' . $color_css_primary_dark;
	}

	if(!empty(\jeo_settings()->get_option( 'jeo_text-over-primary-color', '#000000'))) {
		$over_primary_color =\jeo_settings()->get_option( 'jeo_text-over-primary-color', '#000000');
		$color_css = '--jeo-text-over-primary-color: '. $over_primary_color . ';';
		$css_variables .= $color_css;
	}

	if (!empty(\jeo_settings()->get_option( 'jeo_more-color', '#555D66'))) {
		$color =\jeo_settings()->get_option( 'jeo_more-color', '#555D66');
		$color_css = '--jeo_more-color: '. $color . ';';
		$css_variables .= $color_css;
	}


	if (!empty(\jeo_settings()->get_option( 'jeo_close-bkg-color', '#fff'))) {
		$color =\jeo_settings()->get_option('jeo_close-bkg-color', '#fff');
		$color_css = '--jeo_close-bkg-color: '. $color . ';';
		$css_variables .= $color_css;
	}

	if (!empty(\jeo_settings()->get_option( 'jeo_close-color', '#555D66'))) {
		$colorCloseBkg =\jeo_settings()->get_option('jeo_close-color', '#555D66');

		$color_css = '--jeo_close-color: '. $colorCloseBkg . ';';
		$color_css_hover = '--jeo_close-bkg-color-darker-15: ' . color_luminance_jeo($colorCloseBkg, -0.15) . ';';
		$css_variables .= $color_css . ' ' . $color_css_hover;
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
	if ( \jeo_settings()->get_option( 'jeo_typography-stories' ) ) {
		wp_enqueue_style( 'jeo-font-stories', \jeo_settings()->get_option( 'jeo_typography-stories' ) , array(), null );
    }
}
add_action( 'wp_enqueue_scripts', 'jeo_scripts_typography' );
add_action( 'admin_enqueue_scripts', 'jeo_scripts_typography' );

if (!function_exists("color_luminance_jeo")){
	function color_luminance_jeo($hexcolor, $percent) {
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
}

// Load template for discovery
add_filter( 'page_template', 'template_page_discovery' );
function template_page_discovery( $page_template ){

    if ( get_page_template_slug() == 'discovery.php' ) {
        $page_template = JEO_BASEPATH . '/templates/' . 'discovery.php';
    }
    return $page_template;
}

/**
 * Add "Discovery" template to page attirbute template section.
 */
add_filter( 'theme_page_templates', 'add_template_page_discovery', 10, 4 );
function add_template_page_discovery( $post_templates, $wp_theme, $post, $post_type ) {

    // Add custom template named template-custom.php to select dropdown
    $post_templates['discovery.php'] = __('Discovery', 'jeo');

    return $post_templates;
}
