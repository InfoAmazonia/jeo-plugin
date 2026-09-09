<?php
/**
 * Structured output class for a single georeferenced location.
 *
 * Used by NeuronAI Structured Output to enforce schema and validation
 * instead of relying on prompt-based JSON extraction.
 *
 * @package Jeo
 */

namespace Jeo\AI\Structured;

use NeuronAI\StructuredOutput\SchemaProperty;
use NeuronAI\StructuredOutput\Validation\Rules\NotBlank;
use NeuronAI\StructuredOutput\Validation\Rules\GreaterThanEqual;
use NeuronAI\StructuredOutput\Validation\Rules\LowerThanEqual;

/**
 * Location Output
 *
 * Represents one geographic location extracted by AI georeferencing.
 */
class Location_Output {

	/**
	 * Location name or address.
	 *
	 * @var string
	 */
	#[SchemaProperty( description: 'The location name or address' )]
	#[NotBlank]
	public string $name;

	/**
	 * Latitude as a decimal number.
	 *
	 * @var float
	 */
	#[SchemaProperty( description: 'Latitude as a decimal number' )]
	public float $lat;

	/**
	 * Longitude as a decimal number.
	 *
	 * @var float
	 */
	#[SchemaProperty( description: 'Longitude as a decimal number' )]
	public float $lon;

	/**
	 * Short relevant snippet from the text mentioning this location.
	 *
	 * @var string
	 */
	#[SchemaProperty( description: 'A short relevant snippet (10-15 words) from the provided text that mentions this location' )]
	#[NotBlank]
	public string $quote;

	/**
	 * Confidence score from 0 to 100.
	 *
	 * @var int
	 */
	#[SchemaProperty( description: 'Confidence score from 0 to 100' )]
	#[GreaterThanEqual( 0 )]
	#[LowerThanEqual( 100 )]
	public int $confidence;

	/**
	 * Whether this location is the primary geographic focus.
	 *
	 * @var bool
	 */
	#[SchemaProperty( description: 'Whether this location is the PRIMARY geographic focus of the content' )]
	public bool $is_primary;
}
