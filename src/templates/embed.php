<html style="margin: 0px !important;">

	<head>
		<title></title>
		<?php wp_head(); ?>
	</head>

<body style="margin: 0px !important;">

<div id="embed-container" style="<?php echo esc_html( $container_style ); ?>">
	<div class="jeomap" data-map_id="<?php echo esc_html( $map_id ); ?>" data-options='{"marker_action": "embed_preview"}' style="<?php echo esc_html( $map_style ); ?>"></div>

	<div id="embed-post-preview"></div>
</div>

</body>


</html>
