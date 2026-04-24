<?php
/**
 * AI Handler class.
 *
 * @package Jeo
 */

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
		add_action( 'admin_post_jeo_download_dict', array( $this, 'api_download_dict' ) );
		add_action( 'admin_footer', array( $this, 'deactivation_confirmation_js' ) );
	}

	/**
	 * Inject a confirmation JS on the plugins page to warn about data removal.
	 */
	public function deactivation_confirmation_js() {
		$screen = get_current_screen();
		if ( ! $screen || 'plugins' !== $screen->id ) {
			return;
		}

		$msg = __( 'Warning: Deactivating JEO will permanently remove all API Keys and AI settings for security reasons. Do you want to proceed?', 'jeo' );
		?>
		<script>
			jQuery(function($) {
				$('.wp-list-table tr[data-slug="jeo"] .deactivate a').on('click', function(e) {
					if (!confirm("<?php echo esc_js( $msg ); ?>")) {
						e.preventDefault();
					}
				});
			});
		</script>
		<?php
	}

	/**
	 * Securely download a dictionary JSON file.
	 */
	public function api_download_dict() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'Unauthorized' );
		}

		check_admin_referer( 'jeo_download_dict' );

		$file = isset( $_GET['file'] ) ? sanitize_file_name( wp_unslash( $_GET['file'] ) ) : '';
		if ( empty( $file ) || strpos( $file, '.json' ) === false ) {
			wp_die( 'Invalid file' );
		}

		$path = JEO_BASEPATH . '/includes/ai/data/' . $file;
		if ( ! file_exists( $path ) ) {
			wp_die( 'File not found' );
		}

		header( 'Content-Type: application/json' );
		header( 'Content-Disposition: attachment; filename="' . $file . '"' );
		header( 'Pragma: no-cache' );
		readfile( $path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_readfile
		exit;
	}

	/**
	 * Dynamically translate new AI strings to pt_BR without recompiling .mo files.
	 *
	 * @param string $translation Translated text.
	 * @param string $text        Text to translate.
	 * @param string $domain      Text domain.
	 */
	public function dynamic_pt_br_translations( $translation, $text, $domain ) {
		if ( 'jeo' !== $domain || ( ! is_admin() && ! wp_is_json_request() ) ) {
			return $translation;
		}

		$locale = determine_locale();
		if ( 'pt_BR' !== $locale ) {
			return $translation;
		}

		$translations = array(
			'Welcome'                                      => 'Boas-vindas',
			'Dashboard'                                    => 'Experimental',
			'Settings'                                     => 'Configurações',
			'AI Debug Logs'                                => 'Logs de Depuração IA',
			'Maps'                                         => 'Mapas',
			'Layers'                                       => 'Camadas',
			'Story Map'                                    => 'Mapas de História',
			'Story Maps'                                   => 'Mapas de História',
			'AI (v3.5)'                                    => 'IA (v3.5)',
			'Active AI Provider'                           => 'Provedor de IA Ativo',
			'Gemini API Key'                               => 'Chave de API do Gemini',
			'OpenAI API Key'                               => 'Chave de API da OpenAI',
			'DeepSeek API Key'                             => 'Chave de API do DeepSeek',
			'Custom System Prompt'                         => 'Prompt de Sistema Personalizado',
			'Leave empty to use the default prompt.'       => 'Deixe em branco para usar o prompt otimizado padrão.',
			'Default Prompt Guide:'                        => 'Guia do Prompt Padrão:',
			'Enable AI Debug Mode'                         => 'Ativar Modo de Depuração (Debug)',
			'If enabled, raw AI inputs and outputs will be saved to src/jeo-ai-debug.log for refinement.' => 'Se ativado, os envios e retornos brutos da IA serão salvos no arquivo jeo-ai-debug.log para análise.',
			'Loading settings... (A completely revamped panel is coming in JEO v4.0)' => 'Carregando painel... (Uma interface totalmente nova chegará no JEO v4.0)',
			'AI Debug Logs (Last 10 entries)'              => 'Logs de Depuração da IA (Últimos 10)',
			'No logs found yet. Try georeferencing a post with AI first.' => 'Nenhum log encontrado. Tente georreferenciar um post usando IA primeiro.',
			'Date/Time'                                    => 'Data / Hora',
			'Provider'                                     => 'Provedor LLM',
			'Status / Output Preview'                      => 'Prévia da Resposta',
			'Actions'                                      => 'Ações',
			'View Details'                                 => 'Ver Detalhes',
			'AI Interaction Details'                       => 'Detalhes da Interação com a IA',
			'Close'                                        => 'Fechar',
			'Timestamp'                                    => 'Registro de Tempo',
			'Input (Prompt sent)'                          => 'Entrada (Prompt Enviado)',
			'Output (Raw Response)'                        => 'Saída (Retorno Bruto)',
			'Processing AI...'                             => 'Processando com IA...',
			'Geolocate with AI'                            => 'Geolocalizar com IA',
			'Review AI Suggestions'                        => 'Revisar Sugestões da IA',
			'I identified these locations in your text. Review and select which ones to add to the map:' => 'Identifiquei os seguintes locais no texto. Revise e selecione quais deseja adicionar ao mapa:',
			'(No context snippet found for this location)' => '(Nenhum trecho de contexto encontrado para este local)',
			'Discard All'                                  => 'Descartar Todos',
			'Add to Map'                                   => 'Adicionar ao Mapa',
			'AI Context:'                                  => 'Contexto da IA:',
			'Verified Address:'                            => 'Endereço Verificado:',
			'Enrich Data'                                  => 'Enriquecer Dados',
			'Enriched via Geocoder'                        => 'Enriquecido via Geocoder',
			'Validate Custom Prompt'                       => 'Validar Prompt Customizado',
			'System Prompt Configuration'                  => 'Configuração do Prompt de Sistema',
			'Use Custom System Prompt'                     => 'Usar Prompt de Sistema Personalizado',
			'Check this to override the default behavior. Uncheck to temporarily disable and return to the optimized default prompt.' => 'Marque esta opção para substituir o comportamento padrão. Desmarque para desativar temporariamente e retornar ao prompt padrão otimizado.',
			'Clear Text'                                   => 'Limpar Texto',
			'AI Prompt Engineer Assistant'                 => 'Assistente de Engenharia de Prompt IA',
			'Describe how you want the AI to behave (e.g., "Only map cities in Brazil" or "Ignore street names"). The active LLM will generate a highly optimized System Prompt for you, strictly adhering to JEO formatting rules.' => 'Descreva como você quer que a IA se comporte (ex: "Mapeie apenas cidades no Brasil" ou "Ignore nomes de ruas"). A LLM ativa vai gerar um Prompt de Sistema altamente otimizado para você, aderindo estritamente às regras de formatação do JEO.',
			'Ex: I want to map only locations inside Europe. Press Shift+Enter for new line, or Enter to generate.' => 'Ex: Quero mapear apenas locais dentro da Europa. Aperte Shift+Enter para pular linha, ou Enter para gerar.',
			'Generate Prompt'                              => 'Gerar Prompt',
			'JEO AI Debug Logs'                            => 'Logs de Depuração da IA do JEO',
			'Here you can view the most recent AI interactions, raw inputs, and raw outputs for debugging.' => 'Aqui você pode visualizar as interações mais recentes da IA, entradas e saídas brutas para depuração.',
			'Search logs:'                                 => 'Pesquisar logs:',
			'Search Logs'                                  => 'Pesquisar Logs',
			'Prompt successfully validated! The AI returned a valid JSON array.' => 'Prompt validado com sucesso! A IA retornou um array JSON válido.',
			'Validation failed: The AI did not return the expected JSON schema (missing name, lat, lon, or quote).' => 'Falha na validação: A IA não retornou o esquema JSON esperado (faltando name, lat, lon ou quote).',
			'Context is required.'                         => 'O contexto é obrigatório.',
			'Prompt is required.'                          => 'O prompt é obrigatório.',
			'Knowledge Base'                               => 'Base de Conhecimento',
			'Bulk Geolocation'                             => 'Geolocalização em Massa',
			'Background Processing'                        => 'Processamento em Segundo Plano',
			'Enable background AI geolocalization for legacy posts.' => 'Ativa a geolocalização automática por IA para posts antigos em segundo plano.',
			'Batch Size'                                   => 'Tamanho do Lote',
			'Number of posts to process per cron run.'     => 'Número de posts a processar por ciclo.',
			'Target Post Types'                            => 'Tipos de Post Alvo',
			'Cron Interval'                                => 'Intervalo de Execução',
			'Every Minute'                                 => 'A cada minuto',
			'Every 5 Minutes'                              => 'A cada 5 minutos',
			'Every 15 Minutes'                             => 'A cada 15 minutos',
			'Hourly'                                       => 'De hora em hora',
			'Twice Daily'                                  => 'Duas vezes ao dia',
			'Processing Status'                            => 'Status do Processamento',
			'Recent Logs'                                  => 'Logs Recentes',
			'Manual Actions'                               => 'Ações Manuais',
			'Run 1 Batch Now'                              => 'Processar 1 Lote Agora',
			'Clear Logs'                                   => 'Limpar Logs',
			'Bulk Approval Threshold'                      => 'Limite de Aprovação em Massa',
			'Minimum average confidence required to auto-approve locations during bulk actions.' => 'Confiança média mínima necessária para auto-aprovar locais durante ações em massa.',
			'Average AI Confidence'                        => 'Confiança Média da IA',
			'Geolocated'                                   => 'Geolocalizado',
			'Pending AI Approval'                          => 'Pendente de Aprovação IA',
			'No Locations Found'                           => 'Nenhum Local Encontrado',
			'AI Error'                                     => 'Erro na IA',
			'Not Processed'                                => 'Não Processado',
			'Approve AI'                                   => 'Aprovar IA',
			'Approve JEO AI Geolocations'                  => 'Aprovar Geolocalizações IA do JEO',
			'Background Indexing'                          => 'Indexação em Segundo Plano',
			'Automatically vectorize your posts in small batches using WP-Cron.' => 'Vetoriza seus posts automaticamente em pequenos lotes usando WP-Cron.',
			'Enable Auto-indexing'                         => 'Ativar Auto-indexação',
			'Manual Indexing'                              => 'Indexação Manual',
			'Trigger a single batch vectorization immediately.' => 'Dispara a vetorização de um único lote imediatamente.',
			'Vectorize 1 Batch Now'                        => 'Vetorizar 1 Lote Agora',
			'Indexing Progress'                            => 'Progresso da Indexação',
			'%d of %d posts indexed.'                      => '%d de %d posts indexados.',
			'Alternative: Use WP-CLI for large databases:' => 'Alternativa: Use WP-CLI para bases de dados grandes:',
			'Successfully vectorized %d posts.'            => 'Vetorizado com sucesso %d posts.',
			'No more posts to vectorize.'                  => 'Não há mais posts para vetorizar.',
			'Data Dictionaries'                            => 'Dicionários de Dados',
			'Embedded Brazilian Territories'               => 'Territórios Brasileiros Embarcados',
			'The following geographic dictionaries are available locally to improve AI precision:' => 'Os seguintes dicionários geográficos estão disponíveis localmente para melhorar a precisão da IA:',
			'Advanced RAG Connections (Coming Soon)'       => 'Conexões RAG Avançadas (Em breve)',
			'Connect your own external databases to provide custom context to the LLM.' => 'Conecte seus próprios bancos de dados externos para fornecer contexto personalizado à LLM.',
			'Connect Supabase (PostgreSQL)'                => 'Conectar Supabase (PostgreSQL)',
			'Connect SQLite Local'                         => 'Conectar SQLite Local',
			'Connect N8N Webhook'                          => 'Conectar Webhook N8N',
			'File:'                                        => 'Arquivo:',
			'Entries found:'                               => 'Entradas encontradas:',
			'API Key is valid and active!'                 => 'A Chave de API é válida e está ativa!',
			'Invalid provider.'                            => 'Provedor inválido.',
			'Test API Key'                                 => 'Testar Chave de API',
			'Testing key...'                               => 'Testando chave...',
			'API Status:'                                  => 'Status da API:',
			'Checking...'                                  => 'Verificando...',
			'Please enter an API Key for the selected provider before saving.' => 'Por favor, insira uma Chave de API para o provedor selecionado antes de salvar.',
			'Warning: Deactivating JEO will remove your AI API Keys for security reasons. Other settings will be preserved. Do you want to proceed?' => 'Atenção: Desativar o JEO removerá suas chaves de API de Inteligência Artificial por motivos de segurança. Outras configurações serão preservadas. Deseja continuar?',
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
			'gemini'      => __( 'Google Gemini', 'jeo' ),
			'openai'      => __( 'OpenAI', 'jeo' ),
			'deepseek'    => __( 'DeepSeek', 'jeo' ),
			'anthropic'   => __( 'Anthropic Claude', 'jeo' ),
			'ollama'      => __( 'Ollama (Local/Custom)', 'jeo' ),
			'mistral'     => __( 'Mistral AI', 'jeo' ),
			'zai'         => __( 'Zhipu AI (GLM)', 'jeo' ),
			'huggingface' => __( 'HuggingFace Inference', 'jeo' ),
			'grok'        => __( 'Grok (xAI)', 'jeo' ),
			'cohere'      => __( 'Cohere', 'jeo' ),
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

		// Dynamically fetch configured model and API key.
		$api_key = \jeo_settings()->get_option( $active . '_api_key' );
		$model   = \jeo_settings()->get_option( $active . '_model' );

		// Specific fallback for Ollama URL mapping.
		if ( 'ollama' === $active ) {
			$api_key = \jeo_settings()->get_option( 'ollama_url' );
		}

		if ( array_key_exists( $active, $this->get_adapters() ) ) {
			return new AI\Neuron_Adapter( $active, (string) $api_key, (string) $model );
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

		register_rest_route(
			'jeo/v1',
			'/ai-test-key',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_test_key' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-get-models',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_get_models' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-test-embedding',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_test_embedding' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-test-retrieval',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_test_retrieval' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
		register_rest_route(
			'jeo/v1',
			'/ai-backup-store',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_backup_store' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-list-backups',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'api_list_backups' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-delete-backup',
			array(
				'methods'             => 'DELETE',
				'callback'            => array( $this, 'api_delete_backup' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/ai-clear-store',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_clear_store' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * REST callback that clears the test or production vector store files and optionally resets postmeta.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 * @return \WP_REST_Response
	 */
	public function api_clear_store( $request ) {
		try {
			$store = $request->get_param( 'store' );
			if ( ! in_array( $store, array( 'test', 'production' ), true ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'Invalid store type.', 'jeo' ) ), 400 );
			}

			$upload_dir = wp_upload_dir();
			$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';
			$base_name  = ( 'test' === $store ) ? 'jeo_knowledge_test' : 'jeo_knowledge';

			$file_path = $store_dir . '/' . $base_name . '.store';
			$info_path = $store_dir . '/' . $base_name . '.model_info';

			if ( file_exists( $file_path ) ) {
				wp_delete_file( $file_path );
			}
			if ( file_exists( $info_path ) ) {
				wp_delete_file( $info_path );
			}

			if ( 'production' === $store ) {
				global $wpdb;
				$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s", '_jeo_vectorized_at' ) );
			}

			return new \WP_REST_Response(
				array(
					'success' => true,
					/* translators: %s: Store type name. */
					'message' => sprintf( __( '%s store cleared successfully.', 'jeo' ), ucfirst( $store ) ),
				),
				200
			);
		} catch ( \Throwable $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(),
				),
				200
			);
		}
	}

	/**
	 * REST callback that tests RAG retrieval by performing a similarity search against the vector store.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 * @return \WP_REST_Response
	 */
	public function api_test_retrieval( $request ) {
		try {
			$query = $request->get_param( 'query' );
			$store = $request->get_param( 'store' );

			if ( empty( $query ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'Query is required.', 'jeo' ) ), 400 );
			}

			// Initialize the RAG Agent to access Vector Store.
			$rag = new \Jeo\AI\RAG_Agent();
			if ( 'test' === $store ) {
				$rag->is_test_mode = true;
			}

			// Estimate tokens for the query.
			\jeo_ai_logger()->add_embedding_tokens( 'retrieve', strlen( $query ) );

			// Use the native SimilarityRetrieval logic.
			$retrieval      = $rag->resolveRetrieval();
			$retrieved_docs = $retrieval->retrieve( new \NeuronAI\Chat\Messages\UserMessage( $query ) );

			if ( empty( $retrieved_docs ) ) {
				return new \WP_REST_Response(
					array(
						'success'   => true,
						'documents' => array(),
						'message'   => __( 'No matches found in the selected Vector Store. Try vectorizing some posts first.', 'jeo' ),
					),
					200
				);
			}

			$formatted_docs = array();
			foreach ( $retrieved_docs as $doc ) {
				$formatted_docs[] = array(
					'id'       => $doc->getId(),
					'score'    => $doc->getScore(),
					'content'  => mb_strimwidth( $doc->getContent(), 0, 150, '...' ),
					'metadata' => $doc->metadata,
				);
			}

			return new \WP_REST_Response(
				array(
					'success'   => true,
					'documents' => $formatted_docs,
				),
				200
			);

		} catch ( \Throwable $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(),
				),
				200
			);
		}
	}

	/**
	 * REST callback that tests embedding generation on a random post and saves it to the test store.
	 *
	 * @param \WP_REST_Request $_request Current REST request.
	 * @return \WP_REST_Response
	 */
	public function api_test_embedding( $_request ) {
		try {
			// Select a random post.
			$query = new \WP_Query(
				array(
					'post_type'      => 'post',
					'post_status'    => 'publish',
					'posts_per_page' => 1,
					'orderby'        => 'rand',
				)
			);

			if ( empty( $query->posts ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'No posts available to test.', 'jeo' ) ), 400 );
			}

			$post = $query->posts[0];

			// Load into Document.
			$documents = \Jeo\AI\WP_Post_Data_Loader::load( array( $post ) );
			if ( empty( $documents ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'The selected random post has no usable text content.', 'jeo' ) ), 400 );
			}

			$test_doc = $documents[0];

			// Estimate tokens used for embedding test doc.
			\jeo_ai_logger()->add_embedding_tokens( 'vectorize', strlen( $test_doc->getContent() ) );

			// Use the Factory to get the active embeddings provider.
			$embed_provider = \Jeo\AI\Neuron_Factory::get_active_embeddings_provider();

			// Test the embed operation directly.
			$embedded_doc = $embed_provider->embedDocument( $test_doc );
			$vector       = $embedded_doc->getEmbedding();

			if ( empty( $vector ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'The embedding provider returned an empty vector.', 'jeo' ) ), 500 );
			}

			// Save the embedded document to the TEST Vector Store so we can retrieve it later.
			$rag               = new \Jeo\AI\RAG_Agent();
			$rag->is_test_mode = true;
			$rag->resolveVectorStore()->addDocument( $embedded_doc );

			// Format dimensions text.
			$dimensions     = count( $vector );
			$preview_vector = array_slice( $vector, 0, 5 ); // Just show first 5 floats.

			return new \WP_REST_Response(
				array(
					'success' => true,
					'message' => __( 'Embedding created and saved to Test Store!', 'jeo' ),
					'details' => array(
						'post_id'         => $post->ID,
						'post_title'      => $post->post_title,
						'content_snippet' => mb_strimwidth( $test_doc->getContent(), 0, 200, '...' ),
						'dimensions'      => $dimensions,
						'vector_start'    => $preview_vector,
					),
				),
				200
			);

		} catch ( \Throwable $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(),
				),
				200
			);
		}
	}

	/**
	 * Fetch available models dynamically from the LLM Provider's API.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 */
	public function api_get_models( $request ) {
		$provider = $request->get_param( 'provider' );
		$api_key  = $request->get_param( 'api_key' );

		if ( empty( $api_key ) ) {
			if ( 'ollama' === $provider ) {
				$api_key = \jeo_settings()->get_option( 'ollama_url' );
			} else {
				$api_key = \jeo_settings()->get_option( $provider . '_api_key' );
			}
		}

		if ( empty( $api_key ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'API Key or URL is required to list models.', 'jeo' ) ), 400 );
		}

		$models = array();
		$args   = array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $api_key,
				'Content-Type'  => 'application/json',
			),
			'timeout' => 15,
		);

		switch ( $provider ) {
			case 'openai':
			case 'deepseek':
			case 'mistral':
			case 'grok':
			case 'zai':
				$url = '';
				if ( 'openai' === $provider ) {
					$url = 'https://api.openai.com/v1/models';
				}
				if ( 'deepseek' === $provider ) {
					$url = 'https://api.deepseek.com/models';
				}
				if ( 'mistral' === $provider ) {
					$url = 'https://api.mistral.ai/v1/models';
				}
				if ( 'grok' === $provider ) {
					$url = 'https://api.x.ai/v1/models';
				}
				// Zhipu AI usually implements OpenAI's v1/models compat too if used via SDK endpoint, but can fail if unsupported.
				if ( 'zai' === $provider ) {
					return new \WP_REST_Response( array( 'error' => __( 'Model fetching not officially supported dynamically for Zhipu AI.', 'jeo' ) ), 400 );
				}

				$response = wp_remote_get( $url, $args );
				$body     = wp_remote_retrieve_body( $response );
				$data     = json_decode( $body, true );

				if ( ! empty( $data['data'] ) && is_array( $data['data'] ) ) {
					foreach ( $data['data'] as $model ) {
						$id = $model['id'];

						$skip = false;

						if ( 'openai' === $provider ) {
							$id_lower = strtolower( $id );
							$skip     = ! (
								str_starts_with( $id, 'gpt-' )
								|| str_starts_with( $id_lower, 'o1-' )
								|| str_starts_with( $id_lower, 'o3-' )
								|| str_starts_with( $id_lower, 'o4-' )
								|| str_starts_with( $id_lower, 'chatgpt-' )
							);
							if ( ! $skip ) {
								$skip = (
									str_contains( $id_lower, 'audio' )
									|| str_contains( $id_lower, 'realtime' )
									|| str_contains( $id_lower, 'tts' )
									|| str_contains( $id_lower, 'whisper' )
									|| str_contains( $id_lower, 'dall-e' )
									|| str_contains( $id_lower, 'embedding' )
								);
							}
						}

						if ( 'deepseek' === $provider ) {
							$id_lower = strtolower( $id );
							$skip     = str_contains( $id_lower, 'embedding' );
						}

						if ( 'mistral' === $provider ) {
							$id_lower = strtolower( $id );
							$skip     = str_contains( $id_lower, 'embed' );
						}

						if ( 'grok' === $provider ) {
							$id_lower = strtolower( $id );
							$skip     = (
								str_contains( $id_lower, 'embedding' )
								|| str_contains( $id_lower, 'grok-2-image' )
								|| str_contains( $id_lower, 'aurora' )
								|| str_contains( $id_lower, 'flux' )
							);
						}

						if ( $skip ) {
							continue;
						}

						$models[] = $id;
					}
				}
				break;

			case 'gemini':
				$url      = 'https://generativelanguage.googleapis.com/v1beta/models?key=' . $api_key;
				$response = wp_remote_get( $url, array( 'timeout' => 15 ) );
				$body     = wp_remote_retrieve_body( $response );
				$data     = json_decode( $body, true );

				if ( ! empty( $data['models'] ) && is_array( $data['models'] ) ) {
					foreach ( $data['models'] as $model ) {
						$id       = str_replace( 'models/', '', $model['name'] );
						$id_lower = strtolower( $id );
						if ( ! isset( $model['supportedGenerationMethods'] )
							|| ! in_array( 'generateContent', $model['supportedGenerationMethods'], true )
							|| str_contains( $id_lower, 'embedding' )
							|| str_contains( $id_lower, 'imagen' ) ) {
							continue;
						}
						$models[] = $id;
					}
				}
				break;

			case 'anthropic':
				$args['headers']['x-api-key']         = $api_key;
				$args['headers']['anthropic-version'] = '2023-06-01';
				unset( $args['headers']['Authorization'] );

				$response = wp_remote_get( 'https://api.anthropic.com/v1/models', $args );
				$body     = wp_remote_retrieve_body( $response );
				$data     = json_decode( $body, true );

				if ( ! empty( $data['data'] ) && is_array( $data['data'] ) ) {
					foreach ( $data['data'] as $model ) {
						$id       = $model['id'];
						$id_lower = strtolower( $id );
						if ( str_contains( $id_lower, 'embedding' ) ) {
							continue;
						}
						$models[] = $id;
					}
				}
				break;

			case 'ollama':
				// Ex: http://localhost:11434/api.
				$base_url = rtrim( str_replace( '/api', '', $api_key ), '/' );
				$response = wp_remote_get( $base_url . '/api/tags', array( 'timeout' => 10 ) );
				$body     = wp_remote_retrieve_body( $response );
				$data     = json_decode( $body, true );
				if ( ! empty( $data['models'] ) && is_array( $data['models'] ) ) {
					$ollama_non_text_patterns = array(
						'stable-diffusion',
						'sd-',
						'flux',
						'imagegen',
						'whisper',
						'tts',
						'nomic-embed',
						'mxbai-embed',
						'all-minilm',
						'snowflake-arctic-embed',
					);
					foreach ( $data['models'] as $model ) {
						$id_lower = strtolower( $model['name'] );
						$skip     = false;
						foreach ( $ollama_non_text_patterns as $pattern ) {
							if ( str_contains( $id_lower, $pattern ) ) {
								$skip = true;
								break;
							}
						}
						if ( $skip ) {
							continue;
						}
						$models[] = $model['name'];
					}
				}
				break;

			case 'cohere':
				$response = wp_remote_get( 'https://api.cohere.com/v1/models', $args );
				$body     = wp_remote_retrieve_body( $response );
				$data     = json_decode( $body, true );

				if ( ! empty( $data['models'] ) && is_array( $data['models'] ) ) {
					foreach ( $data['models'] as $model ) {
						if ( isset( $model['endpoints'] ) && in_array( 'chat', $model['endpoints'], true ) ) {
							$models[] = $model['name'];
						}
					}
				}
				break;

			default:
				return new \WP_REST_Response( array( 'error' => __( 'Model fetching is not supported for this provider yet. Please enter the model ID manually.', 'jeo' ) ), 400 );
		}

		if ( is_wp_error( $response ) ) {
			return new \WP_REST_Response( array( 'error' => $response->get_error_message() ), 500 );
		}

		if ( empty( $models ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'No models found. Check your API key or permissions.', 'jeo' ) ), 404 );
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'models'  => array_reverse( $models ),
			),
			200
		);
	}

	/**
	 * Callback to test if an API key is valid using a simple Hello World.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 */
	public function api_test_key( $request ) {
		try {
			$provider = $request->get_param( 'provider' );
			$api_key  = $request->get_param( 'api_key' );
			$model    = $request->get_param( 'model' );

			if ( empty( $api_key ) ) {
				if ( 'ollama' === $provider ) {
					$api_key = \jeo_settings()->get_option( 'ollama_url' );
				} else {
					$api_key = \jeo_settings()->get_option( $provider . '_api_key' );
				}
			}

			if ( empty( $model ) ) {
				$model = \jeo_settings()->get_option( $provider . '_model' );
			}

			if ( empty( $api_key ) ) {
				return new \WP_REST_Response( array( 'error' => __( 'No API Key provided or found in settings.', 'jeo' ) ), 400 );
			}

			$adapter = null;

			if ( array_key_exists( $provider, $this->get_adapters() ) ) {
				$adapter = new AI\Neuron_Adapter( $provider, (string) $api_key, (string) $model );
			}

			if ( ! $adapter ) {
				return new \WP_REST_Response( array( 'error' => __( 'Invalid provider.', 'jeo' ) ), 400 );
			}

			// O teste precisa retornar um JSON válido com a estrutura esperada para não quebrar no parser do AI_Adapter
			// Usamos [SKIP_ENFORCED_SCHEMA] para evitar que o JEO injete o prompt gigante de geolocalização durante o teste de conexão.
			$test_prompt = '[SKIP_ENFORCED_SCHEMA] Instruction: Return a JSON array confirming API access. Your ONLY output must be this exact format: [{"name": "SystemCheck", "lat": 0, "lon": 0, "quote": "Status: Ping", "confidence": 100}]';

			$result = $adapter->georeference( 'SystemCheck', 'Status: Ping', $test_prompt );

			if ( is_wp_error( $result ) ) {
				return new \WP_REST_Response(
					array(
						'success' => false,
						'message' => $result->get_error_message(),
					),
					200
				);
			}

			if ( is_array( $result ) ) {
				return new \WP_REST_Response(
					array(
						'success' => true,
						'message' => __( 'API Key is valid and active!', 'jeo' ),
						'data'    => $result,
					),
					200
				);
			}

			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'The AI provider returned an unexpected response format.', 'jeo' ),
				),
				200
			);

		} catch ( \Throwable $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => 'System Error: ' . $e->getMessage(),
				),
				200
			);
		}
	}

	/**
	 * Callback to generate an optimized prompt using the active LLM.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 */
	public function api_chat_prompt_generator( $request ) {
		$context  = $request->get_param( 'context' );
		$provider = $request->get_param( 'provider' );
		$api_key  = $request->get_param( 'api_key' );
		$model    = $request->get_param( 'model' );
		$lang     = $request->get_param( 'lang' ) ? $request->get_param( 'lang' ) : 'en';

		if ( empty( $context ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'Context is required.', 'jeo' ) ), 400 );
		}

		$lang_instruction = ( 'en' === $lang )
			? 'IMPORTANT: You MUST write the generated prompt and all rules in English. Large Language Models process English instructions more accurately and reliably.'
			: 'IMPORTANT: You MUST write the generated prompt and all rules in ' . get_bloginfo( 'language' ) . '.';

		$context = $lang_instruction . "\n\nUser request: " . $context;

		if ( empty( $api_key ) ) {
			if ( 'ollama' === $provider ) {
				$api_key = \jeo_settings()->get_option( 'ollama_url' );
			} else {
				$api_key = \jeo_settings()->get_option( $provider . '_api_key' );
			}
		}

		if ( empty( $model ) ) {
			$model = \jeo_settings()->get_option( $provider . '_model' );
		}

		if ( array_key_exists( $provider, $this->get_adapters() ) && ! empty( $api_key ) ) {
			$adapter = new AI\Neuron_Adapter( $provider, (string) $api_key, (string) $model );
		} else {
			$adapter = $this->get_active_adapter();
		}

		if ( ! $adapter ) {
			return new \WP_REST_Response( array( 'error' => __( 'No active AI adapter found.', 'jeo' ) ), 500 );
		}

		// Prompt Optimizer: Appends model-specific guidelines to the meta-prompt.
		$model_optimization = '';
		switch ( $provider ) {
			case 'gemini':
				$model_optimization = 'Since the target model is Google Gemini, please use clear Markdown headers (##) and explicit step-by-step instructions. Gemini performs best when formatting is highly structured and unambiguous.';
				break;
			case 'openai':
				$model_optimization = 'Since the target model is OpenAI (GPT), provide highly concise, abstract rules. GPT models are excellent at generalizing logic and understanding constraints without excessive verbosity.';
				break;
			case 'deepseek':
				$model_optimization = 'Since the target model is DeepSeek, enclose critical thinking rules and constraints inside XML-like tags (e.g., <rules>...</rules>). DeepSeek is a reasoning model and heavily benefits from chain-of-thought and structured tag-based directives.';
				break;
			case 'anthropic':
				$model_optimization = "Since the target model is Anthropic Claude, use conversational but highly detailed boundaries. Claude responds well to 'constitutional' style rules and clearly defined 'Do not do X' instructions.";
				break;
			default:
				$model_optimization = 'Make the prompt robust, precise, and well-structured to ensure high accuracy in georeferencing tasks.';
				break;
		}

		// Meta-prompt instructed to build a JEO prompt.
		$meta_prompt = "You are an expert Prompt Engineer for the JEO WordPress mapping plugin.
The user wants to configure an AI georeferencing tool with specific editorial rules: '{$context}'.
Write a clear, strict System Prompt that incorporates the user's rules.
{$model_optimization}

### OUTPUT FORMAT MANDATE
You MUST conclude your response by appending the EXACT following block. DO NOT translate, do not rephrase, do not use markdown code blocks inside the prompt text itself. Just paste it:

\"CRITICAL INSTRUCTION: You MUST respond ONLY with a raw, flat JSON array of objects. Do not nest the array inside a parent object.
Each object inside the array MUST have EXACTLY these keys: 'name', 'lat', 'lon', 'quote', 'confidence'. Do NOT use any other keys like 'city', 'country', 'continent', 'type', or 'keywords'.
- 'name': The location name.
- 'lat': Latitude (string or float).
- 'lon': Longitude (string or float).
- 'quote': A short relevant snippet (10-15 words) from the provided text where this location is mentioned.
- 'confidence': An integer between 0 and 100 representing your confidence level in this extraction.
Example of the ONLY valid format: [{\"name\": \"Teatro Amazonas\", \"lat\": -3.1303, \"lon\": -60.0234, \"quote\": \"...localizado no centro...\", \"confidence\": 95}]
If no locations are found, return exactly []. Do not use markdown backticks, no conversational text. Output MUST start with [ and end with ].\"

Output ONLY the generated prompt text without any markdown wrappers or conversational intro.";

		// We "abuse" the georeference method signature by passing the meta_prompt as the 'content'
		// and using a dummy system prompt so the LLM acts as an assistant.
		$test_title         = 'Prompt Engineering Task';
		$assistant_override = '[SKIP_ENFORCED_SCHEMA] You are an assistant. Just do as instructed in the text.';

		$meta_prompt_json_hack = $meta_prompt . "\n\nCRITICAL SYSTEM OVERRIDE: Your ONLY output must be a single JSON array containing one object with the exact key 'quote'. The value of 'quote' MUST BE the entire generated prompt, INCLUDING the verbatim JSON instruction paragraph at the end. Do NOT omit the verbatim paragraph from the 'quote' value. Return your generated prompt inside this exact JSON format: [{\"name\": \"PROMPT_GENERATED\", \"lat\": 0, \"lng\": 0, \"quote\": \"<PUT_YOUR_GENERATED_PROMPT_HERE>\"}]";
		$result                = $adapter->georeference( $test_title, $meta_prompt_json_hack, $assistant_override );

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
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 */
	public function api_validate_prompt( $request ) {
		$custom_prompt = $request->get_param( 'prompt' );
		$provider      = $request->get_param( 'provider' );
		$api_key       = $request->get_param( 'api_key' );
		$model         = $request->get_param( 'model' );

		if ( empty( $custom_prompt ) ) {
			return new \WP_REST_Response( array( 'error' => __( 'Prompt is required.', 'jeo' ) ), 400 );
		}

		if ( empty( $api_key ) ) {
			if ( 'ollama' === $provider ) {
				$api_key = \jeo_settings()->get_option( 'ollama_url' );
			} else {
				$api_key = \jeo_settings()->get_option( $provider . '_api_key' );
			}
		}

		if ( empty( $model ) ) {
			$model = \jeo_settings()->get_option( $provider . '_model' );
		}

		if ( array_key_exists( $provider, $this->get_adapters() ) && ! empty( $api_key ) ) {
			$adapter = new AI\Neuron_Adapter( $provider, (string) $api_key, (string) $model );
		} else {
			$adapter = $this->get_active_adapter();
		}

		if ( ! $adapter ) {
			return new \WP_REST_Response( array( 'error' => __( 'No active AI adapter found.', 'jeo' ) ), 500 );
		}

		// Use a diverse global text so validation succeeds regardless of regional prompt restrictions (Europe, Brazil, etc.).
		$test_title   = 'Global News Report: Environment and Economy';
		$test_content = 'Today, leaders met in Paris, France to discuss the European economy. Meanwhile, a scientific expedition in the Amazon Rainforest left Manaus, Brazil, to explore the Encontro das Águas. In Asia, Tokyo, Japan reported new technological advancements.';

		// Pass empty string for assistant override to let the adapter attach the enforced schema.
		$result = $adapter->georeference( $test_title, $test_content, $custom_prompt );

		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				200
			); // Send 200 so UI can display the error nicely.
		}

		// Strict schema validation.
		$is_valid = true;
		$msg      = __( 'Prompt successfully validated! The AI understood your instructions and returned a valid JSON array.', 'jeo' );

		if ( ! is_array( $result ) ) {
			$is_valid = false;
			$msg      = __( 'Validation failed: The AI did not return a valid JSON array.', 'jeo' );
		} elseif ( count( $result ) > 0 ) {
			foreach ( $result as $item ) {
				if ( ! isset( $item['name'] ) || ! array_key_exists( 'lat', $item ) || ! array_key_exists( 'lon', $item ) || ! isset( $item['quote'] ) ) {
					$is_valid = false;
					$msg      = __( 'Validation failed: The AI missed mandatory keys (name, lat, lon, quote) in its JSON objects.', 'jeo' );
					break;
				}
			}
		} else {
			// Array is empty (count == 0). This is VALID if the AI correctly filtered out locations based on user prompt.
			$msg = __( 'Prompt successfully validated! The AI returned an empty array, which means your filtering rules worked perfectly for the test text.', 'jeo' );
		}

		return new \WP_REST_Response(
			array(
				'success' => $is_valid,
				'message' => $msg,
				'data'    => $result,
			),
			200
		);
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
		return __( 'You are a highly skilled geographer API. Analyze the text and extract locations. You MUST respond ONLY with a raw JSON array of objects, each containing "name", "lat" (string/float), "lon" (string/float), "quote" (a short relevant snippet from the text where the location was mentioned), and "confidence" (an integer 0-100). If no locations are found, return exactly []. Do not use markdown backticks, do not include any conversational text. Output MUST start with [ and end with ].', 'jeo' );
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
			$log_file   = trailingslashit( $upload_dir['basedir'] ) . 'jeo-ai-debug.log';
		}

		if ( ! file_exists( $log_file ) ) {
			return array();
		}

		$content = file_get_contents( $log_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( false === $content || empty( $content ) ) {
			return array();
		}

		// Split logs by the separator line.
		$entries_raw = explode( str_repeat( '=', 80 ) . "\n\n", $content );

		// Clean empty ends.
		$entries_raw = array_filter( array_map( 'trim', $entries_raw ) );

		$parsed_entries = array();

		foreach ( $entries_raw as $raw_entry ) {
			if ( empty( $raw_entry ) ) {
				continue;
			}

			// Extract components using basic regex/strpos.
			$timestamp = '';
			$provider  = '';
			$input     = '';
			$output    = '';

			if ( preg_match( '/^\[(.*?)\] PROVIDER: (.*?)\n/s', $raw_entry, $matches ) ) {
				$timestamp = $matches[1];
				$provider  = trim( $matches[2] );
			}

			// Find INPUT section.
			if ( preg_match( '/INPUT \(Prompt\):\n(.*?)\nOUTPUT \(Raw Response\):/s', $raw_entry, $matches ) ) {
				$input = trim( $matches[1] );
			}

			// Find OUTPUT section.
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

		// Reverse to get newest first and slice.
		$parsed_entries = array_reverse( $parsed_entries );
		return array_slice( $parsed_entries, 0, $limit );
	}

	/**
	 * REST Callback: Trigger a backup.
	 */
	public function api_backup_store() {
		$result = \jeo_rag_backup()->do_backup();
		if ( is_wp_error( $result ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $result->get_error_message(),
				),
				500
			);
		}
		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Backup created successfully!', 'jeo' ),
			),
			200
		);
	}

	/**
	 * REST Callback: List backups.
	 */
	public function api_list_backups() {
		return new \WP_REST_Response( \jeo_rag_backup()->get_backups(), 200 );
	}

	/**
	 * REST Callback: Delete a backup.
	 *
	 * @param \WP_REST_Request $request Current REST request.
	 */
	public function api_delete_backup( $request ) {
		$filename = $request->get_param( 'filename' );
		if ( empty( $filename ) ) {
			return new \WP_REST_Response( array( 'error' => 'Missing filename' ), 400 );
		}

		$uploads   = wp_upload_dir();
		$file_path = $uploads['basedir'] . '/jeo-ai-store/backups/' . sanitize_file_name( $filename );

		if ( file_exists( $file_path ) && str_ends_with( $file_path, '.zip' ) ) {
			wp_delete_file( $file_path );
			return new \WP_REST_Response( array( 'success' => true ), 200 );
		}

		return new \WP_REST_Response( array( 'error' => 'File not found' ), 404 );
	}
}
