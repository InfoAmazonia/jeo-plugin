<?php
get_header(); ?>
<main>
	<div id="discovery">
	</div>

	<div class="discovery-mobile-warning">
		<h1>
			<?php esc_html_e("Sorry!", "jeo")?>
		</h1>
		<h4>
			<?php esc_html_e("This page can't be viewed on mobiles.", "jeo")?>
		</h4>

		<a href="/">
			<?php esc_html_e("Back to homepage", "jeo") ?>
		</a>
	</div>
</main>

<?php
get_footer();
