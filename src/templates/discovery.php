<?php
/**
 * Discovery page template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

jeo_template_header(); ?>
<main>
	<div id="discovery">
	</div>

	<div class="discovery-mobile-warning">
		<h1>
			<?php esc_html_e( 'Sorry!', 'jeowp' ); ?>
		</h1>
		<h4>
			<?php esc_html_e( "This page can't be viewed on mobile devices.", 'jeowp' ); ?>
		</h4>

		<a href="/">
			<?php esc_html_e( 'Back to homepage', 'jeowp' ); ?>
		</a>
	</div>
</main>

<?php
jeo_template_footer();
