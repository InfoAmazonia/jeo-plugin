<?php
/**
 * Single storymap template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

jeo_template_header();
the_post();
?>

<div class="content">
	<?php the_content(); ?>
</div>

<?php jeo_template_footer(); ?>
