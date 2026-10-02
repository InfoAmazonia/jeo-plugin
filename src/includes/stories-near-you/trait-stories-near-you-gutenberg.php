<?php
/**
 * Gutenberg rendering path for Stories Near You block.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders posts using WordPress core's latest-posts block via render_block().
 */
trait Stories_Near_You_Gutenberg {

	/**
	 * Map SNU attributes to core/latest-posts block attributes.
	 *
	 * @param array $atts Sanitized SNU block attributes.
	 * @return array core/latest-posts compatible attributes.
	 */
	protected function map_gutenberg_attrs( $atts ) {
		return array(
			'postsToShow'             => (int) $atts['postsPerPage'],
			'columns'                 => (int) $atts['postsPerRow'],
			'postLayout'              => $atts['postLayout'],
			'displayFeaturedImage'    => $atts['showThumbnail'],
			'displayAuthor'           => $atts['showAuthor'],
			'displayPostDate'         => $atts['showDate'],
			'displayPostContent'      => $atts['showExcerpt'],
			'displayPostContentRadio' => 'excerpt',
			'excerptLength'           => (int) $atts['excerptLength'],
			'featuredImageSizeSlug'   => $atts['imageSize'] ? $atts['imageSize'] : 'medium_large',
			'addLinkToFeaturedImage'  => $atts['imageAsLink'],
			'order'                   => 'desc',
			'orderBy'                 => 'date',
		);
	}

	/**
	 * Render posts using WordPress core's latest-posts block.
	 *
	 * Uses a self-removing pre_get_posts filter to inject geolocated post IDs
	 * into the core block's WP_Query, then delegates all HTML rendering to
	 * render_block( 'core/latest-posts' ).
	 *
	 * @param int[] $post_ids Ordered post IDs from get_nearby_posts().
	 * @param array $atts     Sanitized block attributes.
	 * @return string Rendered HTML from core/latest-posts.
	 */
	protected function render_posts_gutenberg( $post_ids, $atts ) {
		$mapped   = $this->map_gutenberg_attrs( $atts );
		$captured = false;

		$filter = function ( $query ) use ( $post_ids, &$captured ) {
			if ( $captured || $query->get( 'jeo_snu_captured' ) ) {
				return;
			}
			$captured = true;
			$query->set( 'post__in', $post_ids );
			$query->set( 'orderby', 'post__in' );
			$query->set( 'posts_per_page', count( $post_ids ) );
			$query->set( 'no_found_rows', true );
			$query->set( 'jeo_snu_captured', true );
		};

		add_action( 'pre_get_posts', $filter );

		$html = render_block(
			array(
				'blockName'    => 'core/latest-posts',
				'attrs'        => $mapped,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);

		remove_action( 'pre_get_posts', $filter );

		return $html;
	}
}
