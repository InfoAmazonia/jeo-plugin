<?php
/**
 * Single map template.
 *
 * @package Jeo
 */

$is_embed = null !== filter_input( INPUT_GET, 'embed', FILTER_DEFAULT );

$full_width = filter_input( INPUT_GET, 'width', FILTER_VALIDATE_INT );
$height     = filter_input( INPUT_GET, 'height', FILTER_VALIDATE_INT );

$full_width      = $full_width ? $full_width : 820;
$map_width       = $full_width ? $full_width - 220 : 600;
$height          = $height ? $height : 600;
$map_style       = "width: {$map_width}px; height: {$height}px;";
$container_style = "width: {$full_width}px; height: {$height}px;";
?>

<?php if ( $is_embed ) : ?>
<!DOCTYPE html>
<html style="margin: 0 !important">
	<head>
		<?php wp_head(); ?>
	</head>
	<body style="margin: 0 !important">
		<div id="embed-container" style="<?php echo esc_attr( $container_style ); ?>">
			<div class="jeomap map_id_<?php echo esc_attr( $post->ID ); ?>" data-options='{"marker_action": "embed_preview"}' style="<?php echo esc_attr( $map_style ); ?>"></div>
		</div>
	</body>
</html>

<?php else : ?>
	<?php get_header(); ?>
	<main id="site-content" role="main">
		<?php get_the_title(); ?>
		<div class="jeomap map_id_<?php echo esc_attr( $post->ID ); ?>"></div>
	</main>
	<?php get_footer(); ?>
<?php endif; ?>
