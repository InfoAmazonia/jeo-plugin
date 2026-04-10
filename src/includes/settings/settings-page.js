(function ($) {
	const { __ } = wp.i18n;

	$(function () {
		function toggleMapboxSettings() {
			const shouldShow = $('#map_runtime').val() === 'mapboxgl';
			$('.jeo-mapbox-settings').toggle(shouldShow);
		}

		$('a.nav-tab').click(function (ev) {
			ev.preventDefault();
			$('.tabs-content').hide();
			$('a.nav-tab').removeClass('nav-tab-active');
			$(this).addClass('nav-tab-active');
			$('#tab-' + $(this).data('target')).show();
		});

		$('.nav-tab:first').click();

		$('#active_geocoder_select').change(function () {
			$('tr.geocoder_options').hide();
			$('#geocoder_options_' + $(this).val()).show();
		}).change();

		$('#map_runtime').change(toggleMapboxSettings);
		toggleMapboxSettings();


		var mediaUploader;
		$('#upload_image_button').click(function (e) {
			e.preventDefault();
			if (mediaUploader) {
				mediaUploader.open();
				return;
			}
			mediaUploader = wp.media.frames.file_frame = wp.media({
				title: __( 'Choose Image', 'jeo' ),
				button: {
					text: __( 'Choose Image', 'jeo' )
				}, multiple: false
			});
			mediaUploader.on('select', function () {
				var attachment = mediaUploader.state().get('selection').first().toJSON();
				$('#background_image').val(attachment.url);
			});
			mediaUploader.open();
		});
	});

}(jQuery));
