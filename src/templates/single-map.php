<?php
/**
 * Single map template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$is_embed = null !== filter_input( INPUT_GET, 'embed', FILTER_DEFAULT );

$full_width = filter_input( INPUT_GET, 'width', FILTER_VALIDATE_INT );
$height     = filter_input( INPUT_GET, 'height', FILTER_VALIDATE_INT );

$full_width      = $full_width ? $full_width : 820;
$map_width       = $full_width ? $full_width - 220 : 600;
$height          = $height ? $height : 600;
$map_style       = "width: {$map_width}px; height: {$height}px;";
$container_style = "width: {$full_width}px; height: {$height}px;";
$preview_map     = null;

if ( isset( $post->ID ) && jeo()->is_preview_request_for_post( $post->ID ) && current_user_can( 'edit_post', $post->ID ) ) {
	$preview_map = jeo_maps()->get_preview_map_payload( $post->ID );
}
?>

<?php if ( $is_embed ) : ?>
<!DOCTYPE html>
<html style="margin: 0 !important">
	<head>
		<?php wp_head(); ?>
	</head>
	<body style="margin: 0 !important">
		<div id="embed-container" style="<?php echo esc_attr( $container_style ); ?>">
			<div
				class="jeomap map_id_<?php echo esc_attr( $post->ID ); ?>"
				data-options='{"marker_action": "embed_preview"}'
				<?php if ( $preview_map ) : ?>
					data-preview-map="<?php echo esc_attr( wp_json_encode( $preview_map ) ); ?>"
				<?php endif; ?>
				style="<?php echo esc_attr( $map_style ); ?>"
			></div>
		</div>
	</body>
</html>

<?php else : ?>
	<?php get_header(); ?>
	<main id="site-content" role="main">
		<?php get_the_title(); ?>
		<div
			class="jeomap map_id_<?php echo esc_attr( $post->ID ); ?>"
			<?php if ( $preview_map ) : ?>
				data-preview-map="<?php echo esc_attr( wp_json_encode( $preview_map ) ); ?>"
			<?php endif; ?>
		></div>
	</main>
	<?php get_footer(); ?>
<?php endif; ?>
