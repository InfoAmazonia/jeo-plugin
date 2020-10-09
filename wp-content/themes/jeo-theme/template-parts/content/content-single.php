<?php
/**
 * Template part for displaying posts
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Newspack
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<div class="entry-content">
		<?php if(has_excerpt() && !('large' == newspack_featured_image_position() || 'small' == newspack_featured_image_position())): ?>
			<h1 class="post-excerpt">
				<?php the_excerpt(); ?>
			</h1>
		<?php endif ?>
		<?php
		the_content(
			sprintf(
				wp_kses(
					/* translators: %s: Name of current post. Only visible to screen readers */
					__( 'Continue reading<span class="screen-reader-text"> "%s"</span>', 'newspack' ),
					array(
						'span' => array(
							'class' => array(),
						),
					)
				),
				get_the_title()
			)
		);

		if(get_post_meta(get_the_ID(), 'enable-post-erratum', true) ) { ?>
			<div class="sorry-said-wrong" id="erratum">
				<div class="wrong-title">
					<?= __('Sorry, We said wrong', 'jeo') ?>
				</div>
				<p class="wrong-content">
					<?= get_post_meta(get_the_ID(), 'post-erratum', true) ?>
				</p>
			</div>
		<?php }

		wp_link_pages(
			array(
				'before' => '<div class="page-links">' . __( 'Pages:', 'newspack' ),
				'after'  => '</div>',
			)
		);
		
		if ( is_active_sidebar( 'article-2' ) && is_single() ) {
			dynamic_sidebar( 'article-2' );
		}
		?>
	</div><!-- .entry-content -->

	<?php if (get_post_meta(get_the_ID(), 'project-link', true) && !empty(get_post_meta(get_the_ID(), 'project-link', true))) : ?>
		<a class="project-link" href="<?= get_post_meta(get_the_ID(), 'project-link', true) ?>">
			<?= __('Access project page') ?>
		</a>
	<?php endif; ?>

	<footer class="entry-footer">
		<?php newspack_entry_footer(); ?>
	</footer><!-- .entry-footer -->

	<?php if ( ! is_singular( 'attachment' )  && get_post_meta(get_the_ID(), 'author-bio-display', true)) : ?>
		<?php get_template_part( 'template-parts/post/author', 'bio' ); ?>
	<?php endif; ?>

</article><!-- #post-${ID} -->
