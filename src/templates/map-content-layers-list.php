<h3><?php the_title(); ?></h3>
<?php the_post_thumbnail(); ?>
<?php the_content(); ?>
<?php _e('Attribution:', 'jeo'); ?> <?php echo get_post_meta( get_the_ID(), 'attribution', true ); ?>
