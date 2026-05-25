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
 * Renders posts using Gutenberg native HTML structure (core/latest-posts style).
 */
trait Stories_Near_You_Gutenberg {

	/**
	 * Build inline style string for Gutenberg path wrapper.
	 *
	 * @param array $atts Sanitized attributes.
	 * @return string Inline CSS (empty string if none needed).
	 */
	protected function build_gutenberg_inline_style( $atts ) {
		$parts = array();

		$gap     = self::COL_GAPS[ $atts['colGap'] ] ?? '32px';
		$parts[] = '--jeo-snu-gap:' . $gap;

		if ( $atts['minHeight'] > 0 && 'behind' === $atts['mediaPosition'] ) {
			$parts[] = '--jeo-snu-min-height:' . $atts['minHeight'] . 'vh';
		}

		return implode( ';', $parts );
	}

	/**
	 * Render posts using Gutenberg native HTML structure (core/latest-posts style).
	 *
	 * @param int[] $post_ids Ordered post IDs.
	 * @param array $atts     Block attributes.
	 * @return string
	 */
	protected function render_posts_gutenberg( $post_ids, $atts ) {
		$classes = array( 'wp-block-latest-posts', 'wp-block-latest-posts__list' );

		if ( 'grid' === $atts['postLayout'] ) {
			$classes[] = 'is-grid';
			$classes[] = 'columns-' . (int) $atts['postsPerRow'];
		}

		$is_horizontal = in_array( $atts['mediaPosition'], array( 'left', 'right' ), true );
		$is_featured   = 'behind' === $atts['mediaPosition'];

		if ( $is_horizontal ) {
			$classes[] = 'left' === $atts['mediaPosition'] ? 'jeo-snu-list' : 'jeo-snu-list-reverse';
			$classes[] = 'jeo-snu-is-' . (int) $atts['imageScale'];
		} elseif ( $is_featured ) {
			$classes[] = 'jeo-snu-featured';
			if ( $atts['minHeight'] > 0 ) {
				$classes[] = 'jeo-snu-min-height';
			}
		}

		if ( $atts['showDate'] ) {
			$classes[] = 'has-dates';
		}
		if ( $atts['showAuthor'] ) {
			$classes[] = 'has-author';
		}

		$ul_style = '';
		if ( 'grid' === $atts['postLayout'] ) {
			$gap       = self::COL_GAPS[ $atts['colGap'] ] ?? '32px';
			$ul_style .= 'gap:' . $gap . ';';
		}

		ob_start();
		?>
		<ul class="<?php echo esc_attr( implode( ' ', $classes ) ); ?>"<?php echo $ul_style ? ' style="' . esc_attr( $ul_style ) . '"' : ''; ?>>
			<?php
			foreach ( $post_ids as $post_id ) {
				echo $this->render_post_card_gutenberg( $post_id, $atts ); // phpcs:ignore WordPress.Security.EscapeOutput
			}
			?>
		</ul>
		<?php
		return ob_get_clean();
	}

	/**
	 * Render a single post card using Gutenberg native HTML structure.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $atts    Block attributes.
	 * @return string
	 */
	protected function render_post_card_gutenberg( $post_id, $atts ) {
		$post      = get_post( $post_id );
		$title     = get_the_title( $post_id );
		$permalink = get_permalink( $post_id );
		$excerpt   = has_excerpt( $post_id ) ? get_the_excerpt( $post_id ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), (int) $atts['excerptLength'] );

		$is_horizontal = in_array( $atts['mediaPosition'], array( 'left', 'right' ), true );
		$is_featured   = 'behind' === $atts['mediaPosition'];

		$aspect_style = '';
		if ( 'uncropped' !== $atts['imageShape'] && isset( self::ASPECT_RATIOS[ $atts['imageShape'] ] ) ) {
			$aspect_style = 'aspect-ratio:' . self::ASPECT_RATIOS[ $atts['imageShape'] ] . ';';
		}

		$li_style = '';
		if ( $is_featured && $atts['minHeight'] > 0 ) {
			$li_style = 'min-height:' . (int) $atts['minHeight'] . 'vh;';
		}

		$title_style = '';
		if ( isset( self::TYPE_SCALES[ $atts['typeScale'] ] ) ) {
			$title_style = 'font-size:' . self::TYPE_SCALES[ $atts['typeScale'] ] . ';';
		}

		ob_start();
		?>
		<li data-post-id="<?php echo (int) $post_id; ?>"<?php echo $li_style ? ' style="' . esc_attr( $li_style ) . '"' : ''; ?>>
			<?php if ( $atts['showThumbnail'] && has_post_thumbnail( $post_id ) ) : ?>
			<div class="wp-block-latest-posts__featured-image">
				<a href="<?php echo esc_url( $permalink ); ?>">
					<?php
					echo get_the_post_thumbnail(
						$post_id,
						'medium_large',
						array(
							'alt'   => esc_attr( $title ),
							'style' => $aspect_style ? esc_attr( $aspect_style ) . ' object-fit:cover;' : '',
						)
					);
					?>
				</a>
			</div>
			<?php endif; ?>

			<?php if ( $is_featured ) : ?>
			<div class="jeo-snu-featured__overlay" aria-hidden="true"></div>
			<?php endif; ?>

			<?php if ( $is_horizontal || $is_featured ) : ?>
			<div class="<?php echo $is_featured ? 'jeo-snu-featured__content' : 'jeo-snu-list__content'; ?>">
			<?php endif; ?>

				<?php if ( $atts['showCategory'] ) : ?>
					<?php $cats = get_the_category( $post_id ); ?>
					<?php if ( ! empty( $cats ) ) : ?>
					<div class="wp-block-post-terms taxonomy-category">
						<?php
						$cat_links = array();
						foreach ( $cats as $cat ) {
							$cat_links[] = '<a href="' . esc_url( get_category_link( $cat->term_id ) ) . '" rel="tag">' . esc_html( $cat->name ) . '</a>';
						}
						echo implode( ', ', $cat_links ); // phpcs:ignore WordPress.Security.EscapeOutput
						?>
					</div>
					<?php endif; ?>
				<?php endif; ?>

				<a class="wp-block-latest-posts__post-title" href="<?php echo esc_url( $permalink ); ?>"<?php echo $title_style ? ' style="' . esc_attr( $title_style ) . '"' : ''; ?>><?php echo esc_html( $title ); ?></a>

				<?php if ( $atts['showDate'] ) : ?>
				<time datetime="<?php echo esc_attr( get_the_date( 'c', $post_id ) ); ?>" class="wp-block-latest-posts__post-date"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time>
				<?php endif; ?>

				<?php if ( $atts['showAuthor'] ) : ?>
					<?php
					$author_names = array();
					if ( function_exists( 'get_coauthors' ) ) {
						$coauthors = get_coauthors( $post_id );
						foreach ( $coauthors as $coauthor ) {
							if ( ! empty( $coauthor->display_name ) ) {
								$author_names[] = $coauthor->display_name;
							}
						}
					}
					if ( empty( $author_names ) ) {
						$author_names[] = get_the_author_meta( 'display_name', $post->post_author );
					}
					?>
				<div class="wp-block-latest-posts__post-author">
					<?php if ( $atts['showAvatar'] ) : ?>
						<?php
						$author_id = $post->post_author;
						$avatar    = get_avatar( $author_id, 25, '', '', array( 'class' => 'jeo-snu-avatar' ) );
						if ( $avatar ) {
							echo $avatar; // phpcs:ignore WordPress.Security.EscapeOutput
						}
						?>
					<?php endif; ?>
					<span><?php echo esc_html__( 'by', 'jeo' ) . ' ' . esc_html( implode( ', ', $author_names ) ); ?></span>
				</div>
				<?php endif; ?>

				<?php if ( $atts['showExcerpt'] ) : ?>
				<div class="wp-block-latest-posts__post-excerpt"><?php echo esc_html( $excerpt ); ?></div>
				<?php endif; ?>

				<?php if ( $atts['showReadMore'] ) : ?>
					<?php $label = $atts['readMoreLabel'] ? $atts['readMoreLabel'] : __( 'Read more', 'jeo' ); ?>
				<a class="jeo-snu-read-more" href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $label ); ?></a>
				<?php endif; ?>

			<?php if ( $is_horizontal || $is_featured ) : ?>
			</div>
			<?php endif; ?>
		</li>
		<?php
		return ob_get_clean();
	}
}
