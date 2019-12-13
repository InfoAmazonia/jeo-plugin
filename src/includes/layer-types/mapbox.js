window.JeoLayerTypes.registerLayerType('mapbox', {

	addStyle: function(map, attributes) {
		return map.setStyle( 'mapbox://styles/' + attributes.layer_type_options.style_id );
	},

	addLayer: function(map, attributes) {
		const access_token = typeof(attributes.layer_type_options.access_token) != 'undefined' ? attributes.layer_type_options.access_token : window.mapboxgl.accessToken;
		var layer = {
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [ 'https://api.mapbox.com/styles/v1/'  + attributes.layer_type_options.style_id + '/tiles/256/{z}/{x}/{y}@2x?access_token=' + access_token ]
			},
			type: 'raster'
		};
		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none'
			};
		}
		return map.addLayer(layer);
	},

	getSchema: function() {
		return {
			"type": "object",
			"required": [
				"style_id"
			],
			"properties": {
				"style_id": {
					"type": "string",
					"title": "Style ID"
				},
				"access_token": {
					"type": "string",
					"title": "Access token",
					"description": "Optional. If this layer needs a different access token from the one set in Settings, inform it here."
				}
			}
		}
	}

});
