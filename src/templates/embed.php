<html style="margin: 0px !important;">

	<head>
		<title></title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important;">

<div id="embed-container" style="<?php echo esc_html( $container_style ); ?>">
	<div class="jeomap map_id_<?php echo esc_html( $map_id ); ?>" data-embed="true" data-options='{"marker_action": "embed_preview"}' style="<?php echo esc_html( $map_style ); ?>"></div>

	<?php if($have_related_posts): ?>
		<div id="embed-post-preview" style="<?php echo esc_html( $popup_style ); ?>"></div>
	<?php endif; ?>

	<div class="embed-footer">
		<?php echo the_custom_logo() ?>
	</div>

	<?php wp_footer(); ?>

</div>

</body>
<?php wp_footer(); ?>

</html>
