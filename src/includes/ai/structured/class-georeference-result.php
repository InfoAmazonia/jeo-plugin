<?php
/**
 * Structured output wrapper for AI georeferencing results.
 *
 * NeuronAI does not support arrays as the root schema, so we wrap
 * the list of locations inside an object with a single property.
 *
 * @package Jeo
 */

namespace Jeo\AI\Structured;

use NeuronAI\StructuredOutput\SchemaProperty;
use NeuronAI\StructuredOutput\Validation\Rules\ArrayOf;

/**
 * Georeference Result
 *
 * Wraps the array of Location_Output objects for NeuronAI Structured Output.
 */
class Georeference_Result {

	#[SchemaProperty(
		description: 'List of geographic locations found in the provided text. Include EVERY possible location, even with low confidence.',
		anyOf: [ Location_Output::class ]
	)]
	#[ArrayOf( Location_Output::class )]
	public array $locations;
}
