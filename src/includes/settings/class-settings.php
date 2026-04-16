<?php

namespace Jeo;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Main Settings Class
 */
class Settings {

	use Singleton;

	public $option_key = 'jeo-settings';

	public $default_options = array(
		'map_runtime'                     => 'mapboxgl',
		'enabled_post_types'              => array( 'post' ),
		'map_default_zoom'                => 1,
		'map_default_lat'                 => 0,
		'map_default_lng'                 => 0,
		'mapbox_key'                      => '',
		'active_geocoder'                 => 'nominatim',
		'show_storymaps_on_post_archives' => true,

		// AI
		'ai_default_provider'             => 'gemini',
		'ai_system_prompt'                => '',
		'ai_use_custom_prompt'            => false,
		'ai_debug_mode'                   => false,
		'ai_embedding_model'              => '',

		// Bulk AI
		'jeo_bulk_ai_active'              => false,
		'jeo_bulk_batch_size'             => 5,
		'jeo_bulk_post_types'             => array( 'post' ),
		'jeo_bulk_cron_interval'          => 'hourly',
		'jeo_bulk_logging'                => false,
		'jeo_bulk_confidence_threshold'   => 70,

		// RAG Auto-indexing
		'jeo_rag_auto_index'              => false,
		'jeo_rag_batch_size'              => 10,
		'jeo_rag_cron_interval'           => 'hourly',

		// Gemini
		'gemini_api_key'                  => '',
		'gemini_model'                    => 'gemini-2.5-flash',

		// OpenAI
		'openai_api_key'                  => '',
		'openai_model'                    => 'gpt-4o',

		// DeepSeek
		'deepseek_api_key'                => '',
		'deepseek_model'                  => 'deepseek-chat',

		// Appearance
		'jeo_font-url'                    => 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap',
		'jeo_font-family'                 => 'Open Sans',
		'jeo_font-url-secondary'          => 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap',
		'jeo_font-family-secondary'       => 'Libre Baskerville',
		'jeo_info-btn-font-size'          => '0.9',
		'jeo_primary-color'               => '#007cba',
		'jeo_secondary-color'             => '#2c3338',
		'jeo_info-btn-bg'                 => '#ffffff',
		'jeo_info-btn-color'              => '#007cba',
		'jeo_close-btn-bg'                => '#ffffff',
		'jeo_close-btn-color'             => '#000000',
		'jeo_map-widgets-bg'              => '#ffffff',
		'jeo_map-widgets-color'           => '#000000',
		'jeo_map-widgets-bg-hover'        => '#f0f0f1',
		'jeo_footer-logo'                 => '',
	);

	protected function init() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'add_menu_item' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	public function get_option( $key, $default = null ) {
		$options = get_option( $this->option_key );

		if ( isset( $options[ $key ] ) ) {
			return $options[ $key ];
		}

		if ( isset( $this->default_options[ $key ] ) ) {
			return $this->default_options[ $key ];
		}

		return $default;
	}

	public function get_field_name( $key ) {
		return $this->option_key . '[' . $key . ']';
	}

	public function admin_init() {
		register_setting( 'jeo-settings', $this->option_key, array( 'sanitize_callback' => array( $this, 'sanitize_settings' ) ) );
	}

	public function sanitize_settings( $input ) {
		// 1. Get existing options to merge
		$existing_options = get_option( $this->option_key );
		if ( ! is_array( $existing_options ) ) {
			$existing_options = $this->default_options;
		}

		// 2. Handle specific field sanitization within $input
		if ( isset( $input['enabled_post_types'] ) ) {
			if ( ! is_array( $input['enabled_post_types'] ) ) {
				if ( empty( trim( $input['enabled_post_types'] ) ) ) {
					$input['enabled_post_types'] = array();
				} else {
					$input['enabled_post_types'] = explode( ',', trim( $input['enabled_post_types'] ) );
				}
			} else {
				$input['enabled_post_types'] = array_filter( array_map( 'trim', $input['enabled_post_types'] ) );
			}
		}

		if ( isset( $input['jeo_bulk_post_types'] ) ) {
			if ( ! is_array( $input['jeo_bulk_post_types'] ) ) {
				$input['jeo_bulk_post_types'] = array( 'post' );
			}
		}

		// Handle booleans (checkboxes) - only if they are present in the request
		$booleans = array( 'jeo_bulk_ai_active', 'jeo_bulk_logging', 'jeo_rag_auto_index', 'ai_debug_mode', 'ai_use_custom_prompt', 'show_storymaps_on_post_archives' );
		foreach ( $booleans as $bool_key ) {
			if ( isset( $input[ $bool_key ] ) ) {
				$input[ $bool_key ] = ! empty( $input[ $bool_key ] );
			}
		}

		// Secure API Key handling: If the input contains the visual mask, revert to existing stored value
		$sensitive_keys = array(
			'gemini_api_key', 'openai_api_key', 'anthropic_api_key', 'deepseek_api_key',
			'mistral_api_key', 'zai_api_key', 'huggingface_api_key', 'grok_api_key',
			'cohere_api_key', 'mapbox_key', 'ollama_url'
		);

		foreach ( $sensitive_keys as $s_key ) {
			if ( isset( $input[ $s_key ] ) && strpos( $input[ $s_key ], '********' ) !== false ) {
				// Restore the real key from DB if it exists
				if ( isset( $existing_options[ $s_key ] ) ) {
					$input[ $s_key ] = $existing_options[ $s_key ];
				}
			}
		}

		// Sanitize Appearance - Colors
		$color_fields = array(
			'jeo_primary-color', 'jeo_secondary-color', 'jeo_info-btn-bg', 
			'jeo_info-btn-color', 'jeo_close-btn-bg', 'jeo_close-btn-color',
			'jeo_map-widgets-bg', 'jeo_map-widgets-color', 'jeo_map-widgets-bg-hover'
		);
		foreach ( $color_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_hex_color( $input[ $field ] );
			}
		}

		// Sanitize Appearance - Typography & Others
		$text_fields = array(
			'jeo_font-url', 'jeo_font-family', 'jeo_font-url-secondary', 
			'jeo_font-family-secondary', 'jeo_info-btn-font-size', 'jeo_footer-logo'
		);
		foreach ( $text_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_text_field( $input[ $field ] );
			}
		}

		// 3. FINAL MERGE: Overwrite existing options with sanitized new input
		return array_merge( $existing_options, $input );
	}

	public function enqueue_admin_scripts( $page ) {
		if ( 'jeo_page_jeo-settings' === $page || 'jeo_page_jeo-ai-settings' === $page ) {
			wp_enqueue_media();
			wp_enqueue_style( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css', array(), '4.0.13' );
			wp_enqueue_script( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js', array( 'jquery' ), '4.0.13', true );
			wp_enqueue_script( 'jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', array( 'jquery', 'wp-api-fetch' ), JEO_VERSION, true );
			wp_set_script_translations( 'jeo-settings', 'jeo', JEO_BASEPATH . 'languages' );

			wp_localize_script( 'jeo-settings', 'jeo_settings', array(
				'rest_url'    => rest_url( 'jeo/v1' ),
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'map_runtime' => $this->get_option( 'map_runtime' ),
				'map_defaults' => array(
					'zoom' => $this->get_option( 'map_default_zoom' ),
					'lat'  => $this->get_option( 'map_default_lat' ),
					'lng'  => $this->get_option( 'map_default_lng' ),
				)
			) );

		}
	}

	public function add_menu_item() {
		add_submenu_page(
			'jeo-main-menu',
			__( 'Settings', 'jeo' ),
			__( 'Settings', 'jeo' ),
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
