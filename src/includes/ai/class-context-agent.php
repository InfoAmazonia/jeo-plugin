<?php
/**
 * Context generation AI agent factory — builds an ai-assistant Assistant for editorial suggestions.
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
 * Factory that creates a fully configured Assistant instance for editorial context generation.
 *
 * Uses the hacklabr/ai-assistant library with:
 * - Structured output (Context_Generation_Output)
 * - Sub-agent for post content analysis
 * - Tools: Retrieve_Knowledge_Tool, Get_Post_Content_Tool
 * - Separate storages for conversations (post_meta), learning (wp_options), user memory (user_meta)
 */
class Context_Agent {

	/**
	 * Create a configured Assistant instance for context generation.
	 *
	 * @param int         $post_id         Post ID for conversation storage.
	 * @param string      $conversation_id Conversation UUID.
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

		$tools = Tool_Registry::get_instances_by_id( array( 'retrieve_knowledge', 'get_post_content' ) );

		$config = new AssistantConfig(
			logger:               new StderrLogger(),
			provider:             $provider,
			storage:              $fallback_storage,
			instructions:         self::system_prompt( $prefs, $initial_context ),
			contextWindow:        200000,
			tools:                $tools,
			subAgents:            array(
				'post_analyzer' => self::post_analyzer_config( $provider ),
			),
			autoLearn:            true,
			autoDelegate:         true,
			requireLearningCheck: true,
			outputClass:          Context_Generation_Output::class,
			structuredMaxRetries: 1,
			conversationStorage:  $conversation_storage,
			learningStorage:      $learning_storage,
			userMemoryStorage:    $user_memory_storage,
			userId:               (string) $user_id,
		);

		return Assistant::configure( $config );
	}

	/**
	 * Build the system prompt for the editorial context assistant.
	 *
	 * @param string      $user_prefs      User preferences section (empty if none).
	 * @param string|null $initial_context Extra context from the caller.
	 * @return string
	 */
	private static function system_prompt( string $user_prefs = '', ?string $initial_context = null ): string {
		$custom_prompt = \jeo_settings()->get_option( 'ai_context_prompt' );
		if ( ! empty( $custom_prompt ) ) {
			$prompt = $custom_prompt;
		} else {
			$prompt = self::default_system_prompt();
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
	 * Build the default system prompt for the editorial context assistant.
	 *
	 * @return string
	 */
	private static function default_system_prompt(): string {
		return <<<'PROMPT'
You are an editorial AI assistant embedded in a WordPress block editor. Your task is to suggest new paragraphs and related references that enrich journalistic and editorial posts.

## Core Responsibility

You MUST always return a valid Context_Generation_Output JSON object with suggested paragraphs and related article references. Every response must be constructive and actionable — never return empty or partial results without explanation.

## Workflow

1. **First generation (from post content):** Delegate to the `post_analyzer` sub-agent to extract topics, tone, key facts, and gaps from the post. Use the returned insights to formulate `retrieve_knowledge` queries that find related articles in the site's knowledge base.

2. **Refinement:** When the user asks for changes (e.g. "make it shorter", "focus on environmental impact", "add more historical context"), apply the changes while preserving the editorial intent. Use tools as needed. You may delegate to `post_analyzer` to re-examine content for new context.

## Tool Usage

- `retrieve_knowledge(query, top_k)`: Search the site's vectorized article archive for semantically related content. Use specific, targeted queries. If the first search yields few results, try alternative queries or synonyms.
- `get_post_content(post_id)`: Read the current post's title, content, categories, tags, and geolocation points. Use this to ground your suggestions in the existing text.
- `delegate_to_subagent(sub_agent_id, task)`: Delegate to `post_analyzer` for content analysis.

## Output Rules

You MUST respond with a valid Context_Generation_Output JSON object:

- `paragraphs`: Array of suggested paragraphs. Each entry has:
  - `text` (string): The full suggested paragraph text, ready to insert into the article.
  - `relevance_score` (int 0–100): How relevant this paragraph is to the post's core topic.
- `references`: Array of related articles from the knowledge base. Each entry has:
  - `post_id` (int): WordPress post ID.
  - `title` (string): Article title.
  - `url` (string): Permalink URL.
  - `reason` (string): Why this article is relevant to the suggested content.
- `message`: Cumulative summary of all editorial suggestions across the conversation so far, shown as a notice in the UI. Reflect the full history and current state. Omit off-topic exchanges.
- `assistant_message`: Brief summary of what you did, shown as a chat message.

## Editorial Guidelines

- Suggest 1–3 paragraphs per response. Quality over quantity.
- Match the tone and style of the existing article.
- Ensure factual consistency with the post content and retrieved references.
- When citing references, prefer linking to existing site articles over external sources.
- When no relevant articles are found in the knowledge base, still suggest paragraphs based on the post content and user's instructions, and set `references` to an empty array.
- Always write in the same language as the article.

## Off-Topic Handling

If the user asks something unrelated to editorial suggestions (e.g. general questions, preferences, non-editorial topics), respond conversationally without modifying the output structure. Repeat the previous `message` value unchanged and keep `paragraphs` empty unless the user explicitly asks for new content.

## Tool Error Handling

When a tool returns an error or no results:
1. DO NOT treat it as fatal. Continue generating suggestions based on available context.
2. If `retrieve_knowledge` returns no results, mention the gap in `assistant_message` and suggest paragraphs based on the post content alone.
3. NEVER expose technical error details (WP_Error, stack traces, API codes) to the user.
PROMPT;
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
You are a journalistic content analyst. Your task is to analyze WordPress post content and extract information useful for generating editorial suggestions.

## Tool Restrictions

You ONLY have access to the `get_post_content` tool. Do NOT attempt to call any other tools.

## Task

Use the `get_post_content` tool to retrieve the post data (pass the `post_id` from the task description). Then analyze and return a JSON object with:

- `topics`: Array of main topics/subjects.
- `tone`: The editorial tone (e.g. "investigative", "informative", "opinionated", "neutral").
- `gaps`: Array of potential content gaps or angles not fully explored.
- `key_facts`: Array of important facts mentioned.
- `target_audience`: Brief description of the intended audience.
- `suggested_search_queries`: Array of 3–5 search queries for finding related articles in the knowledge base. Be specific and varied.

Focus on extracting information that will help generate relevant, well-supported paragraphs.
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
