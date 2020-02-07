window.JeoLayerTypes.registerLayerType('tilelayer', {

	addStyle: function(map, attributes) {
		const name = attributes.layer_id
		return map.setStyle({
			'version': 8,
			'glyphs': 'mapbox://fonts/' + jeo_settings.mapbox_username + '/{fontstack}/{range}.pbf',
			'sources': {
				[name]: {
					'type': 'raster',
					tiles: [attributes.layer_type_options.url],
					'tileSize': 256
				}
			},
			'layers': [{
				id: attributes.layer_id,
				type: 'raster',
				source: attributes.layer_id
			}]
		})
	},

	addLayer: function(map, attributes) {
		var layer = {
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [attributes.layer_type_options.url],
			  "tileSize": 256
			},
			type: 'raster'
		};
		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none'
			};
		}
		return Promise.resolve(map.addLayer(layer));
	},

	getSchema: function(attributes) {
		return new Promise( function(resolve, reject) {

			resolve({
				"type": "object",
				"required": [
					"url"
				],
				"properties": {
					"url": {
						"type": "string",
						"title": "URL"
					}
				}
			});

		});
	}

});
