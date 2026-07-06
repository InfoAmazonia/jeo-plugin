<?php
/**
 * Compose Mapbox styles for saved maps.
 *
 * @package Jeo
 */

namespace Jeo;

use WP_Error;
use WP_Post;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Build cached Mapbox Style JSON artifacts from JEO map/layer metadata.
 */
class Map_Style_Composer {

	use Singleton;

	const CACHE_DIR               = 'jeo-mapbox-composed-styles';
	const CACHE_VERSION           = 12;
	const TOKEN_PLACEHOLDER       = '__JEO_MAPBOX_ACCESS_TOKEN__';
	const DEFAULT_FALLBACK_SPRITE = 'mapbox://sprites/mapbox/standard';
	const VIRTUAL_SCOPE_PREVIEW   = 'preview';
	const VIRTUAL_SCOPE_ONETIME   = 'onetime';

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	protected function init() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'save_post_map', array( $this, 'invalidate_map_cache' ), 10, 3 );
		add_action( 'save_post_map-layer', array( $this, 'invalidate_layer_cache' ), 10, 3 );
	}

	/**
	 * Register composer REST routes.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jeo/v1',
			'/map-style/(?P<id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_metadata_response' ),
				'permission_callback' => array( $this, 'can_read_map_request' ),
				'args'                => array(
					'id'      => array(
						'sanitize_callback' => 'absint',
					),
					'refresh' => array(
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/(?P<id>\d+)/style',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_style_response' ),
				'permission_callback' => array( $this, 'can_read_map_request' ),
				'args'                => array(
					'id' => array(
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/(?P<id>\d+)/manifest',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_manifest_response' ),
				'permission_callback' => array( $this, 'can_read_map_request' ),
				'args'                => array(
					'id' => array(
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/compose',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'get_virtual_metadata_response' ),
				'permission_callback' => array( $this, 'can_create_virtual_request' ),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/layer/(?P<id>\d+)/refresh',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'refresh_layer_cache_response' ),
				'permission_callback' => array( $this, 'can_refresh_layer_request' ),
				'args'                => array(
					'id' => array(
						'sanitize_callback' => 'absint',
					),
				),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/(?P<scope>preview|onetime)/(?P<hash>[a-f0-9]{16})/style',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_virtual_style_response' ),
				'permission_callback' => array( $this, 'can_read_virtual_request' ),
				'args'                => array(
					'scope' => array(
						'sanitize_callback' => 'sanitize_key',
					),
					'hash'  => array(
						'sanitize_callback' => 'sanitize_key',
					),
				),
			)
		);

		register_rest_route(
			'jeo/v1',
			'/map-style/(?P<scope>preview|onetime)/(?P<hash>[a-f0-9]{16})/manifest',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_virtual_manifest_response' ),
				'permission_callback' => array( $this, 'can_read_virtual_request' ),
				'args'                => array(
					'scope' => array(
						'sanitize_callback' => 'sanitize_key',
					),
					'hash'  => array(
						'sanitize_callback' => 'sanitize_key',
					),
				),
			)
		);
	}

	/**
	 * Check whether the current request can read a map.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return bool
	 */
	public function can_read_map_request( WP_REST_Request $request ) {
		return $this->can_read_map( absint( $request['id'] ) );
	}

	/**
	 * Check whether the current request can compose a virtual style.
	 *
	 * Preview styles represent unsaved editor state and require edit access.
	 * Public one-time maps are limited later to published layer posts only.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return bool
	 */
	public function can_create_virtual_request( WP_REST_Request $request ) {
		$params = $this->normalize_array( $request->get_json_params() );
		$scope  = $this->normalize_virtual_scope( $params['scope'] ?? self::VIRTUAL_SCOPE_PREVIEW );

		if ( self::VIRTUAL_SCOPE_ONETIME === $scope ) {
			return true;
		}

		if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		$post_id = absint( $params['postId'] ?? 0 );
		if ( $post_id && ! current_user_can( 'edit_post', $post_id ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Check whether the current request can force refresh a layer cache.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return bool
	 */
	public function can_refresh_layer_request( WP_REST_Request $request ) {
		$layer_id = absint( $request['id'] );
		$post     = get_post( $layer_id );

		return $post instanceof WP_Post &&
			'map-layer' === $post->post_type &&
			current_user_can( 'edit_post', $layer_id );
	}

	/**
	 * Check whether the current request can read a virtual artifact.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return bool
	 */
	public function can_read_virtual_request( WP_REST_Request $request ) {
		$scope = $this->normalize_virtual_scope( $request['scope'] ?? '' );

		if ( self::VIRTUAL_SCOPE_ONETIME === $scope ) {
			return true;
		}

		return is_user_logged_in() && current_user_can( 'edit_posts' );
	}

	/**
	 * Return composed style metadata.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function get_metadata_response( WP_REST_Request $request ) {
		$map_id        = absint( $request['id'] );
		$force_refresh = rest_sanitize_boolean( $request->get_param( 'refresh' ) ) &&
			current_user_can( 'edit_post', $map_id );

		$result = $this->get_or_create_artifacts(
			$map_id,
			$force_refresh
		);

		if ( is_wp_error( $result ) ) {
			return rest_ensure_response(
				array(
					'enabled' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		$response = $result;
		unset( $response['stylePath'], $response['manifestPath'] );

		return rest_ensure_response( $response );
	}

	/**
	 * Return the composed style JSON.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_style_response( WP_REST_Request $request ) {
		$result = $this->get_or_create_artifacts( absint( $request['id'] ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$style = $this->read_json_file( $result['stylePath'], false );
		if ( is_wp_error( $style ) ) {
			return $style;
		}

		$response = new WP_REST_Response( $style );
		$response->header( 'Cache-Control', 'public, max-age=300' );
		return $response;
	}

	/**
	 * Return the composed style manifest.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_manifest_response( WP_REST_Request $request ) {
		$result = $this->get_or_create_artifacts( absint( $request['id'] ) );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$manifest = $this->read_json_file( $result['manifestPath'] );
		if ( is_wp_error( $manifest ) ) {
			return $manifest;
		}

		$response = new WP_REST_Response( $manifest );
		$response->header( 'Cache-Control', 'public, max-age=300' );
		return $response;
	}

	/**
	 * Return metadata for a virtual style composed from a payload.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function get_virtual_metadata_response( WP_REST_Request $request ) {
		$result = $this->get_or_create_virtual_artifacts( $this->normalize_array( $request->get_json_params() ) );

		if ( is_wp_error( $result ) ) {
			return rest_ensure_response(
				array(
					'enabled' => false,
					'error'   => $result->get_error_message(),
				)
			);
		}

		$response = $result;
		unset( $response['stylePath'], $response['manifestPath'] );

		return rest_ensure_response( $response );
	}

	/**
	 * Return a virtual composed style JSON.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_virtual_style_response( WP_REST_Request $request ) {
		$paths = $this->get_virtual_artifact_paths( $request['scope'], $request['hash'] );
		if ( is_wp_error( $paths ) ) {
			return $paths;
		}

		$style = $this->read_json_file( $paths['stylePath'], false );
		if ( is_wp_error( $style ) ) {
			return $style;
		}

		$response = new WP_REST_Response( $style );
		$response->header( 'Cache-Control', 'public, max-age=300' );
		return $response;
	}

	/**
	 * Return a virtual composed style manifest.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_virtual_manifest_response( WP_REST_Request $request ) {
		$paths = $this->get_virtual_artifact_paths( $request['scope'], $request['hash'] );
		if ( is_wp_error( $paths ) ) {
			return $paths;
		}

		$manifest = $this->read_json_file( $paths['manifestPath'] );
		if ( is_wp_error( $manifest ) ) {
			return $manifest;
		}

		$response = new WP_REST_Response( $manifest );
		$response->header( 'Cache-Control', 'public, max-age=300' );
		return $response;
	}

	/**
	 * Force refresh composed map style artifacts for maps using a layer.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function refresh_layer_cache_response( WP_REST_Request $request ) {
		$layer_id  = absint( $request['id'] );
		$map_ids   = $this->get_map_ids_for_layer( $layer_id );
		$results   = array();
		$refreshed = 0;
		$failed    = 0;

		foreach ( $map_ids as $map_id ) {
			$result = $this->get_or_create_artifacts( absint( $map_id ), true );

			if ( is_wp_error( $result ) ) {
				++$failed;
				$results[] = array(
					'mapId' => absint( $map_id ),
					'error' => $result->get_error_message(),
				);
				continue;
			}

			++$refreshed;
			$results[] = array(
				'mapId' => absint( $map_id ),
				'hash'  => $result['hash'] ?? null,
			);
		}

		return rest_ensure_response(
			array(
				'layerId'   => $layer_id,
				'mapIds'    => array_map( 'absint', $map_ids ),
				'refreshed' => $refreshed,
				'failed'    => $failed,
				'results'   => $results,
			)
		);
	}

	/**
	 * Clear map cache metadata when a map changes.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post Post object.
	 * @param bool    $update Whether this is an update.
	 * @return void
	 */
	public function invalidate_map_cache( $post_id, $post, $update ) {
		unset( $post, $update );
		delete_post_meta( $post_id, '_jeo_mapbox_composed_style_hash' );
		delete_post_meta( $post_id, '_jeo_mapbox_composed_style_warnings' );
		delete_post_meta( $post_id, '_jeo_mapbox_composed_style_error' );
	}

	/**
	 * Clear cache metadata for maps that reference a changed layer.
	 *
	 * @param int     $post_id Layer post ID.
	 * @param WP_Post $post Layer post object.
	 * @param bool    $update Whether this is an update.
	 * @return void
	 */
	public function invalidate_layer_cache( $post_id, $post, $update ) {
		unset( $post, $update );

		foreach ( $this->get_map_ids_for_layer( $post_id ) as $map_id ) {
			$this->invalidate_map_cache( absint( $map_id ), null, true );
		}
	}

	/**
	 * Get map IDs that reference a layer in serialized map settings.
	 *
	 * @param int $layer_id Layer post ID.
	 * @return int[]
	 */
	private function get_map_ids_for_layer( $layer_id ) {
		$maps = get_posts(
			array(
				'post_type'      => 'map',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_query'     => array(
					array(
						'key'     => 'layers',
						'value'   => 's:2:"id";i:' . absint( $layer_id ) . ';',
						'compare' => 'LIKE',
					),
				),
			)
		);

		return array_map( 'absint', $maps );
	}

	/**
	 * Return whether composed styles are enabled.
	 *
	 * @return bool
	 */
	private function is_enabled() {
		return (bool) apply_filters( 'jeo_mapbox_composed_styles_enabled', true );
	}

	/**
	 * Check map read permission.
	 *
	 * @param int $map_id Map post ID.
	 * @return bool
	 */
	private function can_read_map( $map_id ) {
		$post = get_post( $map_id );
		if ( ! $post instanceof WP_Post || 'map' !== $post->post_type ) {
			return false;
		}

		if ( 'publish' === get_post_status( $post ) ) {
			return true;
		}

		return current_user_can( 'edit_post', $map_id );
	}

	/**
	 * Build or reuse cached artifacts.
	 *
	 * @param int  $map_id Map post ID.
	 * @param bool $force_refresh Whether to force regeneration.
	 * @return array|WP_Error
	 */
	private function get_or_create_artifacts( $map_id, $force_refresh = false ) {
		if ( ! $this->is_enabled() ) {
			return new WP_Error( 'jeo_mapbox_composer_disabled', __( 'Mapbox composed styles are disabled.', 'jeowp' ) );
		}

		$context = $this->build_context( $map_id );
		if ( is_wp_error( $context ) ) {
			update_post_meta( $map_id, '_jeo_mapbox_composed_style_error', $context->get_error_message() );
			return $context;
		}

		$hash  = $this->calculate_hash( $context );
		$paths = $this->get_artifact_paths( $map_id, $hash );
		if ( is_wp_error( $paths ) ) {
			update_post_meta( $map_id, '_jeo_mapbox_composed_style_error', $paths->get_error_message() );
			return $paths;
		}

		if (
			! $force_refresh &&
			file_exists( $paths['stylePath'] ) &&
			file_exists( $paths['manifestPath'] )
		) {
			return $this->build_metadata( $map_id, $hash, $paths );
		}

		if ( ! wp_mkdir_p( $paths['dir'] ) ) {
			return new WP_Error( 'jeo_mapbox_composer_cache_dir', __( 'Could not create the Mapbox composed style cache directory.', 'jeowp' ) );
		}

		$composed = $this->compose_context( $context, $paths );
		if ( is_wp_error( $composed ) ) {
			update_post_meta( $map_id, '_jeo_mapbox_composed_style_error', $composed->get_error_message() );
			return $composed;
		}

		$this->write_json_file( $paths['stylePath'], $this->prepare_style_for_json( $composed['style'] ) );
		$this->write_json_file( $paths['manifestPath'], $composed['manifest'] );
		$this->write_json_file( $paths['reportPath'], $composed['report'] );

		update_post_meta( $map_id, '_jeo_mapbox_composed_style_hash', $hash );
		update_post_meta( $map_id, '_jeo_mapbox_composed_style_warnings', $composed['report']['warnings'] );
		delete_post_meta( $map_id, '_jeo_mapbox_composed_style_error' );

		return $this->build_metadata( $map_id, $hash, $paths, $composed['report'] );
	}

	/**
	 * Build or reuse cached artifacts for an editor/public payload.
	 *
	 * @param array $payload Request payload.
	 * @return array|WP_Error
	 */
	private function get_or_create_virtual_artifacts( array $payload ) {
		if ( ! $this->is_enabled() ) {
			return new WP_Error( 'jeo_mapbox_composer_disabled', __( 'Mapbox composed styles are disabled.', 'jeowp' ) );
		}

		$context = $this->build_virtual_context( $payload );
		if ( is_wp_error( $context ) ) {
			return $context;
		}

		$this->maybe_cleanup_virtual_cache( $context['scope'] );

		$hash  = $this->calculate_virtual_hash( $context );
		$paths = $this->get_virtual_artifact_paths( $context['scope'], $hash );
		if ( is_wp_error( $paths ) ) {
			return $paths;
		}

		if (
			file_exists( $paths['stylePath'] ) &&
			file_exists( $paths['manifestPath'] )
		) {
			return $this->build_virtual_metadata( $context['scope'], $hash, $paths );
		}

		if ( ! wp_mkdir_p( $paths['dir'] ) ) {
			return new WP_Error( 'jeo_mapbox_composer_cache_dir', __( 'Could not create the Mapbox composed style cache directory.', 'jeowp' ) );
		}

		$composed = $this->compose_context( $context, $paths );
		if ( is_wp_error( $composed ) ) {
			return $composed;
		}

		$this->write_json_file( $paths['stylePath'], $this->prepare_style_for_json( $composed['style'] ) );
		$this->write_json_file( $paths['manifestPath'], $composed['manifest'] );
		$this->write_json_file( $paths['reportPath'], $composed['report'] );

		return $this->build_virtual_metadata( $context['scope'], $hash, $paths, $composed['report'] );
	}

	/**
	 * Create metadata returned to the frontend.
	 *
	 * @param int        $map_id Map post ID.
	 * @param string     $hash Cache hash.
	 * @param array      $paths Artifact paths.
	 * @param array|null $report Optional fresh report.
	 * @return array
	 */
	private function build_metadata( $map_id, $hash, array $paths, $report = null ) {
		if ( null === $report && file_exists( $paths['reportPath'] ) ) {
			$report = $this->read_json_file( $paths['reportPath'] );
		}

		$warnings = array();
		if ( is_array( $report ) && isset( $report['warnings'] ) && is_array( $report['warnings'] ) ) {
			$warnings = $report['warnings'];
		}

		return array(
			'enabled'      => true,
			'mapId'        => $map_id,
			'hash'         => $hash,
			'style'        => rest_url( sprintf( 'jeo/v1/map-style/%d/style?hash=%s', $map_id, rawurlencode( $hash ) ) ),
			'manifest'     => rest_url( sprintf( 'jeo/v1/map-style/%d/manifest?hash=%s', $map_id, rawurlencode( $hash ) ) ),
			'warnings'     => $warnings,
			'stylePath'    => $paths['stylePath'],
			'manifestPath' => $paths['manifestPath'],
		);
	}

	/**
	 * Create virtual metadata returned to the frontend.
	 *
	 * @param string     $scope Virtual cache scope.
	 * @param string     $hash Cache hash.
	 * @param array      $paths Artifact paths.
	 * @param array|null $report Optional fresh report.
	 * @return array
	 */
	private function build_virtual_metadata( $scope, $hash, array $paths, $report = null ) {
		$scope = $this->normalize_virtual_scope( $scope );

		if ( null === $report && file_exists( $paths['reportPath'] ) ) {
			$report = $this->read_json_file( $paths['reportPath'] );
		}

		$warnings = array();
		if ( is_array( $report ) && isset( $report['warnings'] ) && is_array( $report['warnings'] ) ) {
			$warnings = $report['warnings'];
		}

		$style_url    = rest_url( sprintf( 'jeo/v1/map-style/%s/%s/style', $scope, rawurlencode( $hash ) ) );
		$manifest_url = rest_url( sprintf( 'jeo/v1/map-style/%s/%s/manifest', $scope, rawurlencode( $hash ) ) );
		if ( self::VIRTUAL_SCOPE_PREVIEW === $scope && is_user_logged_in() ) {
			$nonce        = wp_create_nonce( 'wp_rest' );
			$style_url    = add_query_arg( '_wpnonce', $nonce, $style_url );
			$manifest_url = add_query_arg( '_wpnonce', $nonce, $manifest_url );
		}

		return array(
			'enabled'      => true,
			'scope'        => $scope,
			'hash'         => $hash,
			'style'        => $style_url,
			'manifest'     => $manifest_url,
			'warnings'     => $warnings,
			'stylePath'    => $paths['stylePath'],
			'manifestPath' => $paths['manifestPath'],
		);
	}

	/**
	 * Build context from current map and layer posts.
	 *
	 * @param int $map_id Map post ID.
	 * @return array|WP_Error
	 */
	private function build_context( $map_id ) {
		$post = get_post( $map_id );
		if ( ! $post instanceof WP_Post || 'map' !== $post->post_type ) {
			return new WP_Error( 'jeo_mapbox_composer_map_not_found', __( 'Map not found.', 'jeowp' ) );
		}

		$settings = get_post_meta( $map_id, 'layers', true );
		if ( ! is_array( $settings ) ) {
			$settings = array();
		}

		$token = trim( (string) \jeo_settings()->get_option( 'mapbox_key' ) );
		if ( '' === $token ) {
			return new WP_Error( 'jeo_mapbox_composer_missing_token', __( 'A Mapbox access token is required to compose Mapbox styles.', 'jeowp' ) );
		}

		$refs = $this->build_refs_from_settings( $settings, $token, true );

		$center     = null;
		$center_lon = get_post_meta( $map_id, 'center_lon', true );
		$center_lat = get_post_meta( $map_id, 'center_lat', true );
		if ( '' !== $center_lon && '' !== $center_lat && is_numeric( $center_lon ) && is_numeric( $center_lat ) ) {
			$center = array( (float) $center_lon, (float) $center_lat );
		}

		$zoom = get_post_meta( $map_id, 'initial_zoom', true );
		$zoom = '' !== $zoom && is_numeric( $zoom ) ? (float) $zoom : null;

		return array(
			'kind'        => 'map',
			'id'          => $map_id,
			'slug'        => $post->post_name ? $post->post_name : (string) $map_id,
			'title'       => get_the_title( $post ),
			'url'         => get_permalink( $post ),
			'center'      => $center,
			'zoom'        => $zoom,
			'modifiedGmt' => $post->post_modified_gmt,
			'refs'        => $refs,
			'mapSettings' => $this->normalize_array( $settings ),
		);
	}

	/**
	 * Build context from an editor/public payload.
	 *
	 * @param array $payload Request payload.
	 * @return array|WP_Error
	 */
	private function build_virtual_context( array $payload ) {
		$scope = $this->normalize_virtual_scope( $payload['scope'] ?? self::VIRTUAL_SCOPE_PREVIEW );
		$kind  = sanitize_key( $payload['kind'] ?? ( self::VIRTUAL_SCOPE_ONETIME === $scope ? 'onetime-map' : 'preview' ) );

		if ( self::VIRTUAL_SCOPE_ONETIME === $scope && 'onetime-map' !== $kind ) {
			return new WP_Error( 'jeo_mapbox_composer_invalid_scope', __( 'Public payload composition is only available for one-time maps.', 'jeowp' ) );
		}

		$encoded_payload = wp_json_encode( $payload );
		$max_size        = (int) apply_filters( 'jeo_mapbox_composed_payload_max_bytes', 64 * 1024, $scope );
		if ( strlen( (string) $encoded_payload ) > $max_size ) {
			return new WP_Error( 'jeo_mapbox_composer_payload_too_large', __( 'The map preview payload is too large.', 'jeowp' ) );
		}

		$settings   = isset( $payload['layers'] ) && is_array( $payload['layers'] )
			? $this->sanitize_layer_settings_payload( $payload['layers'] )
			: array();
		$max_layers = (int) apply_filters(
			'jeo_mapbox_composed_payload_max_layers',
			self::VIRTUAL_SCOPE_ONETIME === $scope ? 40 : 100,
			$scope
		);
		if ( count( $settings ) > $max_layers ) {
			return new WP_Error( 'jeo_mapbox_composer_too_many_layers', __( 'The map preview has too many layers to compose.', 'jeowp' ) );
		}

		$token = trim( (string) \jeo_settings()->get_option( 'mapbox_key' ) );
		if ( '' === $token ) {
			return new WP_Error( 'jeo_mapbox_composer_missing_token', __( 'A Mapbox access token is required to compose Mapbox styles.', 'jeowp' ) );
		}

		$include_private = self::VIRTUAL_SCOPE_PREVIEW === $scope;
		$refs            = $this->build_refs_from_settings( $settings, $token, $include_private );
		if ( empty( $refs ) ) {
			return new WP_Error( 'jeo_mapbox_composer_empty_payload', __( 'The map preview does not include any renderable layers.', 'jeowp' ) );
		}

		$post_id = absint( $payload['postId'] ?? 0 );
		$post    = $post_id ? get_post( $post_id ) : null;

		$center     = null;
		$center_lon = $payload['center_lon'] ?? null;
		$center_lat = $payload['center_lat'] ?? null;
		if ( '' !== $center_lon && '' !== $center_lat && is_numeric( $center_lon ) && is_numeric( $center_lat ) ) {
			$center = array( (float) $center_lon, (float) $center_lat );
		}

		$zoom = $payload['initial_zoom'] ?? null;
		$zoom = '' !== $zoom && is_numeric( $zoom ) ? (float) $zoom : null;

		$virtual_id = $post_id ? (string) $post_id : substr( sha1( wp_json_encode( $settings ) ), 0, 8 );
		$title      = isset( $payload['title'] ) ? sanitize_text_field( $payload['title'] ) : '';
		if ( '' === $title && $post instanceof WP_Post ) {
			$title = get_the_title( $post );
		}
		if ( '' === $title ) {
			$title = __( 'Map preview', 'jeowp' );
		}

		$url = '';
		if ( isset( $payload['url'] ) ) {
			$url = esc_url_raw( $payload['url'] );
		} elseif ( $post instanceof WP_Post ) {
			$url = get_permalink( $post );
		}

		return array(
			'kind'        => $kind,
			'scope'       => $scope,
			'id'          => $virtual_id,
			'slug'        => $post instanceof WP_Post && $post->post_name ? $post->post_name : $this->slug_id( $kind . '-' . $virtual_id ),
			'title'       => $title,
			'url'         => $url,
			'center'      => $center,
			'zoom'        => $zoom,
			'modifiedGmt' => $post instanceof WP_Post ? $post->post_modified_gmt : '',
			'refs'        => $refs,
			'mapSettings' => $settings,
		);
	}

	/**
	 * Build layer references from saved or payload layer settings.
	 *
	 * @param array  $settings Layer instance settings.
	 * @param string $token Default Mapbox token.
	 * @param bool   $include_private Whether draft/private layers can be used.
	 * @return array
	 */
	private function build_refs_from_settings( array $settings, $token, $include_private ) {
		$refs = array();

		foreach ( $settings as $index => $setting ) {
			$setting  = $this->normalize_array( $setting );
			$layer_id = absint( $setting['id'] ?? 0 );
			if ( ! $layer_id ) {
				continue;
			}

			$layer_post = get_post( $layer_id );
			if ( ! $layer_post instanceof WP_Post || 'map-layer' !== $layer_post->post_type ) {
				continue;
			}

			if ( 'publish' !== get_post_status( $layer_post ) && ( ! $include_private || ! current_user_can( 'edit_post', $layer_id ) ) ) {
				continue;
			}

			$type    = (string) get_post_meta( $layer_id, 'type', true );
			$options = $this->normalize_array( get_post_meta( $layer_id, 'layer_type_options', true ) );
			if ( '' === $type ) {
				continue;
			}

			$style_id = 'mapbox' === $type ? $this->normalize_style_id( $options['style_id'] ?? '' ) : null;
			if ( 'mapbox' === $type && ! $style_id ) {
				continue;
			}

			$refs[] = array(
				'index'                => (int) $index,
				'layerId'              => $layer_id,
				'title'                => get_the_title( $layer_post ),
				'slug'                 => $layer_post->post_name ? $layer_post->post_name : (string) $layer_id,
				'type'                 => $type,
				'options'              => $options,
				'token'                => ! empty( $options['access_token'] ) ? (string) $options['access_token'] : $token,
				'styleId'              => $style_id,
				'loadAsStyle'          => $this->to_bool( $setting['load_as_style'] ?? false ),
				'use'                  => $setting['use'] ?? null,
				'default'              => $this->to_bool( $setting['default'] ?? false ),
				'styleLayerSettings'   => isset( $setting['style_layers'] ) && is_array( $setting['style_layers'] ) ? $this->normalize_array( $setting['style_layers'] ) : array(),
				'modifiedGmt'          => $layer_post->post_modified_gmt,
				'layerTypeOptionsHash' => sha1( wp_json_encode( $options ) ),
			);
		}

		return $refs;
	}

	/**
	 * Keep only layer instance fields that are safe to influence composition.
	 *
	 * @param array $settings Raw layer settings.
	 * @return array
	 */
	private function sanitize_layer_settings_payload( array $settings ) {
		$sanitized = array();

		foreach ( $settings as $setting ) {
			$setting  = $this->normalize_array( $setting );
			$layer_id = absint( $setting['id'] ?? 0 );
			if ( ! $layer_id ) {
				continue;
			}

			$item = array(
				'id'            => $layer_id,
				'use'           => isset( $setting['use'] ) ? sanitize_key( $setting['use'] ) : null,
				'default'       => $this->to_bool( $setting['default'] ?? false ),
				'load_as_style' => $this->to_bool( $setting['load_as_style'] ?? false ),
				'show_legend'   => ! array_key_exists( 'show_legend', $setting ) || $this->to_bool( $setting['show_legend'] ),
				'style_layers'  => array(),
			);

			if ( isset( $setting['style_layers'] ) && is_array( $setting['style_layers'] ) ) {
				foreach ( $setting['style_layers'] as $style_layer ) {
					$style_layer = $this->normalize_array( $style_layer );
					if ( empty( $style_layer['id'] ) ) {
						continue;
					}
					$item['style_layers'][] = array(
						'id'   => sanitize_text_field( $style_layer['id'] ),
						'show' => ! array_key_exists( 'show', $style_layer ) || ! $this->is_false( $style_layer['show'] ),
					);
				}
			}

			$sanitized[] = $item;
		}

		return $sanitized;
	}

	/**
	 * Calculate the cache hash.
	 *
	 * @param array $context Composer context.
	 * @return string
	 */
	private function calculate_hash( array $context ) {
		return substr(
			sha1(
				wp_json_encode(
					array(
						'version'     => self::CACHE_VERSION,
						'mapId'       => $context['id'],
						'modifiedGmt' => $context['modifiedGmt'],
						'mapSettings' => $context['mapSettings'],
						'refs'        => array_map(
							function ( $ref ) {
								return array(
									'layerId'              => $ref['layerId'],
									'modifiedGmt'          => $ref['modifiedGmt'],
									'type'                 => $ref['type'],
									'styleId'              => $ref['styleId'],
									'layerTypeOptionsHash' => $ref['layerTypeOptionsHash'],
								);
							},
							$context['refs']
						),
					)
				)
			),
			0,
			16
		);
	}

	/**
	 * Calculate the cache hash for virtual payloads.
	 *
	 * @param array $context Composer context.
	 * @return string
	 */
	private function calculate_virtual_hash( array $context ) {
		return substr(
			sha1(
				wp_json_encode(
					array(
						'version'     => self::CACHE_VERSION,
						'scope'       => $context['scope'],
						'kind'        => $context['kind'],
						'id'          => $context['id'],
						'modifiedGmt' => $context['modifiedGmt'],
						'center'      => $context['center'],
						'zoom'        => $context['zoom'],
						'mapSettings' => $context['mapSettings'],
						'refs'        => array_map(
							function ( $ref ) {
								return array(
									'layerId'              => $ref['layerId'],
									'modifiedGmt'          => $ref['modifiedGmt'],
									'type'                 => $ref['type'],
									'styleId'              => $ref['styleId'],
									'layerTypeOptionsHash' => $ref['layerTypeOptionsHash'],
								);
							},
							$context['refs']
						),
					)
				)
			),
			0,
			16
		);
	}

	/**
	 * Get artifact filesystem paths and URLs.
	 *
	 * @param int    $map_id Map post ID.
	 * @param string $hash Cache hash.
	 * @return array|WP_Error
	 */
	private function get_artifact_paths( $map_id, $hash ) {
		$upload_dir = wp_upload_dir( null, false );
		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'jeo_mapbox_composer_upload_dir', $upload_dir['error'] );
		}

		$relative = sprintf( '%s/%d/%s', self::CACHE_DIR, $map_id, sanitize_key( $hash ) );
		$dir      = trailingslashit( $upload_dir['basedir'] ) . $relative;
		$baseurl  = trailingslashit( $upload_dir['baseurl'] ) . $relative;

		return array(
			'dir'          => $dir,
			'baseurl'      => $baseurl,
			'stylePath'    => trailingslashit( $dir ) . 'style.json',
			'manifestPath' => trailingslashit( $dir ) . 'manifest.json',
			'reportPath'   => trailingslashit( $dir ) . 'report.json',
			'spriteRoot'   => trailingslashit( $baseurl ) . 'sprite',
		);
	}

	/**
	 * Get artifact filesystem paths and URLs for virtual payloads.
	 *
	 * @param string $scope Virtual cache scope.
	 * @param string $hash Cache hash.
	 * @return array|WP_Error
	 */
	private function get_virtual_artifact_paths( $scope, $hash ) {
		$scope = $this->normalize_virtual_scope( $scope );
		$hash  = sanitize_key( $hash );

		if ( ! preg_match( '/^[a-f0-9]{16}$/', $hash ) ) {
			return new WP_Error( 'jeo_mapbox_composer_invalid_hash', __( 'Invalid composed style hash.', 'jeowp' ) );
		}

		$upload_dir = wp_upload_dir( null, false );
		if ( ! empty( $upload_dir['error'] ) ) {
			return new WP_Error( 'jeo_mapbox_composer_upload_dir', $upload_dir['error'] );
		}

		$relative = sprintf( '%s/%s/%s', self::CACHE_DIR, $scope, $hash );
		$dir      = trailingslashit( $upload_dir['basedir'] ) . $relative;
		$baseurl  = trailingslashit( $upload_dir['baseurl'] ) . $relative;

		return array(
			'dir'          => $dir,
			'baseurl'      => $baseurl,
			'stylePath'    => trailingslashit( $dir ) . 'style.json',
			'manifestPath' => trailingslashit( $dir ) . 'manifest.json',
			'reportPath'   => trailingslashit( $dir ) . 'report.json',
			'spriteRoot'   => trailingslashit( $baseurl ) . 'sprite',
		);
	}

	/**
	 * Compose the style and manifest.
	 *
	 * @param array $context Composer context.
	 * @param array $paths Artifact paths.
	 * @return array|WP_Error
	 */
	private function compose_context( array $context, array $paths ) {
		$bundles       = array();
		$failed_styles = array();
		$warnings      = array();
		$direct_types  = array( 'mapbox-tileset-raster', 'mapbox-tileset-vector', 'mvt', 'tilelayer' );

		foreach ( $context['refs'] as $ref ) {
			if ( 'mapbox' !== $ref['type'] ) {
				continue;
			}

			$style = $this->fetch_mapbox_style( $ref['styleId'], $ref['token'] );
			if ( is_wp_error( $style ) ) {
				$failed_styles[] = array(
					'layerId' => $ref['layerId'],
					'styleId' => $ref['styleId'],
					'error'   => $style->get_error_message(),
				);
				continue;
			}

			$image_props              = $this->get_image_props( $style );
			$prefix                   = $this->make_prefix( $context, $ref );
			$bundles[ $ref['index'] ] = array(
				'ref'         => $ref,
				'style'       => $style,
				'prefix'      => $prefix,
				'imagePrefix' => $prefix . 'img_',
				'imageProps'  => $image_props,
				'needsSprite' => $image_props > 0,
				'spriteUrl'   => $this->first_sprite( $style ),
				'glyphsUrl'   => $style['glyphs'] ?? null,
				'warnings'    => array(),
			);
		}

		if ( ! empty( $failed_styles ) ) {
			foreach ( $failed_styles as $failed_style ) {
				$warnings[] = array(
					'layerId' => $failed_style['layerId'],
					'styleId' => $failed_style['styleId'],
					'warning' => sprintf(
						'Skipped Mapbox style because it could not be fetched: %s',
						$this->sanitize_tokens_in_value( $failed_style['error'] )
					),
				);
			}

			$has_direct_layers = array_reduce(
				$context['refs'],
				function ( $has_direct, $ref ) use ( $direct_types ) {
					return $has_direct || in_array( $ref['type'], $direct_types, true );
				},
				false
			);

			if ( empty( $bundles ) && ! $has_direct_layers ) {
				return new WP_Error(
					'jeo_mapbox_composer_style_fetch_failed',
					__( 'One or more Mapbox styles could not be fetched.', 'jeowp' ),
					$failed_styles
				);
			}
		}

		$sprite_summary = $this->build_composite_sprite( $bundles, $paths );
		if ( is_wp_error( $sprite_summary ) ) {
			$warnings[]     = array(
				'warning' => $sprite_summary->get_error_message(),
			);
			$sprite_summary = array(
				'generated'      => false,
				'normalImages'   => 0,
				'retinaImages'   => 0,
				'spritesMerged'  => 0,
				'fallbackImages' => 0,
				'fallbackMisses' => array(),
				'failures'       => array(),
			);
		}

		$glyphs = $this->select_glyphs( $bundles );
		$style  = array(
			'version'  => 8,
			'name'     => sprintf( 'JEO - %s', $context['title'] ),
			'metadata' => array(
				'jeo:composed'     => true,
				'jeo:cacheVersion' => self::CACHE_VERSION,
				'jeo:sourcePost'   => array(
					'kind'  => $context['kind'],
					'id'    => $context['id'],
					'title' => $context['title'],
					'url'   => $context['url'],
				),
				'jeo:generatedAt'  => gmdate( 'c' ),
			),
			'sources'  => array(),
			'layers'   => array(),
		);

		if ( ! empty( $context['center'] ) ) {
			$style['center'] = $context['center'];
		}
		if ( null !== $context['zoom'] ) {
			$style['zoom'] = $context['zoom'];
		}
		if ( $glyphs ) {
			$style['glyphs'] = $glyphs;
		}
		if ( ! empty( $sprite_summary['generated'] ) ) {
			$style['sprite'] = $paths['spriteRoot'];
		}

		$manifest = array(
			'kind'        => $context['kind'],
			'id'          => $context['id'],
			'slug'        => $context['slug'],
			'title'       => $context['title'],
			'originalUrl' => $context['url'],
			'layers'      => array(),
		);

		foreach ( $context['refs'] as $ref ) {
			$bundle = $bundles[ $ref['index'] ] ?? null;
			if ( ! $bundle ) {
				if ( in_array( $ref['type'], $direct_types, true ) ) {
					$direct = $this->build_direct_layer( $context, $ref );
					if ( $direct ) {
						$style['sources'][ $direct['sourceId'] ] = $direct['source'];
						$style['layers'][]                       = $direct['layer'];
						$manifest['layers'][]                    = $direct['manifest'];
					}
				}
				continue;
			}

			$source_map = array();
			foreach ( $bundle['style']['sources'] ?? array() as $old_source_id => $source_definition ) {
				$new_source_id                      = $bundle['prefix'] . 'src_' . $this->slug_id( $old_source_id );
				$source_map[ $old_source_id ]       = $new_source_id;
				$style['sources'][ $new_source_id ] = $this->prepare_source_for_composed_style( $source_definition );
			}

			foreach ( array( 'projection', 'light', 'terrain', 'fog' ) as $root_property ) {
				$this->merge_root_property( $style, $root_property, $bundle, $source_map, $warnings );
			}

			$layer_id_map = array();
			foreach ( $bundle['style']['layers'] ?? array() as $layer ) {
				if ( ! is_array( $layer ) || empty( $layer['id'] ) ) {
					continue;
				}
				if ( ! $this->is_style_layer_enabled( $bundle['ref'], $layer['id'] ) ) {
					continue;
				}
				$layer_id_map[ $layer['id'] ] = $bundle['prefix'] . $this->slug_id( $layer['id'] );
			}

			$manifest_layers = array();
			$initial_visible = true === $bundle['ref']['default'];
			foreach ( $bundle['style']['layers'] ?? array() as $layer ) {
				if ( ! is_array( $layer ) || empty( $layer['id'] ) || ! isset( $layer_id_map[ $layer['id'] ] ) ) {
					continue;
				}

				$old_layer_id    = $layer['id'];
				$new_layer       = $this->sanitize_tokens_in_value( $layer );
				$new_layer['id'] = $layer_id_map[ $old_layer_id ];

				if ( isset( $new_layer['source'] ) && isset( $source_map[ $new_layer['source'] ] ) ) {
					$new_layer['source'] = $source_map[ $new_layer['source'] ];
				}

				if ( isset( $new_layer['ref'] ) ) {
					if ( isset( $layer_id_map[ $new_layer['ref'] ] ) ) {
						$new_layer['ref'] = $layer_id_map[ $new_layer['ref'] ];
					} else {
						$warnings[] = array(
							'styleId' => $bundle['ref']['styleId'],
							'warning' => sprintf( 'Skipped layer %1$s because its ref %2$s was not copied.', $old_layer_id, $new_layer['ref'] ),
						);
						continue;
					}
				}

				$visible_when_on = ! isset( $layer['layout']['visibility'] ) || 'none' !== $layer['layout']['visibility'];
				if ( ! $initial_visible ) {
					$new_layer = $this->set_layer_visibility( $new_layer, false );
				}
				if ( ! empty( $bundle['needsSprite'] ) && ! empty( $sprite_summary['generated'] ) ) {
					$new_layer = $this->rewrite_layer_images( $new_layer, $bundle['imagePrefix'], $bundle['warnings'] );
				}

				$unsupported_expressions = array();
				$new_layer               = $this->normalize_unsupported_expressions( $new_layer, $unsupported_expressions );
				if ( ! empty( $unsupported_expressions ) ) {
					$warnings[] = array(
						'styleId' => $bundle['ref']['styleId'],
						'layerId' => $bundle['ref']['layerId'],
						'warning' => sprintf(
							'Layer %1$s used renderer-specific expression operators that were replaced for composed style compatibility: %2$s.',
							$old_layer_id,
							implode( ', ', array_keys( $unsupported_expressions ) )
						),
					);
				}

				if ( ! isset( $new_layer['metadata'] ) || ! is_array( $new_layer['metadata'] ) ) {
					$new_layer['metadata'] = array();
				}
				$new_layer['metadata']['jeo:source'] = array(
					'layerPostId'     => $bundle['ref']['layerId'],
					'layerTitle'      => $bundle['ref']['title'],
					'styleId'         => $bundle['ref']['styleId'],
					'originalLayerId' => $old_layer_id,
				);

				$style['layers'][] = $new_layer;
				$manifest_layers[] = array(
					'originalId'         => $old_layer_id,
					'compositeId'        => $new_layer['id'],
					'type'               => $new_layer['type'] ?? null,
					'visibleWhenLayerOn' => $visible_when_on,
				);
			}

			$manifest['layers'][] = array(
				'layerPostId'     => $bundle['ref']['layerId'],
				'title'           => $bundle['ref']['title'],
				'slug'            => $bundle['ref']['slug'],
				'layerType'       => $bundle['ref']['type'],
				'styleId'         => $bundle['ref']['styleId'],
				'loadAsStyle'     => $bundle['ref']['loadAsStyle'],
				'use'             => $bundle['ref']['use'],
				'default'         => $bundle['ref']['default'],
				'initialVisible'  => $initial_visible,
				'directLayer'     => false,
				'prefix'          => $bundle['prefix'],
				'imagePrefix'     => ! empty( $bundle['needsSprite'] ) ? $bundle['imagePrefix'] : null,
				'interactions'    => $bundle['ref']['loadAsStyle'] ? $this->transform_interactions( $bundle['ref'], $layer_id_map, $warnings ) : array(),
				'compositeLayers' => $manifest_layers,
			);

			foreach ( $bundle['warnings'] as $warning ) {
				$warnings[] = array(
					'styleId' => $bundle['ref']['styleId'],
					'warning' => $warning,
				);
			}
		}

		$report = array(
			'kind'             => $context['kind'],
			'id'               => $context['id'],
			'slug'             => $context['slug'],
			'title'            => $context['title'],
			'sourceRefs'       => count( $context['refs'] ),
			'fetchedStyles'    => count( $bundles ),
			'compositeSources' => count( $style['sources'] ),
			'compositeLayers'  => count( $style['layers'] ),
			'manifestLayers'   => array_sum(
				array_map(
					function ( $layer ) {
						return count( $layer['compositeLayers'] ?? array() );
					},
					$manifest['layers']
				)
			),
			'spriteSummary'    => $sprite_summary,
			'warnings'         => $warnings,
		);

		return array(
			'style'    => $style,
			'manifest' => $manifest,
			'report'   => $report,
		);
	}

	/**
	 * Fetch a Mapbox style.
	 *
	 * @param string $style_id Style ID.
	 * @param string $token Access token.
	 * @return array|WP_Error
	 */
	private function fetch_mapbox_style( $style_id, $token ) {
		$url = add_query_arg(
			'access_token',
			$token,
			sprintf( 'https://api.mapbox.com/styles/v1/%s', ltrim( $style_id, '/' ) )
		);

		$data = $this->remote_json( $url );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return $this->normalize_array( $data );
	}

	/**
	 * Build a direct non-style layer.
	 *
	 * @param array $context Composer context.
	 * @param array $ref Layer reference.
	 * @return array|null
	 */
	private function build_direct_layer( array $context, array $ref ) {
		$options   = $ref['options'];
		$prefix    = $this->make_prefix( $context, $ref );
		$source_id = $prefix . 'src_' . $this->slug_id( $ref['slug'] );
		$layer_id  = $prefix . $this->slug_id( $ref['slug'] );
		$visible   = true === $ref['default'];

		if ( in_array( $ref['type'], array( 'mapbox-tileset-raster', 'mapbox-tileset-vector' ), true ) ) {
			$tileset_url = $this->normalize_tileset_url( $options['tileset_id'] ?? '' );
			if ( ! $tileset_url ) {
				return null;
			}
			$source = array(
				'type' => $options['style_source_type'] ?? ( 'mapbox-tileset-vector' === $ref['type'] ? 'vector' : 'raster' ),
				'url'  => $tileset_url,
			);
			$source = $this->prepare_source_for_composed_style( $source );
			$layer  = array(
				'id'     => $layer_id,
				'type'   => $options['type'] ?? ( 'mapbox-tileset-vector' === $ref['type'] ? 'fill' : 'raster' ),
				'source' => $source_id,
				'layout' => array(
					'visibility' => $visible ? 'visible' : 'none',
				),
			);
			if ( 'mapbox-tileset-vector' === $ref['type'] && ! empty( $options['source_layer'] ) ) {
				$layer['source-layer'] = $options['source_layer'];
			}
		} elseif ( 'mvt' === $ref['type'] ) {
			if ( empty( $options['url'] ) ) {
				return null;
			}
			$source = array(
				'type'  => 'vector',
				'tiles' => array( $this->sanitize_tokens_in_value( $options['url'] ) ),
			);
			$layer  = array(
				'id'     => $layer_id,
				'type'   => $options['type'] ?? 'fill',
				'source' => $source_id,
				'layout' => array(
					'visibility' => $visible ? 'visible' : 'none',
				),
			);
			if ( ! empty( $options['source_layer'] ) ) {
				$layer['source-layer'] = $options['source_layer'];
			}
		} elseif ( 'tilelayer' === $ref['type'] ) {
			if ( empty( $options['url'] ) ) {
				return null;
			}
			$source = array(
				'type'     => 'raster',
				'tiles'    => array( $this->sanitize_tokens_in_value( $options['url'] ) ),
				'tileSize' => 256,
				'scheme'   => $options['scheme'] ?? 'xyz',
			);
			$source = $this->prepare_source_for_composed_style( $source );
			$layer  = array(
				'id'     => $layer_id,
				'type'   => 'raster',
				'source' => $source_id,
				'layout' => array(
					'visibility' => $visible ? 'visible' : 'none',
				),
			);
		} else {
			return null;
		}

		$layer['metadata']['jeo:source'] = array(
			'layerPostId' => $ref['layerId'],
			'layerTitle'  => $ref['title'],
			'layerType'   => $ref['type'],
		);

		return array(
			'sourceId' => $source_id,
			'source'   => $source,
			'layer'    => $layer,
			'manifest' => array(
				'layerPostId'     => $ref['layerId'],
				'title'           => $ref['title'],
				'slug'            => $ref['slug'],
				'layerType'       => $ref['type'],
				'styleId'         => null,
				'loadAsStyle'     => $ref['loadAsStyle'],
				'use'             => $ref['use'],
				'default'         => $ref['default'],
				'initialVisible'  => $visible,
				'directLayer'     => true,
				'prefix'          => $prefix,
				'imagePrefix'     => null,
				'interactions'    => array(),
				'compositeLayers' => array(
					array(
						'originalId'         => (string) $ref['layerId'],
						'compositeId'        => $layer_id,
						'type'               => $layer['type'],
						'visibleWhenLayerOn' => true,
					),
				),
			),
		);
	}

	/**
	 * Return the fallback sprite root used for common missing Mapbox icons.
	 *
	 * Return an empty value from the filter to disable fallback sprite loading.
	 *
	 * @return string
	 */
	private function get_fallback_sprite() {
		return trim(
			(string) apply_filters(
				'jeo_mapbox_composed_style_fallback_sprite',
				self::DEFAULT_FALLBACK_SPRITE
			)
		);
	}

	/**
	 * Merge sprites used by remote styles.
	 *
	 * @param array $bundles Style bundles.
	 * @param array $paths Artifact paths.
	 * @return array|WP_Error
	 */
	private function build_composite_sprite( array $bundles, array $paths ) {
		$needed = array_filter(
			$bundles,
			function ( $bundle ) {
				return ! empty( $bundle['needsSprite'] ) && ! empty( $bundle['spriteUrl'] );
			}
		);

		$summary = array(
			'generated'      => false,
			'normalImages'   => 0,
			'retinaImages'   => 0,
			'spritesMerged'  => 0,
			'fallbackImages' => 0,
			'fallbackMisses' => array(),
			'failures'       => array(),
		);

		if ( empty( $needed ) ) {
			return $summary;
		}

		if ( ! function_exists( 'imagecreatefromstring' ) ) {
			return new WP_Error( 'jeo_mapbox_composer_gd_missing', __( 'The PHP GD extension is required to merge Mapbox sprites.', 'jeowp' ) );
		}

		$fallback_sprite = $this->get_fallback_sprite();

		foreach ( array( 1, 2 ) as $ratio ) {
			$entries        = array();
			$entry_keys     = array();
			$merged_roots   = array();
			$fallback_cache = null;

			foreach ( $needed as $bundle ) {
				$fetched = $this->fetch_sprite( $bundle['spriteUrl'], $bundle['ref']['token'], $ratio );
				if ( is_wp_error( $fetched ) ) {
					$summary['failures'][] = array(
						'style' => $bundle['ref']['styleId'],
						'ratio' => $ratio,
						'error' => $fetched->get_error_message(),
					);
					if ( 2 === $ratio ) {
						continue;
					}
					return $fetched;
				}

				$merged_roots[ $bundle['spriteUrl'] ] = true;
				foreach ( $fetched['json'] as $name => $meta ) {
					$crop = $this->crop_sprite_image( $fetched['image'], $meta );
					if ( ! $crop ) {
						continue;
					}
					$key                = $bundle['imagePrefix'] . $name;
					$entries[]          = array(
						'key'   => $key,
						'meta'  => $meta,
						'image' => $crop,
					);
					$entry_keys[ $key ] = true;
				}

				$missing = array_diff( $this->collect_style_image_names( $bundle['style'] ), array_keys( $fetched['json'] ) );
				if ( ! empty( $missing ) && null === $fallback_cache && '' !== $fallback_sprite ) {
					$fallback_cache = $this->fetch_sprite( $fallback_sprite, $bundle['ref']['token'], $ratio );
				}

				if ( ! empty( $missing ) && is_array( $fallback_cache ) ) {
					foreach ( $missing as $name ) {
						$key = $bundle['imagePrefix'] . $name;
						if ( isset( $entry_keys[ $key ] ) || empty( $fallback_cache['json'][ $name ] ) ) {
							if ( 1 === $ratio && empty( $fallback_cache['json'][ $name ] ) ) {
								$summary['fallbackMisses'][] = array(
									'style' => $bundle['ref']['styleId'],
									'image' => $name,
								);
							}
							continue;
						}
						$crop = $this->crop_sprite_image( $fallback_cache['image'], $fallback_cache['json'][ $name ] );
						if ( ! $crop ) {
							continue;
						}
						$entries[]          = array(
							'key'   => $key,
							'meta'  => $fallback_cache['json'][ $name ],
							'image' => $crop,
						);
						$entry_keys[ $key ] = true;
						if ( 1 === $ratio ) {
							++$summary['fallbackImages'];
						}
					}
				}
			}

			$packed = $this->pack_images( $entries );
			if ( is_wp_error( $packed ) ) {
				return $packed;
			}

			$suffix = 2 === $ratio ? '@2x' : '';
			$this->write_json_file( trailingslashit( $paths['dir'] ) . "sprite{$suffix}.json", $packed['json'] );
			imagepng( $packed['image'], trailingslashit( $paths['dir'] ) . "sprite{$suffix}.png" );
			// phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated -- Explicitly frees GD memory after writing generated sprite sheets.
			imagedestroy( $packed['image'] );

			if ( 1 === $ratio ) {
				$summary['normalImages'] = count( $packed['json'] );
			} else {
				$summary['retinaImages'] = count( $packed['json'] );
			}
			$summary['spritesMerged'] = max( $summary['spritesMerged'], count( $merged_roots ) );
		}

		$summary['generated'] = true;
		return $summary;
	}

	/**
	 * Fetch sprite JSON and PNG.
	 *
	 * @param string $sprite Sprite root.
	 * @param string $token Access token.
	 * @param int    $ratio Pixel ratio.
	 * @return array|WP_Error
	 */
	private function fetch_sprite( $sprite, $token, $ratio ) {
		$suffix = 2 === (int) $ratio ? '@2x' : '';
		$json   = $this->remote_json( $this->sprite_asset_url( $sprite, $token, $suffix, 'json' ) );
		if ( is_wp_error( $json ) ) {
			return $json;
		}

		$image_bytes = $this->remote_bytes( $this->sprite_asset_url( $sprite, $token, $suffix, 'png' ) );
		if ( is_wp_error( $image_bytes ) ) {
			return $image_bytes;
		}

		$image = imagecreatefromstring( $image_bytes );
		if ( ! $image ) {
			return new WP_Error( 'jeo_mapbox_composer_sprite_image', __( 'Could not decode a Mapbox sprite image.', 'jeowp' ) );
		}

		imagealphablending( $image, false );
		imagesavealpha( $image, true );

		return array(
			'json'  => $this->normalize_array( $json ),
			'image' => $image,
		);
	}

	/**
	 * Crop one sprite entry.
	 *
	 * @param resource|\GdImage $image Sprite image.
	 * @param array             $meta Sprite metadata.
	 * @return resource|\GdImage|null
	 */
	private function crop_sprite_image( $image, $meta ) {
		$width  = absint( $meta['width'] ?? 0 );
		$height = absint( $meta['height'] ?? 0 );
		$x      = absint( $meta['x'] ?? 0 );
		$y      = absint( $meta['y'] ?? 0 );
		if ( ! $width || ! $height ) {
			return null;
		}

		$crop = imagecreatetruecolor( $width, $height );
		if ( ! $crop ) {
			return null;
		}

		imagealphablending( $crop, false );
		imagesavealpha( $crop, true );
		$transparent = imagecolorallocatealpha( $crop, 0, 0, 0, 127 );
		imagefilledrectangle( $crop, 0, 0, $width, $height, $transparent );

		if ( ! imagecopy( $crop, $image, 0, 0, $x, $y, $width, $height ) ) {
			// phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated -- Explicitly frees GD memory after a failed sprite crop.
			imagedestroy( $crop );
			return null;
		}

		return $crop;
	}

	/**
	 * Pack sprite images into a single canvas.
	 *
	 * @param array $entries Sprite entries.
	 * @return array|WP_Error
	 */
	private function pack_images( array $entries ) {
		$max_width  = 2048;
		$padding    = 2;
		$x          = 0;
		$y          = 0;
		$row_height = 0;
		$placements = array();

		foreach ( $entries as $entry ) {
			$width  = imagesx( $entry['image'] );
			$height = imagesy( $entry['image'] );
			if ( $x && $x + $width > $max_width ) {
				$x          = 0;
				$y         += $row_height + $padding;
				$row_height = 0;
			}
			$placements[] = array_merge(
				$entry,
				array(
					'x' => $x,
					'y' => $y,
				)
			);
			$x           += $width + $padding;
			$row_height   = max( $row_height, $height );
		}

		$canvas_width  = 1;
		$canvas_height = 1;
		foreach ( $placements as $placement ) {
			$canvas_width  = max( $canvas_width, $placement['x'] + imagesx( $placement['image'] ) );
			$canvas_height = max( $canvas_height, $placement['y'] + imagesy( $placement['image'] ) );
		}

		$canvas = imagecreatetruecolor( $canvas_width, $canvas_height );
		imagealphablending( $canvas, false );
		imagesavealpha( $canvas, true );
		$transparent = imagecolorallocatealpha( $canvas, 0, 0, 0, 127 );
		imagefilledrectangle( $canvas, 0, 0, $canvas_width, $canvas_height, $transparent );

		$packed = array();
		foreach ( $placements as $placement ) {
			imagecopy( $canvas, $placement['image'], $placement['x'], $placement['y'], 0, 0, imagesx( $placement['image'] ), imagesy( $placement['image'] ) );
			$meta                        = $placement['meta'];
			$meta['x']                   = $placement['x'];
			$meta['y']                   = $placement['y'];
			$meta['width']               = imagesx( $placement['image'] );
			$meta['height']              = imagesy( $placement['image'] );
			$packed[ $placement['key'] ] = $meta;
			// phpcs:ignore Generic.PHP.DeprecatedFunctions.Deprecated -- Explicitly frees GD memory after each packed sprite fragment.
			imagedestroy( $placement['image'] );
		}

		return array(
			'json'  => $packed,
			'image' => $canvas,
		);
	}

	/**
	 * Transform interactions to generated layer IDs.
	 *
	 * @param array $ref Layer ref.
	 * @param array $layer_id_map Layer ID map.
	 * @param array $warnings Warnings.
	 * @return array
	 */
	private function transform_interactions( array $ref, array $layer_id_map, array &$warnings ) {
		$interactions = isset( $ref['options']['interactions'] ) && is_array( $ref['options']['interactions'] )
			? $ref['options']['interactions']
			: array();
		$transformed  = array();

		foreach ( $interactions as $interaction ) {
			$interaction = $this->normalize_array( $interaction );
			$original_id = (string) ( $interaction['id'] ?? '' );
			if ( '' === $original_id || empty( $layer_id_map[ $original_id ] ) ) {
				$warnings[] = array(
					'styleId' => $ref['styleId'],
					'layerId' => $ref['layerId'],
					'warning' => sprintf( 'Interaction target layer %s was not copied into the composed style.', $original_id ? $original_id : '<empty>' ),
				);
				continue;
			}

			$fields = array();
			foreach ( $interaction['fields'] ?? array() as $field ) {
				$field = $this->normalize_array( $field );
				if ( empty( $field['field'] ) ) {
					continue;
				}
				$fields[] = array(
					'field' => $field['field'],
					'label' => $field['label'] ?? $field['field'],
				);
			}

			$transformed[] = array(
				'originalId'  => $original_id,
				'compositeId' => $layer_id_map[ $original_id ],
				'on'          => isset( $interaction['on'] ) && in_array( $interaction['on'], array( 'click', 'mouseover' ), true ) ? $interaction['on'] : 'click',
				'title'       => $interaction['title'] ?? null,
				'fields'      => $fields,
			);
		}

		return $transformed;
	}

	/**
	 * Select a glyph template.
	 *
	 * @param array $bundles Style bundles.
	 * @return string|null
	 */
	private function select_glyphs( array $bundles ) {
		foreach ( $bundles as $bundle ) {
			foreach ( $bundle['style']['layers'] ?? array() as $layer ) {
				if ( isset( $layer['layout']['text-font'], $bundle['glyphsUrl'] ) ) {
					return $bundle['glyphsUrl'];
				}
			}
		}

		foreach ( $bundles as $bundle ) {
			if ( ! empty( $bundle['glyphsUrl'] ) ) {
				return $bundle['glyphsUrl'];
			}
		}

		return null;
	}

	/**
	 * Merge a root style property.
	 *
	 * @param array  $composite Composite style.
	 * @param string $property Root property.
	 * @param array  $bundle Style bundle.
	 * @param array  $source_map Source ID map.
	 * @param array  $warnings Warnings.
	 * @return void
	 */
	private function merge_root_property( array &$composite, $property, array $bundle, array $source_map, array &$warnings ) {
		if ( ! isset( $bundle['style'][ $property ] ) ) {
			return;
		}
		if ( isset( $composite[ $property ] ) ) {
			$warnings[] = array(
				'property' => $property,
				'styleId'  => $bundle['ref']['styleId'],
				'layerId'  => $bundle['ref']['layerId'],
				'warning'  => sprintf( 'Root property conflict for %s.', $property ),
			);
			return;
		}

		$value = $this->sanitize_tokens_in_value( $bundle['style'][ $property ] );
		if ( isset( $value['source'], $source_map[ $value['source'] ] ) ) {
			$value['source'] = $source_map[ $value['source'] ];
		}
		$composite[ $property ] = $value;
	}

	/**
	 * Return whether a style layer is enabled by JEO settings.
	 *
	 * @param array  $ref Layer ref.
	 * @param string $layer_id Original style layer ID.
	 * @return bool
	 */
	private function is_style_layer_enabled( array $ref, $layer_id ) {
		foreach ( $ref['styleLayerSettings'] as $setting ) {
			$setting = $this->normalize_array( $setting );
			if ( isset( $setting['id'] ) && $setting['id'] === $layer_id && array_key_exists( 'show', $setting ) && $this->is_false( $setting['show'] ) ) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Set layer visibility.
	 *
	 * @param array $layer Style layer.
	 * @param bool  $visible Visibility.
	 * @return array
	 */
	private function set_layer_visibility( array $layer, $visible ) {
		if ( ! isset( $layer['layout'] ) || ! is_array( $layer['layout'] ) ) {
			$layer['layout'] = array();
		}
		$layer['layout']['visibility'] = $visible ? 'visible' : 'none';
		return $layer;
	}

	/**
	 * Count image properties in a style.
	 *
	 * @param array $style Style JSON.
	 * @return int
	 */
	private function get_image_props( array $style ) {
		$count = 0;
		foreach ( $style['layers'] ?? array() as $layer ) {
			foreach ( array( 'layout', 'paint' ) as $section_name ) {
				$section = $layer[ $section_name ] ?? array();
				if ( ! is_array( $section ) ) {
					continue;
				}
				if ( 'layout' === $section_name && array_key_exists( 'icon-image', $section ) ) {
					++$count;
				}
				foreach ( array_keys( $section ) as $key ) {
					if ( str_ends_with( $key, '-pattern' ) ) {
						++$count;
					}
				}
			}
		}
		return $count;
	}

	/**
	 * Collect literal image names from a style.
	 *
	 * @param array $style Style JSON.
	 * @return array
	 */
	private function collect_style_image_names( array $style ) {
		$names = array();
		foreach ( $style['layers'] ?? array() as $layer ) {
			foreach ( array( 'layout', 'paint' ) as $section_name ) {
				$section = $layer[ $section_name ] ?? array();
				if ( ! is_array( $section ) ) {
					continue;
				}
				if ( 'layout' === $section_name && array_key_exists( 'icon-image', $section ) ) {
					$names = array_merge( $names, $this->collect_literal_image_names( $section['icon-image'] ) );
				}
				foreach ( $section as $key => $value ) {
					if ( str_ends_with( $key, '-pattern' ) ) {
						$names = array_merge( $names, $this->collect_literal_image_names( $value ) );
					}
				}
			}
		}
		return array_values( array_unique( array_filter( $names ) ) );
	}

	/**
	 * Collect literal image names from expressions.
	 *
	 * @param mixed $value Expression value.
	 * @return array
	 */
	private function collect_literal_image_names( $value ) {
		if ( is_string( $value ) ) {
			return '' === $value ? array() : array( $value );
		}
		if ( ! is_array( $value ) || empty( $value ) ) {
			return array();
		}

		$op          = is_string( $value[0] ?? null ) ? $value[0] : null;
		$value_count = count( $value );
		$names       = array();
		if ( 'step' === $op ) {
			if ( isset( $value[2] ) ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[2] ) );
			}
			for ( $i = 4; $i < $value_count; $i += 2 ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[ $i ] ) );
			}
			return $names;
		}
		if ( in_array( $op, array( 'interpolate', 'interpolate-hcl', 'interpolate-lab' ), true ) ) {
			for ( $i = 4; $i < $value_count; $i += 2 ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[ $i ] ) );
			}
			return $names;
		}
		if ( 'case' === $op ) {
			for ( $i = 2; $i < $value_count - 1; $i += 2 ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[ $i ] ) );
			}
			$names = array_merge( $names, $this->collect_literal_image_names( end( $value ) ) );
			return $names;
		}
		if ( 'match' === $op ) {
			for ( $i = 3; $i < $value_count - 1; $i += 2 ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[ $i ] ) );
			}
			$names = array_merge( $names, $this->collect_literal_image_names( end( $value ) ) );
			return $names;
		}
		if ( 'coalesce' === $op ) {
			for ( $i = 1; $i < $value_count; ++$i ) {
				$names = array_merge( $names, $this->collect_literal_image_names( $value[ $i ] ) );
			}
			return $names;
		}
		if ( 'image' === $op && isset( $value[1] ) ) {
			return $this->collect_literal_image_names( $value[1] );
		}

		return array();
	}

	/**
	 * Rewrite image references with a prefix.
	 *
	 * @param array  $layer Style layer.
	 * @param string $image_prefix Image prefix.
	 * @param array  $warnings Warnings.
	 * @return array
	 */
	private function rewrite_layer_images( array $layer, $image_prefix, array &$warnings ) {
		if ( isset( $layer['layout']['icon-image'] ) ) {
			$layer['layout']['icon-image'] = $this->rewrite_image_expression( $layer['layout']['icon-image'], $image_prefix, $warnings );
		}

		foreach ( array( 'layout', 'paint' ) as $section_name ) {
			if ( empty( $layer[ $section_name ] ) || ! is_array( $layer[ $section_name ] ) ) {
				continue;
			}
			foreach ( $layer[ $section_name ] as $key => $value ) {
				if ( str_ends_with( $key, '-pattern' ) ) {
					$layer[ $section_name ][ $key ] = $this->rewrite_image_expression( $value, $image_prefix, $warnings );
				}
			}
		}
		return $layer;
	}

	/**
	 * Rewrite one image expression.
	 *
	 * @param mixed  $value Image expression.
	 * @param string $image_prefix Image prefix.
	 * @param array  $warnings Warnings.
	 * @return mixed
	 */
	private function rewrite_image_expression( $value, $image_prefix, array &$warnings ) {
		if ( is_string( $value ) ) {
			return '' === $value ? $value : $image_prefix . $value;
		}
		if ( ! is_array( $value ) || empty( $value ) ) {
			return $value;
		}

			$op              = is_string( $value[0] ?? null ) ? $value[0] : null;
			$rewritten       = $value;
			$rewritten_count = count( $rewritten );
		if ( 'step' === $op ) {
			if ( isset( $rewritten[2] ) ) {
				$rewritten[2] = $this->rewrite_image_expression( $rewritten[2], $image_prefix, $warnings );
			}
			for ( $i = 4; $i < $rewritten_count; $i += 2 ) {
				$rewritten[ $i ] = $this->rewrite_image_expression( $rewritten[ $i ], $image_prefix, $warnings );
			}
			return $rewritten;
		}
		if ( in_array( $op, array( 'interpolate', 'interpolate-hcl', 'interpolate-lab' ), true ) ) {
			for ( $i = 4; $i < $rewritten_count; $i += 2 ) {
				$rewritten[ $i ] = $this->rewrite_image_expression( $rewritten[ $i ], $image_prefix, $warnings );
			}
			return $rewritten;
		}
		if ( 'case' === $op ) {
			for ( $i = 2; $i < $rewritten_count - 1; $i += 2 ) {
				$rewritten[ $i ] = $this->rewrite_image_expression( $rewritten[ $i ], $image_prefix, $warnings );
			}
			$last = $rewritten_count - 1;
			if ( $last >= 0 ) {
				$rewritten[ $last ] = $this->rewrite_image_expression( $rewritten[ $last ], $image_prefix, $warnings );
			}
			return $rewritten;
		}
		if ( 'match' === $op ) {
			for ( $i = 3; $i < $rewritten_count - 1; $i += 2 ) {
				$rewritten[ $i ] = $this->rewrite_image_expression( $rewritten[ $i ], $image_prefix, $warnings );
			}
			$last = $rewritten_count - 1;
			if ( $last >= 0 ) {
				$rewritten[ $last ] = $this->rewrite_image_expression( $rewritten[ $last ], $image_prefix, $warnings );
			}
			return $rewritten;
		}
		if ( 'coalesce' === $op ) {
			for ( $i = 1; $i < $rewritten_count; ++$i ) {
				$rewritten[ $i ] = $this->rewrite_image_expression( $rewritten[ $i ], $image_prefix, $warnings );
			}
			return $rewritten;
		}
		if ( 'image' === $op && isset( $rewritten[1] ) ) {
			$rewritten[1] = $this->rewrite_image_expression( $rewritten[1], $image_prefix, $warnings );
			return $rewritten;
		}
		if ( in_array( $op, array( 'get', 'var', 'to-string', 'concat', 'upcase', 'downcase' ), true ) ) {
			$string_value = 'to-string' === $op ? $value : array( 'to-string', $value );
			return array( 'case', array( '==', $string_value, '' ), '', array( 'concat', $image_prefix, $string_value ) );
		}

		$warnings[] = sprintf( 'Wrapped unsupported image expression: %s.', $op ? $op : 'unknown' );
		return array( 'case', array( '==', array( 'to-string', $value ), '' ), '', array( 'concat', $image_prefix, array( 'to-string', $value ) ) );
	}

	/**
	 * Replace Mapbox renderer-specific expressions unsupported by MapLibre.
	 *
	 * These expressions are used by recent Mapbox styles mostly to cull labels
	 * when the map is pitched. JEO maps are rendered flat by default, so replacing
	 * them with the flat-map value keeps the style valid without changing the
	 * normal view.
	 *
	 * @param mixed $value Style fragment.
	 * @param array $replacements Operators replaced, passed by reference.
	 * @return mixed
	 */
	private function normalize_unsupported_expressions( $value, array &$replacements ) {
		if ( ! is_array( $value ) ) {
			return $value;
		}

		$operator = isset( $value[0] ) && is_string( $value[0] ) ? $value[0] : null;
		if ( 1 === count( $value ) && in_array( $operator, array( 'pitch', 'distance-from-center' ), true ) ) {
			$replacements[ $operator ] = true;
			return 0;
		}

		foreach ( $value as $key => $item ) {
			$value[ $key ] = $this->normalize_unsupported_expressions( $item, $replacements );
		}

		return $value;
	}

	/**
	 * Normalize a Mapbox style ID.
	 *
	 * @param string $value Raw style ID.
	 * @return string|null
	 */
	private function normalize_style_id( $value ) {
		$value = trim( (string) $value );
		if ( '' === $value ) {
			return null;
		}
		$value = preg_replace( '#^mapbox://styles/#', '', $value );
		$value = preg_replace( '#^https://api\.mapbox\.com/styles/v1/#', '', $value );
		$value = strtok( $value, '?' );
		$value = trim( $value, '/' );
		return '' === $value ? null : $value;
	}

	/**
	 * Normalize a Mapbox tileset URL.
	 *
	 * @param string $tileset_id Tileset ID.
	 * @return string|null
	 */
	private function normalize_tileset_url( $tileset_id ) {
		$tileset_id = trim( (string) $tileset_id );
		if ( '' === $tileset_id ) {
			return null;
		}
		return str_starts_with( $tileset_id, 'mapbox://' ) ? $tileset_id : 'mapbox://' . $tileset_id;
	}

	/**
	 * Prepare a style source for composed output.
	 *
	 * Sources keep their original Mapbox/source URLs. The composer only applies
	 * token placeholders and minimal source normalization needed by the renderer.
	 *
	 * @param array $source Source definition.
	 * @return array
	 */
	private function prepare_source_for_composed_style( $source ) {
		$source = $this->normalize_array( $source );
		$type   = $source['type'] ?? null;

		if ( 'raster' === $type && ! empty( $source['tiles'] ) && is_array( $source['tiles'] ) && empty( $source['tileSize'] ) ) {
			$source['tileSize'] = 256;
		}

		if ( 'vector' === $type && isset( $source['tileSize'] ) && 512 !== absint( $source['tileSize'] ) ) {
			$source['tileSize'] = 512;
		}

		return $this->sanitize_tokens_in_value( $source );
	}

	/**
	 * Make a layer prefix.
	 *
	 * @param array $context Composer context.
	 * @param array $ref Layer ref.
	 * @return string
	 */
	private function make_prefix( array $context, array $ref ) {
		return sprintf( 'j%s_l%d_%d_', $this->slug_id( $context['id'] ), $ref['layerId'], $ref['index'] );
	}

	/**
	 * Convert arbitrary IDs to style-safe IDs.
	 *
	 * @param string $value Raw ID.
	 * @param string $fallback Fallback.
	 * @return string
	 */
	private function slug_id( $value, $fallback = 'id' ) {
		$value = preg_replace( '/[^A-Za-z0-9_.-]+/', '_', (string) $value );
		$value = trim( preg_replace( '/_+/', '_', $value ), '_' );
		return '' === $value ? $fallback : $value;
	}

	/**
	 * Return the first sprite URL in a style.
	 *
	 * @param array $style Style JSON.
	 * @return string|null
	 */
	private function first_sprite( array $style ) {
		if ( isset( $style['sprite'] ) && is_string( $style['sprite'] ) ) {
			return $style['sprite'];
		}
		if ( isset( $style['sprite'][0] ) && is_string( $style['sprite'][0] ) ) {
			return $style['sprite'][0];
		}
		return null;
	}

	/**
	 * Build a sprite asset URL.
	 *
	 * @param string $sprite Sprite root.
	 * @param string $token Access token.
	 * @param string $suffix Pixel ratio suffix.
	 * @param string $extension Extension.
	 * @return string
	 */
	private function sprite_asset_url( $sprite, $token, $suffix, $extension ) {
		if ( str_starts_with( $sprite, 'mapbox://sprites/' ) ) {
			$path = trim( substr( $sprite, strlen( 'mapbox://sprites/' ) ), '/' );
			$root = sprintf( 'https://api.mapbox.com/styles/v1/%s/sprite', $path );
		} else {
			$root = preg_replace( '/(@2x)?\.(json|png)(\?.*)?$/', '', $sprite );
		}

		return add_query_arg( 'access_token', $token, sprintf( '%s%s.%s', $root, $suffix, $extension ) );
	}

	/**
	 * Replace raw access tokens with a runtime placeholder.
	 *
	 * @param mixed $value Value.
	 * @return mixed
	 */
	private function sanitize_tokens_in_value( $value ) {
		if ( is_string( $value ) ) {
			return preg_replace( '/([?&]access_token=)[^&"\']+/', '$1' . self::TOKEN_PLACEHOLDER, $value );
		}
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = $this->sanitize_tokens_in_value( $item );
			}
		}
		return $value;
	}

	/**
	 * Preserve Mapbox Style object containers that can be empty.
	 *
	 * @param array $style Style JSON.
	 * @return array
	 */
	private function prepare_style_for_json( array $style ) {
		if ( isset( $style['sources'] ) && is_array( $style['sources'] ) ) {
			foreach ( $style['sources'] as $source_id => $source ) {
				if ( is_array( $source ) && empty( $source ) ) {
					$style['sources'][ $source_id ] = new \stdClass();
				}
			}
		}

		if ( isset( $style['layers'] ) && is_array( $style['layers'] ) ) {
			foreach ( $style['layers'] as $index => $layer ) {
				if ( ! is_array( $layer ) ) {
					continue;
				}

				foreach ( array( 'layout', 'paint', 'metadata' ) as $property ) {
					if ( isset( $layer[ $property ] ) && is_array( $layer[ $property ] ) && empty( $layer[ $property ] ) ) {
						$style['layers'][ $index ][ $property ] = new \stdClass();
					}
				}
			}
		}

		foreach ( array( 'metadata', 'projection', 'light', 'terrain', 'fog' ) as $property ) {
			if ( isset( $style[ $property ] ) && is_array( $style[ $property ] ) && empty( $style[ $property ] ) ) {
				$style[ $property ] = new \stdClass();
			}
		}

		return $style;
	}

	/**
	 * Fetch remote JSON.
	 *
	 * @param string $url URL.
	 * @return mixed|WP_Error
	 */
	private function remote_json( $url ) {
		$bytes = $this->remote_bytes( $url );
		if ( is_wp_error( $bytes ) ) {
			return $bytes;
		}
		$data = json_decode( $bytes, true );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error( 'jeo_mapbox_composer_json', json_last_error_msg() );
		}
		return $data;
	}

	/**
	 * Fetch remote bytes.
	 *
	 * @param string $url URL.
	 * @return string|WP_Error
	 */
	private function remote_bytes( $url ) {
		$response = wp_remote_get(
			$url,
			array(
				'timeout'    => 45,
				'user-agent' => 'jeo-mapbox-style-composer/' . self::CACHE_VERSION,
			)
		);
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$code = wp_remote_retrieve_response_code( $response );
		if ( $code < 200 || $code >= 300 ) {
			return new WP_Error(
				'jeo_mapbox_composer_http',
				sprintf( 'Remote request failed with HTTP %1$d for %2$s.', $code, $this->sanitize_tokens_in_value( esc_url_raw( $url ) ) )
			);
		}
		return wp_remote_retrieve_body( $response );
	}

		/**
		 * Read a JSON file.
		 *
		 * @param string $path Path.
		 * @param bool   $associative Whether to return associative arrays.
		 * @return mixed|WP_Error
		 */
	private function read_json_file( $path, $associative = true ) {
		if ( ! file_exists( $path ) ) {
			return new WP_Error( 'jeo_mapbox_composer_missing_file', __( 'Composed style artifact was not found.', 'jeowp' ) );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reads plugin-generated cache files.
		$data = json_decode( file_get_contents( $path ), $associative );
		if ( JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error( 'jeo_mapbox_composer_json_file', json_last_error_msg() );
		}
		return $data;
	}

	/**
	 * Write a JSON file.
	 *
	 * @param string $path Path.
	 * @param mixed  $data Data.
	 * @return void
	 */
	private function write_json_file( $path, $data ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Writes plugin-generated cache files.
		file_put_contents(
			$path,
			wp_json_encode( $data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
		);
	}

	/**
	 * Normalize a virtual cache scope.
	 *
	 * @param string $scope Scope.
	 * @return string
	 */
	private function normalize_virtual_scope( $scope ) {
		$scope = sanitize_key( $scope );
		return self::VIRTUAL_SCOPE_ONETIME === $scope ? self::VIRTUAL_SCOPE_ONETIME : self::VIRTUAL_SCOPE_PREVIEW;
	}

	/**
	 * Remove old virtual cache directories opportunistically.
	 *
	 * @param string $scope Virtual cache scope.
	 * @return void
	 */
	private function maybe_cleanup_virtual_cache( $scope ) {
		$scope      = $this->normalize_virtual_scope( $scope );
		$lock_key   = 'jeo_mapbox_composed_' . $scope . '_cleanup_lock';
		$lock_value = get_transient( $lock_key );
		if ( $lock_value ) {
			return;
		}

		set_transient( $lock_key, 1, HOUR_IN_SECONDS );

		$upload_dir = wp_upload_dir( null, false );
		if ( ! empty( $upload_dir['error'] ) ) {
			return;
		}

		$root = trailingslashit( $upload_dir['basedir'] ) . self::CACHE_DIR . '/' . $scope;
		if ( ! is_dir( $root ) ) {
			return;
		}

		$ttl         = (int) apply_filters(
			'jeo_mapbox_composed_virtual_cache_ttl',
			self::VIRTUAL_SCOPE_ONETIME === $scope ? 30 * DAY_IN_SECONDS : DAY_IN_SECONDS,
			$scope
		);
		$now         = time();
		$deleted     = 0;
		$directories = glob( trailingslashit( $root ) . '*' );

		if ( ! is_array( $directories ) ) {
			return;
		}

		foreach ( $directories as $dir ) {
			if ( $deleted >= 50 || ! is_dir( $dir ) ) {
				continue;
			}
			if ( $now - filemtime( $dir ) < $ttl ) {
				continue;
			}
			$this->delete_directory( $dir );
			++$deleted;
		}
	}

	/**
	 * Delete a generated cache directory recursively.
	 *
	 * @param string $dir Directory.
	 * @return void
	 */
	private function delete_directory( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		foreach ( glob( trailingslashit( $dir ) . '*' ) as $path ) {
			if ( is_dir( $path ) ) {
				$this->delete_directory( $path );
			} else {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink -- Removes plugin-generated cache files.
				unlink( $path );
			}
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- Removes plugin-generated cache directories.
		rmdir( $dir );
	}

	/**
	 * Normalize objects into arrays recursively.
	 *
	 * @param mixed $value Value.
	 * @return mixed
	 */
	private function normalize_array( $value ) {
		if ( is_object( $value ) ) {
			$value = get_object_vars( $value );
		}
		if ( is_array( $value ) ) {
			foreach ( $value as $key => $item ) {
				$value[ $key ] = $this->normalize_array( $item );
			}
		}
		return $value;
	}

	/**
	 * Convert values to booleans.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function to_bool( $value ) {
		return true === $value || 1 === $value || '1' === $value || 'true' === $value;
	}

	/**
	 * Return whether a value represents false.
	 *
	 * @param mixed $value Value.
	 * @return bool
	 */
	private function is_false( $value ) {
		return false === $value || 0 === $value || '0' === $value || 'false' === $value || '' === $value;
	}
}
