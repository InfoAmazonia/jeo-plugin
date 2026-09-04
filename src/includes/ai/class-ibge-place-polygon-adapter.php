<?php
/**
 * IBGE adapter for Brazilian municipalities and states.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * IBGE adapter for Brazilian municipalities and states.
 */
class IBGE_Place_Polygon_Adapter extends Abstract_Place_Polygon_Adapter {

	/**
	 * {@inheritDoc}
	 */
	public function get_source(): string {
		return 'ibge';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string      $place_name Place name.
	 * @param string|null $context    Optional state context.
	 */
	public function resolve( string $place_name, ?string $context = null ) {
		$place_name = $this->normalize_name( $place_name );
		$context    = $context ? $this->normalize_name( $context ) : '';

		$cached = $this->get_cached( $place_name, $context );
		if ( null !== $cached ) {
			return $cached;
		}

		// Try municipality first, then state.
		$entity = $this->find_municipality( $place_name, $context );
		if ( null === $entity ) {
			$entity = $this->find_state( $place_name, $context );
		}

		if ( null === $entity ) {
			return null;
		}

		$geojson = $this->fetch_malha( $entity['id'], $entity['type'] );
		if ( is_wp_error( $geojson ) || empty( $geojson ) ) {
			return $geojson;
		}

		$bbox = $this->compute_bbox( $geojson );
		if ( null === $bbox ) {
			return new \WP_Error(
				'jeo_ibge_bbox',
				__( 'Could not compute bounding box from IBGE geometry.', 'jeowp' )
			);
		}

		$result = array(
			'source'       => $this->get_source(),
			'display_name' => $entity['name'],
			'attribution'  => __( 'Source: IBGE', 'jeowp' ),
			'geojson'      => $geojson,
			'bbox'         => $bbox,
		);

		$this->set_cached( $place_name, $result, $context );
		return $result;
	}

	/**
	 * Find a municipality by name, optionally disambiguated by state.
	 *
	 * The IBGE endpoint ignores the "nome" query parameter, so we fetch the
	 * full list once per day and filter it client-side.
	 *
	 * @param string $place_name Place name.
	 * @param string $context    State name or abbreviation.
	 * @return array|null Entity with id, name, type or null.
	 */
	private function find_municipality( string $place_name, string $context ): ?array {
		$data = $this->get_municipality_list();
		if ( empty( $data ) ) {
			return null;
		}

		$place_lower = $this->normalize_for_compare( $place_name );
		$matches     = array_filter(
			$data,
			function ( $item ) use ( $place_lower ) {
				return $this->normalize_for_compare( $item['nome'] ?? '' ) === $place_lower;
			}
		);

		if ( empty( $matches ) ) {
			return null;
		}

		$match = $this->disambiguate_ibge( array_values( $matches ), $context );
		if ( null === $match ) {
			return null;
		}

		return array(
			'id'   => (int) $match['id'],
			'name' => sanitize_text_field( $match['nome'] ),
			'type' => 'municipality',
		);
	}

	/**
	 * Get the full IBGE municipality list, cached for one month.
	 *
	 * @return array
	 */
	private function get_municipality_list(): array {
		$cache_key = 'jeo_ibge_municipios_list';
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = $this->http_get( 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios' );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return array();
		}

		set_transient( $cache_key, $data, MONTH_IN_SECONDS );
		return $data;
	}

	/**
	 * Normalize a string for case-insensitive, accent-insensitive comparison.
	 *
	 * @param string $value Raw value.
	 * @return string
	 */
	private function normalize_for_compare( string $value ): string {
		$value = remove_accents( $value );
		$value = strtolower( $value );
		$value = preg_replace( '/[^a-z0-9\s]/', '', $value );
		return trim( $value );
	}

	/**
	 * Find a state by name.
	 *
	 * @param string $place_name Place name.
	 * @param string $context    Optional context (ignored for states).
	 * @return array|null Entity with id, name, type or null.
	 */
	private function find_state( string $place_name, string $context ): ?array {
		unset( $context );

		$data = $this->get_state_list();
		if ( empty( $data ) ) {
			return null;
		}

		$place_lower = $this->normalize_for_compare( $place_name );
		foreach ( $data as $state ) {
			if ( $this->normalize_for_compare( $state['nome'] ?? '' ) === $place_lower ) {
				return array(
					'id'   => (int) $state['id'],
					'name' => sanitize_text_field( $state['nome'] ),
					'type' => 'state',
				);
			}
		}

		return null;
	}

	/**
	 * Get the full IBGE state list, cached for one month.
	 *
	 * @return array
	 */
	private function get_state_list(): array {
		$cache_key = 'jeo_ibge_estados_list';
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = $this->http_get( 'https://servicodados.ibge.gov.br/api/v1/localidades/estados' );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) ) {
			return array();
		}

		set_transient( $cache_key, $data, MONTH_IN_SECONDS );
		return $data;
	}

	/**
	 * Pick the best IBGE match using optional state context.
	 *
	 * @param array  $results Array of IBGE entities.
	 * @param string $context State name or abbreviation.
	 * @return array|null
	 */
	private function disambiguate_ibge( array $results, string $context ): ?array {
		if ( empty( $results ) ) {
			return null;
		}

		if ( '' === $context || 1 === count( $results ) ) {
			return $results[0];
		}

		$context_lower = strtolower( $context );
		foreach ( $results as $result ) {
			$uf_nome  = strtolower( $result['microrregiao']['mesorregiao']['UF']['nome'] ?? '' );
			$uf_sigla = strtolower( $result['microrregiao']['mesorregiao']['UF']['sigla'] ?? '' );
			if ( $context_lower === $uf_nome || $context_lower === $uf_sigla ) {
				return $result;
			}
		}

		return $results[0];
	}

	/**
	 * Fetch the IBGE malha v3 GeoJSON for a code.
	 *
	 * @param int    $id   IBGE code.
	 * @param string $type municipality|state.
	 * @return array|\WP_Error GeoJSON geometry array or error.
	 */
	private function fetch_malha( int $id, string $type ) {
		$path = 'municipality' === $type ? 'municipios' : 'estados';
		$url  = sprintf(
			'https://servicodados.ibge.gov.br/api/v3/malhas/%s/%d?formato=application/vnd.geo+json',
			$path,
			$id
		);

		$response = $this->http_get( $url );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			return new \WP_Error(
				'jeo_ibge_malha_http',
				sprintf(
					/* translators: %d: HTTP status code. */
					__( 'IBGE API returned HTTP %d.', 'jeowp' ),
					$code
				)
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) ) {
			return new \WP_Error(
				'jeo_ibge_malha_json',
				__( 'Could not parse IBGE geometry response.', 'jeowp' )
			);
		}

		return $data;
	}
}
