<?php
/**
 * FUNAI adapter for Brazilian indigenous lands.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * FUNAI adapter for Brazilian indigenous lands.
 */
class FUNAI_Place_Polygon_Adapter extends Abstract_Place_Polygon_Adapter {

	/**
	 * {@inheritDoc}
	 */
	public function get_source(): string {
		return 'funai';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string      $place_name Place name.
	 * @param string|null $context    Optional context (ignored for FUNAI).
	 */
	public function resolve( string $place_name, ?string $context = null ) {
		unset( $context );

		$place_name = $this->normalize_name( $place_name );

		$cached = $this->get_cached( $place_name );
		if ( null !== $cached ) {
			return $cached;
		}

		$name_attribute = apply_filters( 'jeo_funai_wfs_name_attribute', 'nome' );
		$name_attribute = sanitize_key( $name_attribute );

		// Case-insensitive partial match via GeoServer CQL.
		$cql = sprintf(
			"strToLower(%s) LIKE '%%%s%%'",
			$name_attribute,
			strtolower( esc_sql( $place_name ) )
		);

		$url = add_query_arg(
			array(
				'service'      => 'WFS',
				'version'      => '1.0.0',
				'request'      => 'GetFeature',
				'typeName'     => 'Funai:tis_poligonais',
				'outputFormat' => 'application/json',
				'CQL_FILTER'   => $cql,
				'maxFeatures'  => 10,
			),
			'https://catalogo.funai.gov.br/geoserver/Funai/ows'
		);

		$response = $this->http_get( $url );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			return new \WP_Error(
				'jeo_funai_wfs_http',
				sprintf(
					/* translators: %d: HTTP status code. */
					__( 'FUNAI WFS returned HTTP %d.', 'jeowp' ),
					$code
				)
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) ) {
			return new \WP_Error(
				'jeo_funai_wfs_json',
				__( 'Could not parse FUNAI WFS response.', 'jeowp' )
			);
		}

		$features = $data['features'] ?? array();
		if ( empty( $features ) ) {
			return null;
		}

		$feature = $this->pick_best_feature( $features, $place_name );
		$props   = $feature['properties'] ?? array();
		$display = sanitize_text_field( $props[ $name_attribute ] ?? $place_name );

		$bbox = $this->compute_bbox( $feature['geometry'] );
		if ( null === $bbox ) {
			return new \WP_Error(
				'jeo_funai_bbox',
				__( 'Could not compute bounding box from FUNAI geometry.', 'jeowp' )
			);
		}

		$result = array(
			'source'       => $this->get_source(),
			'display_name' => $display,
			'attribution'  => __( 'Source: FUNAI', 'jeowp' ),
			'geojson'      => array(
				'type'     => 'FeatureCollection',
				'features' => array( $feature ),
			),
			'bbox'         => $bbox,
		);

		$this->set_cached( $place_name, $result );
		return $result;
	}

	/**
	 * Pick the feature whose name most closely matches the query.
	 *
	 * @param array  $features   WFS features.
	 * @param string $place_name Query name.
	 * @return array
	 */
	private function pick_best_feature( array $features, string $place_name ): array {
		$name_attribute = apply_filters( 'jeo_funai_wfs_name_attribute', 'nome' );
		$place_lower    = strtolower( $place_name );
		$best           = $features[0];
		$best_score     = 0;

		foreach ( $features as $feature ) {
			$name  = strtolower( sanitize_text_field( $feature['properties'][ $name_attribute ] ?? '' ) );
			$score = similar_text( $place_lower, $name, $percent );
			unset( $score );

			if ( $percent > $best_score ) {
				$best_score = $percent;
				$best       = $feature;
			}
		}

		return $best;
	}
}
