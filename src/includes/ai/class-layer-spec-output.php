<?php
/**
 * Structured output DTO for the minilayer classifier.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\StructuredOutput\SchemaProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Data Transfer Object representing a classified minilayer specification.
 *
 * Used as the structured output class for the minilayer classifier so the AI
 * returns a deterministic, typed layer definition instead of free-form text.
 */
class Layer_Spec_Output {

	/**
	 * Whether the request can be approximated with available data.
	 *
	 * @var bool
	 */
	#[SchemaProperty(
		description: 'Set to false when the request asks for data that does not exist in any available tileset or external source (e.g. deforestation monitoring, climate data, demographic census). When false, all other fields except limitations should be omitted.',
		required: true,
	)]
	public bool $can_approximate = false;

	/**
	 * Layer type.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Layer type. Use "mapbox-tileset-vector" for single built-in tileset + single source-layer + vector geometry. Use "mapbox" only when external sources, multiple tilesets, raster overlays, or complex composition are needed.',
		required: true,
	)]
	public string $layer_type = '';

	/**
	 * Human-readable layer title.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Short, descriptive layer title derived from the user prompt.',
		required: true,
	)]
	public string $layer_title = '';

	/**
	 * Suggested layer theme from the layer-theme taxonomy.
	 *
	 * @var string|null
	 */
	#[SchemaProperty(
		description: 'Best-matching layer theme for catalog organization and minimap disambiguation. Use one of: Deforestation, Hydrography, Indigenous Lands, Protected Areas, Mining, Oil and Gas, Land Use, Agriculture, Infrastructure, Administrative Boundaries, Socioeconomic, Biodiversity, Fire, Climate.',
	)]
	public ?string $theme = null;

	/**
	 * Mapbox tileset ID.
	 *
	 * @var string|null
	 */
	#[SchemaProperty(
		description: 'Mapbox tileset ID (e.g. "mapbox.mapbox-streets-v8"). Required for mapbox-tileset-vector.',
	)]
	public ?string $tileset_id = null;

	/**
	 * Source layer within the tileset.
	 *
	 * @var string|null
	 */
	#[SchemaProperty(
		description: 'Source layer name within the tileset (e.g. "waterway", "landuse"). Required for mapbox-tileset-vector.',
	)]
	public ?string $source_layer = null;

	/**
	 * Vector geometry type.
	 *
	 * @var string|null
	 */
	#[SchemaProperty(
		description: 'Geometry type for mapbox-tileset-vector: "fill", "line", "symbol", "circle", "fill-extrusion", or "heatmap".',
	)]
	public ?string $layer_geometry_type = null;

	/**
	 * MapLibre filter expression.
	 *
	 * @var array|null
	 */
	#[SchemaProperty(
		description: 'Optional MapLibre filter expression to narrow features (e.g. ["==", "class", "river"]).',
	)]
	public ?array $suggested_filter = null;

	/**
	 * Default paint properties.
	 *
	 * @var array|null
	 */
	#[SchemaProperty(
		description: 'Paint properties for the layer (e.g. {"line-color": "#2980b9", "line-width": 1.5}). Required for mapbox-tileset-vector; optional for mapbox.',
	)]
	public ?array $suggested_paint = null;

	/**
	 * Full style JSON for composed layers.
	 *
	 * @var array|null
	 */
	#[SchemaProperty(
		description: 'Complete Mapbox GL style JSON. Required only for "mapbox" layer_type. Must include version, sources, and layers.',
	)]
	public ?array $style_json = null;

	/**
	 * External source URLs referenced in style_json.
	 *
	 * @var array|null
	 */
	#[SchemaProperty(
		description: 'Map of source IDs to public URLs for any external sources included in style_json.',
	)]
	public ?array $external_sources = null;

	/**
	 * Human-readable limitations.
	 *
	 * @var string
	 */
	#[SchemaProperty(
		description: 'Human-readable description of what the layer actually shows vs. what was requested. Required when can_approximate is false, recommended otherwise.',
		required: true,
	)]
	public string $limitations = '';

	/**
	 * Normalize fields that the model may return as JSON strings or flat arrays.
	 *
	 * @return void
	 */
	public function normalize(): void {
		$this->suggested_paint  = self::normalize_json_field( $this->suggested_paint );
		$this->suggested_filter = self::normalize_json_field( $this->suggested_filter );
		$this->style_json       = self::normalize_json_field( $this->style_json );
	}

	/**
	 * Normalize a field that should be an associative array.
	 *
	 * Handles models that return a JSON string, a flat key/value array, or
	 * an array containing a single JSON string.
	 *
	 * @param mixed $value Raw field value.
	 * @return array|null
	 */
	private static function normalize_json_field( $value ): ?array {
		if ( null === $value ) {
			return null;
		}

		if ( is_array( $value ) && count( $value ) === 1 && isset( $value[0] ) && is_string( $value[0] ) ) {
			$decoded = json_decode( $value[0], true );
			if ( is_array( $decoded ) ) {
				return $decoded;
			}
		}

		if ( is_string( $value ) ) {
			$decoded = json_decode( $value, true );
			return is_array( $decoded ) ? $decoded : null;
		}

		if ( is_array( $value ) && array_is_list( $value ) ) {
			$value_count = count( $value );
			if ( 0 === $value_count % 2 ) {
				$pairs = array();
				for ( $i = 0; $i < $value_count; $i += 2 ) {
					$pairs[ $value[ $i ] ] = $value[ $i + 1 ];
				}
				return $pairs;
			}
		}

		return is_array( $value ) ? $value : null;
	}

	/**
	 * Convert the spec to a legacy-style array for backwards-compatible consumers.
	 *
	 * @return array
	 */
	public function to_array(): array {
		$array = array(
			'layer_type'      => $this->layer_type,
			'layer_title'     => $this->layer_title,
			'limitations'     => $this->limitations,
			'can_approximate' => $this->can_approximate,
		);

		$optional = array(
			'tileset_id',
			'source_layer',
			'layer_geometry_type',
			'suggested_filter',
			'suggested_paint',
			'style_json',
			'external_sources',
		);

		foreach ( $optional as $key ) {
			if ( null !== $this->$key ) {
				$array[ $key ] = $this->$key;
			}
		}

		return $array;
	}
}
