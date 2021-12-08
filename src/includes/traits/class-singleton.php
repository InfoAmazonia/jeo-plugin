<?php

namespace Jeo;

trait Singleton {

	protected static $instance;

	/**
	 * Define the core functionality of the plugin.
	 *
	 * Set the plugin name and the plugin version that can be used throughout the plugin.
	 * Load the dependencies, define the locale, and set the hooks for the admin area and
	 * the public-facing side of the site.
	 *
	 * @since    1.0.0
	 */
	private function __construct() {
		$this->init();
	}

	private function __clone() {

	}

	private function __wakeup() {

	}

	public function should_load_assets() {
		// This is a workarround! The right way is to refractor all enqueues to have their individuals enqueues for admin and a custom condicioned one to front-end
		if(is_admin( )) {
			return true;
		}

		$mapblocks = [
			'jeo/map',
			'jeo/onetime-map',
			'jeo/storymap'
		];

		$use_any_block = false;
		$post_id = get_the_ID();

		foreach($mapblocks as $block) {
			// echo $block;
			if(has_block( $block, $post_id )) {
				$use_any_block = true;
				break;
			}
		}

		$should_load_assets = $use_any_block;

		if(in_array(get_post_type(), array_merge(\jeo_settings()->get_option( 'enabled_post_types' ), [ 'map' ]))) {
			$should_load_assets = true;
		}

		if(get_page_template_slug() === 'discovery.php') {
			$should_load_assets = true;
		}

		return apply_filters( 'jeo_should_load_assets' , $should_load_assets );
	}
	/** 
	* Check if 'edit' or 'new-post' screen of a 
 	* given post type is opened
	* 
 	* @param null $post_type name of post type to compare
 	*
 	* @return bool true or false
 	*/
	public function is_edit_screen_from_post_type( $post_type = null ) {
    	global $pagenow;

    	/**
     	* return false if not on admin page or
     	* post type to compare is null
     	*/
    	if ( ! is_admin() || $post_type === null ) {
    		return false;
    	}

    	/**
     	* if edit screen of a post type is active
     	*/
    	if ( $pagenow === 'post.php' ) {
        	// get post id, in case of view all cpt post id will be -1
        	$post_id = isset( $_GET[ 'post' ] ) ? $_GET[ 'post' ] : - 1;

        	// if no post id then return false
        	if ( $post_id === - 1 ) {
            	return false;
        	}

        	// get post type from post id
        	$get_post_type = get_post_type( $post_id );

        	// if post type is compared return true else false
        	if ( $post_type === $get_post_type ) {
            	return true;
        	} else {
            	return false;
        	}
    	} elseif ( $pagenow === 'post-new.php' ) { // is new-post screen of a post type is active
        	// get post type from $_GET array
        	$get_post_type = isset( $_GET[ 'post_type' ] ) ? $_GET[ 'post_type' ] : '';
        	// if post type matches return true else false.
        	if ( $post_type === $get_post_type ) {
            	return true;
        	} else {
            	return false;
        	}
    	} else {
        	// return false if on any other page.
        	return false;
    	}
	}


	final public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	protected abstract function init();

}
