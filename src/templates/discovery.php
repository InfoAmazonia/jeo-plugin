<?php
get_header(); ?>
<main>
	<div id="discovery">
	</div>

	<div class="discovery-mobile-warning">
		<h1>
			<?= __("Sorry!", "jeo")?>
		</h1>
		<h4>
			<?= __("This page can't be viewed on mobiles.", "jeo")?>
		</h4>

		<a href="/">
			<?= __("Back to homepage", "jeo") ?>
		</a>
	</div>
</main>

<?php
get_footer();
