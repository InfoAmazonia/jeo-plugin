<section id="primary" class="content-area audio category-audio <?php esc_attr(newspack_get_category_tag_classes(get_the_ID())) . ' ' . newspack_featured_image_position(); ?>">
    <main id=" main" class="site-main">
        <header>
            <div class="entry-header">
                <?php get_template_part('template-parts/header/entry', 'header'); ?>
            </div>
        </header>

        <div class="main-content">
            <div class="entry-subhead">
                <?php
                // Display Jetpack Share icons, if enabled
                if (function_exists('sharing_display')) {
                    sharing_display('', true);
                }
                ?>
            </div>

            <?php
            if (is_active_sidebar('article-1')) {
                dynamic_sidebar('article-1');
            }

            get_template_part('template-parts/content/content', 'single');
            ?>



        </div><!-- .main-content -->



    </main><!-- #main -->

    
	
    <div class="after-post-content-widget-area">
			<?php if ( is_single() ):
				dynamic_sidebar('after_post_widget_area'); 
			endif;
			?>
		</div>

    <div class="main-content">
        <?php
        // If comments are open or we have at least one comment, load up the comment template.
        if (comments_open() || get_comments_number()) {
            newspack_comments_template();
        }

        ?>
	</div>
	<?php 
        if(!is_page()) {
            get_template_part('template-parts/content/content', 'republish-post'); 
            get_template_part('template-parts/content/content', 'related-posts'); 
        }
    ?>
</section><!-- #primary -->