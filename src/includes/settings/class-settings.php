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
			'jeo_footer-logo'                 => '',
			'show_storymaps_on_post_archives' => 0,
			'ai_default_provider'             => 'gemini',
			'ai_embedding_model'              => '',

			// Bulk Processing
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

			// Deepseek
			'deepseek_api_key'                => '',
			'deepseek_model'                  => 'deepseek-chat',

			// Anthropic
			'anthropic_api_key'               => '',
			'anthropic_model'                 => 'claude-3-5-sonnet-20240620',

			// Ollama
			'ollama_url'                      => 'http://localhost:11434/api',
			'ollama_model'                    => 'llama3',

			// Mistral
			'mistral_api_key'                 => '',
			'mistral_model'                   => 'mistral-large-latest',

			// ZAI
			'zai_api_key'                     => '',
			'zai_model'                       => 'glm-4',

			// HuggingFace
			'huggingface_api_key'             => '',
			'huggingface_model'               => 'mistralai/Mistral-7B-Instruct-v0.3',

			// Grok (X-AI)
			'grok_api_key'                    => '',
			'grok_model'                      => 'grok-beta',

			// Cohere
			'cohere_api_key'                  => '',
			'cohere_model'                    => 'command-r-plus',

			'ai_use_custom_prompt'            => 0,
			'ai_system_prompt'                => '',
			'ai_debug_mode'                   => 0,

			// Appearance - Colors
			'jeo_primary-color'               => '#007cba',
			'jeo_secondary-color'             => '#2c3338',
			'jeo_info-btn-bg'                 => '#ffffff',
			'jeo_info-btn-color'              => '#2c3338',
			'jeo_close-btn-bg'                => '#2c3338',
			'jeo_close-btn-color'             => '#ffffff',

			// Appearance - Typography
			'jeo_font-url'                    => '',
			'jeo_font-family'                 => '',
			'jeo_font-url-secondary'          => '',
			'jeo_font-family-secondary'       => '',
			'jeo_info-btn-font-size'          => '1',
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
		register_setting( 'jeo-settings', $this->option_key, array( 'sanitize_callback' => array( $this, 'sanitize_settings' ) ) );
	}

	public function sanitize_settings( $input ) {
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
		} else {
			$input['enabled_post_types'] = array();
		}

		if ( isset( $input['jeo_bulk_post_types'] ) ) {
			if ( ! is_array( $input['jeo_bulk_post_types'] ) ) {
				$input['jeo_bulk_post_types'] = array( 'post' );
			}
		}

		// Ensure booleans are correct
		$input['jeo_bulk_ai_active'] = ! empty( $input['jeo_bulk_ai_active'] );
		$input['jeo_bulk_logging']   = ! empty( $input['jeo_bulk_logging'] );
		$input['jeo_rag_auto_index'] = ! empty( $input['jeo_rag_auto_index'] );

		// Secure API Key handling: If the input contains the visual mask, revert to existing stored value
		$existing_options = get_option( $this->option_key );
		$sensitive_keys = array(
			'gemini_api_key', 'openai_api_key', 'anthropic_api_key', 'deepseek_api_key',
			'mistral_api_key', 'zai_api_key', 'huggingface_api_key', 'grok_api_key',
			'cohere_api_key', 'mapbox_key'
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
			'jeo_primary-color',
			'jeo_secondary-color',
			'jeo_info-btn-bg',
			'jeo_info-btn-color',
			'jeo_close-btn-bg',
			'jeo_close-btn-color'
		);
		foreach ( $color_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_hex_color( $input[ $field ] );
			}
		}

		// Sanitize Appearance - Typography
		$text_fields = array(
			'jeo_font-url',
			'jeo_font-family',
			'jeo_font-url-secondary',
			'jeo_font-family-secondary',
			'jeo_info-btn-font-size',
			'jeo_footer-logo'
		);
		foreach ( $text_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_text_field( $input[ $field ] );
			}
		}

		return $input;
	}

	public function enqueue_admin_scripts( $page ) {
		if ( 'jeo_page_jeo-settings' === $page ) {
			wp_enqueue_media();
			wp_enqueue_style( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css', array(), '4.0.13' );
			wp_enqueue_script( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js', array( 'jquery' ), '4.0.13', true );
			wp_enqueue_script( 'jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', array( 'jquery', 'wp-api-fetch' ), JEO_VERSION, true );
			wp_set_script_translations( 'jeo-settings', 'jeo', JEO_BASEPATH . 'languages' );

			wp_localize_script( 'jeo-settings', 'jeo_settings', array(
				'rest_url'    => rest_url( 'jeo/v1' ),
				'nonce'       => wp_create_nonce( 'wp_rest' ),
				'map_runtime' => $this->get_option( 'map_runtime' ),
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
