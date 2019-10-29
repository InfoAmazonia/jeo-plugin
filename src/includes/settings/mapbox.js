//import mapboxgl from 'mapbox-gl.js';
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');




(function($) {

	$(function(){

		mapboxgl.accessToken = jeo_settings.mapbox_key;
		var map = new mapboxgl.Map({
			container: 'test-mapbox',
			style: 'mapbox://styles/mapbox/streets-v11',
			// style: {
			// 	"version": 8,
			// 	"sources": {
			// 		"raster-tiles": {
			// 		"type": "raster",
			// 		"tiles": ["https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg"],
			// 		"tileSize": 256,
			// 		"attribution": 'Map tiles by <a target="_top" rel="noopener" href="http://stamen.com">Stamen Design</a>, under <a target="_top" rel="noopener" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" rel="noopener" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
			// 		}
			// 	},
			// 	"layers": [{
			// 		"id": "simple-tiles",
			// 		"type": "raster",
			// 		"source": "raster-tiles",
			// 		"minzoom": 0,
			// 		"maxzoom": 22
			// 	}]
			// }
		});


	});

})(jQuery);
