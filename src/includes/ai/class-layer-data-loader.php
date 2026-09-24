<?php
/**
 * Layer data loader for RAG embeddings.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\RAG\Document;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Loads layer post data into NeuronAI RAG Document objects for embedding.
 */
class Layer_Data_Loader {

	/**
	 * Human-readable labels for layer types.
	 *
	 * @var array<string, string>
	 */
	private static array $type_labels = array(
		'mapbox'                => 'Mapbox Style',
		'tilelayer'             => 'Raster Tiled Source',
		'mvt'                   => 'Mapbox Vector Tiles (MVT)',
		'mapbox-tileset-raster' => 'Raster Mapbox Tiled Source',
		'mapbox-tileset-vector' => 'Vector Mapbox Tiled Source',
	);

	/**
	 * Load layer posts into RAG Document objects.
	 *
	 * @param \WP_Post[] $posts Array of WP_Post objects.
	 * @return Document[] Array of NeuronAI Document objects.
	 */
	public static function load( array $posts ): array {
		$documents = array();

		foreach ( $posts as $post ) {
			if ( 'publish' !== $post->post_status || 'revision' === $post->post_type ) {
				continue;
			}

			$text = self::build_embedding_text( $post );
			if ( empty( $text ) ) {
				continue;
			}

			$metadata = array(
				'layer_id'   => $post->ID,
				'layer_type' => get_post_meta( $post->ID, 'type', true ),
				'source_url' => get_post_meta( $post->ID, 'source_url', true ),
				'title'      => $post->post_title,
				'themes'     => implode( ', ', wp_get_post_terms( $post->ID, 'layer-theme', array( 'fields' => 'names' ) ) ),
			);

			$doc = new Document( $text );
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- NeuronAI Document uses camelCase.
			$doc->sourceType = 'layer';
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- NeuronAI Document uses camelCase.
			$doc->sourceName = (string) $post->ID;
			foreach ( $metadata as $key => $value ) {
				$doc->addMetadata( $key, (string) $value );
			}
			$documents[] = $doc;
		}

		return $documents;
	}

	/**
	 * Build the embedding text for a layer post.
	 *
	 * @param \WP_Post $post The layer post.
	 * @return string Combined text for embedding.
	 */
	public static function build_embedding_text( \WP_Post $post ): string {
		$sections   = array();
		$layer_type = get_post_meta( $post->ID, 'type', true );

		$sections[] = 'Title: ' . $post->post_title;

		$type_label = isset( self::$type_labels[ $layer_type ] )
			? self::$type_labels[ $layer_type ]
			: $layer_type;
		$sections[] = 'Type: ' . $type_label;

		$attribution = get_post_meta( $post->ID, 'attribution', true );
		if ( ! empty( $attribution ) ) {
			$sections[] = 'Attribution: ' . wp_strip_all_tags( $attribution );
		}

		self::append_source_info( $sections, $post );

		self::append_theme_info( $sections, $post );

		self::append_keyword_aliases( $sections, $post );

		self::append_legend_info( $sections, $post );

		if ( ! empty( $post->post_content ) ) {
			$content = strip_shortcodes( $post->post_content );
			$content = wp_strip_all_tags( $content );
			$content = trim( $content );
			if ( ! empty( $content ) ) {
				$sections[] = 'Content: ' . $content;
			}
		}

		return implode( "\n", $sections );
	}

	/**
	 * Concept aliases used to enrich the embedding text so semantic search matches
	 * layers regardless of the exact wording used in the query.
	 *
	 * Editors reported that layers were hard to find by name (e.g. several "rivers"
	 * layers, but only the one literally named with the word was retrieved). Adding
	 * domain synonyms (PT/EN) to the indexed text widens recall for those queries.
	 *
	 * Keys are lowercase trigger substrings; values are extra terms to append.
	 *
	 * @var array<string, string>
	 */
	private static $keyword_aliases = array(
		'rio'                    => 'rios river rivers hidrografia hydrography drenagem bacia hidrográfica curso d\'água',
		'hidrografia'            => 'rios river hydrography drenagem bacia hidrográfica água',
		'desmatamento'           => 'deforestation prodes deter alerta de desmatamento corte raso supressão de vegetação',
		'terra indígena'         => 'territorio indigena indigenous land TI funai demarcação',
		'indígena'               => 'indigenous povos originários território etnia',
		'mineração'              => 'mining garimpo extração mineral lavra requerimento mineral',
		'unidade de conservação' => 'conservation unit UC área protegida parque reserva',
		'queimada'               => 'fire focos de calor incêndio burned area área queimada',
		'estrada'                => 'rodovia road highway via',
		'bioma'                  => 'biome vegetação cobertura vegetal',
		'limite'                 => 'boundary boundaries divisa fronteira administrative limits município estado',
	);

	/**
	 * Append domain synonyms/aliases based on the layer title and themes, widening
	 * semantic-search recall for differently-worded queries.
	 *
	 * @param array    $sections Reference to sections array.
	 * @param \WP_Post $post     The layer post.
	 * @return void
	 */
	private static function append_keyword_aliases( array &$sections, \WP_Post $post ): void {
		$themes   = wp_get_post_terms( $post->ID, 'layer-theme', array( 'fields' => 'names' ) );
		$haystack = strtolower(
			$post->post_title . ' ' . ( is_array( $themes ) ? implode( ' ', $themes ) : '' )
		);

		$aliases = array();
		foreach ( self::$keyword_aliases as $trigger => $terms ) {
			if ( false !== strpos( $haystack, $trigger ) ) {
				$aliases[] = $terms;
			}
		}

		if ( ! empty( $aliases ) ) {
			$sections[] = 'Related terms: ' . implode( ' ', array_unique( $aliases ) );
		}
	}

	/**
	 * Append theme taxonomy information.
	 *
	 * @param array    $sections Reference to sections array.
	 * @param \WP_Post $post     The layer post.
	 * @return void
	 */
	private static function append_theme_info( array &$sections, \WP_Post $post ): void {
		$themes = wp_get_post_terms( $post->ID, 'layer-theme', array( 'fields' => 'names' ) );
		if ( ! empty( $themes ) && ! is_wp_error( $themes ) ) {
			$sections[] = 'Themes: ' . implode( ', ', $themes );
		}
	}

	/**
	 * Append source-related information sections.
	 *
	 * @param array    $sections Reference to sections array.
	 * @param \WP_Post $post     The layer post.
	 * @return void
	 */
	private static function append_source_info( array &$sections, \WP_Post $post ): void {
		$layer_type_options = get_post_meta( $post->ID, 'layer_type_options', true );
		if ( ! is_array( $layer_type_options ) ) {
			return;
		}

		if ( ! empty( $layer_type_options['source_layer'] ) ) {
			$source_layer = $layer_type_options['source_layer'];
			if ( self::has_readable_words( $source_layer, 1 ) ) {
				$sections[] = 'Source Layer: ' . $source_layer;
			}
		}

		$source_url = get_post_meta( $post->ID, 'source_url', true );
		if ( ! empty( $source_url ) ) {
			if ( self::url_path_has_readable_words( $source_url, 1 ) ) {
				$sections[] = 'Source URL: ' . $source_url;
			}
		}

		if ( ! empty( $layer_type_options['url'] ) ) {
			if ( self::url_path_has_readable_words( $layer_type_options['url'], 1 ) ) {
				$sections[] = 'Tile URL: ' . $layer_type_options['url'];
			}
		}

		if ( ! empty( $layer_type_options['style_id'] ) ) {
			$sections[] = 'Style ID: ' . $layer_type_options['style_id'];
		}
	}

	/**
	 * Append legend information sections with color descriptions.
	 *
	 * @param array    $sections Reference to sections array.
	 * @param \WP_Post $post     The layer post.
	 * @return void
	 */
	private static function append_legend_info( array &$sections, \WP_Post $post ): void {
		$use_legend = get_post_meta( $post->ID, 'use_legend', true );
		if ( empty( $use_legend ) ) {
			return;
		}

		$legend_type         = get_post_meta( $post->ID, 'legend_type', true );
		$legend_type_options = get_post_meta( $post->ID, 'legend_type_options', true );

		if ( empty( $legend_type ) || ! is_array( $legend_type_options ) ) {
			return;
		}

		$labels_with_colors = self::extract_legend_labels( $legend_type, $legend_type_options );

		if ( empty( $labels_with_colors ) ) {
			return;
		}

		$legend_title = get_post_meta( $post->ID, 'legend_title', true );
		if ( ! empty( $legend_title ) ) {
			$sections[] = 'Legend Title: ' . $legend_title;
		}

		$described = array();
		$hex_list  = array();

		foreach ( $labels_with_colors as $entry ) {
			$label = $entry['label'];
			$hex   = $entry['color'] ?? null;

			if ( $hex ) {
				$color_desc  = Color_Describer::describe( $hex );
				$described[] = $color_desc ? "{$label} ({$color_desc})" : $label;
				$hex_list[]  = $hex;
			} else {
				$described[] = $label;
			}
		}

		if ( ! empty( $described ) ) {
			$sections[] = 'Legend: ' . implode( ', ', $described );
		}

		if ( count( $hex_list ) >= 2 ) {
			$palette = Color_Describer::describe_palette( $hex_list );
			if ( ! empty( $palette ) ) {
				$sections[] = 'Palette: ' . $palette;
			}
		}
	}

	/**
	 * Extract legend labels and colors based on legend type.
	 *
	 * @param string $type    Legend type key.
	 * @param array  $options Legend type options.
	 * @return array Array of label/color entries.
	 */
	private static function extract_legend_labels( string $type, array $options ): array {
		$results = array();

		switch ( $type ) {
			case 'barscale':
				if ( ! empty( $options['left_label'] ) ) {
					$results[] = array(
						'label' => $options['left_label'],
						'color' => self::first_color_from_barscale( $options ),
					);
				}
				if ( ! empty( $options['right_label'] ) ) {
					$results[] = array(
						'label' => $options['right_label'],
						'color' => self::last_color_from_barscale( $options ),
					);
				}
				break;

			case 'simple-color':
				if ( ! empty( $options['colors'] ) && is_array( $options['colors'] ) ) {
					foreach ( $options['colors'] as $item ) {
						if ( ! empty( $item['label'] ) ) {
							$results[] = array(
								'label' => $item['label'],
								'color' => $item['color'] ?? null,
							);
						}
					}
				}
				break;

			case 'icons':
				if ( ! empty( $options['colors'] ) && is_array( $options['colors'] ) ) {
					foreach ( $options['colors'] as $item ) {
						if ( ! empty( $item['label'] ) ) {
							$results[] = array(
								'label' => $item['label'],
								'color' => null,
							);
						}
					}
				}
				break;

			case 'circles':
				if ( ! empty( $options['circles'] ) && is_array( $options['circles'] ) ) {
					foreach ( $options['circles'] as $item ) {
						if ( ! empty( $item['label'] ) ) {
							$results[] = array(
								'label' => $item['label'],
								'color' => $options['color'] ?? null,
							);
						}
					}
				}
				break;

			default:
				$results = self::extract_strings_recursive( $options );
				break;
		}

		return $results;
	}

	/**
	 * Recursively extract non-empty strings from a data structure.
	 *
	 * @param array $data Data to search.
	 * @return array Array of label entries with null colors.
	 */
	private static function extract_strings_recursive( array $data ): array {
		$results = array();
		foreach ( $data as $value ) {
			if ( is_string( $value ) && strlen( trim( $value ) ) > 0 ) {
				$results[] = array(
					'label' => $value,
					'color' => null,
				);
			} elseif ( is_array( $value ) ) {
				$results = array_merge( $results, self::extract_strings_recursive( $value ) );
			}
		}
		return $results;
	}

	/**
	 * Get the first color from a barscale legend options array.
	 *
	 * @param array $options Legend type options.
	 * @return string|null Hex color or null.
	 */
	private static function first_color_from_barscale( array $options ): ?string {
		if ( ! empty( $options['colors'] ) && is_array( $options['colors'] ) ) {
			$first = reset( $options['colors'] );
			return is_array( $first ) ? ( $first['color'] ?? null ) : ( is_string( $first ) ? $first : null );
		}
		return null;
	}

	/**
	 * Get the last color from a barscale legend options array.
	 *
	 * @param array $options Legend type options.
	 * @return string|null Hex color or null.
	 */
	private static function last_color_from_barscale( array $options ): ?string {
		if ( ! empty( $options['colors'] ) && is_array( $options['colors'] ) ) {
			$last = end( $options['colors'] );
			return is_array( $last ) ? ( $last['color'] ?? null ) : ( is_string( $last ) ? $last : null );
		}
		return null;
	}

	/**
	 * Check whether a string contains enough readable words.
	 *
	 * @param string $text      Text to check.
	 * @param int    $min_words Minimum number of readable words required.
	 * @return bool
	 */
	private static function has_readable_words( string $text, int $min_words = 2 ): bool {
		$parts = preg_split( '/[^a-zA-Z]/', $text );
		$count = 0;
		foreach ( $parts as $part ) {
			if ( strlen( $part ) >= 3 ) {
				++$count;
			}
		}
		return $count >= $min_words;
	}

	/**
	 * Check whether the path component of a URL has enough readable words.
	 *
	 * @param string $url       URL to check.
	 * @param int    $min_words Minimum number of readable words required.
	 * @return bool
	 */
	private static function url_path_has_readable_words( string $url, int $min_words = 2 ): bool {
		$path = wp_parse_url( $url, PHP_URL_PATH );
		if ( empty( $path ) ) {
			return false;
		}
		return self::has_readable_words( $path, $min_words );
	}
}
