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
					'message' => __( 'Post not found.', 'jeo' ),
				),
				404
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeo' ),
				),
				400
			);
		}

		$initial_context = 'A post is available for analysis (post_id: ' . $post_id . ', title: "' . $post->post_title . '"). Generate editorial suggestions based on its content.';

		try {
			$result = $this->run_agent(
				$post_id,
				$conversation_id,
				$user_id,
				'Generate editorial suggestions for this post based on its content.',
				$initial_context
			);

			$response = $result->to_rest_response();
			$this->persist_initial_context( $post_id, $conversation_id, $response );
			$this->save_context_state( $post_id, $conversation_id, $response );
			$this->save_chat_message(
				$post_id,
				'user',
				__( 'Generate editorial suggestions for this post based on its content.', 'jeo' )
			);
			$this->save_chat_message(
				$post_id,
				'assistant',
				$response['assistant_message'] ?? __( 'Suggestions generated.', 'jeo' )
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
					'message' => __( 'conversation_id is required.', 'jeo' ),
				),
				400
			);
		}

		if ( empty( $post_id ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'A post ID is required.', 'jeo' ),
				),
				400
			);
		}

		if ( ! get_post( $post_id ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'Post not found.', 'jeo' ),
				),
				404
			);
		}

		if ( empty( $message ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'A message is required.', 'jeo' ),
				),
				400
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'No AI provider configured. Set one in JEO AI Settings.', 'jeo' ),
				),
				400
			);
		}

		$state_context = $this->build_state_context( $request );

		try {
			$result = $this->run_agent(
				$post_id,
				$conversation_id,
				$user_id,
				$message,
				$state_context
			);

			$response = $result->to_rest_response();
			$this->save_chat_message( $post_id, 'user', $message );
			$this->save_chat_message(
				$post_id,
				'assistant',
				$response['assistant_message'] ?? __( 'Suggestions updated.', 'jeo' )
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
		$assistant = Context_Agent::create( $post_id, $conversation_id, $user_id ? $user_id : null, $state_context );

		$store = new ConversationStore( new WP_Storage( $post_id, 'post' ) );
		$this->inject_history( $assistant, $store, $conversation_id );

		try {
			$result = $assistant->structured( new UserMessage( $message ) );
		} catch ( \TypeError $e ) {
			if ( false !== strpos( $e->getMessage(), 'getJson()' ) ) {
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- exception message, not HTML output.
				throw new \Exception( esc_html__( 'The AI returned an empty response. Please try again.', 'jeo' ), 0, $e );
			}
			throw $e;
		}

		$this->persist_history( $assistant, $store, $conversation_id );

		return $result;
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
			$parts[] = '\nSuggested paragraphs: ' . count( $paragraphs );
		} else {
			$parts[] = '\nSuggested paragraphs: none';
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
			$parts[] = 'Previously suggested paragraphs: ' . count( $paragraphs );
		}

		$references = $raw_state['references'] ?? array();
		if ( ! empty( $references ) ) {
			$parts[] = 'Previously suggested references: ' . count( $references );
		}

		$parts[] = "\nWhen refining, preserve the existing suggestions unless the user explicitly asks to change them.";

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
					'message' => __( 'Post not found.', 'jeo' ),
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
				$messages[] = array(
					'role'    => $msg['role'],
					'content' => $msg['content'],
				);
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

		return new \WP_REST_Response( $response, 200 );
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
	 * Append a clean chat message to the dedicated chat messages meta.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $role    'user' or 'assistant'.
	 * @param string $content Message content.
	 */
	private function save_chat_message( int $post_id, string $role, string $content ): void {
		$messages = get_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY, true );
		if ( ! is_array( $messages ) ) {
			$messages = array();
		}

		$messages[] = array(
			'role'    => $role,
			'content' => $content,
		);

		update_post_meta( $post_id, self::CHAT_MESSAGES_META_KEY, $messages );
	}
}
