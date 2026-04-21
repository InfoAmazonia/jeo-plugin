<?php
/**
 * Map embed template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$disable_embed = get_post_meta( $map_id, 'disable_embed', true ) === '1';

if ( $disable_embed ) {
	wp_safe_redirect( home_url() );
	exit();
}
?>
<!DOCTYPE html>
<html style="margin: 0px !important;">

	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title><?php echo esc_html( get_the_title( $map_id ) ); ?> </title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important; padding: 0!important">

<div id="embed-container" style="<?php echo esc_attr( $container_style ); ?>">
	<div class="jeomap map_id_<?php echo esc_attr( absint( $map_id ) ); ?>" data-embed="true" data-options='{"marker_action": "embed_preview"}' style="<?php echo esc_attr( $map_style ); ?>"></div>

	<?php if ( $have_related_posts ) : ?>
		<div id="embed-post-preview" style="<?php echo esc_attr( $popup_style ); ?>"></div>
	<?php endif; ?>

	<?php
		$img = \jeo_normalize_asset_url( \jeo_settings()->get_option( 'jeo_footer-logo' ) );
	if ( ! empty( $img ) ) :
		?>
			<div class="embed-footer">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>">
					<img src="<?php echo esc_url( $img ); ?>" alt="" loading="lazy" decoding="async" style="max-width: min(240px, 100%); max-height: 30px; width: auto; height: auto; object-fit: contain;">
				</a>
			</div>
	<?php endif; ?>


</div>
<?php wp_footer(); ?>
</body>
</html>
