<?php
/**
 * The template for displaying search results pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#search-result
 *
 * @package Newspack
 */

get_header();
?>

	<section id="primary" class="content-area row no-gutters">
		<div class="col-md-10 margin-auto">
			<header class="page-header">
				<h1 class="page-title article-section-title">
					<?php esc_html_e( 'Search results', 'newspack' ); ?>
				</h1>
				<?php get_search_form(array(
					'aria_label' => 'search-page-form'
				)); ?>
			</header><!-- .page-header -->

			<main id="main" class="site-main">

			<?php if ( have_posts() ) : ?>

				<?php
				// Start the Loop.
				while ( have_posts() ) :
					the_post();

					/*
					* Include the Post-Format-specific template for the content.
					* If you want to override this in a child theme, then include a file
					* called content-___.php (where ___ is the Post Format name) and that will be used instead.
					*/
					get_template_part( 'template-parts/content/content', 'excerpt' );

					// End the loop.
				endwhile;

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
		</div>
	</section><!-- #primary -->

<?php
get_footer();
