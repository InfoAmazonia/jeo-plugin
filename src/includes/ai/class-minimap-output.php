<?php
/**
 * Structured output DTO for the minimap agent.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\StructuredOutput\SchemaProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Data Transfer Object representing a complete minimap configuration.
 *
 * Used as the structured output class for the Minimap_Agent so the AI
 * always returns a valid, typed minimap definition.
 */
class Minimap_Output {

	/**
	 * Thematic map layer definitions.
	 *
	 * @var array
	 */
	#[SchemaProperty(
		description: 'Thematic map layer definitions. Each entry has: id (int), use ("fixed"), default (true), show_legend (bool), style (optional object). The style object can contain: use_default (bool — when true, use the layer\'s AI-suggested default_style), filter (array — MapLibre filter expression like ["==", "class", "wood"]), paint (object — paint properties like {"fill-color": "#2d5a27", "fill-opacity": 0.6}), layout (object — layout properties).',
		required: true,
	)]
	public array $layers = array();

	/**
	 * Base terrain layer definition or null.
	 *
	 * @var array|null
	 */
	#[SchemaProperty(
		description: 'Base terrain layer definition with id, use, default, show_legend, load_as_style (bool), variant ("dark"|"light"|"satellite"). Null if no base layer.',
	)]
	public ?array $base_layer = null;

	/**
	 * Map center latitude.
	 *
	 * @var float
	 */
	#[SchemaProperty(
		description: 'Map center latitude.',
		required: true,
		min: -90,
		max: 90,
	)]
	public float $center_lat = 0.0;

	/**
	 * Map center longitude.
	 *
	 * @var float
	 */
	#[SchemaProperty(
		description: 'Map center longitude.',
		required: true,
		min: -180,
		max: 180,
	)]
	public float $center_lon = 0.0;

	/**
	 * Initial zoom level.
	 *
	 * @var int
	 */
	#[SchemaProperty(
		description: 'Initial zoom level (0–20).',
		required: true,
		min: 0,
		max: 20,
	)]
	public int $initial_zoom = 2;

	/**
	 * Geolocation pins.
	 *
	 * @var array
	 */
	#[SchemaProperty(
		description: 'Geolocation pins. Each entry has lat (float), lon (float), relevance ("primary"|"secondary"), address (string).',
	)]
	public array $pins = array();

	/**
	 * Base layer variant choice.
	 *
	 * @var string|null
	 */
	#[SchemaProperty(
		description: 'Base layer variant choice: "dark", "light", or "satellite". Set when the agent decides the variant based on context; null to use the luminance heuristic fallback.',
	)]
	public ?string $base_variant = null;

	/**
	 * Cumulative summary of map-relevant changes.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Cumulative summary of all map-relevant changes across the conversation so far, shown as a notice above the map. Reflect the full history of what was done and the current state. Omit off-topic exchanges. Keep it concise.',
		required: true,
	)]
	public string $message = '';

	/**
	 * Optional assistant chat message.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Optional human-readable summary of what the agent did, shown as an assistant chat message in the block UI.',
	)]
	public string $assistant_message = '';

	/**
	 * Convert to the array format expected by the minimap block attributes.
	 *
	 * @return array
	 */
	public function to_block_attributes(): array {
		return array(
			'layers'       => $this->layers,
			'base_layer'   => $this->base_layer,
			'center_lat'   => $this->center_lat,
			'center_lon'   => $this->center_lon,
			'initial_zoom' => $this->initial_zoom,
			'pins'         => $this->pins,
			'message'      => $this->message,
		);
	}

	/**
	 * Convert to REST API response array.
	 *
	 * @return array
	 */
	public function to_rest_response(): array {
		$response = array(
			'success'           => true,
			'layers'            => $this->layers,
			'base_layer'        => $this->base_layer,
			'center_lat'        => $this->center_lat,
			'center_lon'        => $this->center_lon,
			'initial_zoom'      => $this->initial_zoom,
			'pins'              => $this->pins,
			'message'           => $this->message,
			'assistant_message' => $this->assistant_message,
		);

		if ( null !== $this->base_variant ) {
			$response['base_variant'] = $this->base_variant;
		}

		return $response;
	}
}
