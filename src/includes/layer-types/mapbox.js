window.JeoLayerTypes.registerLayerType('mapbox', {

	addStyle: function(map, attributes) {
		return map.setStyle( 'mapbox://styles/' + attributes.layer_type_options.style_id );
	},

	addLayer: function(map, attributes, mapboxgl) {
		const access_token = typeof(attributes.layer_type_options.access_token) != 'undefined' ? attributes.layer_type_options.access_token : window.mapboxgl.accessToken;
		return map.addLayer({
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [ 'https://api.mapbox.com/styles/v1/'  + attributes.layer_type_options.style_id + '/tiles/256/{z}/{x}/{y}@2x?access_token=' + access_token ]
			},
			type: 'raster'
		});
	}

});
