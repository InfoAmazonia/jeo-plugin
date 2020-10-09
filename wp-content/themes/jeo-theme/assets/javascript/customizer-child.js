( function( $ ) {
	wp.customize.bind( 'ready', function() {
		// Only show the color hue control when there's a custom primary color.
		wp.customize( 'search_background_option', function( setting ) {
			wp.customize.control( 'search_icon_bg_color', function( control ) {
				const visibility = function() {
					if ( 'custom' === setting.get() ) {
						control.container.slideDown( 180 );
					} else {
						control.container.slideUp( 180 );
					}
				};

				visibility();
				setting.bind( visibility );
			} );			
		} );

		// Only show image selector when the custom option is selected
		wp.customize( 'decoration_style', function( setting ) {
			wp.customize.control( 'decoration_style_background_image', function( control ) {
				const visibility = function() {
					if ( 'custom' === setting.get() ) {
						control.container.slideDown( 180 );
					} else {
						control.container.slideUp( 180 );
					}
				};

				visibility();
				setting.bind( visibility );
			} );			
		} );

		// Only show decoration marker color picker when the custom option is not selected
		wp.customize( 'decoration_style', function( setting ) {
			wp.customize.control( 'decoration_marker_color', function( control ) {
				const visibility = function() {
					if ( 'custom' !== setting.get() ) {
						control.container.slideDown( 180 );
					} else {
						control.container.slideUp( 180 );
					}
				};

				visibility();
				setting.bind( visibility );
			} );			
		} );

	} );
} )( jQuery );
