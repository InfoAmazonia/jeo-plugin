<form action="options.php" method="post" class="clear prepend-top">
	<?php settings_fields($this->option_key); ?>
	<div class="wrap">
		<h1><?php _e('Jeo Settings', 'jeo'); ?></h1>
		<h2 id="tabs" class="nav-tab-wrapper">
			<a href="#" class="nav-tab" data-target="general">
				<?php _e('General', 'jeo'); ?>
			</a>
			<a href="#" class="nav-tab" data-target="geocoders">
				<?php _e('Geocoders', 'jeo'); ?>
			</a>
			<a href="#" class="nav-tab" data-target="customize">
				<?php _e('Customize', 'jeo'); ?>
			</a>
		</h2>

		<div id="tab-general" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php _e('Map', 'jeo'); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lat"><?php _e('Default map latitute', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_lat') ); ?>" type="number" step=".1" id="map_default_lat" value="<?php echo esc_html( $this->get_option('map_default_lat') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lng"><?php _e('Default map longitude', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_lng') ); ?>" type="number" step=".1" id="map_default_lng" value="<?php echo esc_html( $this->get_option('map_default_lng') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_zoom"><?php _e('Default map zoom', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_zoom') ); ?>" type="number" id="map_default_zoom" value="<?php echo esc_html( $this->get_option('map_default_zoom') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php _e('API', 'jeo'); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th style="padding: 0; margin: 0" scope="row"><h3 style="padding: 0; margin: 0"><?php _e('Mapbox', 'jeo'); ?></h3></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_key"><?php _e('API Key*', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('mapbox_key') ); ?>" placeholder="<?= __("Ex. pk.eyJ3...", "jeo") ?>" type="text" id="mapbox_key" value="<?php echo esc_html( $this->get_option('mapbox_key') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_username"><?php _e('Username', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('mapbox_username') ); ?>" placeholder="<?= __("", "jeo") ?>" type="text" id="mapbox_username" value="<?php echo esc_html( $this->get_option('mapbox_username') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_private_key"><?php _e('Private API Key', 'jeo'); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name('mapbox_private_key') ); ?>" type="text" placeholder="<?= __("Ex. sk.eyJ1Ij...", "jeo") ?>"  id="mapbox_private_key" value="<?php echo esc_html( $this->get_option('mapbox_private_key') ); ?>" class="regular-text">
							<p><?php _e('This is used for Carto integration only. ', 'jeo'); ?></p>
							<p><?php _e('If you will not use, don\'t worry about it. ', 'jeo'); ?></p>

						</td>
					</tr>



					<tr>
						<th style="padding: 0; margin: 0" scope="row"><h3 style="padding: 0; margin: 0"><?php _e('Carto (optional)', 'jeo'); ?></h3></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="carto_username"><?php _e('Username', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('carto_username') ); ?>" placeholder="<?= __("", "jeo") ?>" type="text" id="carto_username" value="<?php echo esc_html( $this->get_option('carto_username') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="carto_key"><?php _e('API Key', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('carto_key') ); ?>" placeholder="<?= __("Ex. 5a03fe2...", "jeo") ?>" type="text" id="carto_key" value="<?php echo esc_html( $this->get_option('carto_key') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="carto_update_time"><?php _e('Update Interval', 'jeo'); ?></label></th>
						<td>
						<select name="<?php echo esc_html( $this->get_field_name('carto_update_time') ); ?>" id="carto_update_time">
							<option value="daily" <?= $this->get_option('carto_update_time') ===  'daily'? 'selected' : '' ?>>Daily</option>
							<option value="weekly" <?= $this->get_option('carto_update_time') ===  'weekly'? ' selected' : '' ?> <?= empty($this->get_option('carto_update_time'))? ' selected' : '' ?>>Weekly</option>
							<option value="monthly" <?= $this->get_option('carto_update_time') ===  'monthly'? 'selected' : '' ?>>Monthly</option>
						</select>
						</td>
					</tr>

			</tbody>
			</table>
		</div>


		<div id="tab-geocoders" class="tabs-content">
			<table class="form-table">
				<tbody>

					<tr>
						<th scope="row"><label for="active_geocoder_select"><?php _e('Active Geocoder', 'jeo'); ?></label></th>
						<td>
							<select name="<?php echo esc_html( $this->get_field_name('active_geocoder') ); ?>" id="active_geocoder_select">

								<?php foreach ( jeo_geocode_handler()->get_registered_geocoders() as $geocoder ): ?>

									<option selected="<?php selected( $this->get_option('active_geocoder'), $geocoder['slug'] ); ?>" value="<?php echo esc_html( $geocoder['slug'] ); ?>">
										<?php echo esc_html( $geocoder['name']); ?>
									</option>

								<?php endforeach; ?>
							</select>
						</td>
					</tr>


					<?php foreach ( jeo_geocode_handler()->get_registered_geocoders() as $gslug => $geocoder ): $geoObject = jeo_geocode_handler()->initialize_geocoder($gslug); ?>

						<?php if (false === $geoObject->get_settings()) continue; ?>

						<tr class="geocoder_options" id="geocoder_options_<?php echo $gslug; ?>">
							<th scope="row">
								<label for="input_id">
									<?php // translators: %s is the geocoder name. Ex: Nominatim options ?>
									<?php printf( _x('%s options', 'geocoder_options', 'jeo'), $geocoder['name'] ); ?>
								</label>
							</th>
							<td>
								<?php foreach ( $geoObject->get_settings() as $settings ): ?>
									<label for="<?php echo esc_html( $settings['slug'] ); ?>">
										<strong><?php echo esc_html( $settings['name'] ); ?></strong> <br/>
									</label>
									<input name="<?php echo esc_html( $this->get_geocoder_option_field_name($gslug, $settings['slug']) ); ?>" type="text" id="<?php echo esc_html( $settings['slug'] ); ?>" value="<?php echo esc_html( $this->get_geocoder_option($gslug, $settings['slug']) ); ?>" class="regular-text">
									<p class="description">
									<?php echo esc_html( $settings['description'] ); ?>
									</p>
								<?php endforeach; ?>

								<?php $geoObject->settings_footer($this); ?>

							</td>
						</tr>

					<?php endforeach; ?>

				</tbody>
			</table>
		</div>
		<!--

		More button font-size
		More button background-color
		More button color


		Close button background-color
		Close button color

		-->
		<div id="tab-customize" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th > <h3 style="margin: 0"> <?= __("Typography", "jeo") ?> </h3> </th>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography"><?php _e('Typography URL', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography') ); ?>" type="text" id="jeo_typography" value="<?php echo esc_html( $this->get_option('jeo_typography') ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Open+Sans" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name"><?php _e('Typography name', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-name') ); ?>" placeholder="Ex. Open Sans" type="text" id="jeo_typography-name" value="<?php echo esc_html( $this->get_option('jeo_typography-name') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-stories"><?php _e('Secondary Typography URL', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-stories') ); ?>" type="text" id="jeo_typography-stories" value="<?php echo esc_html( $this->get_option('jeo_typography-stories') ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name-stories"><?php _e('Secondary Typography name', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-name-stories') ); ?>" placeholder="Ex. Libre Baskerville" type="text" id="jeo_typography-name-stories" value="<?php echo esc_html( $this->get_option('jeo_typography-name-stories') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-font-size"><?php _e('Info button font-size (rem)', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-font-size') ); ?>" type="text" id="jeo_more-font-size" value="<?php echo esc_html( $this->get_option('jeo_more-font-size') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th > <h3 style="margin: 0"> <?= __("Colors", "jeo") ?> </h3> </th>
					</tr>

					<tr>
						<th scope="row"><label for="jeo_primary-color"><?php _e('Primary color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_primary-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_primary-color" value="<?php echo esc_html( $this->get_option('jeo_primary-color') ); ?>" class="regular-text">
						</td>
					</tr>

					<!-- <tr>
						<th scope="row"><label for="jeo_text-over-primary-color"><?php _e('Text over primary color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_text-over-primary-color') ); ?>" placeholder="Ex. #000000" type="text" id="jeo_text-over-primary-color" value="<?php echo esc_html( $this->get_option('jeo_text-over-primary-color') ); ?>" class="regular-text">
						</td>
					</tr> -->

					<tr>
						<th scope="row"><label for="jeo_more-bkg-color"><?php _e('Info button background color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-bkg-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-bkg-color" value="<?php echo esc_html( $this->get_option('jeo_more-bkg-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-color"><?php _e('Info button color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-color" value="<?php echo esc_html( $this->get_option('jeo_more-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-bkg-color"><?php _e('Close button background color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_close-bkg-color') ); ?>" type="text" id="jeo_close-bkg-color" value="<?php echo esc_html( $this->get_option('jeo_close-bkg-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-color"><?php _e('Close button color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_close-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_close-color" value="<?php echo esc_html( $this->get_option('jeo_close-color') ); ?>" class="regular-text">
						</td>
					</tr>
			</tbody>
			</table>
		</div>


	</div>

	<input type="submit" class="button-primary" value="<?php _e('Save Changes', 'jeo'); ?>" />

</form>
