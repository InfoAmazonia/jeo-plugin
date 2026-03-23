<?php
/**
 * Storymap embed template.
 *
 * @package Jeo
 */

$disable_embed = get_post_meta( get_the_ID(), 'disable_embed', true ) === '1';
$storymap_id   = filter_input( INPUT_GET, 'storymap_id', FILTER_VALIDATE_INT );

if ( $disable_embed ) {
	wp_safe_redirect( home_url() );
	exit();
}
?>
<!DOCTYPE html>
<html style="margin: 0px !important;">

	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title><?php echo esc_html( get_the_title( $storymap_id ) ); ?> </title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important; padding: 0!important" class="single-storymap">

<div id="embed-container">
	<div id="page" class="site">
		<div class="content">
			<?php the_content(); ?>
		</div>
	</div>

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
