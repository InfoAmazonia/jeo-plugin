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
		</h2>

		<div id="tab-general" class="tabs-content">

			<p>
				Coming soon...
			</p>

		</div>


		<div id="tab-geocoders" class="tabs-content">


		<table class="form-table">
			<tbody>

				<tr>
					<th scope="row"><label for="active_geocoder_select"><?php _e('Active Geocoder', 'jeo'); ?></label></th>
					<td>
						<select name="<?php echo $this->get_field_name('active_geocoder'); ?>" id="active_geocoder_select">

							<?php foreach ( jeo_geocode_handler()->get_registered_geocoders() as $geocoder ): ?>

								<option selected="<?php selected( $this->get_option('active_geocoder'), $geocoder['slug'] ); ?>" value="<?php echo $geocoder['slug']; ?>">
									<?php echo $geocoder['name']; ?>
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
								<label for="<?php echo $settings['slug']; ?>">
									<strong><?php echo $settings['name']; ?></strong> <br/>
								</label>
								<input name="<?php echo $this->get_geocoder_option_field_name($gslug, $settings['slug']); ?>" type="text" id="<?php echo $settings['slug']; ?>" value="<?php echo htmlspecialchars( $this->get_geocoder_option($gslug, $settings['slug']) ); ?>" class="regular-text">
								<p class="description">
								<?php echo $settings['description']; ?>
								</p>
							<?php endforeach; ?>

							<?php $geoObject->settings_footer($this); ?>

						</td>
					</tr>

				<?php endforeach; ?>

			</tbody>
		</table>


		</div>


	</div>

	<input type="submit" class="button-primary" value="<?php _e('Save Changes', 'jeo'); ?>" />

</form>
