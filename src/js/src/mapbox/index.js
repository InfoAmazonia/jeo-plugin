//import { __ } from "@wordpress/i18n";

/**
 * to test this, add the following div in the singular.php template of the twentytwenty theme
 * <div class="map" data_center_lat="0" data_center_lon="0" data_initial_zoom="1" data_layers="[2,3,4]" style="width:600px; height: 600px;"></div>
 *
 * then visit any page in your site
 */

var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');
mapboxgl.accessToken = jeo_settings.mapbox_key;

class Mapbox {

	constructor(element) {

		this.args = element.attributes;

		let map = new mapboxgl.Map({
			container: element
		});

		this.map = map;

		map.setZoom( this.getArg('data_initial_zoom') );

		map.setCenter( [this.getArg('data_center_lon'), this.getArg('data_center_lat')] );

		this.getLayers().then( layers => {

			const baseLayer = layers[0];
			baseLayer.addStyle(map);

			map.on('load', () => {
				layers.forEach( (layer, i) => {
					if ( i === 0 ) {
						return;
					} else {
						layer.addLayer(map);
					}
				});
			});

		} );

	}

	getArg(argName) {
		if ( typeof(this.args[argName]) == 'object' ) {
			return this.args[argName].value;
		}
	}

	getLayers() {
		const layerIds = this.getArg('data_layers');

		return new Promise( (resolve, reject) => {

			// TODO: get layers using API...
			resolve([
				new MapboxLayer('layer-1', 'infoamazonia/cjvwvumyx5i851coa874sx97e'),
				new TileLayer('layer-2', 'https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'),
				new TileLayer('layer-4', 'https://wri-tiles.s3.amazonaws.com/glad_prod/tiles/{z}/{x}/{y}.png'),
				new MapboxLayer('layer-3', 'infoamazonia/ck33yfty30o0s1dqpien3edi4')
			]);

		});

	}

}

/**
 * The idea here is that each layer type will have its own class implementing
 * addStyle and addLayer methods.
 *
 * In mapboxGL, a map must have a style, which is a sort of base layer, and they are handled differently,
 * that's why we need two methods
 */

class MapboxLayer {
	constructor (layer_id, style_id, access_token) {
		this.layer_id = layer_id;
		this.style_id = style_id;
		this.access_token = access_token ? access_token : mapboxgl.accessToken;
	}

	addStyle(map) {
		return map.setStyle( 'mapbox://styles/' + this.style_id );
	}

	addLayer(map) {
		return map.addLayer({
			id: this.layer_id,
			source: {
			  type: 'raster',
			  tiles: ['https://api.mapbox.com/styles/v1/'  + this.style_id + '/tiles/256/{z}/{x}/{y}@2x?access_token=' + this.access_token]
			},
			type: 'raster'
		  });
	}
}

class TileLayer {
	constructor(layer_id, url) {
		this.url = url;
		this.layer_id = layer_id;
	}

	addStyle(map) {
		return map.setStyle({
			'version': 8,
			'sources': {
				'raster-tiles': {
					'type': 'raster',
					tiles: [this.url],
					'tileSize': 256
				}
			},
			'layers': [{
				id: this.layer_id,
				type: 'raster',
				source: 'raster-tiles'
			}]
		})
	}

	addLayer(map) {
		return map.addLayer({
			id: this.layer_id,
			source: {
			  type: 'raster',
			  tiles: [this.url],
			  "tileSize": 256
			},
			type: 'raster'
		  });
	}
}

(function($) {
	$(function(){
		$('.map').each(function(i) {
			new Mapbox(this);
		});
	});
})(jQuery);










