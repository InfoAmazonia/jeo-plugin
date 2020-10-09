<?php

/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Newspack
 */
?><!doctype html>
<html <?php language_attributes(); ?>>

<head>
	<meta charset="<?php bloginfo('charset'); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="profile" href="https://gmpg.org/xfn/11" />
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
	<?php

	do_action('wp_body_open');
	do_action('before_header');

	// Header Settings
	$header_simplified     = get_theme_mod('header_simplified', false);
	$header_center_logo    = get_theme_mod('header_center_logo', false);
	$show_slideout_sidebar = get_theme_mod('header_show_slideout', false);
	$header_sub_simplified = get_theme_mod('header_sub_simplified', false);

	get_template_part('template-parts/header/mobile', 'sidebar');
	get_template_part('template-parts/header/desktop', 'sidebar');

	if (true === $header_sub_simplified && !is_front_page()) :
		get_template_part('template-parts/header/subpage', 'sidebar');
	endif;
	?>

	<div id="page" class="site">
		<a class="skip-link screen-reader-text" href="#content"><?php _e('Skip to content', 'newspack'); ?></a>
		<button id="search-toggle" style="display:none">
			<span></span>
		</button>

		<header id="masthead" class="site-header hide-header-search" [class]="searchVisible ? 'show-header-search site-header ' : 'hide-header-search site-header'">
			<div id="header-search" class="tablet-down-search" [aria-expanded]="searchVisible ? 'true' : 'false'" aria-expanded="false">
				<div class="wrapper">
					<div class="content-limiter">
						<span class="search-text"><?= __('What are you looking for?', 'jeo'); ?></span>
						<?php get_search_form(); ?>
					</div>
				</div>
			</div><!-- #header-search -->

			<?php if (true === $header_sub_simplified && !is_front_page()) : ?>
				<div class="top-header-contain desktop-only">
					<div class="wrapper">
						<?php if (true === $show_slideout_sidebar && is_active_sidebar('header-1')) : ?>
							<button class="desktop-menu-toggle" on="tap:desktop-sidebar.toggle">
								<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
								<?php echo esc_html(get_theme_mod('slideout_label', esc_html__('Menu', 'newspack'))); ?>
							</button>
						<?php endif; ?>

						<?php
						// Logo is NOT centered:
						if (false === $header_center_logo) :
						?>
							<div id="social-nav-contain">
								<?php
								if (!newspack_is_amp()) {
									newspack_social_menu_header();
								}
								?>
							</div>
							<?php
						else :
							$description = get_bloginfo('description', 'display');
							if ($description || is_customize_preview()) :
							?>
								<p class="site-description">
									<?php echo $description; /* WPCS: xss ok. */ ?>
								</p>
							<?php endif; ?>
						<?php endif; ?>	
					</div><!-- .wrapper -->
				</div><!-- .top-header-contain -->
				<div class="middle-header-contain">
					<div class="wrapper">
						<?php if (newspack_has_menus() || (true === $show_slideout_sidebar && is_active_sidebar('header-1'))) : ?>
							<div class="subpage-toggle-contain">
								<button class="subpage-toggle" on="tap:subpage-sidebar.toggle">
									<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
									<span class="screen-reader-text"><?php esc_html_e('Menu', 'newspack'); ?></span>
								</button>
							</div>
						<?php endif; ?>

						<?php get_template_part('template-parts/header/site', 'branding'); ?>

						<?php if (newspack_has_menus()) : ?>
							<button class="mobile-menu-toggle" on="tap:mobile-sidebar.toggle">
								<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
								<?php esc_html_e('Menu', 'newspack'); ?>
							</button>
						<?php endif; ?>

						<?php get_template_part('template-parts/header/header', 'search'); ?>
					</div><!-- .wrapper -->
				</div><!-- .middle-header-contain -->
				<div class="bottom-header-contain desktop-only">
					<div class="wrapper">
						<div id="site-navigation">
							<?php
							if (!newspack_is_amp()) {
								newspack_primary_menu();
							}
							?>
						</div>
						<?php $button_url = get_theme_mod('discovery_button_link');
						if (!empty($button_url)) : ?>
							<a href="<?= $button_url ?>" class="featured-button <?= get_theme_mod('discovery_button_style', 'solid') ?>">
								<i class="far fa-map"></i>
								Discovery
							</a>
						<?php endif; ?>
					</div><!-- .wrapper -->
				</div><!-- .bottom-header-contain -->
			<?php else : ?>

				<?php
				// If header is NOT short, and if there's a Secondary Menu or Slide-out Sidebar widget.
				if (false === $header_simplified && (is_active_sidebar('header-1') || has_nav_menu('secondary-menu'))) :
				?>
					<div class="top-header-contain desktop-only">
						<div class="wrapper">
							<?php if (true === $show_slideout_sidebar && is_active_sidebar('header-1')) : ?>
								<button class="desktop-menu-toggle" on="tap:desktop-sidebar.toggle">
									<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
									<?php echo esc_html(get_theme_mod('slideout_label', esc_html__('Menu', 'newspack'))); ?>
								</button>
							<?php endif; ?>

							<?php
							// Logo is NOT centered:
							if (false === $header_center_logo) :
							?>
								<div id="social-nav-contain">
									<?php
									if (!newspack_is_amp()) {
										newspack_social_menu_header();
									}
									?>
								</div>
								<?php if(has_action('wpml_language_switcher')):?>
									<div class="language-switter">
										<?= do_action( 'wpml_language_switcher', [
											'native' => 0
										] ); ?>
									</div>
								<?php endif; ?>
								<?php
							else :
								$description = get_bloginfo('description', 'display');
								if ($description || is_customize_preview()) :
								?>
									<p class="site-description">
										<?php echo $description; /* WPCS: xss ok. */ ?>
									</p>
								<?php endif; ?>
							<?php endif; ?>

							

						</div><!-- .wrapper -->
					</div><!-- .top-header-contain -->
				<?php endif; ?>

				<div class="middle-header-contain">
					<div class="wrapper">
						<?php if (true === $header_simplified && true === $show_slideout_sidebar && is_active_sidebar('header-1')) : ?>
							<button class="desktop-menu-toggle" on="tap:desktop-sidebar.toggle">
								<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
								<span><?php echo esc_html(get_theme_mod('slideout_label', esc_html__('Menu', 'newspack'))); ?></span>
							</button>
						<?php endif; ?>

						<?php
						// Centered logo AND NOT short header.
						if (true === $header_center_logo && false === $header_simplified) :
						?>
							<div id="social-nav-contain" class="desktop-only">
								<?php
								if (!newspack_is_amp()) {
									newspack_social_menu_header();
								}
								?>
							</div>
						<?php endif; ?>

						<?php
						// Centered logo AND short header.
						if (true === $header_center_logo && true === $header_simplified) :
						?>

							<div class="nav-wrapper desktop-only">
								<div id="site-navigation">
									<?php
									if (!newspack_is_amp()) {
										newspack_primary_menu();
									}
									?>
								</div><!-- #site-navigation -->
							</div><!-- .nav-wrapper -->

						<?php endif; ?>

						<?php get_template_part('template-parts/header/site', 'branding'); ?>

						<?php
						// Short header:
						if (true === $header_simplified && false === $header_center_logo) :
						?>

							<div class="nav-wrapper desktop-only">
								<div id="site-navigation">
									<?php
									if (!newspack_is_amp()) {
										newspack_primary_menu();
									}
									?>
								</div><!-- #site-navigation -->

								<?php
								// Centered logo:
								if (true === $header_center_logo) {
									get_template_part('template-parts/header/header', 'search');
								}
								?>
							</div><!-- .nav-wrapper -->

						<?php endif; ?>


						<div class="nav-wrapper desktop-only">
							<div id="tertiary-nav-contain">
								<?php
								if (!newspack_is_amp()) {
									newspack_tertiary_menu();
								}
								?>
							</div><!-- #tertiary-nav-contain -->

							<?php
							// Header is simplified and middle menu has search icon always
							if (true === $header_simplified || true === $header_center_logo || false === $header_center_logo) :
								get_template_part('template-parts/header/header', 'search');
							endif;
							?>
						</div><!-- .nav-wrapper -->

						<?php if (newspack_has_menus()) : ?>
							<button class="mobile-menu-toggle" on="tap:mobile-sidebar.toggle">
								<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
								<?php esc_html_e('Menu', 'newspack'); ?>
							</button>
						<?php endif; ?>

					</div><!-- .wrapper -->
				</div><!-- .middle-header-contain -->


				<?php
				// Header is NOT short:
				if (false === $header_simplified) :
				?>
					<div class="bottom-header-contain desktop-only">
						<div class="wrapper">
							<div id="site-navigation">
								<?php
								if (!newspack_is_amp()) {
									newspack_primary_menu();
								}
								?>
							</div>
							<?php $button_url = get_theme_mod('discovery_button_link');
							if (!empty($button_url)) : ?>
								<a href="<?= $button_url ?>" class="featured-button <?= get_theme_mod('discovery_button_style', 'solid') ?>">
									<i class="far fa-map"></i>
									Discovery
								</a>
							<?php endif; ?>
						</div><!-- .wrapper -->
					</div><!-- .bottom-header-contain -->
					<div class="bottom-header-contain post-header">
						<div class="wrapper">
							<div class="left">
								<div class="subpage-toggle-contain">
									<button class="menu-btn mobile-menu-toggle left-menu-toggle" on="tap:mobile-sidebar.toggle">
										<span class="close">
											<?php echo wp_kses(newspack_get_icon_svg('close', 20), newspack_sanitize_svgs()); ?>
										</span>

										<span class="menu-open">
											<?php echo wp_kses(newspack_get_icon_svg('menu', 20), newspack_sanitize_svgs()); ?>
										</span>
										<span class="screen-reader-text"><?php esc_html_e('Menu', 'newspack'); ?></span>
									</button>
								</div>
							</div>
							<div class="logo">
								<div class="site-branding">
									<?php newspack_the_sticky_logo(); ?>
								</div><!-- .site-branding -->
							</div>
							<div class="logo-mobile">
								<div class="site-branding">
									<?php newspack_the_mobile_logo(); ?>
								</div>
							</div>
							<div class="nav-wrapper desktop-only page-header">
								<div id="tertiary-nav-contain">
									<?php
									if (!newspack_is_amp()) {
										newspack_tertiary_menu();
									}
									?>
								</div><!-- #tertiary-nav-contain -->

								<?php
								// Header is simplified. In mobile has search icon always
								if (true === $header_simplified || true === $header_center_logo  || false === $header_center_logo) : ?>
									<button class="search-toggle" on="tap:AMP.setState( { searchVisible: !searchVisible } ), search-form-1.focus" aria-controls="search-menu" [aria-expanded]="searchVisible ? 'true' : 'false'" aria-expanded="false">
										<span class="screen-reader-text" [text]="searchVisible ? '<?php esc_html_e('Close Search', 'newspack'); ?>' : '<?php esc_html_e('Open Search', 'newspack'); ?>'">
											<?php esc_html_e('Open Search', 'newspack'); ?>
										</span>
										<span class="search-icon"><?php echo wp_kses(newspack_get_icon_svg('search', 28), newspack_sanitize_svgs()); ?></span>
										<span class="close-icon"><?php echo wp_kses(newspack_get_icon_svg('close', 28), newspack_sanitize_svgs()); ?></span>
									</button>
									<?php //get_template_part( 'template-parts/header/header', 'search' ); 
									?>
								<?php endif;
								?>
							</div><!-- .nav-wrapper -->
						</div><!-- .wrapper -->
					</div><!-- .bottom-header-contain -->
				<?php
				endif;

				/**
				 * Displays 'highlight' menu; created a function to reduce duplication.
				 */
				if (has_nav_menu('highlight-menu')) :
				?>
					<div class="highlight-menu-contain desktop-only">
						<div class="wrapper">
							<nav class="highlight-menu" aria-label="<?php esc_attr_e('Highlight Menu', 'newspack'); ?>">
								<?php
								wp_nav_menu(
									array(
										'theme_location' => 'highlight-menu',
										'container'      => false,
										'items_wrap'     => '<ul id="%1$s" class="%2$s"><li><span class="menu-label">' . esc_html(wp_get_nav_menu_name('highlight-menu')) . '</span></li>%3$s</ul>',
										'depth'          => 1,
									)
								);
								?>
							</nav>
						</div><!-- .wrapper -->
					</div><!-- .highlight-menu-contain -->
				<?php endif; ?>
			<?php endif; ?>

		</header><!-- #masthead -->

		<?php
		if (function_exists('yoast_breadcrumb')) {
			yoast_breadcrumb('<div class="site-breadcrumb desktop-only"><div class="wrapper">', '</div></div>');
		}
		?>

		<?php do_action('after_header'); ?>

		<div id="content" class="site-content decoration-<?= get_theme_mod('decoration_style', 'square') ?>">