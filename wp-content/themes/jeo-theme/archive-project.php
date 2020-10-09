<?php
/**
 * The template for displaying archive pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Newspack
 */

get_header();
?>
	<section id="primary" class="content-area custom-archive">
		<header class="page-header">
				<h1 class="page-title article-section-title category-header">
					<span class="page-description"><?= __('Special Projects');  ?></span>
				</h1>

				<div class="taxonomy-description">
					<?= get_theme_mod('description_project_archive', '') ?>
				</div>

		</header><!-- .page-header -->


		<?php do_action( 'before_archive_posts' ); ?>

		<main id="main" class="site-main">

		<?php
		if ( have_posts() ) :
			$post_count = 0;
			?>
			<div class="content-wrapper">
			<?php
			// Start the Loop.
			while ( have_posts() ) :
				the_post(); ?>
				
				<article class="project-card">
					<a href="<?php the_permalink() ?>" class="project-card--wrapper">
						<?php the_post_thumbnail() ?>
						<div class="project-card--meta">
							<div class="categories">
							<?php global $post; ?>
							<?php 
								$primary_category = get_post_meta($post->ID, '_yoast_wpseo_primary_category', true );

								if(!empty($primary_category)):
									echo get_term($primary_category)->name;
								else:
									$term_list = wp_get_post_terms($post->ID, 'category', ['fields' => 'all']);
									foreach($term_list as $term) {										
										echo $term->name;
										break;
									}

								endif;
							
							?>
							</div>
							

							<h3 class="title">
								<?php the_title() ?>
							</h3>
						</div>
					</a>
				</article>

				<?php 
				// End the loop.
			endwhile; ?>

			</div>
			
			<?php 
			// Previous/next page navigation.
			echo (get_theme_mod('pagination_style', 'rectangle') == 'circle'? '<div class="circle">' : '<div class="rectangle">');
			newspack_the_posts_navigation();
			echo '</div>';

			// If no content, include the "No posts found" template.
		else :
			get_template_part( 'template-parts/content/content', 'none' );

		endif;
		?>
		</main><!-- #main -->
		
	</section><!-- #primary -->
<?php
get_footer();
