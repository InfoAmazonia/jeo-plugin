<?php
/**
 * NeuronAI tool: generate a boundary layer from a place name.
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
 * Tool that resolves a place name into an authoritative boundary polygon
 * and creates a JEO map-layer CPT backed by a Mapbox style.
 */
class Generate_Boundary_Layer_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'generate_boundary_layer',
			description: 'Generate a boundary layer for a named place (municipality, state, indigenous land, department, etc.). Uses authoritative public sources when available (IBGE for Brazil, FUNAI for indigenous lands, OpenStreetMap as fallback). Requires a Mapbox API key.',
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
				name: 'place_name',
				type: PropertyType::STRING,
				description: 'Name of the place whose boundary should be drawn (e.g. "Altamira", "Amazonas, Colombia", "Terra Indígena Yanomami").',
				required: true,
			),
			new ToolProperty(
				name: 'entity_type',
				type: PropertyType::STRING,
				description: 'Optional type hint: "municipality", "state", "indigenous_land", or "other".',
				required: false,
			),
			new ToolProperty(
				name: 'context',
				type: PropertyType::STRING,
				description: 'Optional geographic context to disambiguate the place (e.g. "Pará", "Brazil", "Colombia").',
				required: false,
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
	 * @param string      $place_name  Place name.
	 * @param string|null $entity_type Optional entity type hint.
	 * @param string|null $context     Optional geographic context.
	 * @param string|null $layer_name  Optional custom layer title.
	 * @return string JSON-encoded result.
	 */
	public function __invoke( string $place_name, ?string $entity_type = null, ?string $context = null, ?string $layer_name = null ): string {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => __( 'You do not have permission to generate layers.', 'jeowp' ),
				)
			);
		}

		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => __( 'Mapbox API key is not configured. Cannot publish boundary layers.', 'jeowp' ),
				)
			);
		}

		$service = new Place_Polygon_Service();
		$result  = $service->create_layer(
			$place_name,
			$entity_type,
			$context,
			$layer_name ?? ''
		);

		if ( is_wp_error( $result ) ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		$bbox   = $result['bbox'];
		$center = array(
			'lat' => ( $bbox[1] + $bbox[3] ) / 2,
			'lon' => ( $bbox[0] + $bbox[2] ) / 2,
		);

		return wp_json_encode(
			array(
				'success'      => true,
				'layer_id'     => $result['id'],
				'title'        => $result['title'],
				'type'         => $result['type'],
				'style_id'     => $result['style_id'],
				'style_url'    => $result['style_url'],
				'edit_url'     => $result['edit_url'],
				'bbox'         => $bbox,
				'center_lat'   => $center['lat'],
				'center_lon'   => $center['lon'],
				'display_name' => $result['display_name'],
				'attribution'  => $result['attribution'],
			)
		);
	}
}
