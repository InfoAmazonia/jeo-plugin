<?php
/**
 * JEO settings page template.
 *
 * @package Jeo
 */

?>
<div class="wrap">
	<h1><?php esc_html_e( 'Jeo Settings', 'jeowp' ); ?></h1>
	<nav class="nav-tab-wrapper wp-clearfix">
		<?php foreach ( $tabs as $slug => $label ) : ?>
			<a href="<?php echo esc_url( admin_url( 'admin.php?page=jeo-settings&tab=' . $slug ) ); ?>" class="nav-tab <?php echo $current_tab === $slug ? 'nav-tab-active' : ''; ?>">
				<?php echo esc_html( $label ); ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<form action="options.php" method="post" class="clear prepend-top">
		<?php settings_fields( $this->option_key ); ?>
		
		<div style="background: #fff; border: 1px solid #ccd0d4; border-top: 0; padding: 20px 30px;">
			<input type="hidden" name="<?php echo esc_html( $this->get_field_name( 'current_tab' ) ); ?>" value="<?php echo esc_attr( $current_tab ); ?>">
			<?php if ( 'general' === $current_tab ) : ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="map_runtime"><?php esc_html_e( 'Rendering library', 'jeowp' ); ?></label></th>
							<td>
								<select name="<?php echo esc_html( $this->get_field_name( 'map_runtime' ) ); ?>" id="map_runtime">
									<option value="mapboxgl" <?php selected( $this->get_option( 'map_runtime' ), 'mapboxgl' ); ?>>MapboxGL</option>
									<option value="maplibregl" <?php selected( $this->get_option( 'map_runtime' ), 'maplibregl' ); ?>>MapLibreGL</option>
								</select>
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="enabled_post_types"><?php esc_html_e( 'Enabled Post Types', 'jeowp' ); ?></label></th>
							<td>
								<?php
								$post_types         = get_post_types( array( 'public' => true ), 'objects' );
								$enabled_post_types = $this->get_option( 'enabled_post_types' );
								if ( ! is_array( $enabled_post_types ) ) {
									$enabled_post_types = array( 'post' );
								}
								foreach ( $post_types as $settings_post_type ) :
									?>
									<label>
										<input type="checkbox" name="<?php echo esc_html( $this->get_field_name( 'enabled_post_types' ) ); ?>[]" value="<?php echo esc_attr( $settings_post_type->name ); ?>" <?php checked( in_array( $settings_post_type->name, $enabled_post_types, true ) ); ?> />
										<?php echo esc_html( $settings_post_type->labels->name ); ?>
									</label><br />
								<?php endforeach; ?>
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_zoom"><?php esc_html_e( 'Default map zoom', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_zoom' ) ); ?>" type="number" id="map_default_zoom" value="<?php echo esc_html( $this->get_option( 'map_default_zoom' ) ); ?>" class="small-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_lat"><?php esc_html_e( 'Default map center (latitude)', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lat' ) ); ?>" type="text" id="map_default_lat" value="<?php echo esc_html( $this->get_option( 'map_default_lat' ) ); ?>" class="regular-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_lng"><?php esc_html_e( 'Default map center (longitude)', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lng' ) ); ?>" type="text" id="map_default_lng" value="<?php echo esc_html( $this->get_option( 'map_default_lng' ) ); ?>" class="regular-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="geolocation_precision"><?php esc_html_e( 'User location precision', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'geolocation_precision' ) ); ?>" type="range" id="geolocation_precision" min="1" max="5" value="<?php echo esc_attr( $this->get_option( 'geolocation_precision' ) ); ?>">
								<output for="geolocation_precision" id="geolocation_precision_value"><?php echo esc_html( $this->get_option( 'geolocation_precision' ) ); ?></output>
								<p class="description">
									<?php esc_html_e( 'Lower = less precision, more privacy.', 'jeowp' ); ?>
									<a href="<?php echo esc_url( __( 'https://en.wikipedia.org/wiki/Decimal_degrees#Precision', 'jeowp' ) ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Learn more about decimal degree precision.', 'jeowp' ); ?></a>
								</p>
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="show_storymaps_on_post_archives"><?php esc_html_e( 'Show Story Maps on Post Archives', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'show_storymaps_on_post_archives' ) ); ?>" type="checkbox" id="show_storymaps_on_post_archives" value="1" <?php checked( $this->get_option( 'show_storymaps_on_post_archives' ), 1 ); ?>>
								<span class="description"><?php esc_html_e( 'Enable this to display relevant story maps at the top of category and tag archive pages.', 'jeowp' ); ?></span>
							</td>
						</tr>

						<?php
						foreach ( jeo_geocode_handler()->get_registered_geocoders() as $gslug => $geocoder ) :
							$geo_object = jeo_geocode_handler()->initialize_geocoder( $gslug );
							?>

							<?php
							if ( false === $geo_object->get_settings() ) {
								continue;}
							?>

							<tr class="geocoder_options" id="geocoder_options_<?php echo esc_attr( $gslug ); ?>">
								<th scope="row">
										<label for="input_id">
										<?php // translators: %s is the geocoder name. Example: Nominatim options. ?>
										<?php printf( esc_html_x( '%s options', 'geocoder_options', 'jeowp' ), esc_html( $geocoder['name'] ) ); ?>
									</label>
								</th>
							<td>
								<?php if ( ! empty( $geocoder['description'] ) ) : ?>
									<p class="description">
										<?php echo esc_html( $geocoder['description'] ); ?>
									</p>
								<?php endif; ?>
								<?php foreach ( $geo_object->get_settings() as $settings ) : ?>
									<label for="<?php echo esc_attr( $settings['slug'] ); ?>">
										<strong><?php echo esc_html( $settings['name'] ); ?></strong> <br/>
									</label>
									<input name="<?php echo esc_attr( $this->get_field_name( 'geocoders' ) ); ?>[<?php echo esc_attr( $gslug ); ?>][<?php echo esc_attr( $settings['slug'] ); ?>]" type="text" id="<?php echo esc_attr( $settings['slug'] ); ?>" value="<?php echo esc_attr( $this->get_geocoder_option( $gslug, $settings['slug'] ) ); ?>" class="regular-text">
									<p class="description">
									<?php echo esc_html( $settings['description'] ); ?>
									</p>
								<?php endforeach; ?>

								<?php $geo_object->settings_footer( $this ); ?>

							</td>
							</tr>
						<?php endforeach; ?>

						<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
							<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Mapbox', 'jeowp' ); ?></h2></th>
							<td></td>
						</tr>
						<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
							<th scope="row"><label for="mapbox_key"><?php esc_html_e( 'Mapbox API Key', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'mapbox_key' ) ); ?>" placeholder="<?php esc_attr_e( 'Ex. pk.eyJ3...', 'jeowp' ); ?>" type="text" id="mapbox_key" value="<?php echo esc_html( $this->get_option( 'mapbox_key' ) ); ?>" class="regular-text">
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'geocoders' === $current_tab ) : ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="active_geocoder"><?php esc_html_e( 'Geocoder service', 'jeowp' ); ?></label></th>
							<td>
								<select name="<?php echo esc_html( $this->get_field_name( 'active_geocoder' ) ); ?>" id="active_geocoder">
									<?php foreach ( \jeo_geocode_handler()->get_registered_geocoders() as $slug => $geocoder ) : ?>
										<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $this->get_option( 'active_geocoder' ), $slug ); ?>><?php echo esc_html( $geocoder['name'] ); ?></option>
									<?php endforeach; ?>
								</select>
								<p class="description"><?php esc_html_e( 'Select the service used to translate addresses into coordinates. Mapbox requires an API Key configured in the General tab.', 'jeowp' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'customize' === $current_tab ) : ?>
				<h2><?php esc_html_e( 'Typography', 'jeowp' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_font-url"><?php esc_html_e( 'Font URL', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-url' ) ); ?>" type="text" id="jeo_font-url" value="<?php echo esc_html( $this->get_option( 'jeo_font-url' ) ); ?>" class="regular-text" placeholder="Ex. https://fonts.googleapis.com/css2?family=Open+Sans">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-family"><?php esc_html_e( 'Font Name', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-family' ) ); ?>" type="text" id="jeo_font-family" value="<?php echo esc_html( $this->get_option( 'jeo_font-family' ) ); ?>" class="regular-text" placeholder="Ex. Open Sans">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-url-secondary"><?php esc_html_e( 'Secondary Font URL', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-url-secondary' ) ); ?>" type="text" id="jeo_font-url-secondary" value="<?php echo esc_html( $this->get_option( 'jeo_font-url-secondary' ) ); ?>" class="regular-text" placeholder="Ex. https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-family-secondary"><?php esc_html_e( 'Secondary Font Name', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-family-secondary' ) ); ?>" type="text" id="jeo_font-family-secondary" value="<?php echo esc_html( $this->get_option( 'jeo_font-family-secondary' ) ); ?>" class="regular-text" placeholder="Ex. Libre Baskerville">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-font-size"><?php esc_html_e( 'Info button font size (rem)', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-font-size' ) ); ?>" type="number" step="0.1" id="jeo_info-btn-font-size" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-font-size' ) ); ?>" class="small-text">
							</td>
						</tr>
					</tbody>
				</table>

				<hr>
				<h2><?php esc_html_e( 'Colors', 'jeowp' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_primary-color"><?php esc_html_e( 'Primary Color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_primary-color' ) ); ?>" type="color" id="jeo_primary-color" value="<?php echo esc_html( $this->get_option( 'jeo_primary-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-bg"><?php esc_html_e( 'Info button background color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-bg' ) ); ?>" type="color" id="jeo_info-btn-bg" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-color"><?php esc_html_e( 'Info button text color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-color' ) ); ?>" type="color" id="jeo_info-btn-color" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_close-btn-bg"><?php esc_html_e( 'Close button background color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-btn-bg' ) ); ?>" type="color" id="jeo_close-btn-bg" value="<?php echo esc_html( $this->get_option( 'jeo_close-btn-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_close-btn-color"><?php esc_html_e( 'Close button text color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-btn-color' ) ); ?>" type="color" id="jeo_close-btn-color" value="<?php echo esc_html( $this->get_option( 'jeo_close-btn-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_secondary-color"><?php esc_html_e( 'Secondary Color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_secondary-color' ) ); ?>" type="color" id="jeo_secondary-color" value="<?php echo esc_html( $this->get_option( 'jeo_secondary-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-bg"><?php esc_html_e( 'Map widgets background color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-bg' ) ); ?>" type="color" id="jeo_map-widgets-bg" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-color"><?php esc_html_e( 'Map widgets text color', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-color' ) ); ?>" type="color" id="jeo_map-widgets-color" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-bg-hover"><?php esc_html_e( 'Map widgets background color (hover)', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-bg-hover' ) ); ?>" type="color" id="jeo_map-widgets-bg-hover" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-bg-hover' ) ); ?>" class="regular-text">
							</td>
						</tr>
					</tbody>
				</table>

				<hr>
				<h2><?php esc_html_e( 'Map Marker Icons', 'jeowp' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_pin_primary_url"><?php esc_html_e( 'Primary Pin URL', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_pin_primary_url' ) ); ?>" type="url" id="jeo_pin_primary_url" value="<?php echo esc_attr( $this->get_option( 'jeo_pin_primary_url' ) ); ?>" class="regular-text" placeholder="https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-blue.png">
								<p class="description"><?php esc_html_e( 'URL for the primary location marker icon. Leave empty to use the default blue marker.', 'jeowp' ); ?></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_pin_secondary_url"><?php esc_html_e( 'Secondary Pin URL', 'jeowp' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_pin_secondary_url' ) ); ?>" type="url" id="jeo_pin_secondary_url" value="<?php echo esc_attr( $this->get_option( 'jeo_pin_secondary_url' ) ); ?>" class="regular-text" placeholder="https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers/img/marker-icon-grey.png">
								<p class="description"><?php esc_html_e( 'URL for the secondary location marker icon. Leave empty to use the default grey marker.', 'jeowp' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>

				<hr>
				<h2><?php esc_html_e( 'Embed', 'jeowp' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="background_image"><?php esc_html_e( 'Company logo', 'jeowp' ); ?></label></th>
							<td>
								<input id="background_image" type="text" name="<?php echo esc_attr( $this->get_field_name( 'jeo_footer-logo' ) ); ?>" value="<?php echo esc_attr( $this->get_option( 'jeo_footer-logo' ) ); ?>" />
								<p class="description">
									<?php esc_html_e( 'You may use a local or external image URL. Large logos will be scaled down automatically in the embed footer.', 'jeowp' ); ?>
								</p>
								<input id="upload_image_button" type="button" class="button-primary" value="<?php esc_attr_e( 'Insert Image', 'jeowp' ); ?>" />
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'discovery' === $current_tab ) : ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_discovery_page"><?php esc_html_e( 'Discovery page', 'jeowp' ); ?></label></th>
							<td>
								<?php
								wp_dropdown_pages(
									array(
										'name'             => esc_attr( $this->get_field_name( 'discovery_page' ) ),
										'selected'         => absint( $this->get_option( 'discovery_page' ) ),
										'show_option_none' => esc_html__( 'Select a page', 'jeowp' ),
									)
								);
								?>
								<p class="description"><?php esc_html_e( 'Select the page where the JEO Discovery block is located.', 'jeowp' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>
			<?php endif; ?>
		</div>

		<div class="jeo-settings-submit" style="margin-top: 20px;">
			<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jeowp' ); ?>" />
		</div>
	</form>
</div>

<style>
	.jeo-settings-submit input {
		padding: 6px 24px;
	}
	#geolocation_precision {
		vertical-align: middle;
	}
	#geolocation_precision_value {
		display: inline-block;
		min-width: 1em;
		text-align: center;
		font-weight: 600;
		vertical-align: middle;
	}
</style>
<script>
	document.addEventListener( 'DOMContentLoaded', function() {
		var slider = document.getElementById( 'geolocation_precision' );
		var output = document.getElementById( 'geolocation_precision_value' );
		if ( slider && output ) {
			slider.addEventListener( 'input', function() {
				output.textContent = slider.value;
			} );
		}
	} );
</script>
