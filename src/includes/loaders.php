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

	$folders = ['.', 'traits', 'maps', 'layers', 'modules', 'admin', 'geocode', 'settings', 'layer-types', 'cli', 'legend-types'];

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


function jeo_get_template( $template_name ) {

	if ( file_exists( get_stylesheet_directory() . '/jeo/templates/' . $template_name ) ) {
		return get_stylesheet_directory() . '/jeo/templates/' . $template_name;
	}

	if ( file_exists( JEO_BASEPATH . '/templates/' . $template_name ) ) {
		return JEO_BASEPATH . '/templates/' . $template_name;
	}

	return false;

}
