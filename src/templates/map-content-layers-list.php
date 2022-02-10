<h3><?php the_title(); ?></h3>
<?php the_post_thumbnail(); ?>
<?php the_content(); ?>
<?php if(strlen($attribution) > 0): ?>
	<?php if(strlen($attribution_name) > 0): ?>
		<?php _e('Attribution: ', 'jeo'); ?><a href="<?php echo $attribution; ?>"><?php echo esc_html( $attribution_name ); ?></a>
	<?php else: ?>
		<?php _e('Attribution: ', 'jeo'); ?><a href="<?php echo $attribution; ?>"><?php echo esc_html( $attribution ); ?></a>
	<?php endif; ?>
<?php endif; ?>
<?php if ( $source_url ): ?>
	<p>
		<a href="<?php echo $source_url;?>" class="download-source"><?php _e('Download from source', 'jeo'); ?></a>
	</p>
<?php endif; ?>
