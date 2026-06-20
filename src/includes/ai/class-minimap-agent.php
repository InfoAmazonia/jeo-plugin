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
		$user_memory_storage  = null !== $user_id ? new WP_User_Memory_Storage( $user_id ) : null;
		$fallback_storage     = new WP_Option_Storage();

		$prefs = '';
		if ( null !== $user_id ) {
			$prefs = self::load_user_prefs_prompt( $user_id );
		}

		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		$has_mapbox = ! empty( $mapbox_key );

		$tool_ids = array( 'search_layers', 'geocode' );
		if ( $has_mapbox ) {
			$tool_ids[] = 'generate_layer';
		}

		$tools = Tool_Registry::get_instances_by_id( $tool_ids );

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

- `layers`: Array of layer definitions. Each has: `id` (int, from search_layers results), `use` ("fixed"), `default` (true), `show_legend` (true/false). Optionally include a `reason` field with a one-sentence explanation of why the layer was chosen.
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
- Respect the geographic scope of the request. When the scope is local or regional (city, municipality, state), reject overly broad national layers such as generic country hydrography, full-country administrative boundaries, or continental base maps as thematic overlays. Use them only as base layers when appropriate. Prefer local or thematic vector layers that match the requested scope.

## Refinement Rules

When the user asks to CHANGE an existing map (refinement), follow these rules strictly:

1. **Preserve by default**: Keep all existing layers, center coordinates, zoom, base layer, and pins unless the user EXPLICITLY asks to change them.
2. **Minimal change**: Make only the specific change requested. Do NOT regenerate the whole map.
3. **Adding layers**: If the user asks to add a layer about a topic, run `search_layers` for that topic and append the new layer(s) to the EXISTING layer list. Do NOT remove existing layers.
4. **Removing layers**: If the user asks to remove a specific layer, remove only that layer. Do NOT change other layers.
5. **Changing base layer**: If the user asks to change the base variant (e.g. "switch to satellite"), update only `base_layer`/`base_variant`. Do NOT touch thematic layers, center or zoom.
6. **Regeneration only when explicit**: Only generate a completely new map when the user explicitly asks for it with phrases like "start over", "regenerate", "from scratch", "new map" or "do it again".
7. **Explain changes**: In `assistant_message`, briefly state what changed and what was preserved.

## Language

Always respond in the same language the user used in their message.

## Off-Topic Handling

If the user asks something unrelated to the map (e.g. general questions, preferences, non-geographic topics), respond conversationally without modifying the map configuration. Repeat the previous `message` value unchanged.

## Tool Error Handling

When a tool returns a JSON object with "success": false:

1. DO NOT treat it as a fatal error. The map should still be rendered.
2. If search_layers returns no results or fails:
   - Set message to a helpful notice (e.g. "No matching layers found for '[topic]'.")
   - Keep the map with base_layer + any pins. Do NOT set status to error.
   - Mention what topics lack coverage in assistant_message.
3. If generate_layer returns success: false:
   - Explain in assistant_message what happened (e.g. "Layer generation failed. You can try again or create the layer manually.")
   - Do NOT retry without asking the user first.
   - Keep the current map state unchanged.
4. NEVER expose technical error details (WP_Error, stack traces, API error codes) to the user. Translate errors into user-friendly messages.

## Layer Themes

The layer catalog is organized by themes. When searching, prefer layers whose themes match the map topic. Available themes: THEMES_LIST

## Layer Default Styles

When a mapbox-tileset-vector layer has a `default_style` in its REST metadata (containing filter and paint), and the user hasn't requested specific styling, set the layer instance's style to `{ "use_default": true }`. This activates the AI-suggested filter and paint (e.g. filtering landuse to show only "wood" class in green).

If the user later asks to change the styling, set `"use_default": false` and provide the custom paint values in `style.paint`.
PROMPT;

		$themes_list = self::get_layer_theme_list();
		$prompt      = str_replace( 'THEMES_LIST', $themes_list, $prompt );

		if ( $has_mapbox ) {
			$prompt .= "\n\n" . <<<'PROMPT'
## Layer Generation (Mapbox)

You have access to `generate_layer(prompt, layer_name)` which creates custom Mapbox map styles from a text description and creates a new layer. This has cost implications (AI tokens + Mapbox API usage).

Rules:
- NEVER call `generate_layer` without explicit user authorization via chat, EXCEPT for simple administrative boundary layers (municipal or state limits) using public data. For those, you MAY generate proactively when `search_layers` finds no suitable option.
- When `search_layers` returns insufficient results for non-administrative topics, mention what's missing in `assistant_message` and ask the user if they would like you to generate a custom layer.
- Only call `generate_layer` for non-administrative layers after the user explicitly confirms (e.g. "yes", "go ahead", "generate it").
- On the initial auto-generation (from post content or prompt), do NOT generate custom layers except simple administrative boundaries — use existing ones only. Report gaps in `assistant_message`.
- When generate_layer returns success with a "limitations" field, include the limitations information in assistant_message so the user understands what the layer actually shows.
- When the user provides an external URL (GeoJSON, tile service), pass it in the prompt to generate_layer so the minilayer agent can include it as a source in the style.
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
	 * Get a comma-separated list of layer theme names.
	 *
	 * @return string
	 */
	private static function get_layer_theme_list(): string {
		$terms = get_terms(
			array(
				'taxonomy'   => 'layer-theme',
				'hide_empty' => false,
				'fields'     => 'names',
			)
		);

		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return 'deforestation, hydrography, indigenous lands, protected areas, mining, oil and gas, land use, agriculture, infrastructure, administrative boundaries, socioeconomic, biodiversity, fire, climate';
		}

		return implode( ', ', $terms );
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

## Tool Restrictions

You ONLY have access to the `get_post_content` tool. Do NOT attempt to call any other tools such as search_layers, geocode, generate_layer, or delegate_to_subagent — those belong to the parent agent and are not available to you.

## Task

Use the `get_post_content` tool to retrieve the post data (pass the `post_id` from the task description). Then analyze and return a JSON object with:

- `topics`: Array of main topics/subjects (e.g. ["deforestation", "Amazon", "indigenous rights"])
- `locations`: Array of location names mentioned (e.g. ["Manaus", "Amazonas", "Brazil"])
- `geographic_scope`: One of "local", "regional", "national", "international"
- `summary`: 1–2 sentence summary of the post's geographic relevance
- `suggested_search_queries`: Array of 4–6 search queries for finding relevant map layers. Build queries by combining the locations above with the most relevant themes below. Use Portuguese terms when the post is in Portuguese. Include queries for different data types when relevant:
  - Administrative boundaries: e.g. "limites municipais [local]", "limites estaduais [local]"
  - Deforestation / forest cover: e.g. "desmatamento [local]", "perda florestal [local]"
  - Hydrography / rivers: e.g. "rios [local]", "hidrografia [local]"
  - Indigenous territories: e.g. "terras indigenas [local]", "TI [local]"
  - Protected areas / conservation units: e.g. "unidades de conservacao [local]"
  - Mining / oil / gas: e.g. "mineração [local]", "petroleo gas [local]"
  - Land use / soil / agriculture: e.g. "uso do solo [local]", "agricultura [local]"
  - Socioeconomic / infrastructure: e.g. "rodovias [local]", "assentamentos [local]"

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
		$storage = new WP_User_Memory_Storage( $user_id );
		$keys    = $storage->list( 'memories' );

		$lines = array();
		foreach ( $keys as $key ) {
			$data = $storage->load( 'memories', $key );
			if ( empty( $data ) || ! is_array( $data ) ) {
				continue;
			}
			if ( isset( $data['category'] ) && 'preference' === $data['category'] && ! empty( $data['content'] ) ) {
				$lines[] = '- ' . $data['content'];
			}
		}

		return empty( $lines ) ? '' : implode( "\n", $lines );
	}
}
