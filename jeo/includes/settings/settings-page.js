( function( $ ) {
	$( function() {
		$( 'a.nav-tab' ).click( function( ev ) {
			ev.preventDefault();
			$( '.tabs-content' ).hide();
			$( 'a.nav-tab' ).removeClass( 'nav-tab-active' );
			$( this ).addClass( 'nav-tab-active' );
			$( '#tab-' + $( this ).data( 'target' ) ).show();
		} );

		$( '.nav-tab:first' ).click();

		$( '#active_geocoder_select' ).change( function() {
			$( 'tr.geocoder_options' ).hide();
			$( '#geocoder_options_' + $( this ).val() ).show();
		} ).change();
	} );
}( jQuery ) );
