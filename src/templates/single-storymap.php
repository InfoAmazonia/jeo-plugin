<?php
/**
 * Single storymap template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
the_post();
?>

<div class="content">
	<?php the_content(); ?>
</div>

<?php get_footer(); ?>
