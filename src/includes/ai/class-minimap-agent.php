<?php
/**
 * Minimap AI agent factory — builds an ai-assistant Assistant for minimap generation.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use HackLab\AIAssistant\Assistant;
use HackLab\AIAssistant\AssistantConfig;
use HackLab\AIAssistant\Logging\StderrLogger;
use HackLab\AIAssistant\SubAgents\SubAgentConfig;
use NeuronAI\Chat\Messages\UserMessage;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Factory that creates a fully configured Assistant instance for minimap generation.
 *
 * Uses the hacklabr/ai-assistant library with:
 * - Structured output (Minimap_Output)
 * - Sub-agent for post content analysis
 * - Tools: Search_Layers_Tool, Geocode_Tool, Generate_Layer_Tool (when Mapbox key is available)
 * - Separate storages for conversations (post_meta), learning (wp_options), user memory (user_meta)
 */
class Minimap_Agent {

	/**
	 * Create a configured Assistant instance for minimap generation.
	 *
	 * @param int         $post_id         Post ID for conversation storage.
	 * @param string      $conversation_id Block conversation UUID.
	 * @param int|null    $user_id         WordPress user ID for memory storage.
	 * @param string|null $initial_context Optional extra context to append to instructions.
	 * @return Assistant
	 */
	public static function create( int $post_id, string $conversation_id, ?int $user_id = null, ?string $initial_context = null ): Assistant {
		$provider = Neuron_Factory::get_active_provider( true );

		$conversation_storage = new WP_Storage( $post_id, 'post' );
		$learning_storage     = new WP_Option_Storage();
		$user_memory_storage  = null !== $user_id ? new WP_Storage( $user_id, 'user' ) : null;
		$fallback_storage     = new WP_Option_Storage();

		$prefs = '';
		if ( null !== $user_id ) {
			$prefs = self::load_user_prefs_prompt( $user_id );
		}

		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		$has_mapbox = ! empty( $mapbox_key );

		$tools = array(
			Search_Layers_Tool::class,
			Geocode_Tool::class,
		);

		if ( $has_mapbox ) {
			$tools[] = Generate_Layer_Tool::class;
		}

		$config = new AssistantConfig(
			logger:               new StderrLogger(),
			provider:             $provider,
			storage:              $fallback_storage,
			instructions:         self::system_prompt( $prefs, $initial_context, $has_mapbox ),
			contextWindow:        200000,
			tools:                $tools,
			subAgents:            array(
				'post_analyzer' => self::post_analyzer_config( $provider ),
			),
			autoLearn:            true,
			autoDelegate:         true,
			requireLearningCheck: true,
			outputClass:          Minimap_Output::class,
			structuredMaxRetries: 1,
			conversationStorage:  $conversation_storage,
			learningStorage:      $learning_storage,
			userMemoryStorage:    $user_memory_storage,
			userId:               (string) $user_id,
		);

		return Assistant::configure( $config );
	}

	/**
	 * Build the system prompt for the minimap cartographer agent.
	 *
	 * @param string      $user_prefs      User preferences section (empty if none).
	 * @param string|null $initial_context Extra context from the caller.
	 * @param bool        $has_mapbox      Whether a Mapbox API key is configured.
	 * @return string
	 */
	private static function system_prompt( string $user_prefs = '', ?string $initial_context = null, bool $has_mapbox = false ): string {
		$prompt = <<<'PROMPT'
You are a cartographic AI assistant embedded in a WordPress block editor. Your task is to generate and refine interactive maps (minimaps) for journalistic and editorial posts.

## Core Responsibility

You MUST always return a valid minimap configuration with layers, center coordinates, zoom level, and optional pins. Every response must be a complete, usable map — never return partial or empty results.

## Workflow

1. **First generation (from post content):** Delegate to the `post_analyzer` sub-agent to extract topics, locations, and geographic context from the post. Use the returned `suggested_search_queries` to search for relevant layers via `search_layers`.

2. **First generation (from prompt):** Use the user's prompt directly to search for layers via `search_layers` and geocode the location via `geocode`. When a post is available, also delegate to `post_analyzer` to extract geographic context — the user's prompt may reference specific sections of the post content (e.g. "map based on the Amazon section"). Combine post context with the prompt to produce a more relevant map.

3. **Refinement:** When the user asks for changes (e.g. "switch to satellite", "add more layers about X"), apply the changes while preserving the existing map configuration. Use tools as needed. When a post is available, you may delegate to `post_analyzer` to re-examine content for new geographic context.

## Tool Usage

- `search_layers(query, top_k)`: Find semantically matching map layers. Call with specific, targeted queries. If the first search yields few results, try alternative queries.
- `geocode(location)`: Convert a location name to lat/lon. Use when the post has no geolocation points or the user mentions a new location.
- `delegate_to_subagent(sub_agent_id, task)`: Delegate to `post_analyzer` for content analysis.

## Output Rules

You MUST respond with a valid Minimap_Output JSON object:

- `layers`: Array of layer definitions. Each has: `id` (int, from search_layers results), `use` ("fixed"), `default` (true), `show_legend` (true/false).
- `base_layer`: Object with `id`, `use`, `default`, `show_legend`, `load_as_style`, `variant`. If you don't know a specific base layer ID, set this to null and the system will create one.
- `center_lat`, `center_lon`: Map center coordinates.
- `initial_zoom`: Zoom level (0–20). Use ~2–4 for country/region, ~8–12 for city-level.
- `pins`: Array of geolocation pins from the post. Each has `lat`, `lon`, `relevance` ("primary"/"secondary"), `address`.
- `base_variant`: "dark", "light", or "satellite". Choose based on:
  - The post's theme and editorial context (e.g. satellite for environmental stories)
  - Layer legend colors (dark base for bright legends, light base for dark legends)
  - User's explicit or implicit preference
  Set to null to use the automatic luminance-based heuristic.
- `message`: Cumulative summary of all map-relevant changes across the conversation so far, shown as a notice above the map. Reflect the full history and current state. Omit off-topic exchanges. When the user asks something unrelated to the map, repeat the previous `message` value unchanged.
- `assistant_message`: Brief summary of what you did, shown as a chat message in the editor.

## Design Principles

- Prioritize vector layers over raster for thematic data.
- Keep the number of layers reasonable (3–7 typically).
- Choose zoom levels appropriate to the geographic scope.
- Consider editorial context: environmental stories may benefit from satellite base, political stories from light base.
- When refining, only change what the user asked — preserve good aspects of the current map.

## Language

Always respond in the same language the user used in their message.

## Off-Topic Handling

If the user asks something unrelated to the map (e.g. general questions, preferences, non-geographic topics), respond conversationally without modifying the map configuration. Repeat the previous `message` value unchanged.
PROMPT;

		if ( $has_mapbox ) {
			$prompt .= "\n\n" . <<<'PROMPT'
## Layer Generation (Mapbox)

You have access to `generate_layer(prompt, layer_name)` which creates custom Mapbox map styles from a text description and creates a new layer. This has cost implications (AI tokens + Mapbox API usage).

Rules:
- NEVER call `generate_layer` without explicit user authorization via chat.
- When `search_layers` returns insufficient results, mention what's missing in `assistant_message` and ask the user if they would like you to generate a custom layer.
- Only call `generate_layer` after the user explicitly confirms (e.g. "yes", "go ahead", "generate it").
- On the initial auto-generation (from post content or prompt), do NOT generate custom layers — use existing ones only. Report gaps in `assistant_message`.
PROMPT;
		} else {
			$prompt .= "\n\n" . <<<'PROMPT'
## Layer Limitations

Custom layer generation is not available (no Mapbox API key is configured). If `search_layers` returns insufficient results, mention what topics lack coverage in `assistant_message` and suggest the user connect a Mapbox API key in JEO Settings to enable AI-powered layer generation.
PROMPT;
		}

		if ( ! empty( $user_prefs ) ) {
			$prompt .= "\n\n## User Preferences\n" . $user_prefs;
		}

		if ( ! empty( $initial_context ) ) {
			$prompt .= "\n\n## Additional Context\n" . $initial_context;
		}

		return $prompt;
	}

	/**
	 * Build the post_analyzer sub-agent configuration.
	 *
	 * @param \NeuronAI\Providers\AIProviderInterface $provider AI provider instance.
	 * @return SubAgentConfig
	 */
	private static function post_analyzer_config( $provider ): SubAgentConfig {
		return new SubAgentConfig(
			id: 'post_analyzer',
			provider: $provider,
			instructions: <<<'PROMPT'
You are a journalistic content analyst specialized in geographic and thematic analysis. Your task is to analyze WordPress post content and extract information useful for building a contextual map.

Use the `get_post_content` tool to retrieve the post data (pass the `post_id` from the task description). Then analyze and return a JSON object with:

- `topics`: Array of main topics/subjects (e.g. ["deforestation", "Amazon", "indigenous rights"])
- `locations`: Array of location names mentioned (e.g. ["Manaus", "Amazonas", "Brazil"])
- `geographic_scope`: One of "local", "regional", "national", "international"
- `summary`: 1–2 sentence summary of the post's geographic relevance
- `suggested_search_queries`: Array of 3–5 search queries for finding relevant map layers. Be specific and varied (e.g. ["deforestation Amazon satellite", "indigenous territories Brazil", "forest cover loss Amazonas"])

Focus on extracting information that will help find relevant map layers and determine appropriate map center/zoom.

When the task includes a specific scope (e.g. "analyze the section about the Amazon" or "focus on the second paragraph"), narrow your analysis to that portion of the content while still providing complete geographic context.
PROMPT,
			tools: array( Get_Post_Content_Tool::class ),
		);
	}

	/**
	 * Load user preferences as a prompt section.
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	private static function load_user_prefs_prompt( int $user_id ): string {
		$prefs = get_user_meta( $user_id, '_jeo_ai_user_memory_minimap_prefs', true );
		if ( empty( $prefs ) || ! is_array( $prefs ) ) {
			return '';
		}

		$lines = array();
		foreach ( $prefs as $key => $value ) {
			$lines[] = "- {$key}: " . ( is_string( $value ) ? $value : wp_json_encode( $value ) );
		}

		return empty( $lines ) ? '' : implode( "\n", $lines );
	}
}
