<?php
/**
 * Minimal WordPress smoke assertions for the plugin bootstrap.
 *
 * @package Jeo
 */

// phpcs:disable WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- This CLI smoke script reports failures directly to STDERR and STDOUT.

if ( ! function_exists( 'jeo' ) ) {
	fwrite( STDERR, "Missing jeo() bootstrap function.\n" );
	exit( 1 );
}

$plugin_instance = jeo();
if ( ! $plugin_instance instanceof Jeo ) {
	fwrite( STDERR, "jeo() did not return the expected Jeo instance.\n" );
	exit( 1 );
}

$required_post_types = array(
	'map',
	'map-layer',
	'storymap',
);

foreach ( $required_post_types as $required_post_type ) {
	if ( ! post_type_exists( $required_post_type ) ) {
		fwrite( STDERR, sprintf( "Missing registered post type: %s\n", $required_post_type ) );
		exit( 1 );
	}
}

$active_plugins = (array) get_option( 'active_plugins', array() );
if ( ! in_array( 'jeo/jeo.php', $active_plugins, true ) ) {
	fwrite( STDERR, "Plugin jeo/jeo.php is not active.\n" );
	exit( 1 );
}

$settings = jeo_settings();
if ( 'maplibregl' !== $settings->get_option( 'map_runtime' ) ) {
	fwrite( STDERR, "Default map runtime is not maplibregl.\n" );
	exit( 1 );
}

update_option(
	'jeo-settings',
	array_merge(
		(array) get_option( 'jeo-settings', array() ),
		array(
			'map_runtime' => 'maplibregl',
			'mapbox_key'  => '',
		)
	)
);

$invalid_runtime = $settings->sanitize_settings(
	array(
		'map_runtime' => 'mapboxgl',
		'mapbox_key'  => '',
	)
);
if ( 'maplibregl' !== $invalid_runtime['map_runtime'] ) {
	fwrite( STDERR, "Mapbox runtime without API key was not rejected.\n" );
	exit( 1 );
}

$valid_runtime = $settings->sanitize_settings(
	array(
		'map_runtime' => 'mapboxgl',
		'mapbox_key'  => 'pk.test-token',
	)
);
if ( 'mapboxgl' !== $valid_runtime['map_runtime'] || 'pk.test-token' !== $valid_runtime['mapbox_key'] ) {
	fwrite( STDERR, "Valid Mapbox runtime settings were not accepted.\n" );
	exit( 1 );
}

fwrite( STDOUT, "WordPress smoke checks passed.\n" );

// phpcs:enable
