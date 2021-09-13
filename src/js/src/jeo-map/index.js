import './../map-blocks/storymap-display';
import JeoMap from './class-jeo-map';

( function ( $ ) {
	window.JeoInitMaps = function() {
		$( '.jeomap:not(.storymap)' ).each( function ( i ) {
			/*
				before pass this element to JeoMap constructor
				we need to get the bypassed wp unfiltered_html permission
				getting map_id as a class and creating it as an data element
				check /src/js/src/map-blocks/map-display.js
			*/
			let map_id;
			this.classList.forEach( ( cls ) => {
				if ( cls.indexOf( 'map_id_' ) === 0 ) {
					map_id = cls.substr( 7 );
				}
			} );
			// creating data-map_id if class exists
			// otherwise this is a onetime map
			// check initMap() method at this file
			if ( map_id ) {
				this.dataset['map_id'] = map_id;
			}
			let uuid = Math.floor(Math.random() * 100);
			this.dataset['uui_id'] = uuid;
			if ( ! window.jeomaps ) {
				window.jeomaps = [];
			}
			window.jeomaps[ uuid ] = new JeoMap( this );
		} );
	}
	$( function () {
		window.JeoInitMaps();
	} );
} )( jQuery );

export default JeoMap;
