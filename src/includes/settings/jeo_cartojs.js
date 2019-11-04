//import mapboxgl from 'mapbox-gl.js';

(function($) {

	$(function(){

		//mapboxgl.accessToken = jeo_settings.mapbox_key;
		var map = new L.Map('map', {
			center: [0,0],
			zoom: 2
		});
//
		L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', {
			attribution: 'Stamen'
		}).addTo(map);

		//L.tileLayer('https://api.mapbox.com/styles/v1/infoamazonia/cjvwvumyx5i851coa874sx97e/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiaW5mb2FtYXpvbmlhIiwiYSI6InItajRmMGsifQ.JnRnLDiUXSEpgn7bPDzp7g', {
		//	attribution: 'Stamen'
		//}).addTo(map);
//
//

		var mvtSource = new L.TileLayer.MVTSource({
			url: "http://spatialserver.spatialdev.com/services/vector-tiles/GAUL_FSP/{z}/{x}/{y}.pbf",
			//url: "https://api.mapbox.com/v4/infoamazonia/cjvwvumyx5i851coa874sx97e/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaW5mb2FtYXpvbmlhIiwiYSI6InItajRmMGsifQ.JnRnLDiUXSEpgn7bPDzp7g",
			//url: "https://api.mapbox.com/styles/v1/infoamazonia/cjvwvumyx5i851coa874sx97e/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaW5mb2FtYXpvbmlhIiwiYSI6InItajRmMGsifQ.JnRnLDiUXSEpgn7bPDzp7g",
			debug: false,
			clickableLayers: ["GAUL0"],
			getIDForLayerFeature: function(feature) {
				return feature.properties.id;
			}

		});

		map.addLayer(mvtSource);


		cartodb.createLayer(map, 'https://infoamazonia.carto.com/api/v2/viz/1bf76e3d-e39b-4851-a26b-27883b0ca073/viz.json')
			.addTo(map)
			.on('done', function(layer) {
				//do stuff
			})
			.on('error', function(err) {
				alert("some error occurred: " + err);
			});

        // this does not work
		//const viz = new carto.Viz('https://infoamazonia.carto.com/api/v2/viz/66b3adc0-0acf-45cc-9c0f-de6f39e05795/viz.json');




		// Vis
		//x = cartodb.createVis('map', 'https://infoamazonia.carto.com/api/v2/viz/1bf76e3d-e39b-4851-a26b-27883b0ca073/viz.json')
		//.on('done', function(vis, layers) {
		//	console.log(vis);
		//	console.log(layers);
		//})
		//;


		// https://gufalei.carto.com/api/v2/viz/cd9a9712-c21b-11e6-ae28-0e3ff518bd15/viz.json
		// 66b3adc0-0acf-45cc-9c0f-de6f39e05795



	});

})(jQuery);
