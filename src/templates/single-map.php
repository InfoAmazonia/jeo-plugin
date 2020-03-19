<?php
	$is_embed = isset($_GET['embed']);

	$full_width = isset( $_GET['width'] ) ? $_GET['width'] : 820;
	$map_width = $full_width ? $full_width - 220 : 600;
	$height = isset( $_GET['height'] ) ? $_GET['height'] : 600;

	$map_style = "width: ${map_width}px; height: ${height}px;";
	$container_style = "width: ${full_width}px; height: ${height}px;";
?>

<?php if ($is_embed): ?>
<!DOCTYPE html>
<html style="margin: 0 !important">
	<head>
		<?php wp_head(); ?>
	</head>
	<body style="margin: 0 !important">
		<div id="embed-container" style="<?= $container_style ?>">
			<div class="jeomap" data-map_id="<?= $post->ID ?>" data-options='{"marker_action": "embed_preview"}' style="<?= $map_style ?>"></div>
		</div>
	</body>
</html>

<?php else: ?>
	<?php get_header(); ?>
	<main id="site-content" role="main">
		<?php get_the_title() ?>
		<div class="jeomap" data-map_id="<?= $post->ID ?>"></div>
	</main>
	<?php get_footer(); ?>
<?php endif; ?>
