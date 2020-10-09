<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package Newspack
 */

get_header();
?>

	<section id="primary" class="content-area">
		<main id="main" class="site-main">
            <div class="error-404">
                <h1>
                    <?php _e( 'Error', 'newspack' ); ?>
                    <strong>404</strong>
                </h1> 
                <p>
                    <?php _e( 'Oops! That page can&rsquo;t be found.', 'newspack' ); ?>
                </p> 
                <a href="/" class="button">
                    <span><?php _e( 'Back to the home', 'newspack' ); ?></span>
                </a>
            </div>

		</main><!-- #main -->
	</section><!-- #primary -->

<?php
get_footer();
