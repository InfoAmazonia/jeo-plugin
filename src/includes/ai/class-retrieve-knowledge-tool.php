<?php
/**
 * NeuronAI tool: retrieve relevant articles from the RAG vector store.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Tools\ArrayProperty;
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
			description: 'Search the site\'s vectorized knowledge base for articles semantically related to given queries. Returns post titles, excerpts, URLs, publication dates, and relevance scores. Accepts a single query or a queries array (one targeted query per theme) whose results are merged and deduplicated.',
		);
	}

	/**
	 * Define tool properties.
	 *
	 * @return ToolProperty[]|ArrayProperty[]
	 */
	protected function properties(): array {
		return array(
			new ToolProperty(
				name: 'query',
				type: PropertyType::STRING,
				description: 'Search query or topic to find related articles in the knowledge base. Use this for single-theme searches; use "queries" when the request spans multiple themes.',
				required: false,
			),
			new ArrayProperty(
				name: 'queries',
				description: 'Array of search queries, one targeted query per theme. Results are merged and deduplicated by post, keeping the best score per post. Use this when the request combines multiple themes or angles.',
				required: false,
				items: new ToolProperty(
					name: 'query',
					type: PropertyType::STRING,
					description: 'A single targeted search query.',
				),
				minItems: 1,
				maxItems: 6,
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
	 * Accepts either a single `query` or a `queries` array (one targeted query
	 * per theme). Multi-query results are merged, deduplicated by post (best
	 * score wins), and interleaved by per-query rank so every theme keeps
	 * representation in the final list before the global top_k cap is applied.
	 *
	 * @param string|null $query   Single search query.
	 * @param int|null    $top_k   Number of results.
	 * @param array|null  $queries Array of search queries (one per theme).
	 * @return string JSON-encoded results.
	 */
	public function __invoke( ?string $query = null, ?int $top_k = null, ?array $queries = null ): string {
		$top_k = $top_k ? (int) $top_k : 5;
		if ( $top_k < 1 ) {
			$top_k = 5;
		}
		if ( $top_k > 20 ) {
			$top_k = 20;
		}

		if ( empty( $queries ) ) {
			$queries = null !== $query && '' !== trim( (string) $query ) ? array( $query ) : array();
		}
		$queries = array_values(
			array_filter(
				array_map(
					function ( $q ) {
						return trim( (string) $q );
					},
					(array) $queries
				),
				function ( $q ) {
					return '' !== $q;
				}
			)
		);

		if ( empty( $queries ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => __( 'Provide either "query" (string) or "queries" (array of strings).', 'jeowp' ),
				)
			);
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

			$by_id = array();
			foreach ( $queries as $query_text ) {
				$rank = 0;
				$docs = $retrieval->retrieve( new \NeuronAI\Chat\Messages\UserMessage( $query_text ) );

				foreach ( $docs as $doc ) {
					$record = $this->format_document( $doc );
					if ( null === $record ) {
						continue;
					}

					$key = $record['post_id'] > 0 ? 'p' . $record['post_id'] : 'c' . md5( $record['url'] . $record['title'] );
					if ( isset( $by_id[ $key ] ) ) {
						continue;
					}

					// Rank within its own query result, for theme-fair interleaving.
					$record['_rank'] = $rank;
					$by_id[ $key ]   = $record;
					++$rank;
				}
			}

			// Interleave by per-query rank (all first-ranked docs first), score as tiebreaker.
			$results = array_values( $by_id );
			usort(
				$results,
				function ( $a, $b ) {
					if ( $a['_rank'] === $b['_rank'] ) {
						return $b['score'] <=> $a['score'];
					}
					return $a['_rank'] <=> $b['_rank'];
				}
			);

			$results = array_slice( $results, 0, $top_k );
			foreach ( $results as &$record ) {
				unset( $record['_rank'] );
			}
			unset( $record );

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

	/**
	 * Format a retrieved document as a result record.
	 *
	 * @param \NeuronAI\RAG\Document $doc Retrieved document.
	 * @return array|null Result record, or null if the document has no usable identity.
	 */
	private function format_document( $doc ): ?array {
		$post_id = (int) ( $doc->metadata['post_id'] ?? 0 );
		$post    = $post_id ? get_post( $post_id ) : null;

		$doc_date = $doc->metadata['date'] ?? ( $post ? $post->post_date : '' );
		$iso_date = '';
		if ( $doc_date ) {
			$timestamp = strtotime( $doc_date );
			if ( false !== $timestamp ) {
				$iso_date = gmdate( 'Y-m-d', $timestamp );
			}
		}

		$title = $post ? $post->post_title : ( $doc->metadata['title'] ?? '' );
		$url   = $post_id ? get_permalink( $post_id ) : '';

		if ( '' === $title && '' === $url ) {
			return null;
		}

		return array(
			'post_id' => $post_id,
			'title'   => $title,
			'excerpt' => $post ? get_the_excerpt( $post ) : mb_strimwidth( $doc->getContent(), 0, 300, '...' ),
			'url'     => $url,
			'date'    => $iso_date,
			'score'   => $doc->getScore(),
		);
	}
}
