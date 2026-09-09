<?php
/**
 * NeuronAI tool: retrieve current post content and geolocation data.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Tools\PropertyType;
use NeuronAI\Tools\Tool;
use NeuronAI\Tools\ToolProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Tool that provides access to the current post's content, metadata, and
 * geolocation points for use by the post_analyzer sub-agent.
 */
class Get_Post_Content_Tool extends Tool {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct(
			name: 'get_post_content',
			description: 'Retrieve the title, content, categories, tags, and geolocation points for a WordPress post.',
		);
	}

	/**
	 * Define tool properties.
	 *
	 * @return ToolProperty[]
	 */
	protected function properties(): array {
		return array(
			new ToolProperty(
				name: 'post_id',
				type: PropertyType::INTEGER,
				description: 'The WordPress post ID.',
				required: true,
			),
		);
	}

	/**
	 * Execute the tool.
	 *
	 * @param int $post_id Post ID.
	 * @return string JSON-encoded post data.
	 */
	public function __invoke( int $post_id ): string {
		$post = get_post( $post_id );

		if ( ! $post ) {
			return wp_json_encode(
				array(
					'success' => false,
					'error'   => 'Post not found.',
				)
			);
		}

		$content = strip_shortcodes( $post->post_content );
		$content = wp_strip_all_tags( $content );
		$content = trim( $content );

		$categories = wp_list_pluck(
			get_the_category( $post_id ),
			'name'
		);

		$tags_raw = get_the_tags( $post_id );
		$tags     = wp_list_pluck(
			false !== $tags_raw ? $tags_raw : array(),
			'name'
		);

		$geolocation_points = $this->get_geolocation_points( $post_id );

		return wp_json_encode(
			array(
				'success'            => true,
				'title'              => $post->post_title,
				'content'            => mb_strimwidth( $content, 0, 5000, '...' ),
				'post_type'          => $post->post_type,
				'categories'         => $categories,
				'tags'               => $tags,
				'geolocation_points' => $geolocation_points,
			),
			JSON_UNESCAPED_UNICODE
		);
	}

	/**
	 * Extract geolocation points from post meta.
	 *
	 * @param int $post_id Post ID.
	 * @return array Array of geolocation point objects.
	 */
	private function get_geolocation_points( int $post_id ): array {
		$points = get_post_meta( $post_id, '_related_point', false );
		$result = array();

		if ( ! is_array( $points ) ) {
			return $result;
		}

		foreach ( $points as $point ) {
			if ( ! is_array( $point ) ) {
				continue;
			}

			$lat = isset( $point['_geocode_lat'] ) ? (float) $point['_geocode_lat'] : null;
			$lon = isset( $point['_geocode_lon'] ) ? (float) $point['_geocode_lon'] : null;

			if ( null === $lat || null === $lon ) {
				continue;
			}

			$result[] = array(
				'lat'       => $lat,
				'lon'       => $lon,
				'relevance' => $point['relevance'] ?? 'primary',
				'address'   => $point['_geocode_full_address'] ?? '',
			);
		}

		return $result;
	}
}
