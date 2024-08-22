<h3><?php the_title(); ?></h3>
<?php the_post_thumbnail(); ?>
<?php the_content(); ?>
<?php if(strlen($attribution) > 0): ?>
	<?php if(strlen($attribution_name) > 0): ?>
		<?php esc_html_e('Attribution:', 'jeo'); ?> <a href="<?php echo esc_url($attribution); ?>"><?php echo esc_html($attribution_name); ?></a>
	<?php else: ?>
		<?php esc_html_e('Attribution:', 'jeo'); ?> <a href="<?php echo esc_url($attribution); ?>"><?php echo esc_html($attribution); ?></a>
	<?php endif; ?>
<?php endif; ?>
<?php if ( $source_url ): ?>
	<p>
		<a href="<?php echo esc_url($source_url);?>" class="download-source"><?php esc_html_e('Download from source', 'jeo'); ?></a>
	</p>
<?php endif; ?>
