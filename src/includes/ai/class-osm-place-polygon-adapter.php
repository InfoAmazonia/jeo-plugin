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
		'https://overpass.osm.ch/api/interpreter',
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
	 * @param string      $place_name  Place name.
	 * @param string|null $entity_type Optional entity type hint (unused — Nominatim matches freely).
	 * @param string|null $context     Optional country/state context.
	 */
	public function resolve( string $place_name, ?string $entity_type = null, ?string $context = null ) {
		unset( $entity_type );
		// Overpass geometry assembly can take 30s+ for large relations (e.g.
		// countries with overseas territories) and the mirror fallback chain
		// adds more requests on top — far beyond the 30s PHP default.
		if ( function_exists( 'set_time_limit' ) ) {
			set_time_limit( 120 );
		}

		$place_name = $this->normalize_name( $place_name );
		$context    = $context ? $this->normalize_name( $context ) : '';

		$cached = $this->get_cached( $place_name, $context );
		if ( null !== $cached ) {
			return $cached;
		}

		$queries = $this->build_nominatim_queries( $place_name, $context );
		$match   = null;

		foreach ( $queries as $query ) {
			// polygon_geojson asks Nominatim for the full boundary geometry:
			// one compact request instead of a multi-megabyte Overpass
			// assembly that can exhaust the PHP memory limit (e.g. France
			// with overseas territories).
			$match = $this->find_relation_match( $this->nominatim_search( $query ) );
			if ( null !== $match ) {
				break;
			}
		}

		if ( null === $match ) {
			return null;
		}

		$geojson = $this->build_geojson_from_nominatim( $match );

		if ( null !== $geojson ) {
			$bbox = $this->bbox_from_nominatim( $match );
		} else {
			// Nominatim did not return an outline for this relation — fall
			// back to assembling the outer rings via Overpass.
			$relation_id = (int) $match->osm_id;
			$geojson     = $this->fetch_overpass_relation( $relation_id );

			if ( is_wp_error( $geojson ) || empty( $geojson ) ) {
				return $geojson;
			}

			$bbox = $this->compute_bbox( $geojson );
		}

		if ( null === $bbox ) {
			return new \WP_Error(
				'jeo_osm_bbox',
				__( 'Could not compute bounding box from OSM geometry.', 'jeowp' )
			);
		}

		$result = array(
			'source'       => $this->get_source(),
			'display_name' => sanitize_text_field( $match->display_name ?? $place_name ),
			'attribution'  => __( 'OpenStreetMap contributors', 'jeowp' ),
			'entity_type'  => 'other',
			'geojson'      => $geojson,
			'bbox'         => $bbox,
		);

		// Serializing very large geometries into a transient duplicates them
		// in memory and can exhaust the PHP memory limit — skip caching those
		// (recreating them costs one Nominatim request).
		if ( ! is_wp_error( $geojson ) && strlen( (string) wp_json_encode( $geojson ) ) < 1000000 ) {
			$this->set_cached( $place_name, $result, $context );
		}

		return $result;
	}

	/**
	 * Search Nominatim for a place, including the full boundary geometry.
	 *
	 * Decodes the response directly as arrays (the shared Nominatim geocoder
	 * decodes to objects, which would double the memory footprint of the
	 * multi-megabyte country geometries). Responses are cached for 6 hours.
	 *
	 * @param string $query Search query.
	 * @return array<int,object> Raw Nominatim items (decoded as objects — much
	 *                           lighter in memory than arrays for large geometries).
	 */
	private function nominatim_search( string $query ): array {
		$cache_key = 'jeo_osm_nominatim_' . md5( $query );
		$cached    = get_transient( $cache_key );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$locale       = get_locale();
		$accept_langs = array_values( array_unique( array_filter( array( $locale, substr( $locale, 0, 2 ) ) ) ) );

		$url = add_query_arg(
			array(
				'q'               => $query,
				'format'          => 'json',
				'addressdetails'  => 1,
				'polygon_geojson' => 1,
			),
			'https://nominatim.openstreetmap.org/search'
		);

		$response = $this->http_get(
			$url,
			array(
				'timeout' => 15,
				'headers' => array(
					'Accept-Language' => implode( ',', $accept_langs ),
				),
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body ); // Objects are significantly lighter than arrays for large geometries.
		if ( ! is_array( $data ) ) {
			return array();
		}

		// Serializing multi-megabyte country geometries into a transient
		// duplicates them in memory — skip caching those (the resolved
		// polygon result is cached separately for 24 hours).
		if ( strlen( $body ) < 1000000 ) {
			set_transient( $cache_key, $data, 6 * HOUR_IN_SECONDS );
		}

		return $data;
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

		// A context that just echoes the place name (e.g. "França, França")
		// deranks the exact match — drop it.
		if ( '' !== $context && $this->names_differ( $place_name, $context ) ) {
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
	 * Check whether two names are meaningfully different (accent-insensitive).
	 *
	 * @param string $a First name.
	 * @param string $b Second name.
	 * @return bool True when the names differ.
	 */
	private function names_differ( string $a, string $b ): bool {
		$normalize = function ( string $value ): string {
			return trim( (string) preg_replace( '/\s+/', ' ', strtolower( remove_accents( $value ) ) ) );
		};

		return $normalize( $a ) !== $normalize( $b );
	}

	/**
	 * Build a GeoJSON FeatureCollection from a Nominatim match with polygon_geojson.
	 *
	 * The geometry is kept as a stdClass tree (decoded directly from the
	 * Nominatim response) — converting it to arrays would double the memory
	 * footprint of large country geometries. Downstream consumers treat it
	 * opaquely and encode it with wp_json_encode().
	 *
	 * @param object $nominatim_match Raw Nominatim item (osm_id, display_name, geojson).
	 * @return array|null FeatureCollection or null when no geometry was returned.
	 */
	private function build_geojson_from_nominatim( $nominatim_match ): ?array {
		$geometry = $nominatim_match->geojson ?? null;

		if ( ! is_object( $geometry ) || empty( $geometry->type ) || ! isset( $geometry->coordinates ) ) {
			return null;
		}

		$display_name = sanitize_text_field( $nominatim_match->display_name ?? '' );

		return array(
			'type'     => 'FeatureCollection',
			'features' => array(
				array(
					'type'       => 'Feature',
					'properties' => array( 'name' => $display_name ),
					'geometry'   => $geometry,
				),
			),
		);
	}

	/**
	 * Build a bounding box from a Nominatim item's boundingbox field.
	 *
	 * Nominatim returns [south, north, west, east]; this plugin uses
	 * [west, south, east, north].
	 *
	 * @param object $nominatim_match Raw Nominatim item.
	 * @return array|null [west, south, east, north] or null.
	 */
	private function bbox_from_nominatim( $nominatim_match ): ?array {
		$box = $nominatim_match->boundingbox ?? null;

		if ( ! is_array( $box ) || 4 !== count( $box ) ) {
			return null;
		}

		return array(
			(float) $box[2],
			(float) $box[0],
			(float) $box[3],
			(float) $box[1],
		);
	}

	/**
	 * Find the first OSM relation result in raw Nominatim items.
	 *
	 * @param array $items Raw Nominatim response items.
	 * @return object|null Item with osm_id/osm_type or null.
	 */
	private function find_relation_match( array $items ): ?object {
		foreach ( $items as $item ) {
			if ( ! is_object( $item ) || empty( $item->osm_type ) || empty( $item->osm_id ) ) {
				continue;
			}
			if ( 'relation' === $item->osm_type ) {
				return $item;
			}
		}

		// Fallback: accept any polygon-ish result.
		foreach ( $items as $item ) {
			if ( is_object( $item ) && ! empty( $item->osm_type ) && ! empty( $item->osm_id ) ) {
				return $item;
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

		$elements = $data['elements'] ?? array();
		unset( $data ); // Free the raw multi-megabyte Overpass payload before assembling.

		$rings = $this->assemble_rings( $elements );
		unset( $elements );

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
				'timeout' => 25,
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

			$response = $this->http_post( $mirror_url, $args );

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
				if ( ! is_array( $point ) || ! isset( $point['lon'], $point['lat'] ) ) {
					continue;
				}
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
