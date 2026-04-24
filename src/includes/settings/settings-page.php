<div class="wrap">
	<h1><?php esc_html_e( 'Jeo Settings', 'jeo' ); ?></h1>
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
							<th scope="row"><label for="map_runtime"><?php esc_html_e( 'Rendering library', 'jeo' ); ?></label></th>
							<td>
								<select name="<?php echo esc_html( $this->get_field_name( 'map_runtime' ) ); ?>" id="map_runtime">
									<option value="mapboxgl" <?php selected( $this->get_option( 'map_runtime' ), 'mapboxgl' ); ?>>MapboxGL</option>
									<option value="maplibregl" <?php selected( $this->get_option( 'map_runtime' ), 'maplibregl' ); ?>>MapLibreGL</option>
								</select>
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="enabled_post_types"><?php esc_html_e( 'Enabled Post Types', 'jeo' ); ?></label></th>
							<td>
								<?php
								$post_types         = get_post_types( array( 'public' => true ), 'objects' );
								$enabled_post_types = $this->get_option( 'enabled_post_types' );
								if ( ! is_array( $enabled_post_types ) ) {
									$enabled_post_types = array( 'post' );
								}
								foreach ( $post_types as $post_type ) :
									?>
									<label>
										<input type="checkbox" name="<?php echo esc_html( $this->get_field_name( 'enabled_post_types' ) ); ?>[]" value="<?php echo esc_attr( $post_type->name ); ?>" <?php checked( in_array( $post_type->name, $enabled_post_types ) ); ?> />
										<?php echo esc_html( $post_type->labels->name ); ?>
									</label><br />
								<?php endforeach; ?>
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_zoom"><?php esc_html_e( 'Default map zoom', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_zoom' ) ); ?>" type="number" id="map_default_zoom" value="<?php echo esc_html( $this->get_option( 'map_default_zoom' ) ); ?>" class="small-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_lat"><?php esc_html_e( 'Default map center (latitude)', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lat' ) ); ?>" type="text" id="map_default_lat" value="<?php echo esc_html( $this->get_option( 'map_default_lat' ) ); ?>" class="regular-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="map_default_lon"><?php esc_html_e( 'Default map center (longitude)', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'map_default_lon' ) ); ?>" type="text" id="map_default_lon" value="<?php echo esc_html( $this->get_option( 'map_default_lon' ) ); ?>" class="regular-text">
							</td>
						</tr>

						<tr>
							<th scope="row"><label for="show_storymaps_on_post_archives"><?php esc_html_e( 'Show Storymaps on Post Archives', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'show_storymaps_on_post_archives' ) ); ?>" type="checkbox" id="show_storymaps_on_post_archives" value="1" <?php checked( $this->get_option( 'show_storymaps_on_post_archives' ), 1 ); ?>>
								<span class="description"><?php esc_html_e( 'Enable this to display relevant storymaps at the top of category and tag archive pages.', 'jeo' ); ?></span>
							</td>
						</tr>

						<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
							<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e( 'Mapbox', 'jeo' ); ?></h2></th>
							<td></td>
						</tr>
						<tr class="mapbox_options" style="display: <?php echo $this->get_option( 'map_runtime' ) === 'mapboxgl' ? 'table-row' : 'none'; ?>;">
							<th scope="row"><label for="mapbox_key"><?php esc_html_e( 'Mapbox API Key', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'mapbox_key' ) ); ?>" placeholder="<?php esc_attr_e( 'Ex. pk.eyJ3...', 'jeo' ); ?>" type="text" id="mapbox_key" value="<?php echo esc_html( $this->get_option( 'mapbox_key' ) ); ?>" class="regular-text">
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'geocoders' === $current_tab ) : ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="active_geocoder"><?php esc_html_e( 'Geocoder service', 'jeo' ); ?></label></th>
							<td>
								<select name="<?php echo esc_html( $this->get_field_name( 'active_geocoder' ) ); ?>" id="active_geocoder">
									<?php foreach ( \jeo_geocode_handler()->get_registered_geocoders() as $slug => $geocoder ) : ?>
										<option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $this->get_option( 'active_geocoder' ), $slug ); ?>><?php echo esc_html( $geocoder['name'] ); ?></option>
									<?php endforeach; ?>
								</select>
								<p class="description"><?php esc_html_e( 'Select the service used to translate addresses into coordinates. Mapbox requires an API Key configured in the General tab.', 'jeo' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'customize' === $current_tab ) : ?>
				<h2><?php esc_html_e( 'Typography', 'jeo' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_font-url"><?php esc_html_e( 'Font URL', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-url' ) ); ?>" type="text" id="jeo_font-url" value="<?php echo esc_html( $this->get_option( 'jeo_font-url' ) ); ?>" class="regular-text" placeholder="Ex. https://fonts.googleapis.com/css2?family=Open+Sans">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-family"><?php esc_html_e( 'Font Name', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-family' ) ); ?>" type="text" id="jeo_font-family" value="<?php echo esc_html( $this->get_option( 'jeo_font-family' ) ); ?>" class="regular-text" placeholder="Ex. Open Sans">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-url-secondary"><?php esc_html_e( 'Secondary Font URL', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-url-secondary' ) ); ?>" type="text" id="jeo_font-url-secondary" value="<?php echo esc_html( $this->get_option( 'jeo_font-url-secondary' ) ); ?>" class="regular-text" placeholder="Ex. https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_font-family-secondary"><?php esc_html_e( 'Secondary Font Name', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_font-family-secondary' ) ); ?>" type="text" id="jeo_font-family-secondary" value="<?php echo esc_html( $this->get_option( 'jeo_font-family-secondary' ) ); ?>" class="regular-text" placeholder="Ex. Libre Baskerville">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-font-size"><?php esc_html_e( 'Info button font size (rem)', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-font-size' ) ); ?>" type="number" step="0.1" id="jeo_info-btn-font-size" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-font-size' ) ); ?>" class="small-text">
							</td>
						</tr>
					</tbody>
				</table>

				<hr>
				<h2><?php esc_html_e( 'Colors', 'jeo' ); ?></h2>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_primary-color"><?php esc_html_e( 'Primary Color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_primary-color' ) ); ?>" type="color" id="jeo_primary-color" value="<?php echo esc_html( $this->get_option( 'jeo_primary-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-bg"><?php esc_html_e( 'Info button background color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-bg' ) ); ?>" type="color" id="jeo_info-btn-bg" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_info-btn-color"><?php esc_html_e( 'Info button text color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_info-btn-color' ) ); ?>" type="color" id="jeo_info-btn-color" value="<?php echo esc_html( $this->get_option( 'jeo_info-btn-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_close-btn-bg"><?php esc_html_e( 'Close button background color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-btn-bg' ) ); ?>" type="color" id="jeo_close-btn-bg" value="<?php echo esc_html( $this->get_option( 'jeo_close-btn-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_close-btn-color"><?php esc_html_e( 'Close button text color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_close-btn-color' ) ); ?>" type="color" id="jeo_close-btn-color" value="<?php echo esc_html( $this->get_option( 'jeo_close-btn-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_secondary-color"><?php esc_html_e( 'Secondary Color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_secondary-color' ) ); ?>" type="color" id="jeo_secondary-color" value="<?php echo esc_html( $this->get_option( 'jeo_secondary-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-bg"><?php esc_html_e( 'Map widgets background color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-bg' ) ); ?>" type="color" id="jeo_map-widgets-bg" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-bg' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-color"><?php esc_html_e( 'Map widgets text color', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-color' ) ); ?>" type="color" id="jeo_map-widgets-color" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-color' ) ); ?>" class="regular-text">
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="jeo_map-widgets-bg-hover"><?php esc_html_e( 'Map widgets background color (hover)', 'jeo' ); ?></label></th>
							<td>
								<input name="<?php echo esc_html( $this->get_field_name( 'jeo_map-widgets-bg-hover' ) ); ?>" type="color" id="jeo_map-widgets-bg-hover" value="<?php echo esc_html( $this->get_option( 'jeo_map-widgets-bg-hover' ) ); ?>" class="regular-text">
							</td>
						</tr>
					</tbody>
				</table>
			<?php elseif ( 'discovery' === $current_tab ) : ?>
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row"><label for="jeo_discovery_page"><?php esc_html_e( 'Discovery page', 'jeo' ); ?></label></th>
							<td>
								<?php
								wp_dropdown_pages(
									array(
										'name'             => $this->get_field_name( 'discovery_page' ),
										'selected'         => $this->get_option( 'discovery_page' ),
										'show_option_none' => __( 'Select a page', 'jeo' ),
									)
								);
								?>
								<p class="description"><?php esc_html_e( 'Select the page where the JEO Discovery block is located.', 'jeo' ); ?></p>
							</td>
						</tr>
					</tbody>
				</table>
			<?php endif; ?>
		</div>

		<div class="jeo-settings-submit" style="margin-top: 20px;">
			<input type="submit" class="button-primary" value="<?php esc_attr_e( 'Save Changes', 'jeo' ); ?>" />
		</div>
	</form>
</div>

<style>
	/* Fix WP standard button spacing slightly */
	.jeo-settings-submit input {
		padding: 6px 24px;
	}
</style>