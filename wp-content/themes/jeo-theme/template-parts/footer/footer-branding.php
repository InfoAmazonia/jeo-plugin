<?php
/**
 * Displays the footer branding and social links.
 *
 * @package Newspack
 */

$has_footer_logo = false;
if ( '' !== get_theme_mod( 'newspack_footer_logo', '' ) && 0 !== get_theme_mod( 'newspack_footer_logo', '' ) ) {
	$has_footer_logo = true;
}

if ( is_active_sidebar( 'footer-1' ) && ( has_custom_logo() || $has_footer_logo ) ) : ?>
	<div class="footer-branding">
		<div class="wrapper">
			<?php if ( $has_footer_logo ) : ?>
				<a class="footer-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
					<?php
					$classes = 'footer-logo light-logo ' . (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');
					echo wp_get_attachment_image(
						get_theme_mod( 'newspack_footer_logo', '' ),
						'newspack-footer-logo',
						'',
						array( 'class' =>  $classes)
					);
					?>

					<?php
						if(!empty(get_theme_mod( 'logo_dark_image', '' ))) {
							echo wp_get_attachment_image(
								get_theme_mod( 'logo_dark_image', '' ),
								'newspack-footer-logo',
								'',
								array( 'class' => 'footer-logo dark-logo' )
							);
						}
					?>
				</a>
			<?php
			elseif ( has_custom_logo() ) : ?>
				<a class="footer-logo-link" href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home">
					<?php
					$classes = 'footer-logo light-logo ' . (!empty(get_theme_mod( 'logo_dark_image', '' ))? 'defined-dark' : 'undefined-dark');
					echo wp_get_attachment_image(
						get_theme_mod( 'custom_logo', '' ),
						'full',
						'',
						array( 'class' =>  $classes)
					);
					?>

					<?php
						if(!empty(get_theme_mod( 'logo_dark_image', '' ))) {
							echo wp_get_attachment_image(
								get_theme_mod( 'logo_dark_image', '' ),
								'newspack-footer-logo',
								'',
								array( 'class' => 'footer-logo dark-logo' )
							);
						}
					?>
				</a> <?php
			endif;

			newspack_social_menu_footer();
			?>
		</div><!-- .wrapper -->
	</div><!-- .footer-branding -->
<?php endif; ?>
