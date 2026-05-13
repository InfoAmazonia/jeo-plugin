<?php
/**
 * NeuronAI tool: search map layers via RAG.
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
 * Tool that wraps RAG_Worker::find_matching_layers() for use by the minimap agent.
 */
class Search_Layers_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'search_layers',
			description: 'Search for map layers that semantically match a query. Returns layer IDs, titles, types, and relevance scores.',
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
				description: 'Search text describing the desired map layers (e.g. "deforestation in the Amazon", "population density").',
				required: true,
			),
			new ToolProperty(
				name: 'top_k',
				type: PropertyType::INTEGER,
				description: 'Maximum number of results to return. Default: 5.',
				required: false,
			),
		);
	}

	/**
	 * Execute the tool.
	 *
	 * @param string   $query Search text.
	 * @param int|null $top_k Max results.
	 * @return string JSON-encoded results.
	 */
	public function __invoke( string $query, ?int $top_k = null ): string {
		$limit = $top_k ?? 5;

		try {
			$results = RAG_Worker::find_matching_layers( $query, $limit );

			$layers = array();
			foreach ( $results as $result ) {
				$layer_id = (int) $result['layer_id'];
				if ( $layer_id && 'publish' === get_post_status( $layer_id ) ) {
					$layers[] = array(
						'layer_id'   => $layer_id,
						'title'      => $result['title'],
						'layer_type' => $result['layer_type'],
						'score'      => $result['score'],
					);
				}
			}

			return wp_json_encode(
				array(
					'success' => true,
					'count'   => count( $layers ),
					'layers'  => $layers,
				)
			);
		} catch ( \Exception $e ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $e->getMessage(),
					'layers'  => array(),
				)
			);
		}
	}
}
