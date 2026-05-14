<?php
/**
 * Minimap block — AI-assisted contextual map for posts.
 *
 * @package Jeo
 */

namespace Jeo;

use HackLab\AIAssistant\Persistence\ConversationStore;
use Jeo\AI\Minimap_Agent;
use Jeo\AI\Minimap_Output;
use Jeo\AI\RAG_Worker;
use Jeo\AI\WP_Storage;
use Jeo\Singleton;
use NeuronAI\Chat\Messages\AssistantMessage;
use NeuronAI\Chat\Messages\ToolCallMessage;
use NeuronAI\Chat\Messages\ToolResultMessage;
use NeuronAI\Chat\Messages\UserMessage;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * AI-assisted minimap block backend.
 *
 * Provides a REST endpoint that analyses the current post content via RAG,
 * selects or creates a contrasting base terrain layer, computes center/zoom
 * from the post's geolocation points, and returns everything the block needs.
 */
class Minimap {

	use Singleton;

	/**
	 * Meta key used to tag auto-created base layer CPTs.
	 *
	 * @var string
	 */
	const BASE_LAYER_META_KEY = '_jeo_is_base_layer';

	/**
	 * JEO core CPT slugs that should not receive the minimap block.
	 *
	 * @var string[]
	 */
	const JEO_CPT_SLUGS = array( 'map', 'map-layer', 'storymap' );

	/**
	 * Bootstrap hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_filter( 'block_type_metadata', array( $this, 'restrict_block_to_enabled_post_types' ) );
	}

	/**
	 * Restrict jeo/ai-minimap to enabled (non-JEO-CPT) post types.
	 *
	 * @param array $metadata Block type metadata.
	 * @return array
	 */
	public function restrict_block_to_enabled_post_types( $metadata ) {
		if ( 'jeo/ai-minimap' !== $metadata['name'] ) {
			return $metadata;
		}

		$enabled = \jeo_settings()->get_option( 'enabled_post_types', array( 'post' ) );
		$allowed = array_values( array_diff( $enabled, self::JEO_CPT_SLUGS ) );

		if ( ! empty( $allowed ) ) {
			$metadata['allowed_post_types'] = $allowed;
		}

		return $metadata;
	}

	/**
	 * Register REST routes for the minimap feature.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/minimap/setup',
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
			'/minimap/setup-prompt',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_setup_prompt' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);

		register_rest_route(
			'jeo/v1',
			'/minimap/chat',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'api_chat' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * REST callback: build minimap data for a given post.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_setup( $request ) {
		$post_id         = (int) $request->get_param( 'post_id' );
		$conversation_id = sanitize_text_field( $request->get_param( 'conversation_id' ) );
		$raw_top_k       = $request->get_param( 'top_k' );
		$top_k           = $raw_top_k ? (int) $raw_top_k : 5;

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

		$search_text = $post->post_title . "\n\n" . wp_strip_all_tags( $post->post_content );

		$layers      = array();
		$rag_message = '';

		try {
			$results = RAG_Worker::find_matching_layers( $search_text, $top_k );
			foreach ( $results as $result ) {
				$layer_id = (int) $result['layer_id'];
				if ( $layer_id && 'publish' === get_post_status( $layer_id ) ) {
					$layers[] = array(
						'id'          => $layer_id,
						'use'         => 'fixed',
						'default'     => true,
						'show_legend' => true,
					);
				}
			}
		} catch ( \Exception $e ) {
			$rag_message = $e->getMessage();
		}

		if ( empty( $layers ) ) {
			$rag_message = $rag_message ? $rag_message : __( 'No matching layers found. Add layers manually or run the RAG indexer in JEO Settings.', 'jeo' );
		}

		$base_variant = $this->determine_base_variant( $layers );
		$base_layer   = $this->get_or_create_base_layer( $base_variant );

		$center_zoom = $this->compute_center_zoom( $post_id );

		$pins = $this->get_pins( $post_id );

		$response_data = array(
			'success'      => true,
			'layers'       => $layers,
			'base_layer'   => $base_layer,
			'center_lat'   => $center_zoom['lat'],
			'center_lon'   => $center_zoom['lon'],
			'initial_zoom' => $center_zoom['zoom'],
			'pins'         => $pins,
			'message'      => $rag_message,
		);

		if ( ! empty( $conversation_id ) ) {
			$this->persist_initial_context( $post_id, $conversation_id, $response_data );
		}

		return new \WP_REST_Response( $response_data, 200 );
	}

	/**
	 * REST callback: build minimap data from a text prompt.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_setup_prompt( $request ) {
		$prompt          = sanitize_textarea_field( $request->get_param( 'prompt' ) );
		$post_id         = (int) $request->get_param( 'post_id' );
		$conversation_id = sanitize_text_field( $request->get_param( 'conversation_id' ) );
		$user_id         = get_current_user_id();

		if ( empty( $prompt ) ) {
			return new \WP_REST_Response(
				array(
					'success' => false,
					'message' => __( 'A prompt is required.', 'jeo' ),
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

		try {
			$state_context = null;
			if ( $post_id ) {
				$post = get_post( $post_id );
				if ( $post ) {
					$state_context = 'A post is available for analysis (post_id: ' . $post_id . ', title: "' . $post->post_title . '"). You may delegate to the post_analyzer sub-agent to extract geographic context from the post content.';
				}
			}

			$result = $this->run_agent(
				$post_id ? $post_id : 0,
				$conversation_id,
				$user_id,
				$prompt,
				$state_context
			);

			return new \WP_REST_Response( $result->to_rest_response(), 200 );
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
	 * REST callback: refine a minimap via multi-turn conversation.
	 *
	 * @param \WP_REST_Request $request REST request.
	 * @return \WP_REST_Response
	 */
	public function api_chat( $request ) {
		$conversation_id = sanitize_text_field( $request->get_param( 'conversation_id' ) );
		$post_id         = (int) $request->get_param( 'post_id' );
		$message         = sanitize_textarea_field( $request->get_param( 'message' ) );
		$type_param      = sanitize_text_field( $request->get_param( 'type' ) );
		$type            = ! empty( $type_param ) ? $type_param : 'text';
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

		if ( empty( $message ) && 'regenerate' !== $type ) {
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

		$resolved_message = $this->resolve_structured_message( $type, $message, $request );

		$state_context = $this->build_state_context( $request );

		try {
			$result = $this->run_agent(
				$post_id,
				$conversation_id,
				$user_id,
				$resolved_message,
				$state_context
			);

			return new \WP_REST_Response( $result->to_rest_response(), 200 );
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
	 * Run the minimap agent and return a Minimap_Output.
	 *
	 * Handles base layer creation/assignment and applies the luminance
	 * heuristic as a fallback when the agent does not return base_variant.
	 *
	 * @param int         $post_id         Post ID.
	 * @param string      $conversation_id Conversation UUID.
	 * @param int         $user_id         User ID.
	 * @param string      $message         User message to the agent.
	 * @param string|null $state_context   Current map state context for the system prompt.
	 * @return Minimap_Output
	 * @throws \Exception On agent failure or empty AI response.
	 * @throws \TypeError On unexpected type errors from the AI library.
	 */
	private function run_agent( int $post_id, string $conversation_id, int $user_id, string $message, ?string $state_context = null ): Minimap_Output {
		$assistant = Minimap_Agent::create( $post_id, $conversation_id, $user_id ? $user_id : null, $state_context );

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

		if ( null === $result->base_layer ) {
			$base_variant       = $result->base_variant ? $result->base_variant : $this->determine_base_variant( $result->layers );
			$result->base_layer = $this->get_or_create_base_layer( $base_variant );
		}

		if ( empty( $result->pins ) && $post_id ) {
			$result->pins = $this->get_pins( $post_id );
		}

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
	 * Persist a synthetic conversation thread for content-based map generation.
	 *
	 * Stores the initial user request and the generated map configuration as
	 * a conversation thread so subsequent chat messages build on the existing
	 * map instead of generating from scratch.
	 *
	 * @param int    $post_id         Post ID.
	 * @param string $conversation_id Conversation UUID.
	 * @param array  $map_config      Generated map configuration.
	 */
	private function persist_initial_context( int $post_id, string $conversation_id, array $map_config ): void {
		$store = new ConversationStore( new WP_Storage( $post_id, 'post' ) );

		$layer_lines = array();
		foreach ( $map_config['layers'] as $layer_def ) {
			$layer_post    = get_post( (int) $layer_def['id'] );
			$name          = $layer_post ? $layer_post->post_title : 'Layer #' . $layer_def['id'];
			$layer_lines[] = "- {$name} (ID: {$layer_def['id']})";
		}

		$parts = array( 'Map generated from post content with the following configuration:' );

		if ( ! empty( $layer_lines ) ) {
			$parts[] = "\nLayers:\n" . implode( "\n", $layer_lines );
		} else {
			$parts[] = "\nLayers: (none found)";
		}

		$parts[] = sprintf(
			"\nCenter: %.6f, %.6f | Zoom: %d",
			$map_config['center_lat'],
			$map_config['center_lon'],
			$map_config['initial_zoom']
		);

		if ( ! empty( $map_config['base_layer']['variant'] ) ) {
			$parts[] = 'Base: ' . $map_config['base_layer']['variant'];
		}

		if ( ! empty( $map_config['pins'] ) ) {
			$parts[] = sprintf( 'Pins: %d geolocation point(s)', count( $map_config['pins'] ) );
		}

		if ( ! empty( $map_config['message'] ) ) {
			$parts[] = 'Notes: ' . $map_config['message'];
		}

		$assistant_content = implode( "\n", $parts );

		$store->saveThread(
			$conversation_id,
			array(
				array(
					'role'    => 'user',
					'content' => 'Generate a map for this post based on its content.',
				),
				array(
					'role'    => 'assistant',
					'content' => $assistant_content,
				),
			)
		);
	}

	/**
	 * Build a context string describing the current map state from the request.
	 *
	 * The returned string is passed as initial_context to Minimap_Agent so the
	 * AI always knows the live block state regardless of conversation history.
	 *
	 * @param \WP_REST_Request $request REST request containing current_map_state.
	 * @return string|null Context string or null if no state provided.
	 */
	private function build_state_context( $request ): ?string {
		$raw_state = $request->get_param( 'current_map_state' );
		if ( empty( $raw_state ) || ! is_array( $raw_state ) ) {
			return null;
		}

		$parts = array( 'Current map state from the block editor:' );

		$layers = $raw_state['layers'] ?? array();
		if ( ! empty( $layers ) ) {
			$layer_lines = array();
			foreach ( $layers as $layer_def ) {
				$layer_id = (int) ( $layer_def['id'] ?? 0 );
				if ( ! $layer_id ) {
					continue;
				}
				$layer_post    = get_post( $layer_id );
				$name          = $layer_post ? $layer_post->post_title : "Layer #{$layer_id}";
				$layer_lines[] = "{$name} (ID: {$layer_id})";
			}
			$parts[] = 'Layers: ' . ( ! empty( $layer_lines ) ? implode( ', ', $layer_lines ) : '(none)' );
		} else {
			$parts[] = 'Layers: (none)';
		}

		$center_lat = $raw_state['center_lat'] ?? null;
		$center_lon = $raw_state['center_lon'] ?? null;
		$zoom       = $raw_state['initial_zoom'] ?? null;
		if ( null !== $center_lat && null !== $center_lon ) {
			$parts[] = sprintf( 'Center: %.6f, %.6f | Zoom: %s', (float) $center_lat, (float) $center_lon, $zoom ?? '?' );
		}

		$base_layer = $raw_state['base_layer'] ?? null;
		if ( ! empty( $base_layer ) && ! empty( $base_layer['variant'] ) ) {
			$parts[] = 'Base: ' . $base_layer['variant'];
		}

		$pins = $raw_state['pins'] ?? array();
		if ( ! empty( $pins ) ) {
			$parts[] = sprintf( 'Pins: %d geolocation point(s)', count( $pins ) );
		}

		$parts[] = "\nWhen refining, preserve the existing map configuration unless the user explicitly asks to change it.";

		return implode( "\n", $parts );
	}

	/**
	 * Resolve structured control messages into natural language for the agent.
	 *
	 * @param string           $type    Message type.
	 * @param string           $message Original message.
	 * @param \WP_REST_Request $request REST request for payload extraction.
	 * @return string
	 */
	private function resolve_structured_message( string $type, string $message, $request ): string {
		$payload = $request->get_param( 'payload' ) ?? array();

		switch ( $type ) {
			case 'base_variant':
				$variant = sanitize_text_field( $payload['variant'] ?? '' );
				return "Change the base layer variant to {$variant}.";

			case 'add_layers':
				$topic = sanitize_text_field( $payload['topic'] ?? '' );
				return "Search for and add additional map layers about: {$topic}";

			case 'regenerate':
				return 'Generate a completely new map suggestion, ignoring previous choices.';

			default:
				return $message;
		}
	}

	/**
	 * Determine whether to use a dark or light base layer based on legend colors.
	 *
	 * @param array $layers Layer definition array from RAG results.
	 * @return string 'dark' or 'light'.
	 */
	private function determine_base_variant( $layers ) {
		$total_luminance = 0;
		$color_count     = 0;

		foreach ( $layers as $layer_def ) {
			$layer_id            = (int) $layer_def['id'];
			$legend_type_options = get_post_meta( $layer_id, 'legend_type_options', true );
			$colors              = $this->extract_legend_colors( $legend_type_options );

			foreach ( $colors as $hex ) {
				$luminance = $this->hex_luminance( $hex );
				if ( null !== $luminance ) {
					$total_luminance += $luminance;
					++$color_count;
				}
			}
		}

		if ( $color_count > 0 ) {
			$avg = $total_luminance / $color_count;
			return $avg > 0.5 ? 'dark' : 'light';
		}

		return 'dark';
	}

	/**
	 * Extract hex color strings from legend type options.
	 *
	 * @param array $options Legend type options meta.
	 * @return string[] Array of hex color strings.
	 */
	private function extract_legend_colors( $options ) {
		if ( ! is_array( $options ) ) {
			return array();
		}

		$colors = array();

		if ( ! empty( $options['colors'] ) && is_array( $options['colors'] ) ) {
			foreach ( $options['colors'] as $item ) {
				if ( ! empty( $item['color'] ) ) {
					$colors[] = $item['color'];
				}
			}
		}

		if ( ! empty( $options['color'] ) && is_string( $options['color'] ) ) {
			$colors[] = $options['color'];
		}

		return $colors;
	}

	/**
	 * Compute relative luminance (0–1) from a hex color string.
	 *
	 * @param string $hex Hex color string, with or without leading '#'.
	 * @return float|null Luminance value, or null if the color is invalid.
	 */
	private function hex_luminance( $hex ) {
		$hex = ltrim( $hex, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		if ( 6 !== strlen( $hex ) ) {
			return null;
		}
		$r = hexdec( substr( $hex, 0, 2 ) ) / 255;
		$g = hexdec( substr( $hex, 2, 2 ) ) / 255;
		$b = hexdec( substr( $hex, 4, 2 ) ) / 255;
		return 0.299 * $r + 0.587 * $g + 0.114 * $b;
	}

	/**
	 * Get or create a base layer for the given visual variant.
	 *
	 * @param string $variant One of 'dark', 'light', 'satellite'.
	 * @return array|null Base layer definition, or null on failure.
	 */
	private function get_or_create_base_layer( $variant ) {
		$existing = $this->find_existing_base_layer( $variant );
		if ( $existing ) {
			return $existing;
		}

		return $this->create_base_layer( $variant );
	}

	/**
	 * Search for an existing base layer CPT tagged with the given variant.
	 *
	 * @param string $variant One of 'dark', 'light', 'satellite'.
	 * @return array|null Base layer definition, or null if not found.
	 */
	private function find_existing_base_layer( $variant ) {
		$query = new \WP_Query(
			array(
				'post_type'        => 'map-layer',
				'post_status'      => 'publish',
				'posts_per_page'   => 1,
				'meta_query'       => array(
					array(
						'key'   => self::BASE_LAYER_META_KEY,
						'value' => $variant,
					),
				),
				'suppress_filters' => true, // Ensure WPML doesn't filter by language.
			)
		);

		if ( $query->have_posts() ) {
			$post = $query->posts[0];
			return $this->build_base_layer_response( $post->ID, $variant );
		}

		$by_title = $this->find_base_layer_by_heuristics( $variant );
		if ( $by_title ) {
			update_post_meta( $by_title, self::BASE_LAYER_META_KEY, $variant );
			return $this->build_base_layer_response( $by_title, $variant );
		}

		return null;
	}

	/**
	 * Search for a likely base layer by title keywords and layer type.
	 *
	 * @param string $variant One of 'dark', 'light', 'satellite'.
	 * @return int|null Matching post ID, or null.
	 */
	private function find_base_layer_by_heuristics( $variant ) {
		$keywords = array();
		if ( 'dark' === $variant ) {
			$keywords = array( 'dark', 'night', 'noir' );
		} elseif ( 'light' === $variant ) {
			$keywords = array( 'light', 'positron', 'outdoor', 'terrain', 'street' );
		} elseif ( 'satellite' === $variant ) {
			$keywords = array( 'satellite', 'aerial', 'imagery' );
		}

		if ( empty( $keywords ) ) {
			return null;
		}

		$query = new \WP_Query(
			array(
				'post_type'      => 'map-layer',
				'post_status'    => 'publish',
				'posts_per_page' => 5,
				'meta_query'     => array(
					array(
						'key'     => 'type',
						'value'   => array( 'mapbox', 'tilelayer', 'mvt' ),
						'compare' => 'IN',
					),
				),
			)
		);

		foreach ( $query->posts as $candidate ) {
			$title_lower = strtolower( $candidate->post_title );
			foreach ( $keywords as $kw ) {
				if ( false !== strpos( $title_lower, $kw ) ) {
					return $candidate->ID;
				}
			}
		}

		return null;
	}

	/**
	 * Create a new base layer CPT for the given variant.
	 *
	 * @param string $variant One of 'dark', 'light', 'satellite'.
	 * @return array|null Base layer definition, or null on failure.
	 */
	private function create_base_layer( $variant ) {
		$defaults = $this->get_default_base_layers();
		$runtime  = $this->get_active_runtime();

		$all = apply_filters( 'jeo_minimap_base_layers', $defaults, $runtime );

		$config = null;
		foreach ( $all as $layer_config ) {
			if ( $layer_config['variant'] === $variant ) {
				$config = $layer_config;
				break;
			}
		}

		if ( ! $config ) {
			$config = $all[0];
		}

		$post_id = wp_insert_post(
			array(
				'post_type'   => 'map-layer',
				'post_title'  => $config['title'],
				'post_status' => 'publish',
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return null;
		}

		update_post_meta( $post_id, 'type', $config['type'] );
		update_post_meta( $post_id, 'layer_type_options', $config['layer_type_options'] );

		if ( ! empty( $config['attribution'] ) ) {
			update_post_meta( $post_id, 'attribution', $config['attribution'] );
		}

		update_post_meta( $post_id, self::BASE_LAYER_META_KEY, $config['variant'] );

		$this->assign_default_language( $post_id );

		return $this->build_base_layer_response( $post_id, $config['variant'] );
	}

	/**
	 * Return the default base layer definitions for the active map runtime.
	 *
	 * Filterable via `jeo_minimap_base_layers`.
	 *
	 * @return array[] Array of base layer config arrays.
	 */
	private function get_default_base_layers() {
		$runtime = $this->get_active_runtime();

		if ( 'mapboxgl' === $runtime ) {
			return array(
				array(
					'variant'            => 'dark',
					'title'              => __( 'Dark Base (Mapbox)', 'jeo' ),
					'type'               => 'mapbox',
					'layer_type_options' => array( 'style_id' => 'mapbox/dark-v11' ),
					'attribution'        => '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>',
				),
				array(
					'variant'            => 'light',
					'title'              => __( 'Terrain Base (Mapbox)', 'jeo' ),
					'type'               => 'mapbox',
					'layer_type_options' => array( 'style_id' => 'mapbox/outdoors-v12' ),
					'attribution'        => '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>',
				),
				array(
					'variant'            => 'satellite',
					'title'              => __( 'Satellite Base (Mapbox)', 'jeo' ),
					'type'               => 'mapbox',
					'layer_type_options' => array( 'style_id' => 'mapbox/satellite-streets-v12' ),
					'attribution'        => '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
				),
			);
		}

		return array(
			array(
				'variant'            => 'dark',
				'title'              => __( 'Dark Base', 'jeo' ),
				'type'               => 'tilelayer',
				'layer_type_options' => array(
					'url' => 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
				),
				'attribution'        => '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OSM</a>',
			),
			array(
				'variant'            => 'light',
				'title'              => __( 'Light Base', 'jeo' ),
				'type'               => 'tilelayer',
				'layer_type_options' => array(
					'url' => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
				),
				'attribution'        => '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			),
			array(
				'variant'            => 'satellite',
				'title'              => __( 'Satellite Base', 'jeo' ),
				'type'               => 'tilelayer',
				'layer_type_options' => array(
					'url' => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
				),
				'attribution'        => '&copy; <a href="https://www.esri.com/">Esri</a>',
			),
		);
	}

	/**
	 * Determine the active map rendering runtime.
	 *
	 * @return string 'mapboxgl' or 'maplibregl'.
	 */
	private function get_active_runtime() {
		$requested  = \jeo_settings()->get_option( 'map_runtime_requested' );
		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );

		if ( 'mapboxgl' === $requested && ! empty( $mapbox_key ) ) {
			return 'mapboxgl';
		}

		return 'maplibregl';
	}

	/**
	 * Build the base layer response array for the block attributes.
	 *
	 * @param int    $post_id Layer CPT post ID.
	 * @param string $variant Variant slug (dark/light/satellite).
	 * @return array Layer definition for block attributes.
	 */
	private function build_base_layer_response( $post_id, $variant ) {
		$layer_type    = get_post_meta( $post_id, 'type', true );
		$load_as_style = ( 'mapbox' === $layer_type );

		return array(
			'id'            => $post_id,
			'use'           => 'fixed',
			'default'       => true,
			'show_legend'   => false,
			'load_as_style' => $load_as_style,
			'variant'       => $variant,
		);
	}

	/**
	 * Assign the site's default WPML language to a newly created post.
	 *
	 * No-op when WPML is not active.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	private function assign_default_language( int $post_id ): void {
		if ( ! did_action( 'wpml_loaded' ) ) {
			return;
		}

		$default_lang = apply_filters( 'wpml_default_language', null );
		if ( empty( $default_lang ) ) {
			return;
		}

		do_action(
			'wpml_set_element_language_details',
			array(
				'element_id'    => $post_id,
				'element_type'  => 'post_map-layer',
				'trid'          => false,
				'language_code' => $default_lang,
			)
		);
	}

	/**
	 * Compute map center latitude, longitude and zoom from post geolocation points.
	 *
	 * Prefers primary points. Falls back to JEO default map settings.
	 *
	 * @param int $post_id Post ID.
	 * @return array { lat: float, lon: float, zoom: int }
	 */
	private function compute_center_zoom( $post_id ) {
		$defaults = array(
			'lat'  => (float) \jeo_settings()->get_option( 'map_default_lat', 0 ),
			'lon'  => (float) \jeo_settings()->get_option( 'map_default_lng', 0 ),
			'zoom' => (float) \jeo_settings()->get_option( 'map_default_zoom', 2 ),
		);

		$points = get_post_meta( $post_id, '_related_point', false );
		if ( empty( $points ) ) {
			return $defaults;
		}

		$primary   = array();
		$secondary = array();

		foreach ( $points as $point ) {
			if ( ! is_array( $point ) ) {
				continue;
			}
			$lat = isset( $point['_geocode_lat'] ) ? (float) $point['_geocode_lat'] : null;
			$lon = isset( $point['_geocode_lon'] ) ? (float) $point['_geocode_lon'] : null;
			if ( null === $lat || null === $lon || ! is_finite( $lat ) || ! is_finite( $lon ) ) {
				continue;
			}
			$entry = array(
				'lat' => $lat,
				'lon' => $lon,
			);
			if ( isset( $point['relevance'] ) && 'primary' === $point['relevance'] ) {
				$primary[] = $entry;
			} else {
				$secondary[] = $entry;
			}
		}

		$use = ! empty( $primary ) ? $primary : $secondary;
		if ( empty( $use ) ) {
			return $defaults;
		}

		if ( 1 === count( $use ) ) {
			return array(
				'lat'  => $use[0]['lat'],
				'lon'  => $use[0]['lon'],
				'zoom' => 10,
			);
		}

		$lats = wp_list_pluck( $use, 'lat' );
		$lons = wp_list_pluck( $use, 'lon' );

		$min_lat = min( $lats );
		$max_lat = max( $lats );
		$min_lon = min( $lons );
		$max_lon = max( $lons );

		$center_lat = ( $min_lat + $max_lat ) / 2;
		$center_lon = ( $min_lon + $max_lon ) / 2;

		$lat_span = $max_lat - $min_lat;
		$lon_span = $max_lon - $min_lon;
		$max_span = max( $lat_span, $lon_span, 0.001 );

		$zoom = max( 1, min( 14, floor( log( 360 / $max_span, 2 ) ) - 1 ) );

		return array(
			'lat'  => round( $center_lat, 6 ),
			'lon'  => round( $center_lon, 6 ),
			'zoom' => $zoom,
		);
	}

	/**
	 * Collect geolocation pins from post meta for block rendering.
	 *
	 * @param int $post_id Post ID.
	 * @return array[] Array of pin objects { lat, lon, relevance, address }.
	 */
	private function get_pins( $post_id ) {
		$points = get_post_meta( $post_id, '_related_point', false );
		$pins   = array();

		foreach ( $points as $point ) {
			if ( ! is_array( $point ) ) {
				continue;
			}
			$lat = isset( $point['_geocode_lat'] ) ? (float) $point['_geocode_lat'] : null;
			$lon = isset( $point['_geocode_lon'] ) ? (float) $point['_geocode_lon'] : null;
			if ( null === $lat || null === $lon ) {
				continue;
			}

			$pins[] = array(
				'lat'       => $lat,
				'lon'       => $lon,
				'relevance' => isset( $point['relevance'] ) ? $point['relevance'] : 'primary',
				'address'   => isset( $point['_geocode_full_address'] ) ? $point['_geocode_full_address'] : '',
			);
		}

		return $pins;
	}
}
