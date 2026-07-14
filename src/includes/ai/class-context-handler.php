<?php
/**
 * AI Context Assistant — REST handler for editorial suggestions.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Persistence\ConversationStore;
use Jeo\Singleton;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\ToolCallMessage;
use NeuronAI\Chat\Messages\ToolResultMessage;
use NeuronAI\Chat\Messages\UserMessage;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI-assisted editorial context generation backend.
 *
 * Provides REST endpoints that analyse the current post content via RAG,
 * suggest new paragraphs, and manage multi-turn conversation for refinement.
 */
class Context_Handler {

	use Singleton;

	/**
	 * Bootstrap hooks.
	 *
	 * @return void
	 */
	/**
	 * Meta key for storing the active conversation ID.
	 *
	 * @var string
	 */
	const CONVERSATION_META_KEY = '_jeo_ai_context_conversation_id';

	/**
	 * Meta key for storing the last assistant response.
	 *
	 * @var string
	 */
	const LAST_RESPONSE_META_KEY = '_jeo_ai_context_last_response';

	/**
	 * Meta key for storing clean chat messages (user + assistant_message only).
	 *
	 * @var string
	 */
	const CHAT_MESSAGES_META_KEY = '_jeo_ai_context_chat_messages';

	/**
	 * Meta key for storing the archive of suggestion versions, so the editor can
	 * browse and reuse previous suggestions that were replaced during refinement.
	 *
	 * @var string
	 */
	const SUGGESTION_HISTORY_META_KEY = '_jeo_ai_context_suggestion_history';

	/**
	 * Maximum number of suggestion versions to keep in the archive.
	 *
	 * @var int
	 */
	const SUGGESTION_HISTORY_LIMIT = 20;

	/**
	 * Bootstrap hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'init', array( $this, 'register_post_meta' ), 99 );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Register post meta for context assistant state.
	 *
	 * @return void
	 */
	public function register_post_meta() {
		$post_types = apply_filters( 'jeo_enabled_post_types', \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) ) );

		foreach ( $post_types as $post_type ) {
			register_post_meta(
				$post_type,
				self::CONVERSATION_META_KEY,
				array(
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'string',
					'auth_callback' => fn() => current_user_can( 'edit_posts' ),
				)
			);

			register_post_meta(
				$post_type,
				self::LAST_RESPONSE_META_KEY,
				array(
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'object',
					'auth_callback' => fn() => current_user_can( 'edit_posts' ),
				)
			);

			register_post_meta(
				$post_type,
				self::CHAT_MESSAGES_META_KEY,
				array(
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'object',
					'auth_callback' => fn() => current_user_can( 'edit_posts' ),
				)
			);

			register_post_meta(
				$post_type,
				self::SUGGESTION_HISTORY_META_KEY,
				array(
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => 'object',
					'auth_callback' => fn() => current_user_can( 'edit_posts' ),
				)
			);
		}
	}

	/**
	 * Register REST routes for the context generation feature.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/context/setup',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_setup' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/context/chat',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_chat' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/context/state',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'api_get_state' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/context/clear',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_clear' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/context/engineer-prompt',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_engineer_prompt' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'prompt' => array(
						'required'  => true,
						'type'      => 'string',
						'minLength' => 1,
					),
				),
			)
		);
	}

	/**
	 * REST callback: generate initial editorial suggestions for a given post.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_setup( $request ) {
		$post_id         = (int) $request->get_param( 'post_id' );
		$conversation_id = sanitize_text_field( $request->get_param( 'conversation_id' ) );
		$user_id         = get_current_user_id();

		$post = get_post( $post_id );
		if ( ! $post ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'jeowp' ),
				),
				404
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeowp' ),
				),
				400
			);
		}

		$locale          = get_locale();
		$initial_context = 'A post is available for analysis (post_id: ' . $post_id . ', title: "' . $post->post_title . '"). The WordPress site language is ' . $locale . '. You MUST respond in this language for all messages, questions, and suggestions.';

		// If the post has very little content, ask the user for more info instead of calling the AI.
		$content_length = strlen( trim( wp_strip_all_tags( $post->post_content ) ) );
		if ( $content_length < 100 ) {
			$assistant_message = __( 'The article seems to have very little content. Please write a bit more about the topic, or tell me what you would like suggestions about (e.g. territory, entities, angles).', 'jeowp' );
			$this->save_chat_message( $post_id, 'user', __( 'Generate editorial suggestions for this post based on its content.', 'jeowp' ), $user_id );
			$this->save_chat_message( $post_id, 'assistant', $assistant_message );

			return new \WP_REST_Response(
				array(
					'success'           => true,
					'paragraphs'        => array(),
					'references'        => array(),
					'message'           => __( 'Waiting for more content or directions.', 'jeowp' ),
					'assistant_message' => $assistant_message,
				),
				200
			);
		}

		try {
			$result = $this->run_agent(
				$post_id,
				$conversation_id,
				$user_id,
				'Analyze this post and ask the user 1-2 clarifying questions about what editorial suggestions they would like, considering the territories and entities mentioned. Do NOT generate paragraph suggestions yet.',
				$initial_context
			);

			$response                      = $result->to_rest_response();
			$response                      = $this->validate_generated_output( $response );
			$response['assistant_message'] = wp_strip_all_tags( $response['assistant_message'] ?? '' );
			$response['message']           = wp_strip_all_tags( $response['message'] ?? '' );

			$this->save_context_state( $post_id, $conversation_id, $response );
			$this->append_suggestion_history(
				$post_id,
				__( 'Initial suggestions', 'jeowp' ),
				$response
			);
			$this->save_chat_message(
				$post_id,
				'user',
				__( 'Generate editorial suggestions for this post based on its content.', 'jeowp' ),
				$user_id
			);
			$this->save_chat_message(
				$post_id,
				'assistant',
				$response['assistant_message'] ?? __( 'Suggestions generated.', 'jeowp' )
			);

			return new \WP_REST_Response( $response, 200 );
		} catch ( \Exception $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage(),
				),
				500
			);
		}
	}

	/**
	 * REST callback: refine suggestions via multi-turn conversation.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_chat( $request ) {
		$conversation_id = sanitize_text_field( $request->get_param( 'conversation_id' ) );
		$post_id         = (int) $request->get_param( 'post_id' );
		$message         = sanitize_textarea_field( $request->get_param( 'message' ) );
		$user_id         = get_current_user_id();

		if ( empty( $conversation_id ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'conversation_id is required.', 'jeowp' ),
				),
				400
			);
		}

		if ( empty( $post_id ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'A post ID is required.', 'jeowp' ),
				),
				400
			);
		}

		if ( ! get_post( $post_id ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'jeowp' ),
				),
				404
			);
		}

		if ( empty( $message ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'A message is required.', 'jeowp' ),
				),
				400
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeowp' ),
				),
				400
			);
		}

		$state_context = $this->build_state_context( $request );
		$post          = get_post( $post_id );
		$locale        = get_locale();
		$live_context  = 'A post is being edited (post_id: ' . $post_id . ', title: "' . ( $post ? $post->post_title : '' ) . '"). Use its content for context when generating suggestions. The WordPress site language is ' . $locale . '. You MUST respond in this language for all messages, questions, and suggestions.';
		if ( ! empty( $state_context ) ) {
			$live_context .= "\n\n" . $state_context;
		}

		try {
			$result = $this->run_agent(
				$post_id,
				$conversation_id,
				$user_id,
				$message,
				$live_context
			);

			$response                      = $result->to_rest_response();
			$response                      = $this->validate_generated_output( $response );
			$response['assistant_message'] = wp_strip_all_tags( $response['assistant_message'] ?? '' );
			$response['message']           = wp_strip_all_tags( $response['message'] ?? '' );

			// Persist the refined response so it is restored on reload, and archive
			// this version so the editor can revisit it after further refinement.
			$this->save_context_state( $post_id, $conversation_id, $response );
			$this->append_suggestion_history( $post_id, $message, $response );
			$this->save_chat_message( $post_id, 'user', $message, $user_id );
			$this->save_chat_message(
				$post_id,
				'assistant',
				$response['assistant_message'] ?? __( 'Suggestions updated.', 'jeowp' )
			);

			return new \WP_REST_Response( $response, 200 );
		} catch ( \Exception $e ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => $e->getMessage(),
				),
				500
			);
		}
	}

	/**
	 * Run the context agent and return a Context_Generation_Output.
	 *
	 * @param int         $post_id         Post ID.
	 * @param string      $conversation_id Conversation UUID.
	 * @param int         $user_id         User ID.
	 * @param string      $message         User message to the agent.
	 * @param string|null $state_context   Current state context for the system prompt.
	 * @return Context_Generation_Output
	 * @throws \Exception On agent failure or empty AI response.
	 * @throws \TypeError On unexpected type errors from the AI library.
	 */
	private function run_agent( int $post_id, string $conversation_id, int $user_id, string $message, ?string $state_context = null ): Context_Generation_Output {
		$max_retries = 3;
		$last_error  = null;

		for ( $attempt = 0; $attempt <= $max_retries; $attempt++ ) {
			if ( $attempt > 0 ) {
				sleep( min( $attempt * 2, 8 ) );
			}

			try {
				$assistant = Context_Agent::create( $post_id, $conversation_id, $user_id ? $user_id : null, $state_context );
				$store     = new ConversationStore( new WP_Storage( $post_id, 'post' ) );
				$this->inject_history( $assistant, $store, $conversation_id );

				$result = $assistant->structured( new UserMessage( $message ) );
				$this->persist_history( $assistant, $store, $conversation_id );

				return $result;
			} catch ( \TypeError $e ) {
				$last_error = $e;
				if ( false === strpos( $e->getMessage(), 'getJson()' ) ) {
					throw $e;
				}
				// Empty response — retry.
			} catch ( \Exception $e ) {
				$last_error = $e;
				$msg        = $e->getMessage();

				// Non-retryable errors: auth, invalid config, rate limit (4xx except 429).
				if ( preg_match( '/\b4(?:0[0-9]|1[0-7]|2[2-9]|[3-9][0-9])\b/', $msg ) ) {
					throw $e;
				}

				// Retryable: network errors, 5xx, 429, timeouts, empty responses, empty body.
				if ( $attempt >= $max_retries ) {
					break;
				}
				// Continue to next retry.
			}
		}

		throw new \Exception(
			esc_html__( 'The AI did not respond after multiple attempts. Please try again or rephrase your request.', 'jeowp' ),
			0,
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- previous exception object, not HTML output.
			$last_error
		);
	}

	/**
	 * Inject prior conversation messages into the assistant's chat history.
	 *
	 * @param \HackLab\AIAssistant\Assistant $assistant       Configured assistant.
	 * @param ConversationStore              $store           Conversation store.
	 * @param string                         $conversation_id Thread ID.
	 */
	private function inject_history( $assistant, ConversationStore $store, string $conversation_id ): void {
		$raw_messages = $store->loadThread( $conversation_id );
		if ( empty( $raw_messages ) ) {
			return;
		}

		$history = $assistant->getChatHistory();
		foreach ( $raw_messages as $msg ) {
			if ( ! is_array( $msg ) || empty( $msg['role'] ) || empty( $msg['content'] ) ) {
				continue;
			}

			$text = is_string( $msg['content'] ) ? $msg['content'] : wp_json_encode( $msg['content'] );
			if ( 'assistant' === $msg['role'] ) {
				$history->addMessage( new AssistantMessage( $text ) );
			} else {
				$history->addMessage( new UserMessage( $text ) );
			}
		}
	}

	/**
	 * Persist the assistant's chat history after a structured call.
	 *
	 * Only stores user and assistant text messages for context continuity.
	 *
	 * @param \HackLab\AIAssistant\Assistant $assistant       Configured assistant.
	 * @param ConversationStore              $store           Conversation store.
	 * @param string                         $conversation_id Thread ID.
	 */
	private function persist_history( $assistant, ConversationStore $store, string $conversation_id ): void {
		$messages = $assistant->getChatHistory()->getMessages();
		$storable = array();

		foreach ( $messages as $msg ) {
			if ( $msg instanceof ToolCallMessage || $msg instanceof ToolResultMessage ) {
				continue;
			}

			$role = $msg->getRole();
			if ( ! in_array( $role, array( 'user', 'assistant' ), true ) ) {
				continue;
			}
			$content = $msg->getContent();
			if ( empty( $content ) ) {
				continue;
			}
			$storable[] = array(
				'role'    => $role,
				'content' => $content,
			);
		}

		$store->saveThread( $conversation_id, $storable );
	}

	/**
	 * Persist a synthetic conversation thread for the initial setup.
	 *
	 * @param int    $post_id         Post ID.
	 * @param string $conversation_id Conversation UUID.
	 * @param array  $response_data   Generated response data.
	 */
	private function persist_initial_context( int $post_id, string $conversation_id, array $response_data ): void {
		$store = new ConversationStore( new WP_Storage( $post_id, 'post' ) );

		$parts = array( 'Editorial suggestions generated from post content:' );

		$paragraphs = $response_data['paragraphs'] ?? array();
		if ( ! empty( $paragraphs ) ) {
			$parts[] = "\nSuggested paragraphs: " . count( $paragraphs );
		} else {
			$parts[] = "\nSuggested paragraphs: none";
		}

		$references = $response_data['references'] ?? array();
		if ( ! empty( $references ) ) {
			$ref_lines = array();
			foreach ( $references as $ref ) {
				$ref_lines[] = '- ' . ( $ref['title'] ?? '' ) . ' (ID: ' . ( $ref['post_id'] ?? 0 ) . ')';
			}
			$parts[] = "\nRelated articles:\n" . implode( "\n", $ref_lines );
		}

		if ( ! empty( $response_data['message'] ) ) {
			$parts[] = 'Notes: ' . $response_data['message'];
		}

		$assistant_content = implode( "\n", $parts );

		$store->saveThread(
			$conversation_id,
			array(
				array(
					'role'    => 'user',
					'content' => 'Generate editorial suggestions for this post based on its content.',
				),
				array(
					'role'    => 'assistant',
					'content' => $assistant_content,
				),
			)
		);
	}

	/**
	 * Verify that every contextual link in generated paragraphs points to a known
	 * reference and that the anchor text is present in the referenced article.
	 *
	 * Links that fail validation are converted to plain text and a note is appended
	 * to `assistant_message`. This reduces hallucinated citations and references
	 * that do not actually support the linked phrase.
	 *
	 * @param array $response Raw response from the agent.
	 * @return array Validated response.
	 */
	private function validate_generated_output( array $response ): array {
		$paragraphs = $response['paragraphs'] ?? array();
		$references = $response['references'] ?? array();
		if ( empty( $paragraphs ) || empty( $references ) ) {
			return $response;
		}

		$refs_by_url = array();
		foreach ( $references as $ref ) {
			$url = $ref['url'] ?? '';
			if ( $url ) {
				$refs_by_url[ $url ] = $ref;
			}
		}

		$warnings = array();

		foreach ( $paragraphs as $idx => $paragraph ) {
			$text = $paragraph['text'] ?? '';
			if ( empty( $text ) ) {
				continue;
			}

			$new_text = preg_replace_callback(
				'/<a\s+href=["\']([^"\']+)["\']\s*>(.*?)<\/a>/i',
				function ( $matches ) use ( $refs_by_url, &$warnings ) {
					$url    = $matches[1];
					$anchor = wp_strip_all_tags( $matches[2] );

					if ( ! isset( $refs_by_url[ $url ] ) ) {
						$warnings[] = sprintf(
							/* translators: %s: linked URL */
							__( 'Link to %s removed: not listed in references.', 'jeowp' ),
							esc_url( $url )
						);
						return $anchor;
					}

					$ref      = $refs_by_url[ $url ];
					$ref_post = get_post( $ref['post_id'] ?? 0 );

					if ( $ref_post ) {
						$haystack = $ref_post->post_title . ' ' . $ref_post->post_excerpt . ' ' . wp_strip_all_tags( $ref_post->post_content );
					} else {
						$haystack = ( $ref['title'] ?? '' ) . ' ' . ( $ref['reason'] ?? '' );
					}

					$haystack_lower = mb_strtolower( $haystack );
					$needle_lower   = mb_strtolower( $anchor );

					// Strip punctuation for a tolerant match.
					$needle_clean   = preg_replace( '/[^\p{L}\p{N}\s]/u', '', $needle_lower );
					$haystack_clean = preg_replace( '/[^\p{L}\p{N}\s]/u', '', $haystack_lower );

					if ( empty( $needle_clean ) || false === strpos( $haystack_clean, $needle_clean ) ) {
						$warnings[] = sprintf(
							/* translators: %s: link anchor text */
							__( 'Link to "%s" removed: anchor not found in reference.', 'jeowp' ),
							$anchor
						);
						return $anchor;
					}

					return $matches[0];
				},
				$text
			);

			if ( $new_text !== $text ) {
				$response['paragraphs'][ $idx ]['text'] = $new_text;
			}
		}

		if ( ! empty( $warnings ) && ! empty( $response['assistant_message'] ) ) {
			$response['assistant_message'] .= "\n\n" . __( 'Verification notes:', 'jeowp' ) . "\n" . implode( "\n", array_unique( $warnings ) );
		}

		return $response;
	}

	/**
	 * Strip all HTML tags except inline formatting and link tags.
	 *
	 * Preserves <a>, <strong>, <b>, <em>, <i>, <br> so the AI can see
	 * existing links and formatting when refining suggestions.
	 *
	 * @param string $html HTML content to filter.
	 * @return string Filtered content with only inline tags preserved.
	 */
	private static function strip_non_inline_tags( string $html ): string {
		$allowed = array(
			'a'      => array(
				'href' => true,
			),
			'strong' => array(),
			'b'      => array(),
			'em'     => array(),
			'i'      => array(),
			'br'     => array(),
			'span'   => array(),
		);

		if ( false !== stripos( $html, '<span' ) ) {
			if ( preg_match_all( '/<span\s+([^>]*)>/i', $html, $matches ) ) {
				foreach ( $matches[1] as $attr_string ) {
					if ( preg_match_all( '/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=/i', $attr_string, $attr_matches ) ) {
						foreach ( $attr_matches[1] as $attr_name ) {
							$attr_lower = strtolower( $attr_name );
							if ( 0 !== strpos( $attr_lower, 'on' ) ) {
								$allowed['span'][ $attr_lower ] = true;
							}
						}
					}
				}
			}
		}

		return wp_kses( $html, $allowed );
	}

	/**
	 * Build a context string describing the current state from the request.
	 *
	 * @param \WP_REST_Request $request REST request containing current_state.
	 * @return string|null Context string or null if no state provided.
	 */
	private function build_state_context( $request ): ?string {
		$raw_state = $request->get_param( 'current_state' );
		if ( empty( $raw_state ) || ! is_array( $raw_state ) ) {
			return null;
		}

		$parts = array( 'Current conversation state from the editor:' );

		$paragraphs = $raw_state['paragraphs'] ?? array();
		if ( ! empty( $paragraphs ) ) {
			$parts[] = 'Previously suggested paragraphs (' . count( $paragraphs ) . '):';
			foreach ( $paragraphs as $i => $para ) {
				$text    = isset( $para['text'] ) ? self::strip_non_inline_tags( $para['text'] ) : '';
				$parts[] = sprintf( '  %d. %s', $i + 1, $text );
			}
		}

		$references = $raw_state['references'] ?? array();
		if ( ! empty( $references ) ) {
			$ref_lines = array();
			foreach ( $references as $ref ) {
				$title       = $ref['title'] ?? '';
				$post_id     = $ref['post_id'] ?? 0;
				$ref_lines[] = "  - {$title} (ID: {$post_id})";
			}
			$parts[] = 'Previously suggested references (' . count( $references ) . "):\n" . implode( "\n", $ref_lines );
		}

		$parts[] = "\nWhen refining, you MUST return the FULL set of paragraphs (including unmodified ones) with the requested changes applied. Do NOT return an empty paragraphs array when the user asks to modify, add a link to, or adjust an existing suggestion. To add a link to a specific paragraph, identify it by its content or number, add the <a href=\"URL\">anchor</a> tag around the relevant phrase, ensure the referenced article is in the references array, and return all paragraphs.";

		return implode( "\n", $parts );
	}

	/**
	 * REST callback: get the current context assistant state for a post.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_get_state( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		$post = get_post( $post_id );
		if ( ! $post ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'jeowp' ),
				),
				404
			);
		}

		$conversation_id = get_post_meta( $post_id, self::CONVERSATION_META_KEY, true );
		$last_response   = get_post_meta( $post_id, self::LAST_RESPONSE_META_KEY, true );

		if ( empty( $conversation_id ) ) {
			return new \WP_REST_Response(
				array(
					'success'     => true,
					'has_started' => false,
				),
				200
			);
		}

		$chat_messages = get_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY, true );
		$messages      = array();

		if ( ! empty( $chat_messages ) && is_array( $chat_messages ) ) {
			foreach ( $chat_messages as $msg ) {
				if ( ! is_array( $msg ) || empty( $msg['role'] ) || empty( $msg['content'] ) ) {
					continue;
				}
				$formatted = array(
					'role'    => $msg['role'],
					'content' => $msg['content'],
				);
				if ( 'user' === $msg['role'] && ! empty( $msg['user_id'] ) ) {
					$user = get_userdata( (int) $msg['user_id'] );
					if ( $user ) {
						$formatted['username'] = $user->display_name;
					}
				}
				$messages[] = $formatted;
			}
		}

		$response = array(
			'success'         => true,
			'has_started'     => true,
			'conversation_id' => $conversation_id,
			'messages'        => $messages,
		);

		if ( ! empty( $last_response ) && is_array( $last_response ) ) {
			$response['paragraphs'] = $last_response['paragraphs'] ?? array();
			$response['references'] = $last_response['references'] ?? array();
			if ( ! empty( $last_response['message'] ) ) {
				$response['message'] = $last_response['message'];
			}
		}

		$history             = get_post_meta( $post_id, self::SUGGESTION_HISTORY_META_KEY, true );
		$response['history'] = is_array( $history ) ? $history : array();

		return new \WP_REST_Response( $response, 200 );
	}

	/**
	 * REST callback: clear all context assistant state for a post.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_clear( $request ) {
		$post_id = (int) $request->get_param( 'post_id' );

		$post = get_post( $post_id );
		if ( ! $post ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'jeowp' ),
				),
				404
			);
		}

		$conversation_id = get_post_meta( $post_id, self::CONVERSATION_META_KEY, true );

		delete_post_meta( $post_id, self::CONVERSATION_META_KEY );
		delete_post_meta( $post_id, self::LAST_RESPONSE_META_KEY );
		delete_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY );
		delete_post_meta( $post_id, self::SUGGESTION_HISTORY_META_KEY );

		if ( ! empty( $conversation_id ) ) {
			$store = new ConversationStore( new WP_Storage( $post_id, 'post' ) );
			$store->deleteThread( $conversation_id );
		}

		return new \WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Conversation cleared.', 'jeowp' ),
			),
			200
		);
	}

	/**
	 * REST callback: use the configured AI provider to engineer a custom system prompt.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_engineer_prompt( $request ) {
		$prompt = sanitize_textarea_field( $request->get_param( 'prompt' ) );

		if ( empty( $prompt ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Prompt is required.', 'jeowp' ),
				),
				400
			);
		}

		$result = Context_Agent::engineer_custom_prompt( $prompt );

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
				'prompt'  => $result,
			),
			200
		);
	}

	/**
	 * Save conversation ID and last response to post meta.
	 *
	 * @param int    $post_id         Post ID.
	 * @param string $conversation_id Conversation UUID.
	 * @param array  $response_data   Response data to persist.
	 */
	private function save_context_state( int $post_id, string $conversation_id, array $response_data ): void {
		update_post_meta( $post_id, self::CONVERSATION_META_KEY, $conversation_id );
		update_post_meta(
			$post_id,
			self::LAST_RESPONSE_META_KEY,
			array(
				'paragraphs' => $response_data['paragraphs'] ?? array(),
				'references' => $response_data['references'] ?? array(),
				'message'    => $response_data['message'] ?? '',
			)
		);
	}

	/**
	 * Append a suggestion version to the archive so the editor can revisit and reuse
	 * suggestions that were later replaced during refinement.
	 *
	 * Only versions that actually contain paragraphs are archived (the initial setup
	 * turn typically only asks clarifying questions). The archive is capped to
	 * SUGGESTION_HISTORY_LIMIT entries (oldest dropped first).
	 *
	 * @param int    $post_id       Post ID.
	 * @param string $label         Short label (e.g. the user message that produced it).
	 * @param array  $response_data Response data containing paragraphs/references.
	 * @return void
	 */
	private function append_suggestion_history( int $post_id, string $label, array $response_data ): void {
		$paragraphs = $response_data['paragraphs'] ?? array();
		if ( empty( $paragraphs ) ) {
			return;
		}

		$history = get_post_meta( $post_id, self::SUGGESTION_HISTORY_META_KEY, true );
		if ( ! is_array( $history ) ) {
			$history = array();
		}

		$history[] = array(
			'label'      => $label,
			'paragraphs' => $paragraphs,
			'references' => $response_data['references'] ?? array(),
			'timestamp'  => current_time( 'mysql' ),
		);

		if ( count( $history ) > self::SUGGESTION_HISTORY_LIMIT ) {
			$history = array_slice( $history, -self::SUGGESTION_HISTORY_LIMIT );
		}

		update_post_meta( $post_id, self::SUGGESTION_HISTORY_META_KEY, $history );
	}

	/**
	 * Append a clean chat message to the dedicated chat messages meta.
	 *
	 * @param int      $post_id Post ID.
	 * @param string   $role    'user' or 'assistant'.
	 * @param string   $content Message content.
	 * @param int|null $user_id WordPress user ID (only for user messages).
	 */
	private function save_chat_message( int $post_id, string $role, string $content, ?int $user_id = null ): void {
		$messages = get_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY, true );
		if ( ! is_array( $messages ) ) {
			$messages = array();
		}

		$entry = array(
			'role'      => $role,
			'content'   => $content,
			'timestamp' => current_time( 'mysql' ),
		);
		if ( null !== $user_id ) {
			$entry['user_id'] = $user_id;
		}

		$messages[] = $entry;

		update_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY, $messages );
	}
}
