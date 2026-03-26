<?php

namespace Jeo;

class Settings {

	use Singleton;

	public $option_key = 'jeo-settings';

	private $default_options = array();

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
			'google_maps_key'                 => '',
			'jeo_footer-logo'                 => '',
			'show_storymaps_on_post_archives' => 0,
			'ai_default_provider'             => 'gemini',
			'gemini_api_key'                  => '',
			'openai_api_key'                  => '',
			'deepseek_api_key'                => '',
			'ai_use_custom_prompt'            => 0,
			'ai_system_prompt'                => '',
			'ai_debug_mode'                   => 0,
		);

		add_action( 'admin_menu', array( $this, 'add_menu_item' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

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

	public function get_field_name( $name ) {
		return $this->option_key . '[' . $name . ']';
	}

	public function get_geocoder_option_field_name( $geocoder, $name ) {
		return $this->get_field_name( 'geocoders' ) . '[' . $geocoder . '][' . $name . ']';
	}

	public function get_geocoder_options( $geocoder_slug ) {
		$options  = $this->get_option( 'geocoders' );
		$geocoder = \jeo_geocode_handler()->initialize_geocoder( $geocoder_slug );
		$defaults = $geocoder->get_default_options();
		$current  = isset( $options[ $geocoder_slug ] ) ? $options[ $geocoder_slug ] : array();
		return array_merge( $defaults, $current );
	}

	public function get_geocoder_option( $geocoder_slug, $option_name ) {
		$options = $this->get_geocoder_options( $geocoder_slug );
		return isset( $options[ $option_name ] ) ? $options[ $option_name ] : '';
	}

	public function admin_init() {
		register_setting( 'jeo-settings', $this->option_key );
	}

	public function enqueue_admin_scripts( $page ) {
		if ( 'jeo_page_jeo-settings' === $page ) {
			wp_enqueue_media();
			wp_enqueue_script( 'jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', array( 'jquery', 'wp-api-fetch' ), JEO_VERSION, true );
			wp_set_script_translations( 'jeo-settings', 'jeo', JEO_BASEPATH . 'languages' );

		}
	}

	public function add_menu_item() {
		add_submenu_page(
			'jeo-main-menu',
			__( 'Settings', 'jeo' ),
			'Settings',
			'manage_options',
			'jeo-settings',
			array( $this, 'admin_page' ),
		);

		add_submenu_page(
			'jeo-main-menu',
			__( 'AI Debug Logs', 'jeo' ),
			__( 'AI Debug Logs', 'jeo' ),
			'manage_options',
			'jeo-ai-logs',
			array( $this, 'admin_logs_page' )
		);
	}

	public function admin_page() {
		include 'settings-page.php';
	}

	public function admin_logs_page() {
		include 'ai-logs-page.php';
	}
}
