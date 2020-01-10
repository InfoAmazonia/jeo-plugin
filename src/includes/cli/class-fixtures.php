<?php

namespace Jeo;

/**
 * Class used while developing, allow to create a bunch of layers and maps while the admin is not ready yet
 */
class Fixtures {

	private function get_fixtures_schema() {

		/**
		 * Schema of posts to be created / upated
		 *
		 * Once a post was created and the meta schema is changed, it will be updated when you call wp jeo fixtures update
		 */
		$posts = [
			[
				'post_type' => 'map-layer',
				'post_title' => 'Layer1',
				'post_status' => 'mapbox',
				'meta' => [
					'type' => 'mapbox',
					'layer_type_options' => [
						'style_id' => 'infoamazonia/cjvwvumyx5i851coa874sx97e'
					]
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Switchable',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'tilelayer',
					'layer_type_options' => [
						'url' => 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
					]
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Swapable 1',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'tilelayer',
					'layer_type_options' => [
						'url' => 'https://wri-tiles.s3.amazonaws.com/glad_prod/tiles/{z}/{x}/{y}.png'
					]
				]
			],
			[
				'post_type' => 'map-layer',
				'post_title' => 'Swapable 2',
				'post_status' => 'publish',
				'meta' => [
					'type' => 'mapbox',
					'layer_type_options' => [
						'style_id' => 'infoamazonia/ck33yfty30o0s1dqpien3edi4'
					]
				]
			],

		];

		return $posts;

	}

	private function get_post_by_schema( $schema ) {

		return get_page_by_title($schema['post_title'], 'OBJECT', $schema['post_type']);

	}

	private function get_posts() {

		$schema = $this->get_fixtures_schema();

		$results = [];

		foreach ($schema as $item) {

			$post = $this->get_post_by_schema( $item );
			if ( $post ) {
				$results[] = array_merge( ['ID' => $post->ID ], $item );
			}

		}

		return $results;

	}


	/**
	 * List current fixtures
	 *
	 * searches for items in the schema that are present in the database
	 */
	public function list() {

		$posts = $this->get_posts();

		\WP_CLI\Utils\format_items( 'table', $posts, array( 'ID', 'post_type', 'post_title', 'meta' ) );

	}

	/**
	 * Updates fixtures in the database
	 *
	 * This command reads the fixtures_schema and updates the database, creating and/or updating posts as necessary
	 *
	 * Note: post title and post type can not be update. If they are changed, a new post will be created
	 *
	 */
	public function update() {

		$schema = $this->get_fixtures_schema();

		foreach ($schema as $item) {

			$post = $this->get_post_by_schema( $item );

			if ( $post ) {
				$post_id = $post->ID;
				$message = "Existing post found ($post_id): ";
			} else {
				$new = $item;
				unset($new['meta']);
				$post_id = wp_insert_post($new);
				$message = "New post created ($post_id): ";
			}

			\WP_CLI::success( $message );

			foreach ( $item['meta'] as $key => $value ) {
				if ( update_post_meta( $post_id, $key, $value ) ) {
					\WP_CLI::success( "$key metadata updated" );
				}
			}

		}

	}
}
