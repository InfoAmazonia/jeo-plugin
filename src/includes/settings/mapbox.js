//import mapboxgl from 'mapbox-gl.js';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

import carto from '@carto/carto-vl';


(function($) {

	$(function(){

		mapboxgl.accessToken = jeo_settings.mapbox_key;
		var map = new mapboxgl.Map({
			container: 'test-mapbox',
			//style: 'mapbox://styles/mapbox/streets-v11',

			style: 'mapbox://styles/infoamazonia/cjvwvumyx5i851coa874sx97e',
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

		//alert(3);

		carto.setDefaultAuth({
            username: 'infoamazonia',
            apiKey: jeo_settings.carto_key
        });


		//const source = new carto.source.Dataset('populated_places');
		const source = new carto.source.Dataset('australia_gccsa');


		const viz = new carto.Viz(`
            color: grey
            width: 4
		`);

        // this does not work
        //const viz = new carto.Viz('https://infoamazonia.carto.com/api/v2/viz/66b3adc0-0acf-45cc-9c0f-de6f39e05795/viz.json');




		// https://gufalei.carto.com/api/v2/viz/cd9a9712-c21b-11e6-ae28-0e3ff518bd15/viz.json
		// 66b3adc0-0acf-45cc-9c0f-de6f39e05795

		// Define map layer
        const layer = new carto.Layer('layer', source, viz);

        // Add map layer
		layer.addTo(map);
		$('#test').click(function() {
			//alert(1);
			console.log(map.queryRenderedFeatures());
			console.log(carto);
			return false;
		});



	});

})(jQuery);
