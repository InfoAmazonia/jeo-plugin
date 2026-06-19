<?php
/**
 * JEO Settings class.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Main Settings Class
 */
class Settings {

	use Singleton;

	/**
	 * Option key for JEO settings.
	 *
	 * @var string
	 */
	public $option_key = 'jeo-settings';

	/**
	 * Default option values.
	 *
	 * @var array
	 */
	public $default_options = array(
		'map_runtime'                     => 'maplibregl',
		'enabled_post_types'              => array( 'post' ),
		'map_default_zoom'                => 1,
		'map_default_lat'                 => 0,
		'map_default_lng'                 => 0,
		'mapbox_key'                      => '',
		'active_geocoder'                 => 'nominatim',
		'show_storymaps_on_post_archives' => true,
		'geolocation_precision'           => 2,

		// AI.
		'ai_default_provider'             => 'gemini',
		'ai_system_prompt'                => '',
		'ai_use_custom_prompt'            => false,
		'ai_debug_mode'                   => false,
		'ai_debug_console'                => true,
		'ai_use_structured_output'        => true,
		'ai_include_taxonomies'           => false,
		'ai_context_prompt'               => '',
		'ai_use_context_custom_prompt'    => false,
		'ai_embedding_model'              => '',
		'ai_cal_granularity'              => 'balanced',
		'ai_cal_confidence'               => 50,
		'ai_cal_title_weight'             => 70,
		'ai_cal_max_tokens'               => 8000,
		'ai_cal_use_granularity'          => true,
		'ai_cal_use_confidence'           => true,
		'ai_cal_use_title_weight'         => true,
		'ai_cal_use_max_tokens'           => true,
		'ai_cal_primary_threshold'        => 75,
		'ai_cal_secondary_threshold'      => 35,
		'ai_cal_use_primary_threshold'    => true,
		'ai_cal_use_secondary_threshold'  => true,

		// Pin icons.
		'jeo_pin_primary_url'             => 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-blue.png',
		'jeo_pin_secondary_url'           => 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-grey.png',

		// Bulk AI.
		'jeo_bulk_ai_active'              => false,
		'jeo_bulk_batch_size'             => 5,
		'jeo_bulk_post_types'             => array( 'post' ),
		'jeo_bulk_cron_interval'          => 'hourly',
		'jeo_bulk_logging'                => false,
		'jeo_bulk_confidence_threshold'   => 70,

		// RAG Auto-indexing.
		'jeo_rag_auto_index'              => false,
		'jeo_rag_batch_size'              => 10,
		'jeo_rag_cron_interval'           => 'hourly',
		'ai_rag_topk'                     => 10,

		// Gemini.
		'gemini_api_key'                  => '',
		'gemini_model'                    => 'gemini-2.5-flash',

		// OpenAI.
		'openai_api_key'                  => '',
		'openai_model'                    => 'gpt-4o',

		// DeepSeek.
		'deepseek_api_key'                => '',
		'deepseek_model'                  => 'deepseek-chat',

		// Anthropic.
		'anthropic_api_key'               => '',
		'anthropic_model'                 => 'claude-3-opus-20240229',

		// Mistral.
		'mistral_api_key'                 => '',
		'mistral_model'                   => 'mistral-large-latest',

		// ZAI.
		'zai_api_key'                     => '',
		'zai_model'                       => '',

		// HuggingFace.
		'huggingface_api_key'             => '',
		'huggingface_model'               => '',

		// Grok.
		'grok_api_key'                    => '',
		'grok_model'                      => 'grok-1',

		// Cohere.
		'cohere_api_key'                  => '',
		'cohere_model'                    => 'command-r-plus',

		// Ollama.
		'ollama_url'                      => '',
		'ollama_model'                    => 'llama3',

		// Appearance.
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

	/**
	 * Initialize hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_menu', array( $this, 'add_menu_item' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Retrieve a single option value from the JEO settings, falling back to defaults.
	 *
	 * @param string $key     Option key.
	 * @param mixed  $default_value Default value if not found.
	 * @return mixed
	 */
	public function get_option( $key, $default_value = null ) {
		$options = get_option( $this->option_key );

		if ( isset( $options[ $key ] ) ) {
			return $options[ $key ];
		}

		if ( isset( $this->default_options[ $key ] ) ) {
			return $this->default_options[ $key ];
		}

		return $default_value;
	}

	/**
	 * Return the HTML form field name for a settings key.
	 *
	 * @param string $key Option key.
	 * @return string
	 */
	public function get_field_name( $key ) {
		return $this->option_key . '[' . $key . ']';
	}

	/**
	 * Register the JEO settings group for the settings API.
	 *
	 * @return void
	 */
	public function admin_init() {
		register_setting( 'jeo-settings', $this->option_key, array( 'sanitize_callback' => array( $this, 'sanitize_settings' ) ) );
	}

	/**
	 * Sanitize and merge settings input, handling checkboxes, API key masking, color fields, and text fields.
	 *
	 * @param array $input Raw settings input.
	 * @return array
	 */
	public function sanitize_settings( $input ) {
		$existing_options = get_option( $this->option_key );
		if ( ! is_array( $existing_options ) ) {
			$existing_options = $this->default_options;
		}

		$input = is_array( $input ) ? $input : array();

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

		$current_tab = isset( $input['current_tab'] ) ? sanitize_text_field( $input['current_tab'] ) : '';
		unset( $input['current_tab'] );

		$booleans_by_tab = array(
			'general'   => array( 'show_storymaps_on_post_archives' ),
			'provider'  => array( 'ai_use_custom_prompt', 'ai_cal_use_granularity', 'ai_cal_use_confidence', 'ai_cal_use_title_weight', 'ai_cal_use_max_tokens', 'ai_cal_use_primary_threshold', 'ai_cal_use_secondary_threshold', 'ai_cal_use_primary_limit', 'ai_cal_use_secondary_limit' ),
			'settings'  => array( 'ai_debug_mode', 'ai_debug_console', 'ai_use_structured_output' ),
			'bulk'      => array( 'jeo_bulk_ai_active', 'jeo_bulk_logging' ),
			'knowledge' => array( 'jeo_rag_auto_index' ),
		);

		if ( ! empty( $current_tab ) && isset( $booleans_by_tab[ $current_tab ] ) ) {
			foreach ( $booleans_by_tab[ $current_tab ] as $bool_key ) {
				$input[ $bool_key ] = isset( $input[ $bool_key ] ) ? true : false;
			}
		} else {
			$all_booleans = array( 'jeo_bulk_ai_active', 'jeo_bulk_logging', 'jeo_rag_auto_index', 'ai_debug_mode', 'ai_debug_console', 'ai_use_structured_output', 'ai_use_custom_prompt', 'ai_include_taxonomies', 'show_storymaps_on_post_archives', 'ai_cal_use_granularity', 'ai_cal_use_confidence', 'ai_cal_use_title_weight', 'ai_cal_use_max_tokens', 'ai_cal_use_primary_threshold', 'ai_cal_use_secondary_threshold', 'ai_cal_use_primary_limit', 'ai_cal_use_secondary_limit' );
			foreach ( $all_booleans as $bool_key ) {
				if ( isset( $input[ $bool_key ] ) ) {
					$input[ $bool_key ] = ! empty( $input[ $bool_key ] );
				}
			}
		}

		if ( isset( $input['ai_cal_granularity'] ) ) {
			$input['ai_cal_granularity'] = sanitize_text_field( $input['ai_cal_granularity'] );
			if ( ! in_array( $input['ai_cal_granularity'], array( 'broad', 'balanced', 'fine' ), true ) ) {
				$input['ai_cal_granularity'] = 'balanced';
			}
		}
		if ( isset( $input['ai_cal_confidence'] ) ) {
			$input['ai_cal_confidence'] = absint( $input['ai_cal_confidence'] );
			if ( $input['ai_cal_confidence'] < 0 || $input['ai_cal_confidence'] > 100 ) {
				$input['ai_cal_confidence'] = 50;
			}
		}
		if ( isset( $input['ai_cal_title_weight'] ) ) {
			$input['ai_cal_title_weight'] = absint( $input['ai_cal_title_weight'] );
			if ( $input['ai_cal_title_weight'] < 0 || $input['ai_cal_title_weight'] > 100 ) {
				$input['ai_cal_title_weight'] = 70;
			}
		}
		if ( isset( $input['ai_cal_max_tokens'] ) ) {
			$input['ai_cal_max_tokens'] = absint( $input['ai_cal_max_tokens'] );
			if ( $input['ai_cal_max_tokens'] < 1000 || $input['ai_cal_max_tokens'] > 100000 ) {
				$input['ai_cal_max_tokens'] = 8000;
			}
		}
		if ( isset( $input['ai_cal_primary_threshold'] ) ) {
			$input['ai_cal_primary_threshold'] = absint( $input['ai_cal_primary_threshold'] );
			if ( $input['ai_cal_primary_threshold'] < 0 || $input['ai_cal_primary_threshold'] > 100 ) {
				$input['ai_cal_primary_threshold'] = 75;
			}
		}
		if ( isset( $input['ai_cal_secondary_threshold'] ) ) {
			$input['ai_cal_secondary_threshold'] = absint( $input['ai_cal_secondary_threshold'] );
			if ( $input['ai_cal_secondary_threshold'] < 0 || $input['ai_cal_secondary_threshold'] > 100 ) {
				$input['ai_cal_secondary_threshold'] = 35;
			}
		}
		if ( isset( $input['ai_cal_primary_max'] ) ) {
			$input['ai_cal_primary_max'] = absint( $input['ai_cal_primary_max'] );
			if ( $input['ai_cal_primary_max'] < 1 || $input['ai_cal_primary_max'] > 100 ) {
				$input['ai_cal_primary_max'] = 10;
			}
		}
		if ( isset( $input['ai_cal_secondary_max'] ) ) {
			$input['ai_cal_secondary_max'] = absint( $input['ai_cal_secondary_max'] );
			if ( $input['ai_cal_secondary_max'] < 1 || $input['ai_cal_secondary_max'] > 100 ) {
				$input['ai_cal_secondary_max'] = 10;
			}
		}

		if ( isset( $input['ai_use_context_custom_prompt'] ) ) {
			$input['ai_use_context_custom_prompt'] = ! empty( $input['ai_use_context_custom_prompt'] );
		}

		if ( isset( $input['ai_context_prompt'] ) ) {
			$input['ai_context_prompt'] = sanitize_textarea_field( $input['ai_context_prompt'] );
		}

		if ( isset( $input['ai_rag_topk'] ) ) {
			$input['ai_rag_topk'] = absint( $input['ai_rag_topk'] );
			if ( $input['ai_rag_topk'] < 1 || $input['ai_rag_topk'] > 50 ) {
				$input['ai_rag_topk'] = 10;
			}
		}

		if ( isset( $input['geolocation_precision'] ) ) {
			$input['geolocation_precision'] = absint( $input['geolocation_precision'] );
			if ( $input['geolocation_precision'] < 1 || $input['geolocation_precision'] > 5 ) {
				$input['geolocation_precision'] = 2;
			}
		}

		if ( isset( $input['jeo_pin_primary_url'] ) ) {
			$input['jeo_pin_primary_url'] = esc_url_raw( $input['jeo_pin_primary_url'] );
		}
		if ( isset( $input['jeo_pin_secondary_url'] ) ) {
			$input['jeo_pin_secondary_url'] = esc_url_raw( $input['jeo_pin_secondary_url'] );
		}

		$sensitive_keys = array(
			'gemini_api_key',
			'openai_api_key',
			'anthropic_api_key',
			'deepseek_api_key',
			'mistral_api_key',
			'zai_api_key',
			'huggingface_api_key',
			'grok_api_key',
			'cohere_api_key',
			'mapbox_key',
			'ollama_url',
		);

		foreach ( $sensitive_keys as $s_key ) {
			if ( isset( $input[ $s_key ] ) && strpos( $input[ $s_key ], '********' ) !== false ) {
				if ( isset( $existing_options[ $s_key ] ) ) {
					$input[ $s_key ] = $existing_options[ $s_key ];
				}
			}
		}

		$color_fields = array(
			'jeo_primary-color',
			'jeo_secondary-color',
			'jeo_info-btn-bg',
			'jeo_info-btn-color',
			'jeo_close-btn-bg',
			'jeo_close-btn-color',
			'jeo_map-widgets-bg',
			'jeo_map-widgets-color',
			'jeo_map-widgets-bg-hover',
		);
		foreach ( $color_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_hex_color( $input[ $field ] );
			}
		}

		$text_fields = array(
			'jeo_font-url',
			'jeo_font-family',
			'jeo_font-url-secondary',
			'jeo_font-family-secondary',
			'jeo_info-btn-font-size',
			'jeo_footer-logo',
		);
		foreach ( $text_fields as $field ) {
			if ( isset( $input[ $field ] ) ) {
				$input[ $field ] = sanitize_text_field( $input[ $field ] );
			}
		}

		if ( isset( $input['map_runtime'] ) && 'mapboxgl' === $input['map_runtime'] ) {
			$mapbox_key = isset( $input['mapbox_key'] ) ? trim( $input['mapbox_key'] ) : '';
			if ( '' === $mapbox_key ) {
				$input['map_runtime'] = 'maplibregl';
			}
		}

		if ( isset( $input['geocoders'] ) && is_array( $input['geocoders'] ) ) {
			$input['geocoders'] = $this->sanitize_geocoder_settings_payload( $input['geocoders'] );
		}

		return array_merge( $existing_options, $input );
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
				__( 'JEO could not save this asset URL. Use a valid http(s) or root-relative URL.', 'jeowp' ),
				'warning'
			);
		}

		return $normalized;
	}

	/**
	 * Enqueue admin scripts and styles for the JEO settings and AI settings pages, including Select2.
	 *
	 * @param string $page Current admin page hook.
	 * @return void
	 */
	public function enqueue_admin_scripts( $page ) {
		if ( 'jeo_page_jeo-settings' === $page || 'jeo_page_jeo-ai-settings' === $page ) {
			wp_enqueue_media();
			wp_enqueue_style( 'select2', JEO_BASEURL . '/includes/vendor/select2/css/select2.min.css', array(), '4.0.13' );
			wp_enqueue_script( 'select2', JEO_BASEURL . '/includes/vendor/select2/js/select2.min.js', array( 'jquery', 'wp-i18n' ), '4.0.13', true );
			wp_enqueue_script( 'jeo-settings', JEO_BASEURL . '/includes/settings/settings-page.js', array( 'jquery', 'wp-api-fetch', 'wp-i18n' ), JEO_VERSION, true );
			wp_set_script_translations( 'jeo-settings', 'jeowp', JEO_BASEPATH . 'languages' );

			wp_localize_script(
				'jeo-settings',
				'jeo_settings',
				array(
					'rest_url'     => rest_url( 'jeo/v1' ),
					'nonce'        => wp_create_nonce( 'wp_rest' ),
					'map_runtime'  => $this->get_option( 'map_runtime' ),
					'map_defaults' => array(
						'zoom' => floatval( $this->get_option( 'map_default_zoom' ) ),
						'lat'  => floatval( $this->get_option( 'map_default_lat' ) ),
						'lon'  => floatval( $this->get_option( 'map_default_lng' ) ),
					),
					'i18n'         => array(
						'console_cleared'        => __( '[System] Console cleared.', 'jeowp' ),
						'missing_config'         => __( 'Missing Configuration', 'jeowp' ),
						'checking'               => __( 'Checking...', 'jeowp' ),
						'active'                 => _x( 'Active', 'geocoder status', 'jeowp' ),
						'invalid'                => _x( 'Invalid', 'geocoder status', 'jeowp' ),
						'failed'                 => __( 'Failed', 'jeowp' ),
						'request_failed'         => __( 'Request Failed', 'jeowp' ),
						'loading'                => __( 'Loading...', 'jeowp' ),
						'change_model'           => __( 'Change Model', 'jeowp' ),
						'select_model'           => __( 'Select or type a model...', 'jeowp' ),
						'non_chat'               => __( ' (Non-chat)', 'jeowp' ),
						'enter_api_key'          => __( 'Please enter an API Key first.', 'jeowp' ),
						'failed_fetch_models'    => __( 'Failed to fetch models: ', 'jeowp' ),
						'unknown_error'          => __( 'Unknown error', 'jeowp' ),
						'error_fetching'         => __( 'Error fetching models. Check your key and connection.', 'jeowp' ),
						'type_description'       => __( 'Please type a description first.', 'jeowp' ),
						'asking_llm'             => __( 'Asking AI...', 'jeowp' ),
						'generating'             => __( 'Generating...', 'jeowp' ),
						'applied_above'          => __( '✨ Applied above.', 'jeowp' ),
						'error_generating'       => __( 'Error generating prompt.', 'jeowp' ),
						'generate_prompt'        => __( 'Generate Prompt', 'jeowp' ),
						'testing'                => __( 'Testing...', 'jeowp' ),
						'valid'                  => __( '✅ Valid', 'jeowp' ),
						'invalid_prompt'         => __( '❌ Invalid', 'jeowp' ),
						'validate_prompt'        => __( 'Validate Prompt', 'jeowp' ),
						'loading_backups'        => __( 'Loading backups...', 'jeowp' ),
						'file'                   => __( 'File', 'jeowp' ),
						'date'                   => __( 'Date', 'jeowp' ),
						'size'                   => __( 'Size', 'jeowp' ),
						'actions'                => __( 'Actions', 'jeowp' ),
						'download'               => __( 'Download', 'jeowp' ),
						'delete'                 => __( 'Delete', 'jeowp' ),
						'no_backups'             => __( 'No backups found.', 'jeowp' ),
						'confirm_delete'         => __( 'Delete?', 'jeowp' ),
						'vectorizing'            => __( 'Vectorizing...', 'jeowp' ),
						'vectorize_now'          => __( 'Vectorize Now', 'jeowp' ),
						'confirm_clear_store'    => __( 'Clear knowledge base?', 'jeowp' ),
						'fetching_post'          => __( 'Fetching post and generating vector embeddings...', 'jeowp' ),
						'success'                => __( 'Success!', 'jeowp' ),
						'post_extracted'         => __( 'Post Extracted:', 'jeowp' ),
						'vector_dimensions'      => __( 'Vector Dimensions:', 'jeowp' ),
						'text_snippet'           => __( 'Text Snippet:', 'jeowp' ),
						'vector_preview'         => __( 'Vector Preview:', 'jeowp' ),
						'run_test'               => __( 'Run Test on Random Post', 'jeowp' ),
						'searching'              => __( 'Searching...', 'jeowp' ),
						'searching_store'        => __( 'Searching the knowledge base ', 'jeowp' ),
						'no_docs_found'          => __( 'No documents found. Have you run vectorization?', 'jeowp' ),
						'score'                  => __( 'Score / Relevance', 'jeowp' ),
						'metadata'               => __( 'Metadata', 'jeowp' ),
						'untitled'               => _x( 'Untitled', 'fallback post title', 'jeowp' ),
						'error'                  => __( 'Error', 'jeowp' ),
						'processing'             => __( 'Processing...', 'jeowp' ),
						'clearing'               => __( 'Clearing...', 'jeowp' ),
						'confirm_clear_bulk'     => __( 'This will schedule clearing ALL AI-geolocated posts in the background. Continue?', 'jeowp' ),
						'confirm_clear_bulk_2'   => __( 'ARE YOU SURE? This cannot be undone and will require full re-vectorization for these posts.', 'jeowp' ),
						'bulk_clear_started'     => __( 'Bulk clearing started in background.', 'jeowp' ),
						'expand'                 => __( 'Expand', 'jeowp' ),
						'collapse'               => __( 'Collapse', 'jeowp' ),
						'back'                   => __( 'Back', 'jeowp' ),
						'low'                    => __( 'Low', 'jeowp' ),
						'fair'                   => __( 'Fair', 'jeowp' ),
						'optimal'                => __( 'Optimal', 'jeowp' ),
						'api_call_failed'        => __( 'API call failed', 'jeowp' ),
						'process_batch_now'      => __( 'Process 1 Batch Now', 'jeowp' ),
						'clear_batch'            => __( 'Clear 1 Batch', 'jeowp' ),
						'delete_log_confirm'     => __( 'Delete log file?', 'jeowp' ),
						'no_matching_layers'     => __( 'No matching layers found.', 'jeowp' ),
						'matching_layers'        => __( ' matching layers:', 'jeowp' ),
						'edit'                   => __( 'Edit', 'jeowp' ),
						'search_btn'             => __( 'Search', 'jeowp' ),
						'clear_layer_store'      => __( 'Clear layer store?', 'jeowp' ),
						'enter_post_or_query'    => __( 'Please enter a post ID or search text.', 'jeowp' ),
						'tokens'                 => __( 'Tokens', 'jeowp' ),
						'reqs'                   => __( 'reqs', 'jeowp' ),
						'in_prompt'              => __( 'In (Prompt):', 'jeowp' ),
						'out_completion'         => __( 'Out (Compl.):', 'jeowp' ),
						'total'                  => __( 'Total', 'jeowp' ),
						'prompt_label'           => __( 'Prompt:', 'jeowp' ),
						'completion_label'       => __( 'Completion:', 'jeowp' ),
						'view_post'              => __( 'View Post', 'jeowp' ),
						'edit_post'              => __( 'Edit Post', 'jeowp' ),
						'select_taxonomy'        => __( 'Select Taxonomy...', 'jeowp' ),
						'select_term'            => __( 'Select Term...', 'jeowp' ),
						'locations_found'        => __( ' locations found.', 'jeowp' ),
						'unauthorized'           => __( 'Unauthorized access.', 'jeowp' ),
						'invalid_file'           => __( 'Invalid file.', 'jeowp' ),
						'file_not_found'         => __( 'File not found.', 'jeowp' ),
						'biomes'                 => __( 'Brazilian Biomes', 'jeowp' ),
						'indigenous_territories' => __( 'Indigenous Territories', 'jeowp' ),
						'quilombola_territories' => __( 'Quilombola Territories', 'jeowp' ),
						'extractive_reserves'    => __( 'Extractive Reserves (Resex)', 'jeowp' ),
						'conservation_units'     => __( 'Conservation Units', 'jeowp' ),
						'riverside_communities'  => __( 'Riverside Communities', 'jeowp' ),
						'agrarian_reform'        => __( 'Agrarian Reform Settlements', 'jeowp' ),
						'indigenous_peoples'     => __( 'Indigenous Peoples (Ethnicities)', 'jeowp' ),
						'legal_amazon'           => __( 'Legal Amazon and Boundaries', 'jeowp' ),
						'hydrographic_basins'    => __( 'Hydrographic Basins', 'jeowp' ),
					),
				)
			);

		}
	}

	/**
	 * Add the Settings and AI Debug Logs submenu items under the JEO main menu.
	 *
	 * @return void
	 */
	public function add_menu_item() {
		add_submenu_page(
			'jeo-main-menu',
			__( 'Settings', 'jeowp' ),
			__( 'Settings', 'jeowp' ),
			'manage_options',
			'jeo-settings',
			array( $this, 'admin_page' ),
		);

		add_submenu_page(
			'jeo-main-menu',
			__( 'AI Debug Logs', 'jeowp' ),
			__( 'AI Debug Logs', 'jeowp' ),
			'manage_options',
			'jeo-ai-logs',
			array( $this, 'admin_logs_page' )
		);
	}

	/**
	 * Render the main JEO settings page with tabbed navigation.
	 *
	 * @return void
	 */
	public function admin_page() {
		$tabs = array(
			'general'   => __( 'General', 'jeowp' ),
			'geocoders' => __( 'Geocoders', 'jeowp' ),
			'customize' => __( 'Appearance', 'jeowp' ),
			'discovery' => __( 'Discovery', 'jeowp' ),
		);

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$current_tab = isset( $_GET['tab'] ) && array_key_exists( sanitize_text_field( wp_unslash( $_GET['tab'] ) ), $tabs ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'general';

		include 'settings-page.php';
	}

	/**
	 * Render the AI debug logs admin page.
	 *
	 * @return void
	 */
	public function admin_logs_page() {
		include 'ai-logs-page.php';
	}
}
