<?php
/**
 * NeuronAI tool: generate a custom Mapbox style and create a layer CPT.
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
 * Tool that generates a custom Mapbox map style from a text description
 * and creates a JEO layer CPT. Only functional when a Mapbox API key is configured.
 */
class Generate_Layer_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'generate_layer',
			description: 'Generate a thematic map layer from a text description and create a new layer. Uses built-in Mapbox tilesets when possible, or publishes a composed style for external sources. Requires a Mapbox API key. Has cost implications (AI tokens + Mapbox API). Only use when the user explicitly authorizes layer generation.',
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
				name: 'prompt',
				type: PropertyType::STRING,
				description: 'Description of the desired map style (e.g. "dark themed deforestation heatmap for the Amazon region").',
				required: true,
			),
			new ToolProperty(
				name: 'layer_name',
				type: PropertyType::STRING,
				description: 'Optional custom title for the generated layer.',
				required: false,
			),
		);
	}

	/**
	 * Execute the tool.
	 *
	 * @param string      $prompt     Description of the desired map style.
	 * @param string|null $layer_name Optional custom title for the layer.
	 * @return string JSON-encoded result.
	 */
	public function __invoke( string $prompt, ?string $layer_name = null ): string {
		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => 'Mapbox API key is not configured. Cannot generate custom layers.',
				)
			);
		}

		$name   = $layer_name ?? '';
		$result = Minilayer_Service::generate_and_create( $prompt, $name );

		if ( is_wp_error( $result ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( sprintf( '[JEO] generate_layer failed (%s): %s', $result->get_error_code(), $result->get_error_message() ) );

			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		return wp_json_encode(
			array(
				'success'  => true,
				'layer_id' => $result['id'],
				'title'    => $result['title'],
				'type'     => $result['type'],
				'style_id' => $result['style_id'],
				'edit_url' => $result['edit_url'],
			)
		);
	}
}
