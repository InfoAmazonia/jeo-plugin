<?php
/**
 * NeuronAI tool: retrieve relevant articles from the RAG vector store.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Tool that performs semantic retrieval against the site's knowledge base
 * (jeo_knowledge vector store) and returns matching articles with metadata.
 */
class Retrieve_Knowledge_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'retrieve_knowledge',
			description: 'Search the site\'s vectorized knowledge base for articles semantically related to a given query. Returns post titles, excerpts, URLs, and relevance scores.',
		);
	}

	/**
	 * Define tool properties.
	 *
	 * @return ToolProperty[]
	 */
	protected function properties(): array {
		return array(
			new ToolProperty(
				name: 'query',
				type: PropertyType::STRING,
				description: 'Search query or topic to find related articles in the knowledge base.',
				required: true,
			),
			new ToolProperty(
				name: 'top_k',
				type: PropertyType::INTEGER,
				description: 'Maximum number of results to return (1–20). Default 5.',
				required: false,
			),
		);
	}

	/**
	 * Execute the tool.
	 *
	 * @param string   $query Search query.
	 * @param int|null $top_k Number of results.
	 * @return string JSON-encoded results.
	 */
	public function __invoke( string $query, ?int $top_k = null ): string {
		$top_k = $top_k ? (int) $top_k : 5;
		if ( $top_k < 1 ) {
			$top_k = 5;
		}
		if ( $top_k > 20 ) {
			$top_k = 20;
		}

		$feasible = RAG_Agent::is_feasible();
		if ( is_wp_error( $feasible ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $feasible->get_error_message(),
				)
			);
		}

		try {
			$rag       = new RAG_Agent( 'jeo_knowledge' );
			$retrieval = $rag->resolveRetrieval();
			$docs      = $retrieval->retrieve( new \NeuronAI\Chat\Messages\UserMessage( $query ) );

			$results = array();
			$count   = 0;
			foreach ( $docs as $doc ) {
				if ( $count >= $top_k ) {
					break;
				}

				$post_id = (int) ( $doc->metadata['post_id'] ?? 0 );
				$post    = $post_id ? get_post( $post_id ) : null;

				$results[] = array(
					'post_id' => $post_id,
					'title'   => $post ? $post->post_title : ( $doc->metadata['title'] ?? '' ),
					'excerpt' => $post ? get_the_excerpt( $post ) : mb_strimwidth( $doc->getContent(), 0, 300, '...' ),
					'url'     => $post_id ? get_permalink( $post_id ) : '',
					'score'   => $doc->getScore(),
				);
				++$count;
			}

			return wp_json_encode(
				array(
					'success' => true,
					'count'   => count( $results ),
					'results' => $results,
				),
				JSON_UNESCAPED_UNICODE
			);
		} catch ( \Exception $e ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $e->getMessage(),
				)
			);
		}
	}
}
