<?php
/**
 * Discovery embed template.
 *
 * @package Jeo
 */

$site_name = get_bloginfo( 'name' );
?>
<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title><?php echo esc_html( $site_name ); ?> - <?php esc_html_e( 'Explore', 'jeo' ); ?></title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important; padding: 0!important">
	<div class="discovery-embed">
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

	<?php wp_footer(); ?>
</body>


</html>
