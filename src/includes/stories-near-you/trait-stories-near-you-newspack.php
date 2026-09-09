<?php
/**
 * Newspack rendering path for Stories Near You block.
 *
 * @package Jeo
 */

namespace Jeo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Renders posts using the Newspack Blocks article template via WP_Query Loop.
 */
trait Stories_Near_You_Newspack {

	/**
	 * Whether Newspack Blocks is active.
	 *
	 * @return bool
	 */
	protected function is_newspack_active() {
		return class_exists( 'Newspack_Blocks' ) || defined( 'NEWSPACK_BLOCKS__VERSION' );
	}

	/**
	 * Enqueue Newspack Homepage Articles styles if the helper function exists.
	 *
	 * @return void
	 */
	protected function enqueue_newspack_styles() {
		if ( class_exists( 'Newspack_Blocks' ) && method_exists( 'Newspack_Blocks', 'enqueue_view_assets' ) ) {
			\Newspack_Blocks::enqueue_view_assets( 'homepage-articles' );
		}
	}

	/**
	 * Build Newspack wrapper CSS classes from attributes.
	 *
	 * @param array $atts Sanitized block attributes.
	 * @return string Space-separated CSS classes.
	 */
	protected function build_newspack_wrapper_classes( $atts ) {
		$classes = array( 'wpnbha' );

		if ( 'grid' === $atts['postLayout'] ) {
			$classes[] = 'is-grid';
			$classes[] = 'columns-' . (int) $atts['postsPerRow'];
		}

		$classes[] = 'image-align' . $atts['mediaPosition'];

		if ( 'uncropped' !== $atts['imageShape'] ) {
			$classes[] = 'is-' . $atts['imageShape'];
		}

		if ( in_array( $atts['mediaPosition'], array( 'left', 'right' ), true ) ) {
			$classes[] = 'is-' . (int) $atts['imageScale'];
		}

		$classes[] = 'ts-' . (int) $atts['typeScale'];
		$classes[] = 'colgap-' . (int) $atts['colGap'];

		if ( $atts['showThumbnail'] ) {
			$classes[] = 'show-image';
		}
		if ( $atts['showCategory'] ) {
			$classes[] = 'show-category';
		}
		if ( $atts['showAuthor'] && $atts['showAvatar'] ) {
			$classes[] = 'show-avatar';
		}
		if ( $atts['showExcerpt'] ) {
			$classes[] = 'show-excerpt';
		}

		return implode( ' ', $classes );
	}

	/**
	 * Map SNU attributes to Newspack block attributes format.
	 *
	 * @param array $atts SNU block attributes.
	 * @return array Newspack-compatible attributes.
	 */
	protected function map_newspack_attrs( $atts ) {
		return array(
			'showImage'            => $atts['showThumbnail'],
			'mediaPosition'        => $atts['mediaPosition'],
			'imageShape'           => $atts['imageShape'],
			'showCaption'          => false,
			'showCredit'           => false,
			'showCategory'         => $atts['showCategory'],
			'showAuthor'           => $atts['showAuthor'],
			'showAvatar'           => $atts['showAvatar'],
			'showDate'             => $atts['showDate'],
			'showExcerpt'          => $atts['showExcerpt'],
			'excerptLength'        => (int) $atts['excerptLength'],
			'showFullContent'      => false,
			'showSubtitle'         => false,
			'showReadMore'         => $atts['showReadMore'],
			'readMoreLabel'        => $atts['readMoreLabel'],
			'sectionHeader'        => '',
			'typeScale'            => (int) $atts['typeScale'],
			'imageScale'           => (int) $atts['imageScale'],
			'columns'              => (int) $atts['postsPerRow'],
			'postLayout'           => $atts['postLayout'],
			'minHeight'            => (int) $atts['minHeight'],
			'colGap'               => (int) $atts['colGap'],
			'disableImageLazyLoad' => false,
			'fetchPriority'        => '',
			'textAlign'            => '',
			'textColor'            => '',
			'customTextColor'      => '',
		);
	}

	/**
	 * Render posts using the Newspack Blocks article template via WP_Query Loop.
	 *
	 * @param int[] $post_ids Ordered post IDs.
	 * @param array $atts     Block attributes.
	 * @return string
	 */
	protected function render_posts_newspack( $post_ids, $atts ) {
		$template_path = '';
		if ( defined( 'NEWSPACK_BLOCKS__PLUGIN_DIR' ) ) {
			$candidate = NEWSPACK_BLOCKS__PLUGIN_DIR . 'src/blocks/homepage-articles/templates/article.php';
			if ( file_exists( $candidate ) ) {
				$template_path = $candidate;
			}
		}

		if ( empty( $template_path ) && defined( 'WP_PLUGIN_DIR' ) ) {
			$candidate = WP_PLUGIN_DIR . '/newspack-blocks/src/blocks/homepage-articles/templates/article.php';
			if ( file_exists( $candidate ) ) {
				$template_path = $candidate;
			}
		}

		if ( empty( $template_path ) ) {
			return $this->render_posts_gutenberg( $post_ids, $atts );
		}

		$newspack_attrs = $this->map_newspack_attrs( $atts );

		$query = new \WP_Query(
			array(
				'post__in'       => $post_ids,
				'orderby'        => 'post__in',
				'posts_per_page' => count( $post_ids ),
				'post_type'      => 'any',
				'no_found_rows'  => true,
			)
		);

		global $newspack_blocks_hpb_rendering_context;
		$prev_context                                   = $newspack_blocks_hpb_rendering_context;
		$newspack_blocks_hpb_rendering_context['attrs'] = $newspack_attrs;

		ob_start();

		echo '<div data-posts>';

		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$data = array(
					'attributes' => $newspack_attrs,
				);
				include $template_path; // phpcs:ignore WordPress.Security.EscapeOutput -- Newspack template.
			}
		}

		echo '</div>';

		\wp_reset_postdata();

		$newspack_blocks_hpb_rendering_context = $prev_context;

		return ob_get_clean();
	}
}
