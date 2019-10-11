<?php

spl_autoload_register('jeo_autoload');

function jeo_autoload($class_name) {

	$class_path = explode('\\', $class_name);
	$class_name = end($class_path);

	$filename = 'class-'. strtolower(str_replace('_', '-' , $class_name)) . '.php';

	$folders = ['.', 'traits', 'maps', 'layers', 'modules', 'admin'];

	foreach ($folders as $folder) {
		$check = __DIR__ . DIRECTORY_SEPARATOR . $folder . DIRECTORY_SEPARATOR . $filename;
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
	return \Jeo\Maps::get_instance();
}
