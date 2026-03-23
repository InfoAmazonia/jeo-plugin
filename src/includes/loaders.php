<?php
/**
 * Global loaders and helper functions.
 *
 * @package Jeo
 */

spl_autoload_register( 'jeo_autoload' );

/**
 * Autoload plugin classes based on namespace and folder conventions.
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

	$folders = array( '.', 'traits', 'maps', 'layers', 'modules', 'admin', 'geocode', 'settings', 'layer-types', 'cli', 'legend-types', 'sidebars', 'menu', 'storymap', 'customization' );

	foreach ( $folders as $folder ) {
		$check = __DIR__ . DIRECTORY_SEPARATOR . $folder . DIRECTORY_SEPARATOR . $subfolder . $filename;
		if ( \file_exists( $check ) ) {
			require_once $check;
			break;
		}
	}
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
 * @param string $base_url Site URL (e.g. `http://example.org`).
 */
function jeo_register_embedder( $id, $base_url ) {
	$regex = '#' . preg_quote( $base_url, '/' ) . '\/embed\/.*#';

	$get_param = function ( $url, $param ) {
		$matches = array();
		preg_match( "/$param=(\d*)/", $url, $matches );
		return empty( $matches ) ? null : $matches[1];
	};

	$embedder = function ( $matches ) use ( $get_param ) {
		$url         = esc_url( $matches[0] );
		$height      = absint( $get_param( $matches[0], 'height' ) );
		$width       = absint( $get_param( $matches[0], 'width' ) );
		$storymap_id = absint( $get_param( $matches[0], 'storymap_id' ) );

		if ( '' === $url ) {
			return '';
		}

		$attributes = array(
			sprintf( 'src="%s"', $url ),
			'frameborder="0"',
			'loading="lazy"',
		);

		if ( $height > 0 ) {
			$attributes[] = sprintf( 'height="%d"', $height );
		}
		if ( $width > 0 ) {
			$attributes[] = sprintf( 'width="%d"', $width );
		}
		if ( $storymap_id > 0 ) {
			$attributes[] = 'class="embed-storymap"';
			$attributes[] = 'seamless';
			$attributes[] = 'scrolling="yes"';
		}

		return '<iframe ' . implode( ' ', $attributes ) . '></iframe>';
	};

	wp_embed_register_handler( $id, $regex, $embedder );
}

/**
 * Normalize an optional asset URL.
 *
 * @param string $url Raw URL value.
 * @return string
 */
function jeo_normalize_asset_url( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}

	if ( 0 === strpos( $url, '/' ) && 0 !== strpos( $url, '//' ) ) {
		$url = home_url( $url );
	}

	$normalized = esc_url_raw( $url );
	if ( '' === $normalized ) {
		return '';
	}

	$target = wp_parse_url( $normalized );
	if ( ! is_array( $target ) ) {
		return '';
	}

	if ( empty( $target['host'] ) ) {
		return '';
	}

	if ( ! empty( $target['scheme'] ) && ! in_array( strtolower( $target['scheme'] ), array( 'http', 'https' ), true ) ) {
		return '';
	}

	return $normalized;
}

/**
 * Sanitize a font-family label for safe CSS output.
 *
 * @param string $font_name Raw font-family string.
 * @return string
 */
function jeo_sanitize_font_family( $font_name ) {
	$font_name = sanitize_text_field( (string) $font_name );
	$font_name = preg_replace( '/[^A-Za-z0-9 \-_]/', '', $font_name );
	$font_name = preg_replace( '/\s+/', ' ', $font_name );

	return trim( (string) $font_name );
}

/**
 * Sanitize a numeric CSS value used with a fixed unit.
 *
 * @param mixed $value Raw numeric value.
 * @return string
 */
function jeo_sanitize_css_number( $value ) {
	if ( ! is_numeric( $value ) ) {
		return '';
	}

	$normalized = sprintf( '%.4F', (float) $value );
	$normalized = rtrim( rtrim( $normalized, '0' ), '.' );

	return $normalized;
}

/**
 * Register privacy policy text for JEO third-party services.
 *
 * @return void
 */
function jeo_add_privacy_policy_content() {
	if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
		return;
	}

	$content = sprintf(
		wp_kses_post(
			/* translators: 1: Mapbox terms URL, 2: Mapbox privacy URL, 3: Nominatim usage policy URL, 4: OSMF privacy URL, 5: OSM tile policy URL. */
			__(
				'<p>JEO can connect to third-party services depending on your configuration.</p><ul><li><strong>Mapbox</strong>: only used when Mapbox is selected as the rendering library or when a map uses Mapbox-hosted resources. In that case the site loads JavaScript/CSS from Mapbox and sends the configured access token plus the visitor&#8217;s IP address, browser details and requested map resources to Mapbox. Terms: <a href="%1$s">Mapbox Terms of Service</a>. Privacy Policy: <a href="%2$s">Mapbox Privacy Policy</a>.</li><li><strong>Nominatim (OpenStreetMap)</strong>: used when an editor explicitly runs an address search or reverse geocoding request in the post geolocation UI. The typed address or selected coordinates, the site URL in the user agent string and the server IP address are sent to the Nominatim service. Usage Policy: <a href="%3$s">Nominatim Usage Policy</a>. Privacy Policy: <a href="%4$s">OpenStreetMap Foundation Privacy Policy</a>.</li><li><strong>OpenStreetMap raster tiles</strong>: the default MapLibre preview style requests map tiles from the OpenStreetMap tile service, which receives the visitor&#8217;s IP address, browser details and requested tile URLs. Tile Policy: <a href="%5$s">OpenStreetMap Tile Usage Policy</a>. Privacy Policy: <a href="%4$s">OpenStreetMap Foundation Privacy Policy</a>.</li><li><strong>Optional external asset URLs configured by the site administrator</strong>: if you configure an external typography stylesheet or footer logo URL, visitors&#8217; browsers will request that asset directly from the selected host. That host may receive the visitor&#8217;s IP address, browser details and referrer according to its own terms and privacy policy.</li></ul>',
				'jeo'
			)
		),
		'https://www.mapbox.com/legal/tos',
		'https://www.mapbox.com/legal/privacy',
		'https://operations.osmfoundation.org/policies/nominatim/',
		'https://osmfoundation.org/wiki/Privacy_Policy',
		'https://operations.osmfoundation.org/policies/tiles/'
	);

	wp_add_privacy_policy_content( 'JEO', $content );
}
add_action( 'admin_init', 'jeo_add_privacy_policy_content' );

/**
 * Build custom CSS from plugin settings.
 *
 * @return string
 */
function jeo_custom_settings_css() {
	$theme_css = '';
	$jeo_font  = jeo_sanitize_font_family( \jeo_settings()->get_option( 'jeo_typography-name' ) );
	if ( '' !== $jeo_font ) {

		$theme_css .= '
		.jeomap .legend-container a.more-info-button  {
			font-family: "' . $jeo_font . '", "sans-serif";
		}
		:root {
			--jeo-font: "' . $jeo_font . '", "sans-serif";
		}
		';
	}
	$jeo_font_stories = jeo_sanitize_font_family( \jeo_settings()->get_option( 'jeo_typography-name-stories' ) );
	if ( '' !== $jeo_font_stories ) {

		$theme_css .= '
		:root {
			--jeo-font-stories: "' . $jeo_font_stories . '", "sans-serif";
		}
		';
	}

	$jeo_info_font_size = jeo_sanitize_css_number( \jeo_settings()->get_option( 'jeo_more-font-size', '1' ) );
	if ( '' !== $jeo_info_font_size ) {
		$font_unit = 'rem';

		$theme_css .= '
		.jeomap div.legend-container a.more-info-button {
			font-size: ' . $jeo_info_font_size . $font_unit . ';
		}';
	}

	$css_variables  = '';
	$color_more_bkg = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_more-bkg-color', '#fff' ) );
	if ( ! empty( $color_more_bkg ) ) {

		$color_css       = '--jeo_more-bkg-color: ' . $color_more_bkg . ';';
		$color_css_hover = '--jeo_more-bkg-color-darker-15: ' . color_luminance_jeo( $color_more_bkg, -0.15 ) . ';';
		$css_variables  .= $color_css . ' ' . $color_css_hover;
	}

	$primary_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_primary-color', '#0073aa' ) );
	if ( ! empty( $primary_color ) ) {
		$color_css_primary      = '--jeo-primary-color: ' . $primary_color . ';';
		$color_css_primary_dark = '--jeo-primary-color-darker-15: ' . color_luminance_jeo( $primary_color, -0.15 ) . ';';
		$css_variables         .= $color_css_primary . ' ' . $color_css_primary_dark;
	}

	$over_primary_color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_text-over-primary-color', '#000000' ) );
	if ( ! empty( $over_primary_color ) ) {
		$color_css      = '--jeo-text-over-primary-color: ' . $over_primary_color . ';';
		$css_variables .= $color_css;
	}

	$color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_more-color', '#555D66' ) );
	if ( ! empty( $color ) ) {
		$color_css      = '--jeo_more-color: ' . $color . ';';
		$css_variables .= $color_css;
	}

	$color = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_close-bkg-color', '#fff' ) );
	if ( ! empty( $color ) ) {
		$color_css      = '--jeo_close-bkg-color: ' . $color . ';';
		$css_variables .= $color_css;
	}

	$color_close_bkg = sanitize_hex_color( \jeo_settings()->get_option( 'jeo_close-color', '#555D66' ) );
	if ( ! empty( $color_close_bkg ) ) {

		$color_css       = '--jeo_close-color: ' . $color_close_bkg . ';';
		$color_css_hover = '--jeo_close-bkg-color-darker-15: ' . color_luminance_jeo( $color_close_bkg, -0.15 ) . ';';
		$css_variables  .= $color_css . ' ' . $color_css_hover;
	}

	if ( '' !== trim( $css_variables ) ) {
		$theme_css .= '
		:root {
			' . trim( $css_variables ) . '
		}
		';
	}

	return $theme_css;
}

/**
 * Print custom CSS generated from plugin settings.
 *
 * @return void
 */
function jeo_custom_settings_css_wrap() {
	?>
	<style type="text/css" id="custom-jeo-css">
		<?php
		echo jeo_custom_settings_css(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		?>
	</style>
	<?php
}
add_action( 'wp_head', 'jeo_custom_settings_css_wrap' );

/**
 * Enqueue configured typography assets.
 *
 * @return void
 */
function jeo_scripts_typography() {
	$primary_font_url = jeo_normalize_asset_url( \jeo_settings()->get_option( 'jeo_typography' ) );
	if ( '' !== $primary_font_url ) {
		wp_enqueue_style( 'jeo-font', $primary_font_url, array(), JEO_VERSION );
	}
	$secondary_font_url = jeo_normalize_asset_url( \jeo_settings()->get_option( 'jeo_typography-stories' ) );
	if ( '' !== $secondary_font_url ) {
		wp_enqueue_style( 'jeo-font-stories', $secondary_font_url, array(), JEO_VERSION );
	}
}
add_action( 'wp_enqueue_scripts', 'jeo_scripts_typography' );
add_action( 'admin_enqueue_scripts', 'jeo_scripts_typography' );

if ( ! function_exists( 'color_luminance_jeo' ) ) {
	/**
	 * Adjust luminance for a hex color value.
	 *
	 * @param string    $hexcolor Base color.
	 * @param float|int $percent Luminance delta.
	 * @return string
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

// Load the Discovery template when the page template slug matches.
add_filter( 'page_template', 'template_page_discovery' );

/**
 * Swap in the bundled Discovery page template.
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

/**
 * Add the Discovery template to the page-template selector.
 */
add_filter( 'theme_page_templates', 'add_template_page_discovery', 10, 1 );

/**
 * Expose the bundled Discovery template in the editor selector.
 *
 * @param array $post_templates Registered page templates.
 * @return array
 */
function add_template_page_discovery( $post_templates ) {

	// translators: Explore is the name of JEO's discovery page feature.
	$post_templates['discovery.php'] = __( 'Explore', 'jeo' );

	return $post_templates;
}
