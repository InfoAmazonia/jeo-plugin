<?php

if ( ! function_exists( 'post_meta_request_params' ) ) {

	function post_meta_request_params( $args, $request ) {
		if ( $request[ 'meta_query' ] ) {
			$args[ 'meta_query' ] = $request[ 'meta_query' ];
		}

		return $args;
	}

	add_filter( 'rest_post_query', 'post_meta_request_params', 10, 2 );
};
