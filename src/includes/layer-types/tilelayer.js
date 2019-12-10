import JeoLayerTypes from './JeoLayerTypes'

JeoLayerTypes.registerLayerType('tilelayer', {

	addStyle: (map, attributes) => {
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

	addLayer: (map, attributes) => {
		return map.addLayer({
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [attributes.layer_type_options.url],
			  "tileSize": 256
			},
			type: 'raster'
		});
	}

});
