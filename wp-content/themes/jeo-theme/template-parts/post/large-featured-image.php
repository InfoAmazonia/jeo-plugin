<?php

/**
 * The template part for displaying large featured images on posts.
 *
 * @package Newspack
 */

$caption = get_the_excerpt(get_post_thumbnail_id());
// Check the existance of the caption separately, so filters -- like ones that add ads -- don't interfere.
$caption_exists = get_post(get_post_thumbnail_id())->post_excerpt;


if ('behind' === newspack_featured_image_position()) :
?>
	<div class="featured-image-behind">
		<?php newspack_post_thumbnail(); ?>
		
		<div class="wrapper">
			

			<header class="entry-header">
				<?php get_template_part('template-parts/header/entry', 'header'); ?>
			</header>
			
			<?php if(class_exists('Newspack_Image_Credits') && (!empty(Newspack_Image_Credits::get_media_credit(get_post_thumbnail_id())['credit']) || !empty(get_post(get_post_thumbnail_id())->post_content))): ?>
			<div class="image-info">
				<i class="fas fa-info-circle"></i>
			</div>
			<?php endif; ?>

		</div><!-- .wrapper -->

		<div class="image-info-container">
			<div class="wrapper">
				<div class="image-meta">
					<?php
					if (class_exists('Newspack_Image_Credits')) {
						$image_meta = Newspack_Image_Credits::get_media_credit(get_post_thumbnail_id()); ?>
						<span class="description">
							<?php
							//var_dump(get_post(get_post_thumbnail_id()));
							?>
							<?= get_post(get_post_thumbnail_id())->post_content ?>
						</span>

						<i class="fas fa-camera"></i>
						<?= (isset($image_meta['credit_url']) && !empty($image_meta['credit_url'])) ? '<a href="' . $image_meta['credit_url'] . '">' : null ?>
						<span class="credit">
							<?= $image_meta['credit'] ?>

							<?= isset($image_meta['organization']) && !empty($image_meta['organization']) ? ' / ' . $image_meta['organization'] : null ?>
						</span>
						<?= (isset($image_meta['credit_url']) && !empty($image_meta['credit_url'])) ? '</a>' : null ?>

					<?php
					}
					?>
				</div>

			</div>
		</div>
	</div><!-- .featured-image-behind -->


	<?php if ($caption_exists) : ?>
		<figcaption><?php //echo wp_kses_post($caption); 
					?></figcaption>
	<?php endif; ?>

<?php elseif ('beside' === newspack_featured_image_position()) : ?>

	<div class="featured-image-beside">
		<div class="wrapper">
			<header class="entry-header">
				<?php get_template_part('template-parts/header/entry', 'header'); ?>
			</header>
		</div><!-- .wrapper -->

		<?php newspack_post_thumbnail(); ?>

		<?php if ($caption_exists) : ?>
			<figcaption><span><?php echo wp_kses_post($caption); ?></span></figcaption>
		<?php endif; ?>
	</div><!-- .featured-image-behind -->
<?php else : ?>

	<header class="entry-header">
		<?php get_template_part('template-parts/header/entry', 'header'); ?>
	</header>

<?php
	newspack_post_thumbnail();
endif;
