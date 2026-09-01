<?php
/**
 * Minilayer shared service — deterministic classifier → JEO layer CPT creation.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Stateless service that orchestrates deterministic layer generation and CPT creation.
 *
 * Shared by Minilayer_Handler (REST endpoint) and Generate_Layer_Tool (agent tool).
 */
class Minilayer_Service {

	/**
	 * Full pipeline: classify a prompt and create a layer CPT.
	 *
	 * @param string $prompt     Text description of the desired map style.
	 * @param string $layer_name Optional custom title for the layer.
	 * @return array|\WP_Error Layer info array on success, WP_Error on failure.
	 */
	public static function generate_and_create( string $prompt, string $layer_name = '' ) {
		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return new \WP_Error(
				'minilayer_no_mapbox_key',
				__( 'Mapbox API key is not configured. Set it in JEO Settings.', 'jeowp' )
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_Error(
				'minilayer_no_provider',
				__( 'No AI provider configured. Set one in JEO AI Settings.', 'jeowp' )
			);
		}

		$spec = Minilayer_Classifier::classify( $prompt );
		if ( is_wp_error( $spec ) ) {
			return $spec;
		}

		if ( ! $spec->can_approximate ) {
			return new \WP_Error(
				'minilayer_not_approximable',
				$spec->limitations
					? $spec->limitations
					: __( 'The request cannot be approximated with available map data.', 'jeowp' )
			);
		}

		if ( 'mapbox-tileset-vector' === $spec->layer_type ) {
			return self::create_tileset_vector_layer( $spec, $layer_name );
		}

		if ( 'mapbox' === $spec->layer_type ) {
			return self::create_composed_layer( $spec, $layer_name, $mapbox_key );
		}

		return new \WP_Error(
			'minilayer_invalid_type',
			sprintf(
				/* translators: %s: layer type. */
				__( 'Unsupported layer type: %s.', 'jeowp' ),
				esc_html( $spec->layer_type )
			)
		);
	}

	/**
	 * Create a mapbox-tileset-vector layer directly from a classified spec.
	 *
	 * @param Layer_Spec_Output $spec       Classified spec.
	 * @param string            $layer_name Optional custom title.
	 * @return array|\WP_Error Layer info or error.
	 */
	private static function create_tileset_vector_layer( Layer_Spec_Output $spec, string $layer_name = '' ) {
		$required = array( 'tileset_id', 'source_layer', 'layer_geometry_type' );
		foreach ( $required as $key ) {
			if ( empty( $spec->$key ) ) {
				return new \WP_Error(
					'minilayer_missing_tileset_field',
					sprintf(
						/* translators: %s: missing field name. */
						__( 'Missing required tileset field: %s.', 'jeowp' ),
						esc_html( $key )
					)
				);
			}
		}

		$vector_types = array( 'fill', 'line', 'symbol', 'circle', 'fill-extrusion', 'heatmap' );
		if ( ! in_array( $spec->layer_geometry_type, $vector_types, true ) ) {
			return new \WP_Error(
				'minilayer_invalid_geometry',
				__( 'Invalid layer geometry type for tileset-vector.', 'jeowp' )
			);
		}

		$post_title = self::layer_title( $spec, $layer_name );
		$theme      = $spec->theme ?? Minilayer_Metadata::theme_for_tileset_vector( $spec->source_layer, $spec->suggested_filter ?? array() );

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'map-layer',
				'post_title'   => $post_title,
				'post_status'  => 'publish',
				'post_excerpt' => Minilayer_Metadata::build_excerpt(
					$post_title,
					$spec->tileset_id,
					'',
					$spec->limitations,
					'mapbox-tileset-vector'
				),
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		$layer_type         = 'mapbox-tileset-vector';
		$layer_type_options = array(
			'tileset_id'        => $spec->tileset_id,
			'source_layer'      => $spec->source_layer,
			'type'              => $spec->layer_geometry_type,
			'style_source_type' => 'vector',
		);

		update_post_meta( $post_id, 'type', $layer_type );
		update_post_meta( $post_id, 'layer_type_options', $layer_type_options );

		$default_style = array();
		if ( ! empty( $spec->suggested_filter ) ) {
			$default_style['filter'] = $spec->suggested_filter;
		}
		if ( ! empty( $spec->suggested_paint ) ) {
			$default_style['paint'] = $spec->suggested_paint;
		}
		if ( ! empty( $default_style ) ) {
			update_post_meta( $post_id, 'default_style', $default_style );
		}

		$attribution = $spec->limitations
			? $spec->limitations
			: sprintf(
				/* translators: %s: tileset ID. */
				__( 'Data from Mapbox tileset %s.', 'jeowp' ),
				$spec->tileset_id
			);
		update_post_meta( $post_id, 'attribution', $attribution );

		Minilayer_Metadata::assign_theme( $post_id, $theme );

		$legend_color = Minilayer_Metadata::extract_color_from_paint( $spec->suggested_paint ?? array() );
		$legend       = Minilayer_Metadata::build_simple_color_legend( $post_title, $legend_color );
		self::store_legend_meta( $post_id, $legend );

		self::assign_current_language( $post_id );

		return array(
			'id'                  => $post_id,
			'title'               => $post_title,
			'type'                => $layer_type,
			'tileset_id'          => $spec->tileset_id,
			'source_layer'        => $spec->source_layer,
			'layer_geometry_type' => $spec->layer_geometry_type,
			'default_style'       => $default_style,
			'limitations'         => $spec->limitations,
			'theme'               => $theme,
			'edit_url'            => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
		);
	}

	/**
	 * Create a composed mapbox layer from a classified spec.
	 *
	 * @param Layer_Spec_Output $spec       Classified spec.
	 * @param string            $layer_name Optional custom title.
	 * @param string            $mapbox_key Mapbox access token.
	 * @return array|\WP_Error Layer info or error.
	 */
	private static function create_composed_layer( Layer_Spec_Output $spec, string $layer_name = '', string $mapbox_key = '' ) {
		$style_json = Mapbox_Style_Builder::build_from_spec( $spec );
		if ( is_wp_error( $style_json ) ) {
			return $style_json;
		}

		$post_title = self::layer_title( $spec, $layer_name );
		$published  = Mapbox_Style_Builder::publish_style( $style_json, $post_title, $mapbox_key );
		if ( is_wp_error( $published ) ) {
			return $published;
		}

		$source_label = $spec->external_sources ? __( 'External sources', 'jeowp' ) : __( 'Mapbox composed style', 'jeowp' );

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'map-layer',
				'post_title'   => $post_title,
				'post_status'  => 'publish',
				'post_excerpt' => Minilayer_Metadata::build_excerpt(
					$post_title,
					$source_label,
					'',
					$spec->limitations,
					'mapbox'
				),
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		update_post_meta( $post_id, 'type', 'mapbox' );
		update_post_meta(
			$post_id,
			'layer_type_options',
			array(
				'style_id' => $published['style_id'],
			)
		);

		$attribution = $spec->limitations
			? $spec->limitations
			: __( 'Composed Mapbox style with external sources.', 'jeowp' );
		update_post_meta( $post_id, 'attribution', $attribution );

		Minilayer_Metadata::assign_theme( $post_id, $spec->theme );

		$legend_color = self::extract_first_layer_color( $spec->style_json ?? array() );
		if ( $legend_color ) {
			$legend = Minilayer_Metadata::build_simple_color_legend( $post_title, $legend_color );
			self::store_legend_meta( $post_id, $legend );
		}

		self::assign_current_language( $post_id );

		return array(
			'id'          => $post_id,
			'title'       => $post_title,
			'type'        => 'mapbox',
			'style_id'    => $published['style_id'],
			'style_url'   => $published['style_url'],
			'limitations' => $spec->limitations,
			'theme'       => $spec->theme,
			'edit_url'    => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
		);
	}

	/**
	 * Store legend metadata on a layer post.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $legend  Legend metadata.
	 * @return void
	 */
	private static function store_legend_meta( int $post_id, array $legend ): void {
		update_post_meta( $post_id, 'use_legend', $legend['use_legend'] );
		update_post_meta( $post_id, 'legend_title', $legend['legend_title'] );
		update_post_meta( $post_id, 'legend_type', $legend['legend_type'] );
		update_post_meta( $post_id, 'legend_type_options', $legend['legend_type_options'] );
	}

	/**
	 * Extract the first usable color from a composed style's layers.
	 *
	 * @param array $style_json Mapbox GL style JSON.
	 * @return string|null Hex color or null.
	 */
	private static function extract_first_layer_color( array $style_json ): ?string {
		$layers = $style_json['layers'] ?? array();
		foreach ( $layers as $layer ) {
			$paint = $layer['paint'] ?? array();
			if ( ! is_array( $paint ) ) {
				continue;
			}
			$color = Minilayer_Metadata::extract_color_from_paint( $paint );
			if ( '#888888' !== $color ) {
				return $color;
			}
		}
		return null;
	}

	/**
	 * Resolve the layer title from the spec or the custom name.
	 *
	 * @param Layer_Spec_Output $spec       Classified spec.
	 * @param string            $layer_name Optional custom title.
	 * @return string
	 */
	private static function layer_title( Layer_Spec_Output $spec, string $layer_name = '' ): string {
		if ( '' !== $layer_name ) {
			return $layer_name;
		}

		if ( '' !== $spec->layer_title ) {
			return $spec->layer_title;
		}

		return __( 'Minilayer', 'jeowp' );
	}

	/**
	 * Assign the current WPML language to a newly created post.
	 *
	 * No-op when WPML is not active.
	 *
	 * @param int $post_id Post ID.
	 * @return void
	 */
	private static function assign_current_language( int $post_id ): void {
		if ( ! did_action( 'wpml_loaded' ) ) {
			return;
		}

		$current_lang = apply_filters( 'wpml_current_language', null );
		if ( empty( $current_lang ) ) {
			return;
		}

		do_action(
			'wpml_set_element_language_details',
			array(
				'element_id'    => $post_id,
				'element_type'  => 'post_map-layer',
				'trid'          => false,
				'language_code' => $current_lang,
			)
		);
	}
}
