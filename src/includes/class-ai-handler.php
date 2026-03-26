<?php

namespace Jeo;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI Handler Class
 *
 * Manages LLM integrations for georeferencing.
 */
class AI_Handler {

	use Singleton;

	/**
	 * Adapters registered.
	 *
	 * @var array
	 */
	private $adapters = array();

	/**
	 * Initialize the class.
	 */
	protected function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_filter( 'gettext', array( $this, 'dynamic_pt_br_translations' ), 10, 3 );
	}

	/**
	 * Dynamically translate new AI strings to pt_BR without recompiling .mo files.
	 */
	public function dynamic_pt_br_translations( $translation, $text, $domain ) {
		if ( 'jeo' !== $domain || ! is_admin() && ! wp_is_json_request() ) {
			return $translation;
		}

		$locale = determine_locale();
		if ( 'pt_BR' !== $locale ) {
			return $translation;
		}

		$translations = array(
			'AI (v3.5)' => 'IA (v3.5)',
			'Active AI Provider' => 'Provedor de IA Ativo',
			'Gemini API Key' => 'Chave de API do Gemini',
			'OpenAI API Key' => 'Chave de API da OpenAI',
			'DeepSeek API Key' => 'Chave de API do DeepSeek',
			'Custom System Prompt' => 'Prompt de Sistema Personalizado',
			'Leave empty to use the default prompt.' => 'Deixe em branco para usar o prompt otimizado padrão.',
			'Default Prompt Guide:' => 'Guia do Prompt Padrão:',
			'Enable AI Debug Mode' => 'Ativar Modo de Depuração (Debug)',
			'If enabled, raw AI inputs and outputs will be saved to src/jeo-ai-debug.log for refinement.' => 'Se ativado, os envios e retornos brutos da IA serão salvos no arquivo jeo-ai-debug.log para análise.',
			'Loading settings... (A completely revamped panel is coming in JEO v4.0)' => 'Carregando painel... (Uma interface totalmente nova chegará no JEO v4.0)',
			'AI Debug Logs (Last 10 entries)' => 'Logs de Depuração da IA (Últimos 10)',
			'No logs found yet. Try georeferencing a post with AI first.' => 'Nenhum log encontrado. Tente georreferenciar um post usando IA primeiro.',
			'Date/Time' => 'Data / Hora',
			'Provider' => 'Provedor LLM',
			'Status / Output Preview' => 'Prévia da Resposta',
			'Actions' => 'Ações',
			'View Details' => 'Ver Detalhes',
			'AI Interaction Details' => 'Detalhes da Interação com a IA',
			'Close' => 'Fechar',
			'Timestamp' => 'Registro de Tempo',
			'Input (Prompt sent)' => 'Entrada (Prompt Enviado)',
			'Output (Raw Response)' => 'Saída (Retorno Bruto)',
			'Processing AI...' => 'Processando com IA...',
			'Review AI Suggestions' => 'Revisar Sugestões da IA',
			'I identified these locations in your text. Review and select which ones to add to the map:' => 'Identifiquei os seguintes locais no texto. Revise e selecione quais deseja adicionar ao mapa:',
			'(No context snippet found for this location)' => '(Nenhum trecho de contexto encontrado para este local)',
			'Discard All' => 'Descartar Todos',
			'Add to Map' => 'Adicionar ao Mapa',
			'Validate Custom Prompt' => 'Validar Prompt Customizado',
			'System Prompt Configuration' => 'Configuração do Prompt de Sistema',
			'Use Custom System Prompt' => 'Usar Prompt de Sistema Personalizado',
			'Check this to override the default behavior. Uncheck to temporarily disable and return to the optimized default prompt.' => 'Marque esta opção para substituir o comportamento padrão. Desmarque para desativar temporariamente e retornar ao prompt padrão otimizado.',
			'Clear Text' => 'Limpar Texto',
			'AI Prompt Engineer Assistant' => 'Assistente de Engenharia de Prompt IA',
			'Describe how you want the AI to behave (e.g., "Only map cities in Brazil" or "Ignore street names"). The active LLM will generate a highly optimized System Prompt for you, strictly adhering to JEO formatting rules.' => 'Descreva como você quer que a IA se comporte (ex: "Mapeie apenas cidades no Brasil" ou "Ignore nomes de ruas"). A LLM ativa vai gerar um Prompt de Sistema altamente otimizado para você, aderindo estritamente às regras de formatação do JEO.',
			'Ex: I want to map only locations inside Europe. Press Shift+Enter for new line, or Enter to generate.' => 'Ex: Quero mapear apenas locais dentro da Europa. Aperte Shift+Enter para pular linha, ou Enter para gerar.',
			'Generate Prompt' => 'Gerar Prompt',
			'JEO AI Debug Logs' => 'Logs de Depuração da IA do JEO',
			'Here you can view the most recent AI interactions, raw inputs, and raw outputs for debugging.' => 'Aqui você pode visualizar as interações mais recentes da IA, entradas e saídas brutas para depuração.',
			'Search logs:' => 'Pesquisar logs:',
			'Search Logs' => 'Pesquisar Logs',
			'Prompt successfully validated! The AI returned a valid JSON array.' => 'Prompt validado com sucesso! A IA retornou um array JSON válido.',
			'Validation failed: The AI did not return the expected JSON schema (missing name, lat, lng, or quote).' => 'Falha na validação: A IA não retornou o esquema JSON esperado (faltando name, lat, lng ou quote).',
			'Context is required.' => 'O contexto é obrigatório.',
			'Prompt is required.' => 'O prompt é obrigatório.',
		);

		if ( isset( $translations[ $text ] ) ) {
			return $translations[ $text ];
		}

		return $translation;
	}

	/**
	 * Register an AI adapter.
	 *
	 * @param string $slug Adapter slug.
	 * @param string $class_name Adapter class name.
	 */
	public function register_adapter( $slug, $class_name ) {
		$this->adapters[ $slug ] = $class_name;
	}

	/**
	 * Get available adapters.
	 *
	 * @return array
	 */
	public function get_adapters() {
		return array(
			'gemini'   => __( 'Google Gemini', 'jeo' ),
			'openai'   => __( 'OpenAI (GPT)', 'jeo' ),
			'deepseek' => __( 'DeepSeek', 'jeo' ),
		);
	}

	/**
	 * Get the active adapter instance.
	 *
	 * @return AI_Adapter|null
	 */
	public function get_active_adapter() {
		$active = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( ! $active ) {
			$active = 'gemini';
		}

		switch ( $active ) {
			case 'gemini':
				return new AI\Gemini_Adapter();
			case 'openai':
				return new AI\OpenAI_Adapter();
			case 'deepseek':
				return new AI\DeepSeek_Adapter();
		}

		return null;
	}

	/**
	 * Register REST API routes.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/ai-georeference',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_georeference' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-chat-prompt-generator',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_chat_prompt_generator' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-validate-prompt',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_validate_prompt' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Callback to generate an optimized prompt using the active LLM.
	 */
	public function api_chat_prompt_generator( $request ) {
		$context = $request->get_param( 'context' );
		if ( empty( $context ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'Context is required.', 'jeo' ) ), 400 );
		}

		$adapter = $this->get_active_adapter();
		if ( ! $adapter ) {
			return new \WP_REST_Response( array( 'error' => __( 'No active AI adapter found.', 'jeo' ) ), 500 );
		}

		// Meta-prompt instructed to build a JEO prompt
		$meta_prompt = "You are an expert Prompt Engineer for the JEO WordPress mapping plugin. 
The user wants to configure an AI georeferencing tool with specific rules: '{$context}'.
Write a clear, strict System Prompt that incorporates the user's rules. 
CRITICAL: The generated prompt MUST explicitly instruct the AI to return ONLY a raw JSON array of objects.
Each object MUST have keys: 'name', 'lat' (string/float), 'lng' (string/float), and 'quote'.
Example to include: [{\"name\": \"Place\", \"lat\": 0, \"lng\": 0, \"quote\": \"...\"}].
If no locations match, return [].
Output ONLY the generated prompt text without any markdown wrappers or conversational intro.";

		// We "abuse" the georeference method signature by passing the meta_prompt as the 'content' 
		// and using a dummy system prompt so the LLM acts as an assistant.
		$test_title = "Prompt Engineering Task";
		$assistant_override = "You are an assistant. Just do as instructed in the text.";
		
		// The current adapters are wired to parse JSON from output.
		// Wait, if we use georeference(), it expects a JSON output. But for the prompt generator, we want raw text.
		// Since we can't easily change the abstract without refactoring all adapters to return raw text, 
		// we'll instruct the LLM to return the prompt *inside* the expected JSON format!
		
		$meta_prompt_json_hack = $meta_prompt . "\n\nReturn your generated prompt inside this JSON format: [{\"name\": \"PROMPT_GENERATED\", \"lat\": 0, \"lng\": 0, \"quote\": \"PUT_YOUR_GENERATED_PROMPT_HERE\"}]";
		
		$result = $adapter->georeference( $test_title, $meta_prompt_json_hack, $assistant_override );

		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 'error' => $result->get_error_message() ), 400 );
		}

		$generated_prompt = isset( $result[0]['quote'] ) ? $result[0]['quote'] : '';
		if ( empty( $generated_prompt ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'AI failed to generate prompt.', 'jeo' ) ), 500 );
		}

		return new \WP_REST_Response( array( 'prompt' => $generated_prompt ), 200 );
	}

	/**
	 * Callback to validate a custom prompt.
	 */
	public function api_validate_prompt( $request ) {
		$custom_prompt = $request->get_param( 'prompt' );
		if ( empty( $custom_prompt ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'Prompt is required.', 'jeo' ) ), 400 );
		}

		$adapter = $this->get_active_adapter();
		if ( ! $adapter ) {
			return new \WP_REST_Response( array( 'error' => __( 'No active AI adapter found.', 'jeo' ) ), 500 );
		}

		$test_title   = "Test Article: The Amazon Rainforest";
		$test_content = "Today, an expedition was organized in the Amazon Rainforest, specifically leaving from the city of Manaus to explore the Negro River. The researchers found interesting species near the Encontro das Águas.";

		$result = $adapter->georeference( $test_title, $test_content, $custom_prompt );

		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 
				'success' => false, 
				'message' => $result->get_error_message() 
			), 200 ); // Send 200 so UI can display the error nicely
		}

		// Basic schema validation
		$is_valid = true;
		$msg = __( 'Prompt successfully validated! The AI returned a valid JSON array.', 'jeo' );

		if ( ! is_array( $result ) || ( count( $result ) > 0 && ( ! isset( $result[0]['name'] ) || ! isset( $result[0]['lat'] ) ) ) ) {
			$is_valid = false;
			$msg = __( 'Validation failed: The AI did not return the expected JSON schema (missing name, lat, lng, or quote).', 'jeo' );
		}

		return new \WP_REST_Response( array( 
			'success' => $is_valid, 
			'message' => $msg,
			'data'    => $result 
		), 200 );
	}

	/**
	 * Callback for the AI georeference API.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return \WP_REST_Response
	 */
	public function api_georeference( $request ) {
		$post_id = $request->get_param( 'post_id' );
		$title   = $request->get_param( 'title' );
		$content = $request->get_param( 'content' );

		if ( empty( $title ) && ! empty( $post_id ) ) {
			$post    = get_post( $post_id );
			$title   = $post->post_title;
			$content = $post->post_content;
		}

		$adapter = $this->get_active_adapter();

		if ( ! $adapter ) {
			return new \WP_REST_Response( array( 'error' => __( 'No active AI adapter found.', 'jeo' ) ), 500 );
		}

		$result = $adapter->georeference( $title, $content );

		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response( array( 'error' => $result->get_error_message() ), 400 );
		}

		return new \WP_REST_Response( $result, 200 );
	}

	/**
	 * Get the default system prompt for the AI adapters.
	 * 
	 * @return string
	 */
	public function get_default_system_prompt() {
		return __( 'You are a highly skilled geographer API. Analyze the text and extract locations. You MUST respond ONLY with a raw JSON array of objects, each containing "name", "lat" (string/float), "lng" (string/float), and "quote" (a short relevant snippet from the text where the location was mentioned). If no locations are found, return exactly []. Do not use markdown backticks, do not include any conversational text. Output MUST start with [ and end with ].', 'jeo' );
	}

	/**
	 * Parse the raw AI debug log and return the last $limit entries.
	 *
	 * @param int $limit Number of entries to return.
	 * @return array
	 */
	public function get_last_logs( $limit = 10 ) {
		$log_file = JEO_BASEPATH . 'jeo-ai-debug.log';
		
		if ( ! file_exists( $log_file ) ) {
			$upload_dir = wp_upload_dir();
			$log_file = trailingslashit( $upload_dir['basedir'] ) . 'jeo-ai-debug.log';
		}

		if ( ! file_exists( $log_file ) ) {
			return array();
		}

		$content = @file_get_contents( $log_file );
		if ( empty( $content ) ) {
			return array();
		}

		// Split logs by the separator line
		$entries_raw = explode( str_repeat( '=', 80 ) . "\n\n", $content );
		
		// Clean empty ends
		$entries_raw = array_filter( array_map( 'trim', $entries_raw ) );
		
		$parsed_entries = array();
		
		foreach ( $entries_raw as $raw_entry ) {
			if ( empty( $raw_entry ) ) continue;

			// Extract components using basic regex/strpos
			$timestamp = '';
			$provider = '';
			$input = '';
			$output = '';

			if ( preg_match( '/^\[(.*?)\] PROVIDER: (.*?)\n/s', $raw_entry, $matches ) ) {
				$timestamp = $matches[1];
				$provider = trim( $matches[2] );
			}

			// Find INPUT section
			if ( preg_match( '/INPUT \(Prompt\):\n(.*?)\nOUTPUT \(Raw Response\):/s', $raw_entry, $matches ) ) {
				$input = trim( $matches[1] );
			}

			// Find OUTPUT section
			if ( preg_match( '/OUTPUT \(Raw Response\):\n(.*)$/s', $raw_entry, $matches ) ) {
				$output = trim( $matches[1] );
			}

			if ( ! empty( $timestamp ) ) {
				$parsed_entries[] = array(
					'timestamp' => $timestamp,
					'provider'  => $provider,
					'input'     => $input,
					'output'    => $output,
				);
			}
		}

		// Reverse to get newest first and slice
		$parsed_entries = array_reverse( $parsed_entries );
		return array_slice( $parsed_entries, 0, $limit );
	}
}
