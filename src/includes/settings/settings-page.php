<form action="options.php" method="post" class="clear prepend-top">
	<?php settings_fields($this->option_key); ?>
	<div class="wrap">
		<h1><?php esc_html_e('Jeo Settings', 'jeo'); ?></h1>
		<h2 id="tabs" class="nav-tab-wrapper">
			<a href="#" class="nav-tab" data-target="general">
				<?php esc_html_e('General', 'jeo'); ?>
			</a>
			<a href="#" class="nav-tab" data-target="geocoders">
				<?php esc_html_e('Geocoders', 'jeo'); ?>
			</a>
			<a href="#" class="nav-tab" data-target="customize">
				<?php esc_html_e('Customize', 'jeo'); ?>
			</a>
		</h2>

		<div id="tab-general" class="tabs-content">
			<table class="form-table">
				<tbody>
					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e('Map', 'jeo'); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lat"><?php esc_html_e('Default map latitute', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_lat') ); ?>" type="number" step=".00000000000001" id="map_default_lat" value="<?php echo esc_html( $this->get_option('map_default_lat') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_lng"><?php esc_html_e('Default map longitude', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_lng') ); ?>" type="number" step=".00000000000001" id="map_default_lng" value="<?php echo esc_html( $this->get_option('map_default_lng') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="map_default_zoom"><?php esc_html_e('Default map zoom', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('map_default_zoom') ); ?>" type="number" step=".00000000000001" id="map_default_zoom" value="<?php echo esc_html( $this->get_option('map_default_zoom') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e('Post types', 'jeo'); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="show_storymaps_on_post_archives"><?php esc_html_e('Show story maps on post archives pages', 'jeo'); ?></label></th>
						<td>
						<input type="checkbox" name="<?php echo esc_html( $this->get_field_name('show_storymaps_on_post_archives') ); ?>" value="1" <?php checked(1, $this->get_option('show_storymaps_on_post_archives'), true); ?> />
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="enabled_post_types"><?php esc_html_e('Enabled Post Types. Default: post,storymap', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('enabled_post_types') ); ?>" placeholder="<?php esc_attr_e("Post types separated by comma, Ex: map,post,page ", "jeo") ?>" type="text" id="enabled_post_types" value="<?php echo esc_textarea( implode( ',' , $this->get_option('enabled_post_types') ) ); ?>" class="regular-text">
						</td>
					</tr>


					<tr>
						<th scope="row"><h2 style="padding: 0; margin: 0"><?php esc_html_e('API', 'jeo'); ?></h2></th>
						<td>
						</td>
					</tr>

					<tr>
						<th style="padding: 0; margin: 0" scope="row"><h3 style="padding: 0; margin: 0"><?php esc_html_e('Mapbox', 'jeo'); ?></h3></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_key"><?php esc_html_e('API Key*', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('mapbox_key') ); ?>" placeholder="<?php esc_attr_e("Ex. pk.eyJ3...", "jeo") ?>" type="text" id="mapbox_key" value="<?php echo esc_html( $this->get_option('mapbox_key') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_username"><?php esc_html_e('Username', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('mapbox_username') ); ?>" placeholder="" type="text" id="mapbox_username" value="<?php echo esc_html( $this->get_option('mapbox_username') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="mapbox_private_key"><?php esc_html_e('Private API Key', 'jeo'); ?></label></th>
						<td>
							<input name="<?php echo esc_html( $this->get_field_name('mapbox_private_key') ); ?>" type="text" placeholder="<?php esc_attr_e("Ex. sk.eyJ1Ij...", "jeo") ?>"  id="mapbox_private_key" value="<?php echo esc_html( $this->get_option('mapbox_private_key') ); ?>" class="regular-text">
							<p><?php esc_html_e('This is used for Carto integration only. ', 'jeo'); ?></p>
							<p><?php esc_html_e('If you will not use, don\'t worry about it. ', 'jeo'); ?></p>

						</td>
					</tr>



					<tr>
						<th style="padding: 0; margin: 0" scope="row"><h3 style="padding: 0; margin: 0"><?php esc_html_e('Carto (optional)', 'jeo'); ?></h3></th>
						<td>
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="carto_username"><?php esc_html_e('Username', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('carto_username') ); ?>" placeholder="" type="text" id="carto_username" value="<?php echo esc_html( $this->get_option('carto_username') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th scope="row"><label for="carto_key"><?php esc_html_e('API Key', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('carto_key') ); ?>" placeholder="<?php esc_attr_e("Ex. 5a03fe2...", "jeo") ?>" type="text" id="carto_key" value="<?php echo esc_html( $this->get_option('carto_key') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="carto_update_time"><?php esc_html_e('Update Interval', 'jeo'); ?></label></th>
						<td>
						<select name="<?php echo esc_html( $this->get_field_name('carto_update_time') ); ?>" id="carto_update_time">
							<option value="daily" <?= $this->get_option('carto_update_time') ===  'daily'? 'selected' : '' ?>>Daily</option>
							<option value="weekly" <?= $this->get_option('carto_update_time') ===  'weekly'? ' selected' : '' ?> <?= empty($this->get_option('carto_update_time'))? ' selected' : '' ?>>Weekly</option>
							<option value="monthly" <?= $this->get_option('carto_update_time') ===  'monthly'? 'selected' : '' ?>>Monthly</option>
						</select>


						</td>
					</tr>

					<tr>
						<th scope="row"></th>
						<td>
							<?php esc_html_e('After saving the setting, the update will only be made from the current date plus the interval selected. <br> For instance, if the selected interval is "Weekly" and a update is made to "Monthly" the next update will be made only from the current date plus one month.') ?>
							<br>
							<?php esc_html_e('We recommend the plugin WP Crontrol, that allows you to run cron tasks whenever you want.') ?>
						</td>
					</tr>
			</tbody>
			</table>
		</div>


		<div id="tab-geocoders" class="tabs-content">
			<table class="form-table">
				<tbody>

					<tr>
						<th scope="row"><label for="active_geocoder_select"><?php esc_html_e('Active Geocoder', 'jeo'); ?></label></th>
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
									<?php printf( esc_html_x('%s options', 'geocoder_options', 'jeo'), $geocoder['name'] ); ?>
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
						<th > <h3 style="margin: 0"> <?php esc_html_e('Typography', 'jeo') ?> </h3> </th>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography"><?php esc_html_e('Typography URL', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography') ); ?>" type="text" id="jeo_typography" value="<?php echo esc_html( $this->get_option('jeo_typography') ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Open+Sans" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name"><?php esc_html_e('Typography name', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-name') ); ?>" placeholder="Ex. Open Sans" type="text" id="jeo_typography-name" value="<?php echo esc_html( $this->get_option('jeo_typography-name') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-stories"><?php esc_html_e('Secondary Typography URL', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-stories') ); ?>" type="text" id="jeo_typography-stories" value="<?php echo esc_html( $this->get_option('jeo_typography-stories') ); ?>" placeholder="Ex. https://fonts.googleapis.com/css2?family=Libre+Baskerville&display=swap" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_typography-name-stories"><?php esc_html_e('Secondary Typography name', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_typography-name-stories') ); ?>" placeholder="Ex. Libre Baskerville" type="text" id="jeo_typography-name-stories" value="<?php echo esc_html( $this->get_option('jeo_typography-name-stories') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-font-size"><?php esc_html_e('Info button font-size (rem)', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-font-size') ); ?>" type="text" id="jeo_more-font-size" value="<?php echo esc_html( $this->get_option('jeo_more-font-size') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th > <h3 style="margin: 0"> <?php esc_html_e('Colors', 'jeo') ?> </h3> </th>
					</tr>

					<tr>
						<th scope="row"><label for="jeo_primary-color"><?php esc_html_e('Primary color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_primary-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_primary-color" value="<?php echo esc_html( $this->get_option('jeo_primary-color') ); ?>" class="regular-text">
						</td>
					</tr>

					<!-- <tr>
						<th scope="row"><label for="jeo_text-over-primary-color"><?php esc_html_e('Text over primary color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_text-over-primary-color') ); ?>" placeholder="Ex. #000000" type="text" id="jeo_text-over-primary-color" value="<?php echo esc_html( $this->get_option('jeo_text-over-primary-color') ); ?>" class="regular-text">
						</td>
					</tr> -->

					<tr>
						<th scope="row"><label for="jeo_more-bkg-color"><?php esc_html_e('Info button background color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-bkg-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-bkg-color" value="<?php echo esc_html( $this->get_option('jeo_more-bkg-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_more-color"><?php esc_html_e('Info button color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_more-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_more-color" value="<?php echo esc_html( $this->get_option('jeo_more-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-bkg-color"><?php esc_html_e('Close button background color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_close-bkg-color') ); ?>" type="text" id="jeo_close-bkg-color" value="<?php echo esc_html( $this->get_option('jeo_close-bkg-color') ); ?>" class="regular-text">
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="jeo_close-color"><?php esc_html_e('Close button color', 'jeo'); ?></label></th>
						<td>
						<input name="<?php echo esc_html( $this->get_field_name('jeo_close-color') ); ?>" placeholder="Ex. #ffffff" type="text" id="jeo_close-color" value="<?php echo esc_html( $this->get_option('jeo_close-color') ); ?>" class="regular-text">
						</td>
					</tr>

					<tr>
						<th><h3 style="margin: 0"><?php esc_html_e("Embed", "jeo") ?></h3></th>
					</tr>

					<tr>
						<th scope="row"><label for="background_image"><?php esc_html_e('Company logo', 'jeo'); ?></label></th>
						<td>
							<input id="background_image" type="text" name="<?php echo esc_html( $this->get_field_name('jeo_footer-logo') ); ?>" value="<?php echo esc_html( $this->get_option('jeo_footer-logo') ); ?>" />
							<input id="upload_image_button" type="button" class="button-primary" value="Insert Image" />
						</td>
					</tr>
			</tbody>
			</table>
		</div>


	</div>

	<input type="submit" class="button-primary" value="<?php esc_attr_e('Save Changes', 'jeo'); ?>" />

</form>
