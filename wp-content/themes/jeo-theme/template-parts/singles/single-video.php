<section id="primary" class="content-area video category-video <?php esc_attr(newspack_get_category_tag_classes(get_the_ID())) . ' ' . newspack_featured_image_position(); ?>">
    <main id=" main" class="site-main">
        <header>
            <div class="entry-header">
                <?php set_query_var('hide_post_meta', true); ?>
                <?php set_query_var('model', 'video'); ?>
                <?php get_template_part('template-parts/header/entry', 'header'); ?>
            </div>
        </header>

        <div class="content">
            <div class="main-content">
                <?php
                $subtitle = get_post_meta($post->ID, 'newspack_post_subtitle', true);
                ?>
                <div class="wrapper-entry-title">
                    <h1 class="entry-title <?php echo $subtitle ? 'entry-title--with-subtitle' : ''; ?>">
                        <?php echo wp_kses_post(get_the_title()); ?>
                    </h1>
                </div>
                <?php if ($subtitle) : ?>
                    <div class="newspack-post-subtitle">
                        <?php echo esc_html($subtitle); ?>
                    </div>
                <?php endif; ?>

                <?php if (!is_page() && 'behind' !== newspack_featured_image_position() && !get_query_var('hide_post_meta')) : ?>
                    <div class="entry-subhead">
                        <div class="entry-meta">
                            <?php if (get_post_meta(get_the_ID(), 'author-bio-display', true)) : ?>
                                <?php newspack_posted_by(); ?>
                            <?php endif; ?>
                            <?php newspack_posted_on(); ?>
                        </div><!-- .meta-info -->
                        <?php
                        // Display Jetpack Share icons, if enabled
                        if (function_exists('sharing_display')) {
                            sharing_display('', true);
                        }
                        ?>
                    </div>
                <?php endif; ?>

                <div class="entry-subhead">
                    <div class="entry-meta">
                        <?php if (get_post_meta(get_the_ID(), 'author-bio-display', true)) : ?>
                            <?php newspack_posted_by(); ?>
                        <?php endif; ?>
                        <div></div>
                        <?php newspack_posted_on(); ?>
                    </div><!-- .meta-info -->
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
        </div>


    </main><!-- #main -->

    <div class="content">
        
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
    </div>
</section><!-- #primary -->