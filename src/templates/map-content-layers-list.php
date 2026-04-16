<?php
/**
 * Map content layers list template.
 *
 * @package Jeo
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<h3><?php echo esc_html( get_the_title( $layer_post ) ); ?></h3>
<?php echo wp_kses_post( get_the_post_thumbnail( $layer_post ) ); ?>
<?php echo $layer_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- WordPress filters render trusted post content for the selected layer. ?>
<?php if ( strlen( $attribution ) > 0 ) : ?>
	<?php if ( strlen( $attribution_name ) > 0 ) : ?>
		<?php esc_html_e( 'Attribution:', 'jeo' ); ?> <a href="<?php echo esc_url( $attribution ); ?>"><?php echo esc_html( $attribution_name ); ?></a>
	<?php else : ?>
		<?php esc_html_e( 'Attribution:', 'jeo' ); ?> <a href="<?php echo esc_url( $attribution ); ?>"><?php echo esc_html( $attribution ); ?></a>
	<?php endif; ?>
<?php endif; ?>
<?php if ( $source_url ) : ?>
	<p>
		<a href="<?php echo esc_url( $source_url ); ?>" class="download-source"><?php esc_html_e( 'Download from source', 'jeo' ); ?></a>
	</p>
<?php endif; ?>
