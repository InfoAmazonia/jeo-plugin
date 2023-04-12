<?php
	$disable_embed = get_post_meta($map_id, 'disable_embed', true) == '1'? true : false;

	if($disable_embed) {
		wp_redirect(home_url());
		exit();
	}
?>
<!DOCTYPE html>
<html style="margin: 0px !important;">

	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title><?= get_the_title( $map_id ) ?> </title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important; padding: 0!important">

<div id="embed-container" style="<?php echo esc_html( $container_style ); ?>">
	<div class="jeomap map_id_<?php echo esc_html( $map_id ); ?>" data-embed="true" data-options='{"marker_action": "embed_preview"}' style="<?php echo esc_html( $map_style ); ?>"></div>

	<?php if($have_related_posts): ?>
		<div id="embed-post-preview" style="<?php echo esc_html( $popup_style ); ?>"></div>
	<?php endif; ?>

	<?php
		$img = \jeo_settings()->get_option( 'jeo_footer-logo' );
		if(!empty($img)): ?>
			<div class="embed-footer">
				<a href="/">
					<img src="<?= esc_url($img) ?>">
				</a>
			</div>
	<?php endif; ?>


</div>
<?php wp_footer(); ?>
</body>
</html>
