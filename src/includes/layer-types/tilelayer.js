window.JeoLayerTypes.registerLayerType('tilelayer', {

	addStyle: function(map, attributes) {
		return map.setStyle({
			'version': 8,
			'sources': {
				'raster-tiles': {
					'type': 'raster',
					tiles: [attributes.layer_type_options.url],
					'tileSize': 256
				}
			},
			'layers': [{
				id: attributes.layer_id,
				type: 'raster',
				source: 'raster-tiles'
			}]
		})
	},

	addLayer: function(map, attributes) {
		return map.addLayer({
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [attributes.layer_type_options.url],
			  "tileSize": 256
			},
			type: 'raster'
		});
	},

	getSchema: function() {
		return {
			"type": "object",
			"required": [
				"url"
			],
			"properties": {
				"url": {
					"type": "string",
					"title": "Style ID"
				}
			}
		}
	}

});
