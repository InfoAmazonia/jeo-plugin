<?php

namespace Jeo;

class Geocode_Handler {

	use Singleton;

	public $geo_attributes = array(
		'_geocode_lat',
		'_geocode_lng',
		'_geocode_city_level_1',
		'_geocode_city',
		'_geocode_region_level_3',
		'_geocode_region_level_2',
		'_geocode_region_level_1',
		'_geocode_country_code',
		'_geocode_country',
	);

	protected function init() {
		add_action( 'wp_ajax_jeo_geocode', array( $this, 'ajax_geocode' ) );
		add_action( 'wp_ajax_jeo_reverse_geocode', array( $this, 'ajax_reverse_geocode' ) );
		add_action( 'init', array( $this, 'register_metadata' ), 99 );

		$this->add_index_metadata_hooks();
	}

	private $registered_geocoders = array();

	public function ajax_geocode() {

		$geocoder = $this->get_active_geocoder();

		if ( $geocoder ) {
			echo wp_json_encode( $geocoder->geocode( sanitize_text_field( $_GET['search'] ) ) );
		} else {
			echo wp_json_encode( array() );
		}

		die;
	}

	public function ajax_reverse_geocode() {
		$geocoder = $this->get_active_geocoder();
		if ( $geocoder ) {
			echo wp_json_encode( $geocoder->reverse_geocode( sanitize_text_field( $_GET['lat'] ), sanitize_text_field( $_GET['lng'] ) ) );
		}
		die;
	}

	/**
	 * Registers all core geocoders and fires the hook for
	 * extenals geocoders to be registered
	 *
	 * @return void
	 */
	private function register_geocoders() {

		$this->register_geocoder(
			array(
				'slug'        => 'nominatim',
				'name'        => 'Nominatim',
				'description' => __( 'Service provided by Open Street Maps at https://nominatim.openstreetmap.org/', 'jeo' ),
				'class_name'  => '\Jeo\Geocoders\Nominatim',
			)
		);
		// Register Mapbox geocoder
		$this->register_geocoder(
			array(
				'slug'        => 'mapbox',
				'name'        => 'Mapbox',
				'description' => __( 'Service provided by Mapbox (requires API Key).', 'jeo' ),
				'class_name'  => '\Jeo\Geocoders\Mapbox',
			)
		);

		/**
		 * Hook used to register geocoders
		 *
		 * example:
		 * add_action('jeo_register_geocoders', function($geocoders) {
		 *      $geocoders->register_geocoder([
		 *          'slug' => 'my-geocoder',
		 *          'name' => 'My Geocoder',
		 *          'description' => __('My Geocoder description', 'my-textdomain'),
		 *          'class_name' => 'MyGeocoderClass'
		 *      ]);
		 * });
		 *
		 * @param Jeo\Geocode_Handler The Geocode_Handler instance
		 */
		do_action( 'jeo_register_geocoders', $this );
	}

	public function get_active_geocoder() {
		$this->register_geocoders();
		$active_geocoder = jeo_settings()->get_option( 'active_geocoder' );
		return $this->initialize_geocoder( $active_geocoder );
	}

	public function register_metadata() {

		$post_types = \jeo_settings()->get_option( 'enabled_post_types' );

		if ( ! $post_types || ! is_array( $post_types ) || empty( $post_types ) ) {
			$post_types = array( 'post' );
		}
		foreach ( $post_types as $type ) {

				// Garante que o Post Type tenha suporte a custom-fields, essencial para a REST API expor a chave 'meta'.
				add_post_type_support( $type, 'custom-fields' );

				register_post_meta(
					$type,
					'_related_point',
					array(
						'show_in_rest'      => array(
							'schema' => array(
								'properties'           => array(
									'_geocode_lat'     => array(
										'type' => 'number',
									),
									'_geocode_lng'     => array(
										'type' => 'number',
									),
									'_geocode_city_level_1' => array(
										'type' => 'string',
									),
									'_geocode_city'    => array(
										'type' => 'string',
									),
									'_geocode_region_level_3' => array(
										'type' => 'string',
									),
									'_geocode_region_level_2' => array(
										'type' => 'string',
									),
									'_geocode_region_level_1' => array(
										'type' => 'string',
									),
									'_geocode_country_code' => array(
										'type' => 'string',
									),
									'_geocode_country' => array(
										'type' => 'string',
									),
									'_geocode_full_address' => array(
										'type' => 'string',
									),
									'relevance'        => array(
										'type' => 'string',
										'enum' => array(
											'primary',
											'secondary',
										),
									),
									'_ai_quote'        => array(
										'type' => 'string',
									),
								),
								'additionalProperties' => true,
							),
						),
						'single'            => false,
						'sanitize_callback' => array( $this, 'sanitize_points' ),
						'auth_callback'     => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'              => 'object',
						'description'       => __( 'Multiple metadata that holds locations related to the post. Each location is an object composed of lat, lon and geocode attributes', 'jeo' ),
					)
				);

			foreach ( array( 'p', 's' )  as $relevance ) {

				register_post_meta(
					$type,
					'_geocode_lat_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'number',
						'description'   => __( 'Latitude', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_lng_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'number',
						'description'   => __( 'Longitude', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_country_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'Country', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_country_code_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'Country code', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_region_level_1_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'Region level 1', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_region_level_2_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'Region level 2', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_region_level_3_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'Region level 3', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_city_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'City', 'jeo' ),
					)
				);

				register_post_meta(
					$type,
					'_geocode_city_level_1_' . $relevance,
					array(
						'show_in_rest'  => false,
						'single'        => false,
						'auth_callback' => function () {
							return current_user_can( 'edit_posts' );
						},
						'type'          => 'string',
						'description'   => __( 'City sub-level 1', 'jeo' ),
					)
				);

			}
		}
	}

	/**
	 * Register Geocoder
	 *
	 * @param array $geocoder {
	 *     Required. Array or string of arguments describing the geocoder
	 *
	 *     @type string      $name                  The name of the geocoder. e.g. 'Example geocoder'
	 *     @type string      $slug                  A unique slug for the geocoder. e.g. 'example-geocoder'
	 *     @type string      $description           The geocoder description. e.g. 'This is an example geocoder description'
	 *     @type string      $class_name            The geocoder Class. e.g. '\Jeo\Geocoders\Test_geocoder'
	 */
	public function register_geocoder( array $geocoder ) {

		if ( ! isset( $geocoder['slug'] ) || ! isset( $geocoder['class_name'] ) || ! isset( $geocoder['name'] ) ) {
			return false;
		}

		$this->registered_geocoders[ $geocoder['slug'] ] = $geocoder;

		return true;
	}

	public function unregister_geocoder( $geocoder_slug ) {
		unset( $this->registered_geocoders[ $geocoder_slug ] );
	}

	public function get_registered_geocoders() {
		if ( empty( $this->registered_geocoders ) ) {
			$this->register_geocoders();
		}
		return $this->registered_geocoders;
	}

	public function get_geocoder( $geocoder_slug ) {
		$geocoders = $this->get_registered_geocoders();
		if ( isset( $geocoders[ $geocoder_slug ] ) ) {
			return $geocoders[ $geocoder_slug ];
		}
		return null;
	}

	public function get_geocoder_by_object( \Jeo\Geocoder $geocoder_object ) {
		$class_name = get_class( $geocoder_object );
		// add first bracket
		$class_name = '\\' . $class_name;
		$geocoders  = $this->get_registered_geocoders();
		foreach ( $geocoders as $geocoder ) {
			if ( $geocoder['class_name'] === $class_name ) {
				return $geocoder;
			}
		}
		return null;
	}

	public function initialize_geocoder( $geocoder_slug ) {
		$geocoder = $this->get_geocoder( $geocoder_slug );
		if ( is_array( $geocoder ) && isset( $geocoder['class_name'] ) ) {
			try {
				return new $geocoder['class_name']();
			} catch ( \Throwable $th ) {
				return false;
			}
		}
		return false;
	}

	/**
	 * Makes sure coordinates are stores as strings with dots as decimal separator
	 *
	 * We dont store them as float because we had problems updating them that way. When
	 * WordPress API tries to update values, it deletes older occurrences and passes the value
	 * through wp_slash and coverts float to string. (In WP_REST_Meta_Fields::update_multi_meta_value())
	 *
	 * @param object|array $value
	 * @return object|array $value
	 */
	public function sanitize_points( $value ) {

		if ( isset( $value['_geocode_lat'] ) ) {
			$value['_geocode_lat'] = str_replace( ',', '.', $value['_geocode_lat'] );
		}

		if ( isset( $value['_geocode_lng'] ) ) {
			$value['_geocode_lng'] = str_replace( ',', '.', $value['_geocode_lng'] );
		}

		if ( isset( $value->_geocode_lat ) ) {
			$value->_geocode_lat = str_replace( ',', '.', $value->_geocode_lat );
		}

		if ( isset( $value->_geocode_lng ) ) {
			$value->_geocode_lng = str_replace( ',', '.', $value->_geocode_lng );
		}

		return $value;
	}

	private function add_index_metadata_hooks() {

		add_filter( 'update_post_metadata', array( $this, 'disable_update_post_meta' ), 10, 3 );
		add_filter( 'add_post_metadata', array( $this, 'disable_update_post_meta' ), 10, 3 );

		add_action( 'updated_postmeta', array( $this, 'update_meta_indexes' ), 10, 3 );
		add_action( 'added_post_meta', array( $this, 'update_meta_indexes' ), 10, 3 );
	}

	private function remove_index_metadata_hooks() {

		remove_filter( 'update_post_metadata', array( $this, 'disable_update_post_meta' ) );
		remove_filter( 'add_post_metadata', array( $this, 'disable_update_post_meta' ) );

		remove_action( 'updated_postmeta', array( $this, 'update_meta_indexes' ) );
		remove_action( 'added_post_meta', array( $this, 'update_meta_indexes' ) );
	}

	/**
	 * metadata used as indexes are generated automatically when _primary_point and _secondary_point are updated
	 * and should not be updated directly
	 */
	public function disable_update_post_meta( $check, $object_id, $meta_key ) {

		// the name of the meta without the last _s or _p suffix
		$raw_key = substr( $meta_key, 0, strlen( $meta_key ) );
		if ( in_array( $raw_key, $this->geo_attributes, true ) ) {
			return false;
		}

		return $check;
	}

	/**
	 * When a primary or secondary point is added/updated we extract
	 * the geocoded information from the point and add it as post meta to the post.
	 *
	 * This serves as an index so we can find posts by this information.
	 */
	public function update_meta_indexes( $meta_id, $object_id, $meta_key ) {

		if ( '_related_point' === $meta_key ) {

			$this->remove_index_metadata_hooks();

			// get all values
			$all_points = get_post_meta( $object_id, '_related_point', false );

			foreach ( $this->geo_attributes as $attr ) {

				delete_post_meta( $object_id, $attr . '_p' );
				delete_post_meta( $object_id, $attr . '_s' );

				foreach ( $all_points as $point ) {

					// Fallback to secondary if relevance is missing to prevent PHP Warnings
					$point_relevance = isset( $point['relevance'] ) ? $point['relevance'] : 'secondary';
					$suffix = 'primary' === $point_relevance ? '_p' : '_s';

					if ( isset( $point[ $attr ] ) ) {
						add_post_meta( $object_id, $attr . $suffix, $point[ $attr ] );
					}
				}
			}

			$this->add_index_metadata_hooks();

		}
	}
}
