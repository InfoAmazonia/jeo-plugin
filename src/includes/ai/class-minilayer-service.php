<?php
/**
 * Minilayer shared service — AI style generation → JEO layer CPT creation pipeline.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Stateless service that orchestrates AI layer generation and CPT creation.
 *
 * Shared by Minilayer_Handler (REST endpoint) and Generate_Layer_Tool (agent tool).
 */
class Minilayer_Service {

	/**
	 * Full pipeline: generate a Mapbox style from a prompt and create a layer CPT.
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
				__( 'Mapbox API key is not configured. Set it in JEO Settings.', 'jeo' )
			);
		}

		$active_provider = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active_provider ) ) {
			return new \WP_Error(
				'minilayer_no_provider',
				__( 'No AI provider configured. Set one in JEO AI Settings.', 'jeo' )
			);
		}

		try {
			$raw = Minilayer_Agent::generate( $prompt, $mapbox_key );
		} catch ( \Exception $e ) {
			return new \WP_Error(
				'minilayer_agent_error',
				$e->getMessage()
			);
		}

		$parsed = self::parse_response( $raw );
		if ( is_wp_error( $parsed ) ) {
			return $parsed;
		}

		return self::create_layer( $parsed, $layer_name );
	}

	/**
	 * Parse the raw AI response and extract the style JSON object.
	 *
	 * @param string $raw Raw text from the AI agent.
	 * @return array|\WP_Error Parsed style data or error.
	 */
	public static function parse_response( string $raw ) {
		$text = preg_replace( '/<(thought|thinking)>.*?<\/\1>/is', '', $raw );

		if ( preg_match( '/```(?:json)?\s*(.*?)\s*```/is', $text, $matches ) ) {
			$text = $matches[1];
		}

		$start = strpos( $text, '{' );
		if ( false !== $start ) {
			$depth     = 0;
			$len       = strlen( $text );
			$in_string = false;
			$escape    = false;

			for ( $i = $start; $i < $len; $i++ ) {
				$ch = $text[ $i ];

				if ( $escape ) {
					$escape = false;
					continue;
				}

				if ( '\\' === $ch ) {
					$escape = true;
					continue;
				}

				if ( '"' === $ch ) {
					$in_string = ! $in_string;
					continue;
				}

				if ( $in_string ) {
					continue;
				}

				if ( '{' === $ch ) {
					++$depth;
				} elseif ( '}' === $ch ) {
					--$depth;
					if ( 0 === $depth ) {
						$text = substr( $text, $start, $i - $start + 1 );
						break;
					}
				}
			}
		}

		$parsed = json_decode( trim( $text ), true );

		if ( JSON_ERROR_NONE !== json_last_error() || ! is_array( $parsed ) ) {
			return new \WP_Error(
				'minilayer_parse_error',
				__( 'Failed to parse AI response as JSON.', 'jeo' )
			);
		}

		if ( empty( $parsed['style_id'] ) ) {
			return new \WP_Error(
				'minilayer_missing_style_id',
				__( 'AI response did not include a style_id.', 'jeo' )
			);
		}

		return $parsed;
	}

	/**
	 * Determine whether the style data qualifies as a mapbox-tileset-vector layer.
	 *
	 * @param array $style_data Parsed style data from the AI.
	 * @return bool
	 */
	public static function is_tileset_vector( array $style_data ): bool {
		if ( ( $style_data['layer_type'] ?? '' ) !== 'mapbox-tileset-vector' ) {
			return false;
		}

		$required = array( 'tileset_id', 'source_layer', 'layer_geometry_type' );
		foreach ( $required as $key ) {
			if ( empty( $style_data[ $key ] ) ) {
				return false;
			}
		}

		$vector_types = array( 'fill', 'line', 'symbol', 'circle', 'fill-extrusion', 'heatmap' );
		return in_array( $style_data['layer_geometry_type'], $vector_types, true );
	}

	/**
	 * Create a map-layer CPT post from the generated style data.
	 *
	 * @param array  $style_data Parsed style data from the AI.
	 * @param string $layer_name Optional custom title for the layer.
	 * @return array|\WP_Error Layer info array or error.
	 */
	public static function create_layer( array $style_data, $layer_name = '' ) {
		$style_id = $style_data['style_id'];
		/* translators: %s: Mapbox style ID. */
		$fallback   = sprintf( __( 'Minilayer: %s', 'jeo' ), $style_id );
		$post_title = ! empty( $layer_name )
			? $layer_name
			: ( $style_data['layer_title'] ?? $style_data['style_name'] ?? $fallback );

		$post_id = wp_insert_post(
			array(
				'post_type'   => 'map-layer',
				'post_title'  => $post_title,
				'post_status' => 'publish',
			)
		);

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		if ( self::is_tileset_vector( $style_data ) ) {
			$layer_type         = 'mapbox-tileset-vector';
			$layer_type_options = array(
				'tileset_id'        => $style_data['tileset_id'],
				'source_layer'      => $style_data['source_layer'],
				'type'              => $style_data['layer_geometry_type'],
				'style_source_type' => 'vector',
			);
		} else {
			$layer_type         = 'mapbox';
			$layer_type_options = array(
				'style_id' => $style_id,
			);
		}

		update_post_meta( $post_id, 'type', $layer_type );
		update_post_meta( $post_id, 'layer_type_options', $layer_type_options );

		self::assign_current_language( $post_id );

		$result = array(
			'id'       => $post_id,
			'title'    => $post_title,
			'type'     => $layer_type,
			'style_id' => $style_id,
			'edit_url' => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
		);

		if ( 'mapbox-tileset-vector' === $layer_type ) {
			$result['tileset_id']          = $style_data['tileset_id'];
			$result['source_layer']        = $style_data['source_layer'];
			$result['layer_geometry_type'] = $style_data['layer_geometry_type'];
		}

		return $result;
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
