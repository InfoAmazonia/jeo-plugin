<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 * E.g., it puts together the home page when no home.php file exists.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package Newspack
 */

get_header();
?>

	<section id="primary" class="content-area custom-archive">
			<header class="page-header">
				<span>
					<?php single_post_title( '<h1 class="page-title article-section-title category-header page-description">', '</h1>' ); ?>
				</span>

			</header><!-- .page-header -->
		<main id="main" class="site-main">
		<?php
		if ( have_posts() ) {

			// Load posts loop.
			while ( have_posts() ) {
				the_post();
				get_template_part( 'template-parts/content/content', 'excerpt' );
			}

			// Previous/next page navigation.
            echo (get_theme_mod('pagination_style', 'rectangle') == 'circle'? '<div class="circle">' : '<div class="rectangle">');
            newspack_the_posts_navigation();
            echo '</div>';

		} else {

			// If no content, include the "No posts found" template.
			get_template_part( 'template-parts/content/content', 'none' );

		}
		?>
		</main><!-- .site-main -->

		<!-- old: get_sidebar() -->
        <aside class="category-page-sidebar">
    		<div class="content">
				<?php dynamic_sidebar('category_page_sidebar') ?>
			</div>
		</aside>
	</section><!-- .content-area -->

<?php
get_footer();
