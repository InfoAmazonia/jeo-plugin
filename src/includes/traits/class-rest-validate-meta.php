<?php

namespace Jeo;

/**
 * This trait adds allows classes to add a validation method for any metadata registered using register_post_meta()
 *
 * When there is an attempt to save a post and a metadata is submitted, this trait will check if there is a method called `validate_meta_{meta_slug}` in the class and call it.
 *
 * This method must return a \WP_Error object in case the value does not validate. Example:
 *
 * public function validate_meta_zoom($value) {
 *	 $val = intval($value);
 *	 if ( $val < 1 || $val > 14 ) {
 *		 return new \WP_Error( 'rest_invalid_field', __( 'Map zoom must be between 1 and 14', 'jeo' ), array( 'status' => 400 ) );
 *	 }
 *	 
 * Please note:
 * * This method is called before any sanitize_callback registered in the `register_post_meta` function 
 * * WordPress already validates the metadata value based on the `type` informed in `register_post_meta`. No need to validate it again.
 * 
 */
trait Rest_Validate_Meta {

	public function register_rest_meta_validation() {
		if (!$this->post_type) return;
		add_filter('rest_pre_insert_' . $this->post_type, [$this, 'rest_insert_validate'], 10, 2);
	}
	
	public function rest_insert_validate($prepared_post, $request) {
		$registered_meta = get_registered_meta_keys('post', $this->post_type);
		if ( is_array($registered_meta) && isset($request['meta']) && is_array($request['meta']) ) {
			foreach ( $registered_meta as $meta_key => $meta_def ) {
				if ( isset( $request['meta'][$meta_key] ) ) {
					if ( method_exists($this, 'validate_meta_' . $meta_key) ) {
						$valid = call_user_func([$this, 'validate_meta_' . $meta_key], $request['meta'][$meta_key]);
						if ( \is_wp_error($valid) ) {
							return $valid;
						}
					}
				}
			}
		}

		return $prepared_post;
		
	}
	
	

}
