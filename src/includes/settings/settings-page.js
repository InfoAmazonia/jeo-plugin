(function ($) {
	$(function () {
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


		var mediaUploader;
		$('#upload_image_button').click(function (e) {
			e.preventDefault();
			if (mediaUploader) {
				mediaUploader.open();
				return;
			}
			mediaUploader = wp.media.frames.file_frame = wp.media({
				title: 'Choose Image',
				button: {
					text: 'Choose Image'
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
