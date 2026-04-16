<?php
/**
 * Plugin settings bootstrap and accessors.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Manage plugin settings and geocoder options.
 */
class Settings {

	use Singleton;

	/**
	 * Settings option key.
	 *
	 * @var string
	 */
	public $option_key = 'jeo-settings';

	/**
	 * Default settings values.
	 *
	 * @var array
	 */
	private $default_options = array();

	/**
	 * Register settings hooks and defaults.
	 *
	 * @return void
	 */
	protected function init() {

		$this->default_options = array(
			'map_runtime'                     => 'maplibregl',
			'enabled_post_types'              => array(
				'post',
				'storymap',
			),
			'active_geocoder'                 => 'nominatim',
			'map_default_zoom'                => 11,
			'map_default_lat'                 => -23.54998517,
			'map_default_lng'                 => -46.65599340,
			'mapbox_key'                      => '',
			'jeo_footer-logo'                 => '',
			'show_storymaps_on_post_archives' => 0,
		);

		add_action( 'admin_menu', array( $this, 'add_menu_item' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Return a single plugin option value merged with defaults.
	 *
	 * @param string $option_name Option slug.
	 * @return mixed
	 */
	public function get_option( $option_name ) {
		$options = get_option( $this->option_key );
		if ( ! $options ) {
			$options = array();
		}
		if ( isset( $options['enabled_post_types'] ) && ! empty( $options['enabled_post_types'] ) ) {
			if ( ! is_array( $options['enabled_post_types'] ) ) {
				$options['enabled_post_types'] = explode( ',', trim( esc_textarea( $options['enabled_post_types'] ) ) );
			}
		}
		$options = array_merge( $this->default_options, $options );
		if ( isset( $options[ $option_name ] ) ) {
			return $options[ $option_name ];
		}
		return null;
	}

	/**
	 * Build a namespaced option field name.
	 *
	 * @param string $name Field slug.
	 * @return string
	 */
	public function get_field_name( $name ) {
		return $this->option_key . '[' . $name . ']';
	}

	/**
	 * Build a geocoder option field name.
	 *
	 * @param string $geocoder Geocoder slug.
	 * @param string $name Field slug.
	 * @return string
	 */
	public function get_geocoder_option_field_name( $geocoder, $name ) {
		return $this->get_field_name( 'geocoders' ) . '[' . $geocoder . '][' . $name . ']';
	}

	/**
	 * Return all options for a geocoder, merged with defaults.
	 *
	 * @param string $geocoder_slug Geocoder slug.
	 * @return array
	 */
	public function get_geocoder_options( $geocoder_slug ) {
		$options  = $this->get_option( 'geocoders' );
		$geocoder = \jeo_geocode_handler()->initialize_geocoder( $geocoder_slug );
		$defaults = $geocoder->get_default_options();
		$current  = isset( $options[ $geocoder_slug ] ) ? $options[ $geocoder_slug ] : array();
		return array_merge( $defaults, $current );
	}

	/**
	 * Return a single geocoder option.
	 *
	 * @param string $geocoder_slug Geocoder slug.
	 * @param string $option_name Option slug.
	 * @return mixed
	 */
	public function get_geocoder_option( $geocoder_slug, $option_name ) {
		$options = $this->get_geocoder_options( $geocoder_slug );
		return isset( $options[ $option_name ] ) ? $options[ $option_name ] : '';
	}

	/**
	 * Register the settings option group.
	 *
	 * @return void
	 */
	public function admin_init() {
		register_setting(
			'jeo-settings',
			$this->option_key,
			array(
				'sanitize_callback' => array( $this, 'sanitize_settings' ),
			)
		);
	}

	/**
	 * Sanitize plugin settings before persisting them.
	 *
	 * @param array $input Submitted settings payload.
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$previous = get_option( $this->option_key );
		if ( ! is_array( $previous ) ) {
			$previous = array();
		}

		$input = is_array( $input ) ? $input : array();

		$normalized = array_merge( $previous, $input );

		$map_runtime = isset( $input['map_runtime'] ) ? sanitize_key( $input['map_runtime'] ) : $this->get_option( 'map_runtime' );
		if ( ! in_array( $map_runtime, array( 'maplibregl', 'mapboxgl' ), true ) ) {
			$map_runtime = 'maplibregl';
		}
		$normalized['map_runtime'] = $map_runtime;

		if ( isset( $input['mapbox_key'] ) ) {
			$normalized['mapbox_key'] = sanitize_text_field( $input['mapbox_key'] );
		} else {
			$normalized['mapbox_key'] = sanitize_text_field( $previous['mapbox_key'] ?? '' );
		}

		if ( 'mapboxgl' === $normalized['map_runtime'] && empty( $normalized['mapbox_key'] ) ) {
			add_settings_error(
				$this->option_key,
				'jeo_mapbox_key_required',
				__( 'Mapbox requires a valid API key. The rendering library setting was not changed.', 'jeo' ),
				'error'
			);

			$normalized['map_runtime'] = sanitize_key( $previous['map_runtime'] ?? 'maplibregl' );
			$normalized['mapbox_key']  = sanitize_text_field( $previous['mapbox_key'] ?? '' );
		}

		if ( isset( $normalized['enabled_post_types'] ) && ! is_array( $normalized['enabled_post_types'] ) ) {
			$normalized['enabled_post_types'] = explode( ',', trim( sanitize_textarea_field( $normalized['enabled_post_types'] ) ) );
		}

		$enabled_post_types = $normalized['enabled_post_types'] ?? array();

		$normalized['enabled_post_types'] = array_values(
			array_filter(
				array_map(
					'sanitize_key',
					is_array( $enabled_post_types ) ? $enabled_post_types : array()
				)
			)
		);
		if ( empty( $normalized['enabled_post_types'] ) ) {
			$normalized['enabled_post_types'] = $this->default_options['enabled_post_types'];
		}

		$normalized['map_default_zoom']                = $this->sanitize_int_setting(
			$input['map_default_zoom'] ?? $previous['map_default_zoom'] ?? $this->default_options['map_default_zoom'],
			(int) $this->default_options['map_default_zoom']
		);
		$normalized['map_default_lat']                 = $this->sanitize_float_setting(
			$input['map_default_lat'] ?? $previous['map_default_lat'] ?? $this->default_options['map_default_lat'],
			(float) $this->default_options['map_default_lat']
		);
		$normalized['map_default_lng']                 = $this->sanitize_float_setting(
			$input['map_default_lng'] ?? $previous['map_default_lng'] ?? $this->default_options['map_default_lng'],
			(float) $this->default_options['map_default_lng']
		);
		$normalized['show_storymaps_on_post_archives'] = empty( $input['show_storymaps_on_post_archives'] ) ? 0 : 1;
		$normalized['active_geocoder']                 = sanitize_key( (string) ( $input['active_geocoder'] ?? $previous['active_geocoder'] ?? $this->default_options['active_geocoder'] ) );
		$normalized['jeo_typography']                  = $this->sanitize_asset_url_setting( 'jeo_typography', $input['jeo_typography'] ?? $previous['jeo_typography'] ?? '' );
		$normalized['jeo_typography-stories']          = $this->sanitize_asset_url_setting( 'jeo_typography-stories', $input['jeo_typography-stories'] ?? $previous['jeo_typography-stories'] ?? '' );
		$normalized['jeo_footer-logo']                 = $this->sanitize_asset_url_setting( 'jeo_footer-logo', $input['jeo_footer-logo'] ?? $previous['jeo_footer-logo'] ?? '' );
		$normalized['jeo_typography-name']             = \jeo_sanitize_font_family( $input['jeo_typography-name'] ?? $previous['jeo_typography-name'] ?? '' );
		$normalized['jeo_typography-name-stories']     = \jeo_sanitize_font_family( $input['jeo_typography-name-stories'] ?? $previous['jeo_typography-name-stories'] ?? '' );
		$normalized['jeo_more-font-size']              = $this->sanitize_float_setting( $input['jeo_more-font-size'] ?? $previous['jeo_more-font-size'] ?? '', 1.0, true );
		$normalized['jeo_primary-color']               = $this->sanitize_hex_color_setting( $input['jeo_primary-color'] ?? $previous['jeo_primary-color'] ?? '#0073aa', '#0073aa' );
		$normalized['jeo_text-over-primary-color']     = $this->sanitize_hex_color_setting( $input['jeo_text-over-primary-color'] ?? $previous['jeo_text-over-primary-color'] ?? '#000000', '#000000' );
		$normalized['jeo_more-bkg-color']              = $this->sanitize_hex_color_setting( $input['jeo_more-bkg-color'] ?? $previous['jeo_more-bkg-color'] ?? '#ffffff', '#ffffff' );
		$normalized['jeo_more-color']                  = $this->sanitize_hex_color_setting( $input['jeo_more-color'] ?? $previous['jeo_more-color'] ?? '#555D66', '#555D66' );
		$normalized['jeo_close-bkg-color']             = $this->sanitize_hex_color_setting( $input['jeo_close-bkg-color'] ?? $previous['jeo_close-bkg-color'] ?? '#ffffff', '#ffffff' );
		$normalized['jeo_close-color']                 = $this->sanitize_hex_color_setting( $input['jeo_close-color'] ?? $previous['jeo_close-color'] ?? '#555D66', '#555D66' );

		if ( isset( $normalized['geocoders'] ) && is_array( $normalized['geocoders'] ) ) {
			$normalized['geocoders'] = $this->sanitize_geocoder_settings_payload( $normalized['geocoders'] );
		}

		return $normalized;
	}

	/**
	 * Sanitize a recursive geocoder settings payload.
	 *
	 * @param array $payload Raw payload.
	 * @return array
	 */
	private function sanitize_geocoder_settings_payload( array $payload ) {
		$sanitized = array();

		foreach ( $payload as $key => $value ) {
			$key = sanitize_key( (string) $key );

			if ( is_array( $value ) ) {
				$sanitized[ $key ] = $this->sanitize_geocoder_settings_payload( $value );
				continue;
			}

			$sanitized[ $key ] = sanitize_text_field( (string) $value );
		}

		return $sanitized;
	}

	/**
	 * Sanitize an integer setting.
	 *
	 * @param mixed $value Raw value.
	 * @param int   $fallback Fallback value.
	 * @return int
	 */
	private function sanitize_int_setting( $value, $fallback = 0 ) {
		return is_numeric( $value ) ? absint( $value ) : $fallback;
	}

	/**
	 * Sanitize a float setting.
	 *
	 * @param mixed     $value Raw value.
	 * @param float|int $fallback Fallback value.
	 * @param bool      $allow_empty Whether to allow an empty string.
	 * @return float|string
	 */
	private function sanitize_float_setting( $value, $fallback = 0.0, $allow_empty = false ) {
		if ( '' === $value || null === $value ) {
			return $allow_empty ? '' : $fallback;
		}

		return is_numeric( $value ) ? (float) $value : $fallback;
	}

	/**
	 * Sanitize a hex color setting.
	 *
	 * @param mixed  $value Raw value.
	 * @param string $fallback Fallback color.
	 * @return string
	 */
	private function sanitize_hex_color_setting( $value, $fallback ) {
		$color = sanitize_hex_color( (string) $value );

		return $color ? $color : $fallback;
	}

	/**
	 * Sanitize an optional asset URL setting.
	 *
	 * @param string $field Field slug.
	 * @param mixed  $value Raw URL value.
	 * @return string
	 */
	private function sanitize_asset_url_setting( $field, $value ) {
		$value      = trim( (string) $value );
		$normalized = \jeo_normalize_asset_url( $value );

		if ( '' !== $value && '' === $normalized ) {
			add_settings_error(
				$this->option_key,
				'jeo_invalid_' . sanitize_key( $field ),
				__( 'JEO could not save this asset URL. Use a valid http(s) or root-relative URL.', 'jeo' ),
				'warning'
			);
		}

		return $normalized;
	}

	/**
	 * Enqueue admin assets for the settings screen.
	 *
	 * @param string $page Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_scripts( $page ) {
		if ( 'jeo_page_jeo-settings' === $page ) {
			wp_enqueue_media();
			wp_enqueue_script( 'jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', array( 'jquery', 'wp-i18n' ), JEO_VERSION, true );
			wp_set_script_translations( 'jeo-settings', 'jeo', JEO_BASEPATH . 'languages' );
		}
	}

	/**
	 * Register the plugin settings menu entry.
	 *
	 * @return void
	 */
	public function add_menu_item() {
		add_submenu_page(
			'jeo-main-menu',
			__( 'Settings', 'jeo' ),
			__( 'Settings', 'jeo' ),
			'manage_options',
			'jeo-settings',
			array( $this, 'admin_page' ),
		);
	}

	/**
	 * Render the settings page.
	 *
	 * @return void
	 */
	public function admin_page() {
		include 'settings-page.php';
	}
}
