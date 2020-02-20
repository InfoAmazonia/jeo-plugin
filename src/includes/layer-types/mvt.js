window.JeoLayerTypes.registerLayerType('mvt', {

	addStyle: function(map, attributes) {
		const name = attributes.layer_id
		return map.setStyle({
			'version': 8,
			'sources': {
				[name]: {
					'type': 'vector',
					tiles: [attributes.layer_type_options.url]
				}
			},
			'layers': [{
				id: attributes.layer_id,
				type: attributes.layer_type_options.type,
				source: attributes.layer_id,
				'source-layer': attributes.layer_type_options.source_layer,
			}]
		})
	},

	addLayer: function(map, attributes) {
		map.addSource(attributes.layer_id, {
			'type': 'vector',
			'tiles': [
				attributes.layer_type_options.url
			]
		});

		return map.addLayer({
			'id': attributes.layer_id,
			'type': attributes.layer_type_options.type,
			'source': attributes.layer_id,
			'source-layer': attributes.layer_type_options.source_layer,
			// 'layout': {
			// 	'line-cap': 'round',
			// 	'line-join': 'round'
			// },
			// 'paint': {
			// 	'line-opacity': 0.6,
			// 	'line-color': 'rgb(53, 175, 109)',
			// 	'line-width': 2
			// }
		});

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
					},
					"source_layer": {
						"type": "string",
						"title": "Source layer",
						"description": "Layer to use from a vector tile source. "
					},
					"type": {
						"type": "string",
						"enum": [
							"fill",
							"line",
							"symbol",
							"circle",
							"heatmap",
							"fill-extrusion",
							"hillshade",
							"background"
						]
					}
				}
			});

		});
	}

});
