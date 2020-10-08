<?php
/**
 * Template Name: Story Map
 */
 
the_post();

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<?php wp_head(); ?>
</head>
<body>
	<div class="storymap-block">
		<?php the_content() ?>
	</div>

	<?php wp_footer(); ?>
</body>
</html>
