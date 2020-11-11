<html>
	<head>
		<title><?php bloginfo( 'name' ); ?> - Discovery</title>
		<?php wp_head(); ?>
	</head>

<body>
	<div class="discovery-embed">
	</div>


	<?php if(has_custom_logo()): ?>
		<div class="embed-footer discovery">
			<?php echo the_custom_logo() ?>
		</div>
	<?php endif; ?>


	<?php wp_footer(); ?>
</body>


</html>
