<?php

namespace Jeo\AI;

use NeuronAI\RAG\Document;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Custom Data Loader to convert WordPress Posts into RAG Documents.
 */
class WP_Post_Data_Loader {

	/**
	 * Extracts and converts an array of WP_Post objects into Neuron RAG Documents.
	 *
	 * @param \WP_Post[] $posts Array of WP_Post objects.
	 * @return Document[] Array of RAG Documents.
	 */
	public static function load( array $posts ): array {
		$documents = [];

		foreach ( $posts as $post ) {
			// Basic filtering to avoid empty posts or revisions being passed directly
			if ( empty( $post->post_content ) ) {
				continue;
			}

			// Clean up the content by stripping tags and shortcodes for better embedding
			$content = strip_shortcodes( $post->post_content );
			$content = wp_strip_all_tags( $content );
			
			// Optional: Combine title, excerpt, and content
			$text_to_embed = "Title: {$post->post_title}\n\nContent: {$content}";

			// Store metadata like the post ID and URL so the AI can reference it
			$metadata = [
				'post_id'   => $post->ID,
				'post_type' => $post->post_type,
				'title'     => $post->post_title,
				'url'       => get_permalink( $post->ID ),
				'date'      => $post->post_date,
			];

			$doc = new Document( $text_to_embed );
			foreach ( $metadata as $key => $value ) {
				$doc->addMetadata( $key, (string) $value );
			}
			$documents[] = $doc;
		}

		return $documents;
	}
}