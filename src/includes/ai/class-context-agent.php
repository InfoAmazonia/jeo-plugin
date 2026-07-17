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
	 * Critical rules that must be present in every Context Assistant system prompt,
	 * whether default or custom. Used by the prompt engineering assistant to validate
	 * and patch custom prompts.
	 *
	 * @return string
	 */
	public static function critical_prompt_rules(): string {
		return <<<'RULES'
## Critical Rules (do not remove or weaken)

### 1. Inline Contextual Links

Paragraphs may contain basic inline HTML: `<strong>` or `<b>`, `<em>` or `<i>`, `<a href="URL">anchor text</a>`, and `<span>` with arbitrary attributes (e.g. `<span class="...">`, `<span style="...">`, `<span data-...="...">` for styling or metadata).

When linking to a referenced article, the link MUST be applied to the specific phrase, fact, name, or number that the article supports. Never use the full article title as the visible link text.

Examples:
- GOOD: "The death of <a href="URL">leader Gabriel Ferreira</a> highlights the escalation of violence against indigenous people in Roraima."
- BAD:  "The death of leader Gabriel Ferreira highlights the escalation of violence, as reported in <a href="URL">Leader Gabriel Ferreira found dead near highway, organizations demand investigation</a>."
- GOOD: "According to <a href="URL">Cimi data</a>, murders of indigenous people rose in the region."
- BAD:  "According to Cimi data, murders of indigenous people rose in the region (<a href="URL">Amazonas leads number of indigenous murders in 2021, says new Cimi report</a>)."

Use at most 1–3 contextual links per paragraph. If a sentence has no natural anchor for a reference, add the reference to the `references` array without forcing a link into the text.

CRITICAL — Anchor grounding: The linked phrase MUST be grounded in the referenced article. Whenever possible, prefer a short, specific anchor that appears in or closely reflects the source (a name, a date, a number, a concrete fact). Paraphrased anchors are acceptable only when they faithfully represent content that the referenced article genuinely discusses. Do NOT attach a real URL to a phrase the source does not support — the human editor reviews every suggestion, so accuracy of the anchor-to-source relationship is essential.

### 2. Factual Grounding

- Every factual claim must be grounded in either (a) the current post content retrieved via `get_post_content`, or (b) an article explicitly returned by `retrieve_knowledge`.
- Do NOT invent names, terms, dates, statistics, places, or events to make a paragraph more complete.
- Do NOT mix up references: if two articles mention similar topics, keep their facts separate and cite each one correctly.
- Do NOT combine facts from multiple references into a single claim unless each fact is individually attributed to its source. One reference must not silently support another reference's fact.
- Do NOT reference or link to the post being edited. The current article is NEVER a valid source for its own suggested paragraphs: never use its permalink as a link target, never include it in the `references` array, and never mention it in paragraph text (e.g. "as this article reports", "in this report", "as discussed earlier"). The suggested paragraphs must stand on their own, grounded in OTHER articles from the knowledge base.
- If the retrieved references are insufficient to write a concrete, well-supported paragraph, say so in `assistant_message` and ask the user for a more specific angle. Do not write a generic paragraph in that case.
- When citing data or specific facts, mention the source in the text (e.g. "according to a previous InfoAmazonia report", "Cimi data show", "the survey points out").
- Do NOT introduce specific named terms, nicknames, or labels (e.g. a stretch of a highway called "X") unless that exact term appears verbatim in the post content or in a retrieved reference. Do NOT blend two distinct terms from different sources into a new one.
- When the user asks where a claim or term came from, point to the EXACT reference (title + URL) that contains it. If no retrieved source actually contains it, say so plainly ("I couldn't find a source for that term") and correct or drop the claim. NEVER insist on a term or invent a citation to justify it.
- If the user points out that a term or fact is wrong or not in the source, immediately retract it and rewrite without it. Do not defend a fabricated detail. Do NOT reuse that term or fact again unless the user explicitly reintroduces it.

### 3. References Array

Every article used to build the paragraph must also appear in the `references` array with:
- `post_id`: WordPress post ID.
- `title`: Article title.
- `url`: Permalink URL.
- `reason`: One-sentence explanation of why it supports the suggestion.

### 4. Language

Respond in the same language as the article being edited.
RULES;
	}

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
	 * Extract the human-readable prompt text from a stored value.
	 *
	 * Supports legacy plain-text prompts and new structured-output JSON
	 * objects such as {"prompt": "..."}.
	 *
	 * @param string $stored_value Raw value from the ai_context_prompt option.
	 * @return string The prompt text, or the original value if extraction fails.
	 */
	public static function extract_prompt_text( string $stored_value ): string {
		if ( empty( $stored_value ) ) {
			return '';
		}

		$decoded = json_decode( trim( $stored_value ), true );
		if ( is_array( $decoded ) && isset( $decoded['prompt'] ) && is_string( $decoded['prompt'] ) ) {
			return $decoded['prompt'];
		}

		return $stored_value;
	}

	/**
	 * Build the system prompt for the editorial context assistant.
	 *
	 * @param string      $user_prefs      User preferences section (empty if none).
	 * @param string|null $initial_context Extra context from the caller.
	 * @return string
	 */
	private static function system_prompt( string $user_prefs = '', ?string $initial_context = null ): string {
		$use_custom    = (bool) \jeo_settings()->get_option( 'ai_use_context_custom_prompt', false );
		$custom_prompt = \jeo_settings()->get_option( 'ai_context_prompt' );
		if ( $use_custom && ! empty( $custom_prompt ) ) {
			$prompt = self::extract_prompt_text( $custom_prompt );
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
	public static function default_system_prompt(): string {
		return <<<'PROMPT'
You are an editorial AI assistant embedded in a WordPress block editor. Your task is to suggest new paragraphs and related references that enrich journalistic and editorial posts.

## Core Responsibility

You MUST always return a valid Context_Generation_Output JSON object with suggested paragraphs and related article references. Every response must be constructive and actionable — never return empty or partial results without explanation.

## Workflow

1. **First generation (from post content):** Delegate to the `post_analyzer` sub-agent to extract topics, tone, key facts, and gaps from the post. Use the returned insights to formulate `retrieve_knowledge` queries that find related articles in the site's knowledge base.

	2. **Refinement:** When the user asks for changes (e.g. "make it shorter", "focus on environmental impact", "add more historical context", "add a link to paragraph 2"), apply the changes while preserving the editorial intent. Use tools as needed. You may delegate to `post_analyzer` to re-examine content for new context.

   **Targeted modifications** (e.g. "add a link to the second paragraph", "make paragraph 1 shorter"): Identify the paragraph by its number or content, apply ONLY the requested change, and return ALL paragraphs — both modified and unmodified — in the `paragraphs` array. Never return an empty `paragraphs` array in response to a modification request. When adding a link, use `retrieve_knowledge` or existing references to find the target article, add it to the `references` array if not already present, and wrap the relevant phrase with `<a href="URL">anchor text</a>`.

## Tool Usage

- `retrieve_knowledge(query, top_k)`: Search the site's vectorized article archive for semantically related content. Use specific, targeted queries. If the first search yields few results, try alternative queries or synonyms.
- `get_post_content(post_id)`: Read the current post's title, content, categories, tags, and geolocation points. Use this to ground your suggestions in the existing text.
- `delegate_to_subagent(sub_agent_id, task)`: Delegate to `post_analyzer` for content analysis.

## Output Rules

You MUST respond with a valid Context_Generation_Output JSON object:

- `paragraphs`: Array of suggested paragraphs. Each entry has:
  - `text` (string): The full suggested paragraph text, ready to insert into the article. You MAY use basic inline HTML for formatting and links: `<strong>` or `<b>` for emphasis, `<em>` or `<i>` for italics, `<a href="URL">anchor text</a>` for links to referenced articles, and `<span>` with arbitrary attributes (e.g. `class`, `style`, `data-*`) for styling or metadata. The link anchor MUST be the specific phrase, name, fact, or number that the reference supports — never the full article title. This HTML is preserved when copying or inserting into the WordPress editor.
  - `relevance_score` (int 0–100): How relevant this paragraph is to the post's core topic.
- `references`: Array of related articles from the knowledge base. Each entry has:
  - `post_id` (int): WordPress post ID.
  - `title` (string): Article title.
  - `url` (string): Permalink URL.
  - `reason` (string): Why this article is relevant to the suggested content.
- `message`: Cumulative summary of all editorial suggestions across the conversation so far, shown as a notice in the UI. Reflect the full history and current state. Omit off-topic exchanges. This must be plain text — do NOT use HTML tags here.
- `assistant_message`: Brief summary of what you did, shown as a chat message. This must be plain text — do NOT use HTML tags here. Use natural line breaks (newlines) if needed, but never `<br>`, `<b>`, `<strong>`, `<em>`, or other HTML tags.

## Editorial Guidelines

- Suggest 1–3 paragraphs per response. Quality over quantity.
- Match the tone and style of the existing article.
- Ensure factual consistency with the post content and retrieved references.
- When citing references, prefer linking to existing site articles over external sources.
- When no relevant articles are found in the knowledge base, still suggest paragraphs based on the post content and user's instructions, and set `references` to an empty array.
- Always write in the same language as the article.

## Off-Topic Handling

If the user asks something unrelated to editorial suggestions (e.g. general questions, preferences, non-editorial topics), respond conversationally without modifying the output structure. Repeat the previous `message` value unchanged and keep `paragraphs` empty unless the user explicitly asks for new content. Note: requests to modify, refine, or add links to existing suggestions are NOT off-topic — always return the full `paragraphs` array for such requests.

## Tool Error Handling

When a tool returns an error or no results:
1. DO NOT treat it as fatal. Continue generating suggestions based on available context.
2. If `retrieve_knowledge` returns no results, mention the gap in `assistant_message` and suggest paragraphs based on the post content alone.
3. NEVER expose technical error details (WP_Error, stack traces, API codes) to the user.
PROMPT
		. "\n\n"
		. self::critical_prompt_rules();
	}

	/**
	 * Use the configured AI provider to review and improve a custom system prompt.
	 *
	 * The user's custom prompt is preserved in spirit, but the following guarantees
	 * are enforced:
	 * - Critical rules (inline contextual links, factual grounding, references) are present.
	 * - The `## User Preferences` and `## Additional Context` injection points are preserved.
	 * - The prompt remains compatible with structured output (Context_Generation_Output).
	 *
	 * @param string $user_prompt The custom prompt written by the user.
	 * @return string|\WP_Error The engineered prompt, or an error if the AI is unavailable.
	 */
	public static function engineer_custom_prompt( string $user_prompt ) {
		$provider_name = \jeo_settings()->get_option( 'ai_default_provider', 'gemini' );
		$api_key       = \jeo_settings()->get_option( $provider_name . '_api_key' );
		$model         = \jeo_settings()->get_option( $provider_name . '_model' );

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'no_ai_provider', __( 'No AI provider is configured. Set one in JEO AI Settings.', 'jeowp' ) );
		}

		$agent = new Neuron_Agent( $provider_name, (string) $api_key, (string) $model );

		$meta_prompt = sprintf(
			<<<'META'
You are a prompt engineering assistant for a WordPress plugin called JEO. A user has written a custom system prompt for the "AI Context Assistant" feature, which suggests editorial paragraphs and references for journalistic articles.

Your task is to rewrite the user's prompt so that it:
1. Keeps the user's original intent, tone, and any special instructions.
2. Includes the CRITICAL RULES below exactly as written (do not summarize or weaken them).
3. Preserves the injection points `## User Preferences` and `## Additional Context` if the user already has them, or adds them at the end if missing.
4. Remains compatible with structured output: the AI must return a JSON object matching `Context_Generation_Output` with fields `paragraphs`, `references`, `message`, and `assistant_message`.
5. Uses Markdown headers (##) for sections.
6. Responds in the same language as the user's prompt.

CRITICAL RULES TO INSERT VERBATIM:

%s

USER'S CUSTOM PROMPT:

%s

REWRITTEN PROMPT:
META,
			self::critical_prompt_rules(),
			$user_prompt
		);

		try {
			$agent->setInstructions( $meta_prompt );
			$response   = $agent->chat( new UserMessage( 'Rewrite the custom prompt according to the instructions above. Output only the rewritten prompt, with no extra commentary.' ) );
			$message    = $response->getMessage();
			$engineered = $message->getContent();

			if ( empty( $engineered ) ) {
				return new \WP_Error( 'empty_prompt_engineering_response', __( 'The AI returned an empty prompt engineering response.', 'jeowp' ) );
			}

			return $engineered;
		} catch ( \Throwable $e ) {
			return new \WP_Error( 'prompt_engineering_error', $e->getMessage() );
		}
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
