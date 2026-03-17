<?php
/**
 * Single storymap template.
 *
 * @package Jeo
 */

get_header();
the_post();
?>

<div class="content">
	<?php the_content(); ?>
</div>

<?php get_footer(); ?>
