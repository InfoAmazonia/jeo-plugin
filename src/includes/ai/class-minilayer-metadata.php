<?php
/**
 * Metadata helpers for AI-generated layers.
 *
 * Builds post excerpt, layer-theme taxonomy terms, and simple-color legends
 * from classified specs and boundary results.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Metadata builder for AI-generated layers.
 */
class Minilayer_Metadata {

	/**
	 * Default layer theme terms provided by the plugin.
	 *
	 * @var array<int,string>
	 */
	private const DEFAULT_THEMES = array(
		'Deforestation',
		'Hydrography',
		'Indigenous Lands',
		'Protected Areas',
		'Mining',
		'Oil and Gas',
		'Land Use',
		'Agriculture',
		'Infrastructure',
		'Administrative Boundaries',
		'Socioeconomic',
		'Biodiversity',
		'Fire',
		'Climate',
	);

	/**
	 * Build a useful post excerpt for a generated layer.
	 *
	 * @param string $layer_title Layer title.
	 * @param string $source      Source identifier (e.g. 'ibge', 'osm', 'mapbox-streets-v8').
	 * @param string $attribution Attribution text.
	 * @param string $limitations Limitations text.
	 * @param string $layer_type  CPT layer type.
	 * @return string
	 */
	public static function build_excerpt( string $layer_title, string $source, string $attribution, string $limitations, string $layer_type ): string {
		$parts = array();

		/* translators: %s: layer title. */
		$parts[] = sprintf( __( 'AI-generated layer: %s.', 'jeowp' ), $layer_title );

		if ( '' !== $attribution ) {
			$parts[] = $attribution;
		}

		if ( '' !== $source ) {
			$parts[] = sprintf(
				/* translators: %s: source name. */
				__( 'Data source: %s.', 'jeowp' ),
				esc_html( $source )
			);
		}

		if ( '' !== $limitations ) {
			$parts[] = sprintf(
				/* translators: %s: limitations text. */
				__( 'Limitations: %s', 'jeowp' ),
				$limitations
			);
		}

		$parts[] = sprintf(
			/* translators: %s: layer type. */
			__( 'Layer type: %s.', 'jeowp' ),
			esc_html( $layer_type )
		);

		return implode( ' ', $parts );
	}

	/**
	 * Resolve a theme name to a valid layer-theme term.
	 *
	 * @param string|null $theme Candidate theme name.
	 * @return int|null Term ID or null.
	 */
	public static function resolve_theme_term( ?string $theme ): ?int {
		if ( empty( $theme ) ) {
			return null;
		}

		$theme = trim( $theme );

		// Exact match first.
		$term = get_term_by( 'name', $theme, 'layer-theme' );
		if ( $term instanceof \WP_Term ) {
			return (int) $term->term_id;
		}

		// Case-insensitive match against default theme list.
		$theme_lower = strtolower( $theme );
		foreach ( self::DEFAULT_THEMES as $default_theme ) {
			if ( strtolower( $default_theme ) === $theme_lower ) {
				$term = get_term_by( 'name', $default_theme, 'layer-theme' );
				if ( $term instanceof \WP_Term ) {
					return (int) $term->term_id;
				}
				break;
			}
		}

		return null;
	}

	/**
	 * Assign a layer-theme term to a layer post.
	 *
	 * @param int         $post_id        Post ID.
	 * @param string|null $theme          Theme name.
	 * @param string|null $fallback_theme Fallback theme name.
	 * @return void
	 */
	public static function assign_theme( int $post_id, ?string $theme, ?string $fallback_theme = null ): void {
		$term_id = self::resolve_theme_term( $theme );
		if ( null === $term_id && null !== $fallback_theme ) {
			$term_id = self::resolve_theme_term( $fallback_theme );
		}

		if ( null === $term_id ) {
			return;
		}

		wp_set_post_terms( $post_id, array( $term_id ), 'layer-theme' );
	}

	/**
	 * Build a simple-color legend from a label and a hex color.
	 *
	 * @param string $label Layer label.
	 * @param string $color Hex color.
	 * @return array Legend metadata array.
	 */
	public static function build_simple_color_legend( string $label, string $color ): array {
		return array(
			'use_legend'          => true,
			'legend_title'        => $label,
			'legend_type'         => 'simple-color',
			'legend_type_options' => array(
				'colors' => array(
					array(
						'label' => $label,
						'color' => sanitize_hex_color( $color ),
					),
				),
			),
		);
	}

	/**
	 * Try to extract a single representative color from a MapLibre paint object.
	 *
	 * Falls back to a neutral gray when no color is found.
	 *
	 * @param array $paint Paint properties.
	 * @return string
	 */
	public static function extract_color_from_paint( array $paint ): string {
		$candidates = array(
			'fill-color',
			'line-color',
			'circle-color',
			'text-color',
			'icon-color',
		);

		foreach ( $candidates as $key ) {
			if ( ! empty( $paint[ $key ] ) ) {
				$value = $paint[ $key ];
				if ( is_string( $value ) ) {
					$hex = sanitize_hex_color( $value );
					return $hex ? $hex : '#888888';
				}
				if ( is_array( $value ) && ! empty( $value[ count( $value ) - 1 ] ) && is_string( $value[ count( $value ) - 1 ] ) ) {
					$hex = sanitize_hex_color( $value[ count( $value ) - 1 ] );
					return $hex ? $hex : '#888888';
				}
			}
		}

		return '#888888';
	}

	/**
	 * Theme fallback for tileset-vector source layers.
	 *
	 * @param string $source_layer Source layer name.
	 * @param array  $filter       MapLibre filter expression.
	 * @return string
	 */
	public static function theme_for_tileset_vector( string $source_layer, array $filter = array() ): string {
		$filter_str = wp_json_encode( $filter );

		if ( 'waterway' === $source_layer || 'water' === $source_layer || str_contains( $filter_str, 'river' ) || str_contains( $filter_str, 'stream' ) ) {
			return 'Hydrography';
		}

		if ( 'landuse' === $source_layer || 'landuse_overlay' === $source_layer ) {
			if ( str_contains( $filter_str, 'wood' ) || str_contains( $filter_str, 'park' ) ) {
				return 'Biodiversity';
			}
			if ( str_contains( $filter_str, 'agriculture' ) ) {
				return 'Agriculture';
			}
			if ( str_contains( $filter_str, 'national_park' ) || str_contains( $filter_str, 'wetland' ) ) {
				return 'Protected Areas';
			}
			return 'Land Use';
		}

		if ( 'admin' === $source_layer ) {
			return 'Administrative Boundaries';
		}

		if ( 'road' === $source_layer ) {
			return 'Infrastructure';
		}

		if ( 'contour' === $source_layer || 'hillshade' === $source_layer ) {
			return 'Infrastructure';
		}

		return 'Land Use';
	}
}
