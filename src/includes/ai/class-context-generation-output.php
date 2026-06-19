<?php
/**
 * Structured output DTO for the context generation agent.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\StructuredOutput\SchemaProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Data Transfer Object representing suggested editorial content for a post.
 *
 * Used as the structured output class for the Context_Agent so the AI
 * always returns typed, validated suggestions with references.
 */
class Context_Generation_Output {

	/**
	 * Suggested paragraphs to incorporate into the article.
	 *
	 * @var array
	 */
	#[SchemaProperty(
		description: 'Array of suggested paragraphs to insert into the article. Each entry must have: text (string, the full paragraph content), relevance_score (int 0–100, how relevant the paragraph is to the post topic). The text may contain basic inline HTML for formatting and links: <strong>, <em>, <a href="...">. Use <a href="URL">anchor text</a> when citing referenced articles. The anchor MUST be the specific phrase, name, fact, or number the reference supports — never the full article title.',
		required: true,
	)]
	public array $paragraphs = array();

	/**
	 * Related articles from the knowledge base that support the suggestions.
	 *
	 * @var array
	 */
	#[SchemaProperty(
		description: 'Array of related articles found in the knowledge base. Each entry has: post_id (int), title (string), url (string), reason (string explaining why this article is relevant).',
		required: true,
	)]
	public array $references = array();

	/**
	 * Summary message shown to the user about what was generated.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Cumulative summary of all editorial suggestions across the conversation, shown as a notice in the UI. Reflect the full history and current state. Keep it concise.',
		required: true,
	)]
	public string $message = '';

	/**
	 * Optional assistant chat message.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Human-readable summary of what the agent did, shown as an assistant chat message.',
	)]
	public string $assistant_message = '';

	/**
	 * Convert to REST API response array.
	 *
	 * @return array
	 */
	public function to_rest_response(): array {
		return array(
			'success'           => true,
			'paragraphs'        => $this->paragraphs,
			'references'        => $this->references,
			'message'           => $this->message,
			'assistant_message' => $this->assistant_message,
		);
	}
}
