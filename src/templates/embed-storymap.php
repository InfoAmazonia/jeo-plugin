<?php
	$disable_embed = get_post_meta( get_the_ID(), 'disable_embed', true) == '1'? true : false;
	$storymap_id = $_GET['storymap_id'];

	if ($disable_embed) {
		wp_redirect(home_url());
		exit();
	}
?>
<html style="margin: 0px !important;">

	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title><?= get_the_title( $storymap_id ) ?> </title>
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
		$img = \jeo_settings()->get_option( 'jeo_footer-logo' );
		if(!empty($img)): ?>
			<div class="embed-footer">
				<a href="/">
					<img src="<?= $img ?>">
				</a>
			</div>
	<?php endif; ?>


</div>
<?php wp_footer(); ?>
</body>
</html>
