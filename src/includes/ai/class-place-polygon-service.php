<?php
/**
 * Deterministic polygon resolver for administrative and thematic boundaries.
 *
 * Replaces guesswork (Mapbox tileset filters) with authoritative public
 * sources: IBGE for Brazilian municipalities/states, FUNAI for indigenous
 * lands, and OpenStreetMap as an international fallback.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Central service that resolves a place name into a published boundary layer.
 */
class Place_Polygon_Service {

	/**
	 * Default adapter order.
	 *
	 * @var array<int,string>
	 */
	private const DEFAULT_ORDER = array( 'ibge', 'funai', 'osm' );

	/**
	 * Registered adapters.
	 *
	 * @var array<string,Place_Polygon_Adapter>
	 */
	private array $adapters = array();

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->register_adapter( new IBGE_Place_Polygon_Adapter() );
		$this->register_adapter( new FUNAI_Place_Polygon_Adapter() );
		$this->register_adapter( new OSM_Place_Polygon_Adapter() );
	}

	/**
	 * Register a polygon adapter.
	 *
	 * @param Place_Polygon_Adapter $adapter Adapter instance.
	 * @return void
	 */
	public function register_adapter( Place_Polygon_Adapter $adapter ): void {
		$this->adapters[ $adapter->get_source() ] = $adapter;
	}

	/**
	 * Resolve a place name to a polygon result.
	 *
	 * @param string      $place_name  Place name.
	 * @param string|null $entity_type Optional hint: municipality|state|indigenous_land|other.
	 * @param string|null $context     Optional geographic context.
	 * @return array|\WP_Error Result array or error.
	 */
	public function resolve( string $place_name, ?string $entity_type = null, ?string $context = null ) {
		$order = $this->resolve_order( $entity_type );

		foreach ( $order as $source ) {
			if ( ! isset( $this->adapters[ $source ] ) ) {
				continue;
			}

			$result = $this->adapters[ $source ]->resolve( $place_name, $context );
			if ( is_wp_error( $result ) ) {
				return $result;
			}
			if ( is_array( $result ) ) {
				return $result;
			}
		}

		return new \WP_Error(
			'jeo_boundary_not_found',
			sprintf(
				/* translators: %s: place name. */
				__( 'Could not find a boundary polygon for "%s".', 'jeowp' ),
				esc_html( $place_name )
			)
		);
	}

	/**
	 * Create a JEO map-layer CPT from a place name.
	 *
	 * Publishes a Mapbox style backed by the resolved boundary GeoJSON.
	 *
	 * @param string      $place_name  Place name.
	 * @param string|null $entity_type Optional entity type hint.
	 * @param string|null $context     Optional geographic context.
	 * @param string      $layer_name  Optional custom layer title.
	 * @return array|\WP_Error Layer info or error.
	 */
	public function create_layer( string $place_name, ?string $entity_type = null, ?string $context = null, string $layer_name = '' ) {
		$mapbox_key = \jeo_settings()->get_option( 'mapbox_key' );
		if ( empty( $mapbox_key ) ) {
			return new \WP_Error(
				'jeo_boundary_no_mapbox_key',
				__( 'Mapbox API key is required to publish boundary layers.', 'jeowp' )
			);
		}

		$result = $this->resolve( $place_name, $entity_type, $context );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$geojson_url = $this->publish_geojson_attachment( $result['geojson'], $result['display_name'] );
		if ( is_wp_error( $geojson_url ) ) {
			return $geojson_url;
		}

		$style_name = $layer_name ? $layer_name : $result['display_name'];
		$fill_color = '#8e44ad';
		$style_json = Mapbox_Style_Builder::build_boundary_style(
			$geojson_url,
			$style_name,
			array(
				'fill_color'   => $fill_color,
				'fill_opacity' => 0.15,
				'line_color'   => $fill_color,
				'line_width'   => 2,
			)
		);

		$published = Mapbox_Style_Builder::publish_style( $style_json, $style_name, $mapbox_key );
		if ( is_wp_error( $published ) ) {
			return $published;
		}

		$post_title = $layer_name ? $layer_name : sprintf(
			/* translators: %s: boundary display name. */
			__( 'Boundary: %s', 'jeowp' ),
			$result['display_name']
		);

		$theme = ( 'funai' === $result['source'] ) ? 'Indigenous Lands' : 'Administrative Boundaries';

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'map-layer',
				'post_title'   => $post_title,
				'post_status'  => 'publish',
				'post_excerpt' => Minilayer_Metadata::build_excerpt(
					$post_title,
					$result['source'],
					$result['attribution'],
					__( 'Geometry simplified for interactive display; use authoritative source for legal boundaries.', 'jeowp' ),
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
		update_post_meta( $post_id, 'attribution', $result['attribution'] );
		update_post_meta( $post_id, '_jeo_boundary_source', $result['source'] );
		update_post_meta( $post_id, '_jeo_boundary_geojson_url', $geojson_url );

		Minilayer_Metadata::assign_theme( $post_id, $theme );

		$legend = Minilayer_Metadata::build_simple_color_legend( $post_title, $fill_color );
		update_post_meta( $post_id, 'use_legend', $legend['use_legend'] );
		update_post_meta( $post_id, 'legend_title', $legend['legend_title'] );
		update_post_meta( $post_id, 'legend_type', $legend['legend_type'] );
		update_post_meta( $post_id, 'legend_type_options', $legend['legend_type_options'] );

		return array(
			'id'           => $post_id,
			'title'        => $post_title,
			'type'         => 'mapbox',
			'style_id'     => $published['style_id'],
			'style_url'    => $published['style_url'],
			'edit_url'     => admin_url( 'post.php?post=' . $post_id . '&action=edit' ),
			'bbox'         => $result['bbox'],
			'display_name' => $result['display_name'],
			'attribution'  => $result['attribution'],
			'theme'        => $theme,
		);
	}

	/**
	 * Publish a GeoJSON payload as a WordPress attachment for a stable public URL.
	 *
	 * Deduplicates by content hash.
	 *
	 * @param array  $geojson      GeoJSON array.
	 * @param string $display_name Human-readable name (used in filename).
	 * @return string|\WP_Error Public URL or error.
	 */
	private function publish_geojson_attachment( array $geojson, string $display_name ) {
		$hash     = md5( wp_json_encode( $geojson ) );
		$existing = $this->find_existing_attachment( $hash );
		if ( null !== $existing ) {
			return $existing;
		}

		$upload_dir = wp_upload_dir();
		$filename   = $this->sanitize_geojson_filename( $display_name ) . '-' . substr( $hash, 0, 8 ) . '.geojson';
		$filepath   = trailingslashit( $upload_dir['path'] ) . $filename;
		$fileurl    = trailingslashit( $upload_dir['url'] ) . $filename;

		global $wp_filesystem;
		$written = false;
		if ( function_exists( 'WP_Filesystem' ) ) {
			$written = WP_Filesystem();
		}

		if ( true === $written && is_object( $wp_filesystem ) ) {
			$written = $wp_filesystem->put_contents( $filepath, wp_json_encode( $geojson ), FS_CHMOD_FILE );
		}

		if ( true !== $written ) {
			$written = file_put_contents( $filepath, wp_json_encode( $geojson ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		}

		if ( false === $written ) {
			return new \WP_Error(
				'jeo_boundary_write_failed',
				__( 'Could not write boundary GeoJSON file.', 'jeowp' )
			);
		}

		$attachment_id = wp_insert_attachment(
			array(
				'guid'           => $fileurl,
				'post_mime_type' => 'application/geo+json',
				'post_title'     => sanitize_text_field( $display_name ),
				'post_content'   => '',
				'post_status'    => 'inherit',
			),
			$filepath
		);

		if ( is_wp_error( $attachment_id ) || 0 === $attachment_id ) {
			return new \WP_Error(
				'jeo_boundary_attachment_failed',
				__( 'Could not create boundary GeoJSON attachment.', 'jeowp' )
			);
		}

		update_post_meta( $attachment_id, '_jeo_boundary_geojson_hash', $hash );

		return $fileurl;
	}

	/**
	 * Find an existing GeoJSON attachment by content hash.
	 *
	 * @param string $hash Content hash.
	 * @return string|null Public URL or null.
	 */
	private function find_existing_attachment( string $hash ): ?string {
		$query = new \WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'application/geo+json',
				'meta_query'     => array(
					array(
						'key'   => '_jeo_boundary_geojson_hash',
						'value' => $hash,
					),
				),
				'posts_per_page' => 1,
				'fields'         => 'ids',
			)
		);

		if ( ! $query->have_posts() ) {
			return null;
		}

		$attachment_id = (int) $query->posts[0];
		$url           = wp_get_attachment_url( $attachment_id );
		return $url ? $url : null;
	}

	/**
	 * Build a safe filename from a display name.
	 *
	 * @param string $display_name Raw display name.
	 * @return string
	 */
	private function sanitize_geojson_filename( string $display_name ): string {
		$slug = sanitize_title( $display_name );
		return '' !== $slug ? $slug : 'boundary';
	}

	/**
	 * Determine adapter order from an optional entity type hint.
	 *
	 * @param string|null $entity_type Entity type hint.
	 * @return array<int,string>
	 */
	private function resolve_order( ?string $entity_type ): array {
		$order = apply_filters( 'jeo_place_polygon_adapter_order', self::DEFAULT_ORDER );

		switch ( $entity_type ) {
			case 'indigenous_land':
				return array( 'funai', 'ibge', 'osm' );
			case 'municipality':
			case 'state':
				return array( 'ibge', 'osm', 'funai' );
		}

		return is_array( $order ) ? $order : self::DEFAULT_ORDER;
	}
}
