<html>
	<head>
		<title><?php bloginfo( 'name' ); ?> - Discovery</title>
		<?php wp_head(); ?>
	</head>

<body>
	<div class="discovery-embed">
	</div>


	<?php
		$img = \jeo_settings()->get_option( 'jeo_footer-logo' );
		if(!empty($img)): ?>
			<div class="embed-footer">
				<a href="/">
					<img src="<?= $img ?>">
				</a>
			</div>
	<?php endif; ?>

	<?php wp_footer(); ?>
</body>


</html>
