<?php
/**
 * OpenStreetMap adapter: Nominatim lookup + Overpass geometry assembly.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * OpenStreetMap adapter: Nominatim lookup + Overpass geometry assembly.
 */
class OSM_Place_Polygon_Adapter extends Abstract_Place_Polygon_Adapter {

	/**
	 * Overpass API mirrors to try in order.
	 *
	 * @var string[]
	 */
	private const OVERPASS_MIRRORS = array(
		'https://overpass-api.de/api/interpreter',
		'https://overpass.kumi.systems/api/interpreter',
		'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
	);

	/**
	 * {@inheritDoc}
	 */
	public function get_source(): string {
		return 'osm';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string      $place_name Place name.
	 * @param string|null $context    Optional country/state context.
	 */
	public function resolve( string $place_name, ?string $context = null ) {
		$place_name = $this->normalize_name( $place_name );
		$context    = $context ? $this->normalize_name( $context ) : '';

		$cached = $this->get_cached( $place_name, $context );
		if ( null !== $cached ) {
			return $cached;
		}

		$nominatim = new \Jeo\Geocoders\Nominatim();

		$queries = $this->build_nominatim_queries( $place_name, $context );
		$match   = null;

		foreach ( $queries as $query ) {
			$results = $nominatim->geocode( $query );
			$match   = $this->find_relation_match( $results );
			if ( null !== $match ) {
				break;
			}
		}

		if ( null === $match ) {
			return null;
		}

		$relation_id = (int) $match['osm_id'];
		$geojson     = $this->fetch_overpass_relation( $relation_id );
		if ( is_wp_error( $geojson ) || empty( $geojson ) ) {
			return $geojson;
		}

		$bbox = $this->compute_bbox( $geojson );
		if ( null === $bbox ) {
			return new \WP_Error(
				'jeo_osm_bbox',
				__( 'Could not compute bounding box from OSM geometry.', 'jeowp' )
			);
		}

		$result = array(
			'source'       => $this->get_source(),
			'display_name' => sanitize_text_field( $match['display_name'] ?? $place_name ),
			'attribution'  => __( 'Source: OpenStreetMap contributors', 'jeowp' ),
			'geojson'      => $geojson,
			'bbox'         => $bbox,
		);

		$this->set_cached( $place_name, $result, $context );
		return $result;
	}

	/**
	 * Build normalized Nominatim queries to try.
	 *
	 * Strips common administrative prefixes that confuse Nominatim.
	 *
	 * @param string $place_name Place name.
	 * @param string $context    Optional context.
	 * @return array<int,string>
	 */
	private function build_nominatim_queries( string $place_name, string $context ): array {
		$queries = array();

		if ( '' !== $context ) {
			$queries[] = $place_name . ', ' . $context;
		}

		$queries[] = $place_name;

		$default_prefixes = array(
			// Spanish / Portuguese.
			'Departamento del ',
			'Departamento de ',
			'Departamento do ',
			'Estado del ',
			'Estado de ',
			'Estado do ',
			'Provincia de ',
			'Provincia del ',
			'Región de ',
			'Region de ',
			'Municipio de ',
			'Município de ',
			// English.
			'Department of ',
			'State of ',
			'Province of ',
			'Region of ',
			'Municipality of ',
		);

		$prefixes = apply_filters( 'jeo_osm_admin_prefixes', $default_prefixes );

		foreach ( $prefixes as $prefix ) {
			if ( 0 === stripos( $place_name, $prefix ) ) {
				$stripped = substr( $place_name, strlen( $prefix ) );
				if ( '' !== $context ) {
					$queries[] = $stripped . ', ' . $context;
				}
				$queries[] = $stripped;
			}
		}

		return array_values( array_unique( $queries ) );
	}

	/**
	 * Find the first OSM relation result from Nominatim.
	 *
	 * @param array $results Nominatim results.
	 * @return array|null Raw Nominatim item with osm_id/osm_type.
	 */
	private function find_relation_match( array $results ): ?array {
		foreach ( $results as $result ) {
			$raw = $result['raw'] ?? array();
			if ( empty( $raw['osm_type'] ) || empty( $raw['osm_id'] ) ) {
				continue;
			}
			if ( 'relation' === $raw['osm_type'] ) {
				$raw['display_name'] = $result['full_address'] ?? ( $raw['display_name'] ?? '' );
				return $raw;
			}
		}

		// Fallback: accept any polygon-ish result.
		foreach ( $results as $result ) {
			$raw = $result['raw'] ?? array();
			if ( ! empty( $raw['osm_type'] ) && ! empty( $raw['osm_id'] ) ) {
				$raw['display_name'] = $result['full_address'] ?? ( $raw['display_name'] ?? '' );
				return $raw;
			}
		}

		return null;
	}

	/**
	 * Fetch outer ways for a relation from Overpass and assemble them into a GeoJSON MultiPolygon.
	 *
	 * @param int $relation_id OSM relation ID.
	 * @return array|\WP_Error GeoJSON FeatureCollection or error.
	 */
	private function fetch_overpass_relation( int $relation_id ) {
		$cache_key = 'jeo_osm_overpass_relation_' . $relation_id;
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$overpass_query = sprintf(
			"[out:json];\nrelation(%d);\nout tags;\nway(r:\"outer\");\nout geom;\n",
			$relation_id
		);

		$mirror = $this->pick_overpass_mirror( $overpass_query );
		if ( is_wp_error( $mirror ) ) {
			return $mirror;
		}

		$data = json_decode( $mirror, true );
		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $data ) ) {
			return new \WP_Error(
				'jeo_osm_overpass_json',
				__( 'Could not parse Overpass response.', 'jeowp' )
			);
		}

		$relation_tags = array();
		foreach ( $data['elements'] ?? array() as $element ) {
			if ( 'relation' === ( $element['type'] ?? '' ) && (int) $element['id'] === $relation_id ) {
				$relation_tags = $element['tags'] ?? array();
				break;
			}
		}

		$rings = $this->assemble_rings( $data['elements'] ?? array() );
		if ( empty( $rings ) ) {
			return new \WP_Error(
				'jeo_osm_no_rings',
				__( 'Could not assemble closed rings from OSM relation.', 'jeowp' )
			);
		}

		$coordinates = array();
		foreach ( $rings as $ring ) {
			$coordinates[] = array( $ring );
		}

		$geojson = array(
			'type'     => 'FeatureCollection',
			'features' => array(
				array(
					'type'       => 'Feature',
					'properties' => array_map( 'sanitize_text_field', $relation_tags ),
					'geometry'   => array(
						'type'        => 'MultiPolygon',
						'coordinates' => $coordinates,
					),
				),
			),
		);

		set_transient( $cache_key, $geojson, DAY_IN_SECONDS );
		return $geojson;
	}

	/**
	 * Try Overpass mirrors until one succeeds.
	 *
	 * @param string $overpass_query Overpass QL.
	 * @return string|\WP_Error Response body or error.
	 */
	private function pick_overpass_mirror( string $overpass_query ) {
		$mirror_list = apply_filters( 'jeo_overpass_mirrors', self::OVERPASS_MIRRORS );

		if ( ! is_array( $mirror_list ) || empty( $mirror_list ) ) {
			return new \WP_Error(
				'jeo_osm_no_mirrors',
				__( 'No Overpass mirrors configured.', 'jeowp' )
			);
		}

		$last_error = null;
		foreach ( $mirror_list as $mirror_url ) {
			$default_args = array(
				'timeout' => 45,
				'body'    => array( 'data' => $overpass_query ),
			);

			/**
			 * Filter the HTTP request args for a specific Overpass mirror.
			 *
			 * Use this to inject authentication headers, custom timeouts, or
			 * paid-mirror API keys.
			 *
			 * @param array  $args          WP_HTTP request args.
			 * @param string $mirror_url    Mirror URL being tried.
			 * @param string $overpass_query Overpass QL query.
			 */
			$args = apply_filters( 'jeo_overpass_request_args', $default_args, $mirror_url, $overpass_query );

			$response = $this->http_get( $mirror_url, $args );

			if ( is_wp_error( $response ) ) {
				$last_error = $response;
				continue;
			}

			$code = (int) wp_remote_retrieve_response_code( $response );
			if ( $code < 200 || $code >= 300 ) {
				$last_error = new \WP_Error(
					'jeo_osm_overpass_http',
					sprintf(
						/* translators: %d: HTTP status code. */
						__( 'Overpass returned HTTP %d.', 'jeowp' ),
						$code
					)
				);
				continue;
			}

			return wp_remote_retrieve_body( $response );
		}

		return $last_error ?? new \WP_Error(
			'jeo_osm_overpass_failed',
			__( 'All Overpass mirrors failed.', 'jeowp' )
		);
	}

	/**
	 * Assemble Overpass ways into closed rings.
	 *
	 * Uses node IDs for endpoint matching, building coordinates from the
	 * geometry array returned by Overpass.
	 *
	 * @param array $elements Overpass elements.
	 * @return array<int,array<int,array{0:float,1:float}>> Closed rings.
	 */
	private function assemble_rings( array $elements ): array {
		$ways = array();
		foreach ( $elements as $element ) {
			if ( 'way' !== ( $element['type'] ?? '' ) || empty( $element['nodes'] ) ) {
				continue;
			}

			$coords = array();
			foreach ( $element['geometry'] ?? array() as $point ) {
				$coords[] = array(
					(float) $point['lon'],
					(float) $point['lat'],
				);
			}

			if ( count( $coords ) < 2 ) {
				continue;
			}

			$ways[] = array(
				'first'  => (int) $element['nodes'][0],
				'last'   => (int) end( $element['nodes'] ),
				'nodes'  => array_map( 'intval', $element['nodes'] ),
				'coords' => $coords,
			);
		}

		$rings = array();

		while ( ! empty( $ways ) ) {
			$current = array_shift( $ways );
			$chain   = $current['coords'];
			$first   = $current['first'];
			$last    = $current['last'];
			$used    = array( 0 => true );

			$progress = true;
			while ( $first !== $last && $progress ) {
				$progress = false;
				foreach ( $ways as $index => $way ) {
					if ( isset( $used[ $index + 1 ] ) ) {
						continue;
					}

					if ( $way['first'] === $last ) {
						$chain              = array_merge( $chain, $way['coords'] );
						$last               = $way['last'];
						$used[ $index + 1 ] = true;
						$progress           = true;
						break;
					}

					if ( $way['last'] === $last ) {
						$chain              = array_merge( $chain, array_reverse( $way['coords'] ) );
						$last               = $way['first'];
						$used[ $index + 1 ] = true;
						$progress           = true;
						break;
					}

					if ( $way['last'] === $first ) {
						$chain              = array_merge( $way['coords'], $chain );
						$first              = $way['first'];
						$used[ $index + 1 ] = true;
						$progress           = true;
						break;
					}

					if ( $way['first'] === $first ) {
						$chain              = array_merge( array_reverse( $way['coords'] ), $chain );
						$first              = $way['last'];
						$used[ $index + 1 ] = true;
						$progress           = true;
						break;
					}
				}
			}

			if ( $first === $last && count( $chain ) >= 4 ) {
				$rings[] = $chain;
			}

			// Remove used ways from the pool.
			$remaining = array();
			foreach ( $ways as $index => $way ) {
				if ( ! isset( $used[ $index + 1 ] ) ) {
					$remaining[] = $way;
				}
			}
			$ways = $remaining;
		}

		return $rings;
	}
}
