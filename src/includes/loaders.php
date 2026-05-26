<?php
/**
 * Carrega o Composer Autoloader dependendo do ambiente (Desenvolvimento ou Produção).
 *
 * @package Jeo
 */

if ( file_exists( JEO_BASEPATH . 'vendor/autoload.php' ) ) {
	require_once JEO_BASEPATH . 'vendor/autoload.php';
}

spl_autoload_register( 'jeo_autoload' );

require_once __DIR__ . '/privacy.php';
require_once __DIR__ . '/admin/uninstall-handler.php';

/**
 * PSR-0-compatible autoloader that maps `Jeo\ClassName` to `class-class-name.php` across known directories.
 *
 * @param string $class_name Fully-qualified class name.
 * @return void
 */
function jeo_autoload( $class_name ) {

	$class_path = explode( '\\', $class_name );

	$subfolder = '';
	if ( count( $class_path ) > 2 ) {
		$subfolder = strtolower( $class_path[ count( $class_path ) - 2 ] ) . DIRECTORY_SEPARATOR;
	}

	$class_name = end( $class_path );

	$filename = 'class-' . strtolower( str_replace( '_', '-', $class_name ) ) . '.php';

	$folders = array( '.', 'traits', 'maps', 'layers', 'modules', 'admin', 'geocode', 'settings', 'layer-types', 'cli', 'legend-types', 'sidebars', 'menu', 'storymap', 'customization', 'ai', 'stories-near-you', 'minimap' );

	foreach ( $folders as $folder ) {
		$check = __DIR__ . DIRECTORY_SEPARATOR . $folder . DIRECTORY_SEPARATOR . $subfolder . $filename;
		if ( \file_exists( $check ) ) {
			require_once $check;
			break;
		}
	}
}

/**
 * Gets the instance of the main AI Handler Class
 *
 * @return \Jeo\AI_Handler AI_Handler instance
 */
function jeo_ai_handler() {
	return \Jeo\AI_Handler::get_instance();
}

/**
 * Gets the instance of the AI Logger Class
 *
 * @return \Jeo\AI\AI_Logger AI_Logger instance
 */
function jeo_ai_logger() {
	return \Jeo\AI\AI_Logger::get_instance();
}

/**
 * Gets the instance of the Bulk Processor Class
 *
 * @return \Jeo\AI\Bulk_Processor Bulk_Processor instance
 */
function jeo_bulk_processor() {
	return \Jeo\AI\Bulk_Processor::get_instance();
}

/**
 * Gets the instance of the RAG Backup Class
 *
 * @return \Jeo\AI\RAG_Backup RAG_Backup instance
 */
function jeo_rag_backup() {
	return \Jeo\AI\RAG_Backup::get_instance();
}

/**
 * Gets the instance of the RAG Worker Class
 *
 * @return \Jeo\AI\RAG_Worker RAG_Worker instance
 */
function jeo_rag_worker() {
	return \Jeo\AI\RAG_Worker::get_instance();
}

/**
 * Gets the instance of the AI Settings Class
 *
 * @return \Jeo\AI\AI_Settings AI_Settings instance
 */
function jeo_ai_settings() {
	return \Jeo\AI\AI_Settings::get_instance();
}

/**
 * Gets the instance of the Minilayer Handler Class
 *
 * @return \Jeo\AI\Minilayer_Handler Minilayer_Handler instance
 */
function jeo_minilayer_handler() {
	return \Jeo\AI\Minilayer_Handler::get_instance();
}

/**
 * Gets the instance of the Minimap Class
 *
 * @return \Jeo\Minimap Minimap instance
 */
function jeo_minimap() {
	return \Jeo\Minimap::get_instance();
}

/**
 * Gets the instance of the Context Handler Class
 *
 * @return \Jeo\AI\Context_Handler Context_Handler instance
 */
function jeo_context_handler() {
	return \Jeo\AI\Context_Handler::get_instance();
}

/**
 * Gets the instance of the main Jeo Class
 *
 * @return \Jeo Jeo instance
 */
function jeo() {
	return \Jeo::get_instance();
}

/**
 * Gets the instance of the main Maps Class
 *
 * @return \Jeo\Maps Maps instance
 */
function jeo_maps() {
	return \Jeo\Maps::get_instance();
}

/**
 * Gets the instance of the main Layers Class
 *
 * @return \Jeo\Layers Layers instance
 */
function jeo_layers() {
	return \Jeo\Layers::get_instance();
}

/**
 * Gets the instance of the main Geocode_Handler Class
 *
 * @return \Jeo\Geocode_Handler Geocode_Handler instance
 */
function jeo_geocode_handler() {
	return \Jeo\Geocode_Handler::get_instance();
}

/**
 * Gets the instance of the main Settings Class
 *
 * @return \Jeo\Settings Settings instance
 */
function jeo_settings() {
	return \Jeo\Settings::get_instance();
}

/**
 * Gets the instance of the Layer Types Class
 *
 * @return \Jeo\Layer_Types Layer Types instance
 */
function jeo_layer_types() {
	return \Jeo\Layer_Types::get_instance();
}

/**
 * Gets the instance of the Legend Types Class
 *
 * @return \Jeo\Legend_Types Legend Types instance
 */
function jeo_legend_types() {
	return \Jeo\Legend_Types::get_instance();
}

/**
 * Gets the instance of the Sidebars Class
 *
 * @return \Sidebars Sidebars instance
 */
function jeo_sidebars() {
	return \Jeo\Sidebars::get_instance();
}

/**
 * Gets the instance of the Menu Class
 *
 * @return \Menu Menu instance
 */
function jeo_menu() {
	return \Jeo\Menu::get_instance();
}

/**
 * Gets the instance of the Storymap
 *
 * @return \Storymap Storymap instance
 */
function jeo_storymap() {
	return \Jeo\Storymap::get_instance();
}

/**
 * Gets the instance of the Stories_Near_You class
 *
 * @return \Stories_Near_You Stories_Near_You instance
 */
function jeo_stories_near_you() {
	return \Jeo\Stories_Near_You::get_instance();
}

/**
 * Returns the URL to a JEO template file
 *
 * It can be overriden by a `jeo_get_template` filter, that receives two parameters:
 * * The pre-computed `$template_uri`
 * * The original `$template_name`
 *
 * @param string $template_name The name of the template (e.g. `some-template.php`).
 * @return string The URL for the template file
 */
function jeo_get_template( $template_name ) {
	$template_uri = false;

	if ( file_exists( get_stylesheet_directory() . '/jeo/templates/' . $template_name ) ) {
		$template_uri = get_stylesheet_directory() . '/jeo/templates/' . $template_name;
	}

	if ( file_exists( get_template_directory() . '/jeo/templates/' . $template_name ) ) {
		$template_uri = get_template_directory() . '/jeo/templates/' . $template_name;
	}

	if ( file_exists( JEO_BASEPATH . '/templates/' . $template_name ) ) {
		$template_uri = JEO_BASEPATH . '/templates/' . $template_name;
	}

	return apply_filters( 'jeo_get_template', $template_uri, $template_name );
}

/**
 * Register an embedder for a JEO-capable site
 *
 * @param string $id Unique ID for the source.
 * @param string $base_url Site URL (e.g.` http://example.org`).
 */
function jeo_register_embedder( $id, $base_url ) {
	$regex = '#' . preg_quote( $base_url, '/' ) . '\/embed\/.*#';

	$get_param = function ( $url, $param ) {
		$matches = array();
		preg_match( "/$param=(\d*)/", $url, $matches );
		return empty( $matches ) ? null : $matches[1];
	};

	$embedder = function ( $matches ) use ( $get_param ) {
		$url    = $matches[0];
		$height = $get_param( $url, 'height' );
		$width  = $get_param( $url, 'width' );

		$html = "<iframe src='$url'";
		if ( ! empty( $height ) ) {
			$html .= " height='$height'";
		}
		if ( ! empty( $width ) ) {
			$html .= " width='$width'";
		}
		if ( ! empty( $get_param( $url, 'storymap_id' ) ) ) {
			$html .= " class='embed-storymap' seamless scrolling='yes'";
		}
		$html .= " frameborder='0' loading='lazy'></iframe>";

		return $html;
	};

	wp_embed_register_handler( $id, $regex, $embedder );
}

/* New JEO Plugin Settings */
/**
 * Generate dynamic CSS for typography, colors, and CSS variables based on JEO appearance settings.
 *
 * @return string
 */
/**
 * Sanitize a font-family name for safe use inside a CSS string.
 *
 * @param string $font Raw font name.
 * @return string Sanitized font name.
 */
function jeo_sanitize_css_font_family( $font ) {
	$font = sanitize_text_field( $font );
	// Allow letters, numbers, spaces, hyphens, underscores, and common punctuation.
	return preg_replace( '/[^A-Za-z0-9\s\-_.,&()\/]+/', '', $font );
}

/**
 * Generate dynamic CSS from JEO appearance settings.
 *
 * @return string Safe CSS string.
 */
function jeo_custom_settings_css() {
	$theme_css = '';

	$font = jeo_sanitize_css_font_family( \jeo_settings()->get_option( 'jeo_typography-name', '' ) );
	if ( ! empty( $font ) ) {
		$theme_css .= '.jeomap .legend-container a.more-info-button { font-family: "' . esc_attr( $font ) . '", "sans-serif"; } :root { --jeo-font: "' . esc_attr( $font ) . '", "sans-serif"; }';
	}

	$font_stories = jeo_sanitize_css_font_family( \jeo_settings()->get_option( 'jeo_typography-name-stories', '' ) );
	if ( ! empty( $font_stories ) ) {
		$theme_css .= ':root { --jeo-font-stories: "' . esc_attr( $font_stories ) . '", "sans-serif"; }';
	}

	$info_font_size = floatval( \jeo_settings()->get_option( 'jeo_more-font-size', '1' ) );
	if ( $info_font_size > 0 ) {
		$theme_css .= '.jeomap div.legend-container a.more-info-button { font-size: ' . esc_attr( $info_font_size ) . 'rem; }';
	}

	$css_variables = '';

	$color_more_bkg = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_more-bkg-color', '#fff' ) );
	if ( ! empty( $color_more_bkg ) ) {
		$css_variables .= '--jeo_more-bkg-color: ' . $color_more_bkg . ';';
		$css_variables .= '--jeo_more-bkg-color-darker-15: ' . color_luminance_jeo( $color_more_bkg, -0.15 ) . ';';
	}

	$primary_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_primary-color', '#0073aa' ) );
	if ( ! empty( $primary_color ) ) {
		$css_variables .= '--jeo-primary-color: ' . $primary_color . ';';
		$css_variables .= '--jeo-primary-color-darker-15: ' . color_luminance_jeo( $primary_color, -0.15 ) . ';';
	}

	$over_primary_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_text-over-primary-color', '#000000' ) );
	if ( ! empty( $over_primary_color ) ) {
		$css_variables .= '--jeo-text-over-primary-color: ' . $over_primary_color . ';';
	}

	$more_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_more-color', '#555D66' ) );
	if ( ! empty( $more_color ) ) {
		$css_variables .= '--jeo_more-color: ' . $more_color . ';';
	}

	$close_bkg_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_close-bkg-color', '#fff' ) );
	if ( ! empty( $close_bkg_color ) ) {
		$css_variables .= '--jeo_close-bkg-color: ' . $close_bkg_color . ';';
	}

	$close_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_close-color', '#555D66' ) );
	if ( ! empty( $close_color ) ) {
		$css_variables .= '--jeo_close-color: ' . $close_color . ';';
		$css_variables .= '--jeo_close-bkg-color-darker-15: ' . color_luminance_jeo( $close_color, -0.15 ) . ';';
	}

	if ( ! empty( $css_variables ) ) {
		$theme_css .= ':root { ' . $css_variables . ' }';
	}

	return $theme_css;
}

/**
 * Output the custom JEO CSS in a `<style>` tag in the frontend `<head>`.
 *
 * @return void
 */
function jeo_custom_settings_css_wrap() {
	$css = jeo_custom_settings_css();
	if ( empty( $css ) ) {
		return;
	}
	// Values are individually sanitized in jeo_custom_settings_css().
	echo '<style type="text/css" id="custom-jeo-css">' . $css . '</style>' . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action( 'wp_head', 'jeo_custom_settings_css_wrap' );

/**
 * Enqueue Google Fonts stylesheets for primary and stories typography when configured.
 *
 * @return void
 */
function jeo_scripts_typography() {
	if ( \jeo_settings()->get_option( 'jeo_typography' ) ) {
		wp_enqueue_style( 'jeo-font', \jeo_settings()->get_option( 'jeo_typography' ), array(), JEO_VERSION );
	}
	if ( \jeo_settings()->get_option( 'jeo_typography-stories' ) ) {
		wp_enqueue_style( 'jeo-font-stories', \jeo_settings()->get_option( 'jeo_typography-stories' ), array(), JEO_VERSION );
	}
}
add_action( 'wp_enqueue_scripts', 'jeo_scripts_typography' );
add_action( 'admin_enqueue_scripts', 'jeo_scripts_typography' );

if ( ! function_exists( 'color_luminance_jeo' ) ) {
	/**
	 * Adjust a hex color's luminance by a given percentage for lighter/darker variants.
	 *
	 * @param string $hexcolor Hex color string (e.g. '#ff0000').
	 * @param float  $percent  Percentage adjustment (-1.0 to 1.0).
	 * @return string Adjusted hex color string.
	 */
	function color_luminance_jeo( $hexcolor, $percent ) {
		if ( strlen( $hexcolor ) < 6 ) {
			$hexcolor = $hexcolor[0] . $hexcolor[0] . $hexcolor[1] . $hexcolor[1] . $hexcolor[2] . $hexcolor[2];
		}
		$hexcolor = array_map( 'hexdec', str_split( str_pad( str_replace( '#', '', $hexcolor ), 6, '0' ), 2 ) );

		foreach ( $hexcolor as $i => $color ) {
			$from           = $percent < 0 ? 0 : $color;
			$to             = $percent < 0 ? $color : 255;
			$pvalue         = ceil( ( $to - $from ) * $percent );
			$hexcolor[ $i ] = str_pad( dechex( $color + $pvalue ), 2, '0', STR_PAD_LEFT );
		}

		return '#' . implode( $hexcolor );
	}
}

// Load template for discovery.
add_filter( 'page_template', 'template_page_discovery' );
/**
 * Override the page template to the Discovery template when the `discovery.php` template slug is selected.
 *
 * @param string $page_template Current page template path.
 * @return string
 */
function template_page_discovery( $page_template ) {

	if ( get_page_template_slug() === 'discovery.php' ) {
		$page_template = JEO_BASEPATH . '/templates/discovery.php';
	}
	return $page_template;
}

add_filter( 'theme_page_templates', 'add_template_page_discovery', 10, 1 );

/**
 * Add "Discovery" template to page attirbute template section.
 *
 * @param array $post_templates Existing page templates.
 *
 * @return array
 */
function add_template_page_discovery( $post_templates ) {

	// Add custom template named template-custom.php to select dropdown.
	$post_templates['discovery.php'] = __( 'Discovery', 'jeo' );

	return $post_templates;
}
