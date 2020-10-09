<?php
?>

<!DOCTYPE html>
<html>
	<?php
		get_header(); 
		the_post();
	?>

	<body style="margin: 0 !important">
		<?php the_content(); ?>
	</body>

	<?php wp_footer(); ?>
</html>

