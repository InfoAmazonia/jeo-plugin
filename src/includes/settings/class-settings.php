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
		'map_runtime'                     => 'mapboxgl',
		'enabled_post_types'              => array( 'post' ),
		'map_default_zoom'                => 1,
		'map_default_lat'                 => 0,
		'map_default_lon'                 => 0,
		'mapbox_key'                      => '',
		'active_geocoder'                 => 'nominatim',
		'show_storymaps_on_post_archives' => true,

		// AI.
		'ai_default_provider'             => 'gemini',
		'ai_system_prompt'                => '',
		'ai_use_custom_prompt'            => false,
		'ai_debug_mode'                   => false,
		'ai_embedding_model'              => '',

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
			'provider'  => array( 'ai_use_custom_prompt', 'ai_debug_mode' ),
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
			$all_booleans = array( 'jeo_bulk_ai_active', 'jeo_bulk_logging', 'jeo_rag_auto_index', 'ai_debug_mode', 'ai_use_custom_prompt', 'show_storymaps_on_post_archives' );
			foreach ( $all_booleans as $bool_key ) {
				if ( isset( $input[ $bool_key ] ) ) {
					$input[ $bool_key ] = ! empty( $input[ $bool_key ] );
				}
			}
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
			wp_enqueue_style( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css', array(), '4.0.13' );
			wp_enqueue_script( 'select2', 'https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js', array( 'jquery', 'wp-i18n' ), '4.0.13', true );
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
						'lon'  => $this->get_option( 'map_default_lon' ),
					),
					'i18n'         => array(
						'console_cleared'      => __( '[Sistema] Console limpo.', 'jeo' ),
						'missing_config'       => __( 'Configuração Faltando', 'jeo' ),
						'checking'             => __( 'Verificando...', 'jeo' ),
						'active'               => __( 'Ativo', 'jeo' ),
						'invalid'              => __( 'Inválido', 'jeo' ),
						'failed'               => __( 'Falhou', 'jeo' ),
						'request_failed'       => __( 'Falha na Requisição', 'jeo' ),
						'loading'              => __( 'Carregando...', 'jeo' ),
						'change_model'         => __( 'Alterar Modelo', 'jeo' ),
						'select_model'         => __( 'Selecione ou digite um modelo...', 'jeo' ),
						'non_chat'             => __( ' (Não-chat)', 'jeo' ),
						'enter_api_key'        => __( 'Por favor, insira uma Chave de API primeiro.', 'jeo' ),
						'failed_fetch_models'  => __( 'Falha ao buscar modelos: ', 'jeo' ),
						'unknown_error'        => __( 'Erro desconhecido', 'jeo' ),
						'error_fetching'       => __( 'Erro ao buscar modelos. Verifique sua chave e conexão.', 'jeo' ),
						'type_description'     => __( 'Por favor, descreva o comportamento desejado primeiro.', 'jeo' ),
						'asking_llm'           => __( 'Consultando IA...', 'jeo' ),
						'applied_above'        => __( '✨ Aplicado acima.', 'jeo' ),
						'error_generating'     => __( 'Erro ao gerar o prompt.', 'jeo' ),
						'generate_prompt'      => __( 'Gerar Prompt', 'jeo' ),
						'testing'              => __( 'Testando...', 'jeo' ),
						'valid'                => __( '✅ Válido', 'jeo' ),
						'invalid_prompt'       => __( '❌ Inválido', 'jeo' ),
						'validate_prompt'      => __( 'Validar Prompt', 'jeo' ),
						'loading_backups'      => __( 'Carregando backups...', 'jeo' ),
						'file'                 => __( 'Arquivo', 'jeo' ),
						'date'                 => __( 'Data', 'jeo' ),
						'size'                 => __( 'Tamanho', 'jeo' ),
						'actions'              => __( 'Ações', 'jeo' ),
						'download'             => __( 'Baixar', 'jeo' ),
						'delete'               => __( 'Excluir', 'jeo' ),
						'no_backups'           => __( 'Nenhum backup encontrado.', 'jeo' ),
						'confirm_delete'       => __( 'Excluir?', 'jeo' ),
						'vectorizing'          => __( 'Vetorizando...', 'jeo' ),
						'vectorize_now'        => __( 'Vetorizar Agora', 'jeo' ),
						'confirm_clear_store'  => __( 'Limpar base de conhecimento?', 'jeo' ),
						'fetching_post'        => __( 'Buscando post e gerando embeddings vetoriais...', 'jeo' ),
						'success'              => __( 'Sucesso!', 'jeo' ),
						'post_extracted'       => __( 'Post Extraído:', 'jeo' ),
						'vector_dimensions'    => __( 'Dimensões do Vetor:', 'jeo' ),
						'text_snippet'         => __( 'Trecho de Texto:', 'jeo' ),
						'vector_preview'       => __( 'Pré-visualização do Vetor:', 'jeo' ),
						'run_test'             => __( 'Executar Teste em Post Aleatório', 'jeo' ),
						'searching'            => __( 'Pesquisando...', 'jeo' ),
						'searching_store'      => __( 'Pesquisando na base de conhecimento ', 'jeo' ),
						'no_docs_found'        => __( 'Nenhum documento encontrado. Você já executou a vetorização?', 'jeo' ),
						'score'                => __( 'Pontuação / Relevância', 'jeo' ),
						'metadata'             => __( 'Metadados', 'jeo' ),
						'untitled'             => __( 'Sem título', 'jeo' ),
						'error'                => __( 'Erro', 'jeo' ),
						'processing'           => __( 'Processando...', 'jeo' ),
						'clearing'             => __( 'Limpando...', 'jeo' ),
						'confirm_clear_bulk'   => __( 'Isso irá agendar a limpeza de TODOS os posts geolocalizados pela IA em segundo plano. Deseja continuar?', 'jeo' ),
						'confirm_clear_bulk_2' => __( 'TEM CERTEZA? Esta ação não pode ser desfeita e exigirá uma nova vetorização completa para estes posts.', 'jeo' ),
						'bulk_clear_started'   => __( 'Limpeza em massa iniciada em segundo plano.', 'jeo' ),
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
