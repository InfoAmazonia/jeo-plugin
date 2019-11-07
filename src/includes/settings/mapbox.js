//import mapboxgl from 'mapbox-gl.js';

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

import carto from '@carto/carto-vl';
import { arrayExpression, catchClause } from '@babel/types';
//import { keyToTestName } from 'jest-snapshot/build/utils';


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
		//const source = new carto.source.Dataset('unidades_conservacao');
		const source = new carto.source.SQL('SELECT * FROM unidades_conservacao');
		console.log(source);


		$.ajax({
			url: 'https://infoamazonia.carto.com/api/v2/sql',
			data: {
				api_key: jeo_settings.carto_key,
				q: "SELECT CDB_ColumnNames('unidades_conservacao')",

			},
			success: function(results) {
				console.log('columns');
				var columns = results.rows.map(r => {
					//console.log(r);
					return r.cdb_columnnames;
				})

				//const vizOptions = {
				//	color: 'grey',
				//	width: 4
				//}
//
				//columns.forEach(e => {
				//	vizOptions['@' + e] = '$' + e;
				//})
//
				//const viz = new carto.Viz( new carto.vizSpec(vizOptions));

				let vizOptions = `color: grey, width: 4`;

				columns.forEach(e => {
					vizOptions += ', @' + e + ': $' + e;
				});

				const viz = new carto.Viz( vizOptions );

				const layer = new carto.Layer('layer', source, viz);

				layer.addTo(map);

				const interactivity = new carto.Interactivity(layer, {autoChangePointer: false});

				interactivity.on('featureClick', featureEvent => {
					console.log(featureEvent);
					featureEvent.features.forEach((feature) => {
						//const name = feature.variables.name.value;
						//const popK = feature.variables.popK.value.toFixed(0);
						//console.log(`You have clicked on ${name} with a population of ${popK}K`);
						const coords = featureEvent.coordinates;
						let html = '';
						columns.forEach(field => {
							if ( feature.variables.hasOwnProperty(field)) {
								try {
									html += '<p><strong>' + field + ': </strong>' + feature.variables[field].value + '</p>';
								} catch(e) {
									console.log('err');
								}

							}
						});

						// Populate the popup and set its coordinates
						// based on the feature found.
						popupfrigorificos.setLngLat([coords.lng, coords.lat])
							.setHTML(html)
							.addTo(map);


					});
				});

				interactivity.on('featureEnter', () => {
					map.getCanvas().style.cursor = 'pointer';
				});
				interactivity.on('featureLeave', () => {
					map.getCanvas().style.cursor = '';
				});


			}

		});

		//const viz = new carto.Viz(`
        //    color: grey
		//	width: 4,
		//	@nome: $nome
		//`);

        // this does not work
        //const viz = new carto.Viz('https://infoamazonia.carto.com/api/v2/viz/66b3adc0-0acf-45cc-9c0f-de6f39e05795/viz.json');




		// https://gufalei.carto.com/api/v2/viz/cd9a9712-c21b-11e6-ae28-0e3ff518bd15/viz.json
		// 66b3adc0-0acf-45cc-9c0f-de6f39e05795





		// Define map layer
		//const layer = new carto.Layer('layer', source, viz);
		// Add map layer
		//layer.addTo(map);

		//const interactivity = new carto.Interactivity(layer);

		//interactivity.on('featureClick', featureEvent => {
		//	console.log(featureEvent);
		//	featureEvent.features.forEach((feature) => {
		//		//const name = feature.variables.name.value;
		//		//const popK = feature.variables.popK.value.toFixed(0);
		//		//console.log(`You have clicked on ${name} with a population of ${popK}K`);
		//		console.log(feature.variables.nome.value);
		//	});
		//});

		// Create a popup, but don't add it to the map yet.
		var popupfrigorificos = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: true
		});

		var clickableLayerId = 'imazon-frigorificos-ativo';

		map.on('click', clickableLayerId, function(e) {
			// Change the cursor style as a UI indicator.
			map.getCanvas().style.cursor = 'pointer';

			var feature = e.features[0];

			var coordinates = feature.geometry.coordinates.slice();

			// Ensure that if the map is zoomed out such that multiple
			// copies of the feature are visible, the popup appears
			// over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}

			// there might be a better way to do this
			// get the vector layer
			var sourceLayerName = map.style._layers[clickableLayerId].sourceLayer;
			// I believe vectorLayersIds and vectorLayers are in the same order
			var vectorLayer = map.getSource('composite').vectorLayers[ map.getSource('composite').vectorLayerIds.indexOf(sourceLayerName) ];

			var html = '';

			Object.keys(vectorLayer.fields).forEach(field => {
				if ( feature.properties.hasOwnProperty(field) ) {
					html += '<p><strong>' + field + ': </strong>' + feature.properties[field] + '</p>';
				}
			});

			// Populate the popup and set its coordinates
			// based on the feature found.
			popupfrigorificos.setLngLat([e.lngLat.lng, e.lngLat.lat])
				.setHTML(html)
				.addTo(map);
		});
		map.on('mouseenter', clickableLayerId, function () {
			map.getCanvas().style.cursor = 'pointer';
		});
		map.on('mouseleave', clickableLayerId, function() {
			map.getCanvas().style.cursor = '';
			//popupfrigorificos.remove();
		});

		map.on('load', function(e) {
			let html = '<h3>Mapbox vector layers</h3>';

			map.getSource('composite').vectorLayers.forEach(element => {
				html += '<h4>' + element.id + '</h4>';
				html += '<ul>';
				Object.keys( element.fields ).forEach(field => {
					html += '<li>' + field + '</li>';
				})
				html += '</ul>';
			});

			$('#map-details').html(html);




		});


		$('#test').click(function() {
			//alert(1);
			console.log(map.queryRenderedFeatures());
			console.log(carto);
			return false;
		});



	});

})(jQuery);
