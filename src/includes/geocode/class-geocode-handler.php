<?php
/**
 * Geocoding registration and metadata indexing.
 *
 * @package Jeo
 */

namespace Jeo;

/**
 * Register geocoders, AJAX endpoints and geocode metadata.
 */
class Geocode_Handler {

	use Singleton;

	/**
	 * Geocode metadata keys indexed per post.
	 *
	 * @var array
	 */
	public $geo_attributes = array(
		'_geocode_lat',
		'_geocode_lon',
		'_geocode_city_level_1',
		'_geocode_city',
		'_geocode_region_level_3',
		'_geocode_region_level_2',
		'_geocode_region_level_1',
		'_geocode_country_code',
		'_geocode_country',
	);

	/**
	 * Register geocoding hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'wp_ajax_jeo_geocode', array( $this, 'ajax_geocode' ) );
		add_action( 'wp_ajax_jeo_reverse_geocode', array( $this, 'ajax_reverse_geocode' ) );
		add_action( 'init', array( $this, 'register_metadata' ), 99 );

		$this->add_index_metadata_hooks();
	}

	/**
	 * Registered geocoders keyed by slug.
	 *
	 * @var array
	 */
	private $registered_geocoders = array();

	/**
	 * Handle forward geocoding requests for authenticated editors.
	 *
	 * @return void
	 */
	public function ajax_geocode() {
		check_ajax_referer( 'jeo_geocode', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array(), 403 );
		}

		$search   = filter_input( INPUT_GET, 'search', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$geocoder = $this->get_active_geocoder();

		if ( ! $geocoder || empty( $search ) ) {
			wp_send_json( array() );
		}

		wp_send_json( $geocoder->geocode( sanitize_text_field( $search ) ) );
	}

	/**
	 * Handle reverse-geocoding requests for authenticated editors.
	 *
	 * @return void
	 */
	public function ajax_reverse_geocode() {
		check_ajax_referer( 'jeo_geocode', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array(), 403 );
		}

		$lat      = filter_input( INPUT_GET, 'lat', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$lon      = filter_input( INPUT_GET, 'lon', FILTER_SANITIZE_FULL_SPECIAL_CHARS );
		$geocoder = $this->get_active_geocoder();

		if ( ! $geocoder || null === $lat || null === $lon ) {
			wp_send_json( array() );
		}

		wp_send_json(
			$geocoder->reverse_geocode(
				sanitize_text_field( $lat ),
				sanitize_text_field( $lon )
			)
		);
	}

	/**
	 * Registers all core geocoders and fires the hook for
	 * external geocoders to be registered.
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

		/**
		 * Hook used to register geocoders.
		 *
		 * Example:
		 * add_action('jeo_register_geocoders', function($geocoders) {
		 *      $geocoders->register_geocoder([
		 *          'slug' => 'my-geocoder',
		 *          'name' => 'My Geocoder',
		 *          'description' => __('My Geocoder description', 'my-textdomain'),
		 *          'class_name' => 'MyGeocoderClass'
		 *      ]);
		 * });
		 *
		 * @param Jeo\Geocode_Handler $geocoders The Geocode_Handler instance.
		 */
		do_action( 'jeo_register_geocoders', $this );
	}

	/**
	 * Return the currently configured geocoder instance.
	 *
	 * @return Geocoder|false
	 */
	public function get_active_geocoder() {
		$this->register_geocoders();
		$active_geocoder = jeo_settings()->get_option( 'active_geocoder' );
		return $this->initialize_geocoder( $active_geocoder );
	}

	/**
	 * Register geocoding-related post meta.
	 *
	 * @return void
	 */
	public function register_metadata() {

		$post_types = \jeo_settings()->get_option( 'enabled_post_types' );

		if ( ! $post_types || ! is_array( $post_types ) || empty( $post_types ) ) {
			$post_types = array( 'post' );
		}
		foreach ( $post_types as $type ) {
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
									'_geocode_lon'     => array(
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
								),
								'additionalProperties' => false,
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
					'post',
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
					'post',
					'_geocode_lon_' . $relevance,
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
					'post',
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
					'post',
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
					'post',
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
					'post',
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
					'post',
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
					'post',
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
					'post',
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
	 * Register a geocoder definition.
	 *
	 * @param array $geocoder {
	 *     Required. Array of arguments describing the geocoder.
	 *
	 *     @type string $name        The name of the geocoder. e.g. 'Example geocoder'.
	 *     @type string $slug        A unique slug for the geocoder. e.g. 'example-geocoder'.
	 *     @type string $description The geocoder description.
	 *     @type string $class_name  The geocoder class. e.g. '\Jeo\Geocoders\Test_Geocoder'.
	 */
	public function register_geocoder( array $geocoder ) {

		if ( ! isset( $geocoder['slug'] ) || ! isset( $geocoder['class_name'] ) || ! isset( $geocoder['name'] ) ) {
			return false;
		}

		$this->registered_geocoders[ $geocoder['slug'] ] = $geocoder;

		return true;
	}

	/**
	 * Remove a registered geocoder.
	 *
	 * @param string $geocoder_slug Geocoder slug.
	 * @return void
	 */
	public function unregister_geocoder( $geocoder_slug ) {
		unset( $this->registered_geocoders[ $geocoder_slug ] );
	}

	/**
	 * Return the registered geocoder definitions.
	 *
	 * @return array
	 */
	public function get_registered_geocoders() {
		if ( empty( $this->registered_geocoders ) ) {
			$this->register_geocoders();
		}
		return $this->registered_geocoders;
	}

	/**
	 * Return a single geocoder definition.
	 *
	 * @param string $geocoder_slug Geocoder slug.
	 * @return array|null
	 */
	public function get_geocoder( $geocoder_slug ) {
		$geocoders = $this->get_registered_geocoders();
		if ( isset( $geocoders[ $geocoder_slug ] ) ) {
			return $geocoders[ $geocoder_slug ];
		}
		return null;
	}

	/**
	 * Return the geocoder definition that matches an instantiated object.
	 *
	 * @param \Jeo\Geocoder $geocoder_object Geocoder instance.
	 * @return array|null
	 */
	public function get_geocoder_by_object( \Jeo\Geocoder $geocoder_object ) {
		$class_name = get_class( $geocoder_object );
		// Add the leading namespace separator expected by registered class names.
		$class_name = '\\' . $class_name;
		$geocoders  = $this->get_registered_geocoders();
		foreach ( $geocoders as $geocoder ) {
			if ( $geocoder['class_name'] === $class_name ) {
				return $geocoder;
			}
		}
		return null;
	}

	/**
	 * Instantiate a geocoder by slug.
	 *
	 * @param string $geocoder_slug Geocoder slug.
	 * @return Geocoder|false
	 */
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
	 * Ensure coordinates are stored as strings with dots as decimal separators.
	 *
	 * We do not store them as floats because updates had precision and serialization issues.
	 * When the WordPress REST API updates values, it deletes older occurrences and passes the
	 * value through wp_slash, converting floats to strings.
	 *
	 * @param object|array $value Point payload.
	 * @return object|array
	 */
	public function sanitize_points( $value ) {

		if ( isset( $value['_geocode_lat'] ) ) {
			$value['_geocode_lat'] = str_replace( ',', '.', $value['_geocode_lat'] );
		}

		if ( isset( $value['_geocode_lon'] ) ) {
			$value['_geocode_lon'] = str_replace( ',', '.', $value['_geocode_lon'] );
		}

		if ( isset( $value->_geocode_lat ) ) {
			$value->_geocode_lat = str_replace( ',', '.', $value->_geocode_lat );
		}

		if ( isset( $value->_geocode_lon ) ) {
			$value->_geocode_lon = str_replace( ',', '.', $value->_geocode_lon );
		}

		return $value;
	}

	/**
	 * Register hooks that maintain the geocode index metadata.
	 *
	 * @return void
	 */
	private function add_index_metadata_hooks() {

		add_filter( 'update_post_metadata', array( $this, 'disable_update_post_meta' ), 10, 3 );
		add_filter( 'add_post_metadata', array( $this, 'disable_update_post_meta' ), 10, 3 );

		add_action( 'updated_postmeta', array( $this, 'update_meta_indexes' ), 10, 3 );
		add_action( 'added_post_meta', array( $this, 'update_meta_indexes' ), 10, 3 );
	}

	/**
	 * Remove hooks that maintain the geocode index metadata.
	 *
	 * @return void
	 */
	private function remove_index_metadata_hooks() {

		remove_filter( 'update_post_metadata', array( $this, 'disable_update_post_meta' ) );
		remove_filter( 'add_post_metadata', array( $this, 'disable_update_post_meta' ) );

		remove_action( 'updated_postmeta', array( $this, 'update_meta_indexes' ) );
		remove_action( 'added_post_meta', array( $this, 'update_meta_indexes' ) );
	}

	/**
	 * Block direct writes to derived geocode index metadata.
	 *
	 * Metadata used as indexes is generated automatically when related points are updated.
	 *
	 * @param mixed  $check Existing short-circuit value.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key Meta key being written.
	 * @return mixed
	 */
	public function disable_update_post_meta( $check, $object_id, $meta_key ) {

		// The name of the meta without the last _s or _p suffix.
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
	 *
	 * @param int    $meta_id Meta row ID.
	 * @param int    $object_id Post ID.
	 * @param string $meta_key Meta key being updated.
	 * @return void
	 */
	public function update_meta_indexes( $meta_id, $object_id, $meta_key ) {

		if ( '_related_point' === $meta_key ) {

			$this->remove_index_metadata_hooks();

			// Get all values.
			$all_points = get_post_meta( $object_id, '_related_point', false );

			foreach ( $this->geo_attributes as $attr ) {

				delete_post_meta( $object_id, $attr . '_p' );
				delete_post_meta( $object_id, $attr . '_s' );

				foreach ( $all_points as $point ) {

					$suffix = 'primary' === $point['relevance'] ? '_p' : '_s';

					if ( isset( $point[ $attr ] ) ) {
						add_post_meta( $object_id, $attr . $suffix, $point[ $attr ] );
					}
				}
			}

			$this->add_index_metadata_hooks();
		}
	}
}
