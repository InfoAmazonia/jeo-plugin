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

		// Identify the current tab submitted, so we only reset checkboxes that belong to this tab.
		$current_tab = isset( $input['current_tab'] ) ? sanitize_text_field( $input['current_tab'] ) : '';
		unset( $input['current_tab'] );

		// Checkboxes grouped by tab.
		$booleans_by_tab = array(
			'general'   => array( 'show_storymaps_on_post_archives' ),
			'provider'  => array( 'ai_use_custom_prompt', 'ai_cal_use_granularity', 'ai_cal_use_confidence', 'ai_cal_use_title_weight', 'ai_cal_use_max_tokens', 'ai_cal_use_primary_threshold', 'ai_cal_use_secondary_threshold', 'ai_cal_use_primary_limit', 'ai_cal_use_secondary_limit' ),
			'settings'  => array( 'ai_debug_mode', 'ai_debug_console', 'ai_use_structured_output' ),
			'bulk'      => array( 'jeo_bulk_ai_active', 'jeo_bulk_logging' ),
			'knowledge' => array( 'jeo_rag_auto_index' ),
		);

		// Handle booleans (checkboxes) - if the tab was submitted, assume unchecked if absent.
		if ( ! empty( $current_tab ) && isset( $booleans_by_tab[ $current_tab ] ) ) {
			foreach ( $booleans_by_tab[ $current_tab ] as $bool_key ) {
				$input[ $bool_key ] = isset( $input[ $bool_key ] ) ? true : false;
			}
		} else {
			// Fallback if no tab identifier (e.g. direct API updates or older logic).
			$all_booleans = array( 'jeo_bulk_ai_active', 'jeo_bulk_logging', 'jeo_rag_auto_index', 'ai_debug_mode', 'ai_debug_console', 'ai_use_structured_output', 'ai_use_custom_prompt', 'ai_include_taxonomies', 'show_storymaps_on_post_archives', 'ai_cal_use_granularity', 'ai_cal_use_confidence', 'ai_cal_use_title_weight', 'ai_cal_use_max_tokens', 'ai_cal_use_primary_threshold', 'ai_cal_use_secondary_threshold', 'ai_cal_use_primary_limit', 'ai_cal_use_secondary_limit' );
			foreach ( $all_booleans as $bool_key ) {
				if ( isset( $input[ $bool_key ] ) ) {
					$input[ $bool_key ] = ! empty( $input[ $bool_key ] );
				}
			}
		}

		// AI Calibration controls sanitization.
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

		// Context prompt settings.
		if ( isset( $input['ai_use_context_custom_prompt'] ) ) {
			$input['ai_use_context_custom_prompt'] = ! empty( $input['ai_use_context_custom_prompt'] );
		}

		// Context prompt sanitization.
		if ( isset( $input['ai_context_prompt'] ) ) {
			$input['ai_context_prompt'] = sanitize_textarea_field( $input['ai_context_prompt'] );
		}

		// RAG topK sanitization.
		if ( isset( $input['ai_rag_topk'] ) ) {
			$input['ai_rag_topk'] = absint( $input['ai_rag_topk'] );
			if ( $input['ai_rag_topk'] < 1 || $input['ai_rag_topk'] > 50 ) {
				$input['ai_rag_topk'] = 10;
			}
		}

		// Geolocation precision sanitization.
		if ( isset( $input['geolocation_precision'] ) ) {
			$input['geolocation_precision'] = absint( $input['geolocation_precision'] );
			if ( $input['geolocation_precision'] < 1 || $input['geolocation_precision'] > 5 ) {
				$input['geolocation_precision'] = 2;
			}
		}

		// Pin icon URLs.
		if ( isset( $input['jeo_pin_primary_url'] ) ) {
			$input['jeo_pin_primary_url'] = esc_url_raw( $input['jeo_pin_primary_url'] );
		}
		if ( isset( $input['jeo_pin_secondary_url'] ) ) {
			$input['jeo_pin_secondary_url'] = esc_url_raw( $input['jeo_pin_secondary_url'] );
		}

		// Secure API Key handling: If the input contains the visual mask, revert to existing stored value.
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
				// Restore the real key from DB if it exists.
				if ( isset( $existing_options[ $s_key ] ) ) {
					$input[ $s_key ] = $existing_options[ $s_key ];
				}
			}
		}

		// Sanitize Appearance - Colors.
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

		// Sanitize Appearance - Typography & Others.
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

		// Reject Mapbox runtime without a valid API key.
		if ( isset( $input['map_runtime'] ) && 'mapboxgl' === $input['map_runtime'] ) {
			$mapbox_key = isset( $input['mapbox_key'] ) ? trim( $input['mapbox_key'] ) : '';
			if ( '' === $mapbox_key ) {
				$input['map_runtime'] = 'maplibregl';
			}
		}

		// 3. FINAL MERGE: Overwrite existing options with sanitized new input
		return array_merge( $existing_options, $input );
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
			wp_set_script_translations( 'jeo-settings', 'jeo', JEO_BASEPATH . 'languages' );

			wp_localize_script(
				'jeo-settings',
				'jeo_settings',
				array(
					'rest_url'     => rest_url( 'jeo/v1' ),
					'nonce'        => wp_create_nonce( 'wp_rest' ),
					'map_runtime'  => $this->get_option( 'map_runtime' ),
					'map_defaults' => array(
						'zoom' => $this->get_option( 'map_default_zoom' ),
						'lat'  => $this->get_option( 'map_default_lat' ),
						'lon'  => $this->get_option( 'map_default_lng' ),
					),
					'i18n'         => array(
						'console_cleared'        => __( '[System] Console cleared.', 'jeo' ),
						'missing_config'         => __( 'Missing Configuration', 'jeo' ),
						'checking'               => __( 'Checking...', 'jeo' ),
						'active'                 => _x( 'Active', 'geocoder status', 'jeo' ),
						'invalid'                => _x( 'Invalid', 'geocoder status', 'jeo' ),
						'failed'                 => __( 'Failed', 'jeo' ),
						'request_failed'         => __( 'Request Failed', 'jeo' ),
						'loading'                => __( 'Loading...', 'jeo' ),
						'change_model'           => __( 'Change Model', 'jeo' ),
						'select_model'           => __( 'Select or type a model...', 'jeo' ),
						'non_chat'               => __( ' (Non-chat)', 'jeo' ),
						'enter_api_key'          => __( 'Please enter an API Key first.', 'jeo' ),
						'failed_fetch_models'    => __( 'Failed to fetch models: ', 'jeo' ),
						'unknown_error'          => __( 'Unknown error', 'jeo' ),
						'error_fetching'         => __( 'Error fetching models. Check your key and connection.', 'jeo' ),
						'type_description'       => __( 'Please type a description first.', 'jeo' ),
						'asking_llm'             => __( 'Asking AI...', 'jeo' ),
						'generating'             => __( 'Generating...', 'jeo' ),
						'applied_above'          => __( '✨ Applied above.', 'jeo' ),
						'error_generating'       => __( 'Error generating prompt.', 'jeo' ),
						'generate_prompt'        => __( 'Generate Prompt', 'jeo' ),
						'testing'                => __( 'Testing...', 'jeo' ),
						'valid'                  => __( '✅ Valid', 'jeo' ),
						'invalid_prompt'         => __( '❌ Invalid', 'jeo' ),
						'validate_prompt'        => __( 'Validate Prompt', 'jeo' ),
						'loading_backups'        => __( 'Loading backups...', 'jeo' ),
						'file'                   => __( 'File', 'jeo' ),
						'date'                   => __( 'Date', 'jeo' ),
						'size'                   => __( 'Size', 'jeo' ),
						'actions'                => __( 'Actions', 'jeo' ),
						'download'               => __( 'Download', 'jeo' ),
						'delete'                 => __( 'Delete', 'jeo' ),
						'no_backups'             => __( 'No backups found.', 'jeo' ),
						'confirm_delete'         => __( 'Delete?', 'jeo' ),
						'vectorizing'            => __( 'Vectorizing...', 'jeo' ),
						'vectorize_now'          => __( 'Vectorize Now', 'jeo' ),
						'confirm_clear_store'    => __( 'Clear knowledge base?', 'jeo' ),
						'fetching_post'          => __( 'Fetching post and generating vector embeddings...', 'jeo' ),
						'success'                => __( 'Success!', 'jeo' ),
						'post_extracted'         => __( 'Post Extracted:', 'jeo' ),
						'vector_dimensions'      => __( 'Vector Dimensions:', 'jeo' ),
						'text_snippet'           => __( 'Text Snippet:', 'jeo' ),
						'vector_preview'         => __( 'Vector Preview:', 'jeo' ),
						'run_test'               => __( 'Run Test on Random Post', 'jeo' ),
						'searching'              => __( 'Searching...', 'jeo' ),
						'searching_store'        => __( 'Searching the knowledge base ', 'jeo' ),
						'no_docs_found'          => __( 'No documents found. Have you run vectorization?', 'jeo' ),
						'score'                  => __( 'Score / Relevance', 'jeo' ),
						'metadata'               => __( 'Metadata', 'jeo' ),
						'untitled'               => _x( 'Untitled', 'fallback post title', 'jeo' ),
						'error'                  => __( 'Error', 'jeo' ),
						'processing'             => __( 'Processing...', 'jeo' ),
						'clearing'               => __( 'Clearing...', 'jeo' ),
						'confirm_clear_bulk'     => __( 'This will schedule clearing ALL AI-geolocated posts in the background. Continue?', 'jeo' ),
						'confirm_clear_bulk_2'   => __( 'ARE YOU SURE? This cannot be undone and will require full re-vectorization for these posts.', 'jeo' ),
						'bulk_clear_started'     => __( 'Bulk clearing started in background.', 'jeo' ),
						'expand'                 => __( 'Expand', 'jeo' ),
						'collapse'               => __( 'Collapse', 'jeo' ),
						'back'                   => __( 'Back', 'jeo' ),
						'low'                    => __( 'Low', 'jeo' ),
						'fair'                   => __( 'Fair', 'jeo' ),
						'optimal'                => __( 'Optimal', 'jeo' ),
						'api_call_failed'        => __( 'API call failed', 'jeo' ),
						'process_batch_now'      => __( 'Process 1 Batch Now', 'jeo' ),
						'clear_batch'            => __( 'Clear 1 Batch', 'jeo' ),
						'delete_log_confirm'     => __( 'Delete log file?', 'jeo' ),
						'no_matching_layers'     => __( 'No matching layers found.', 'jeo' ),
						'matching_layers'        => __( ' matching layers:', 'jeo' ),
						'edit'                   => __( 'Edit', 'jeo' ),
						'search_btn'             => __( 'Search', 'jeo' ),
						'clear_layer_store'      => __( 'Clear layer store?', 'jeo' ),
						'enter_post_or_query'    => __( 'Please enter a post ID or search text.', 'jeo' ),
						'tokens'                 => __( 'Tokens', 'jeo' ),
						'reqs'                   => __( 'reqs', 'jeo' ),
						'in_prompt'              => __( 'In (Prompt):', 'jeo' ),
						'out_completion'         => __( 'Out (Compl.):', 'jeo' ),
						'total'                  => __( 'Total', 'jeo' ),
						'prompt_label'           => __( 'Prompt:', 'jeo' ),
						'completion_label'       => __( 'Completion:', 'jeo' ),
						'view_post'              => __( 'View Post', 'jeo' ),
						'edit_post'              => __( 'Edit Post', 'jeo' ),
						'select_taxonomy'        => __( 'Select Taxonomy...', 'jeo' ),
						'select_term'            => __( 'Select Term...', 'jeo' ),
						'locations_found'        => __( ' locations found.', 'jeo' ),
						'unauthorized'           => __( 'Unauthorized access.', 'jeo' ),
						'invalid_file'           => __( 'Invalid file.', 'jeo' ),
						'file_not_found'         => __( 'File not found.', 'jeo' ),
						'biomes'                 => __( 'Brazilian Biomes', 'jeo' ),
						'indigenous_territories' => __( 'Indigenous Territories', 'jeo' ),
						'quilombola_territories' => __( 'Quilombola Territories', 'jeo' ),
						'extractive_reserves'    => __( 'Extractive Reserves (Resex)', 'jeo' ),
						'conservation_units'     => __( 'Conservation Units', 'jeo' ),
						'riverside_communities'  => __( 'Riverside Communities', 'jeo' ),
						'agrarian_reform'        => __( 'Agrarian Reform Settlements', 'jeo' ),
						'indigenous_peoples'     => __( 'Indigenous Peoples (Ethnicities)', 'jeo' ),
						'legal_amazon'           => __( 'Legal Amazon and Boundaries', 'jeo' ),
						'hydrographic_basins'    => __( 'Hydrographic Basins', 'jeo' ),
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

	/**
	 * Render the main JEO settings page with tabbed navigation.
	 *
	 * @return void
	 */
	public function admin_page() {
		$tabs = array(
			'general'   => __( 'General', 'jeo' ),
			'geocoders' => __( 'Geocoders', 'jeo' ),
			'customize' => __( 'Appearance', 'jeo' ),
			'discovery' => __( 'Discovery', 'jeo' ),
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
