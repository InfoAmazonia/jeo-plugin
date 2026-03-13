<?php

if ( ! function_exists( 'jeo' ) ) {
	fwrite( STDERR, "Missing jeo() bootstrap function.\n" );
	exit( 1 );
}

$plugin = jeo();
if ( ! $plugin instanceof Jeo ) {
	fwrite( STDERR, "jeo() did not return the expected Jeo instance.\n" );
	exit( 1 );
}

$required_post_types = array(
	'map',
	'map-layer',
	'storymap',
);

foreach ( $required_post_types as $post_type ) {
	if ( ! post_type_exists( $post_type ) ) {
		fwrite( STDERR, sprintf( "Missing registered post type: %s\n", $post_type ) );
		exit( 1 );
	}
}

$active_plugins = (array) get_option( 'active_plugins', array() );
if ( ! in_array( 'jeo/jeo.php', $active_plugins, true ) ) {
	fwrite( STDERR, "Plugin jeo/jeo.php is not active.\n" );
	exit( 1 );
}

fwrite( STDOUT, "WordPress smoke checks passed.\n" );
