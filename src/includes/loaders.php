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

	$folders = ['.', 'traits', 'maps', 'layers', 'modules', 'admin', 'geocode', 'settings', 'layer-types', 'cli', 'legend-types', 'sidebars', 'menu'];

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
		$html .= " frameborder='0'></iframe>";

		return $html;
	};

	wp_embed_register_handler($id, $regex, $embedder);
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
