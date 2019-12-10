import JeoLayerTypes from './JeoLayerTypes'

JeoLayerTypes.registerLayerType('mapbox', {

	addStyle: (map, attributes) => {
		return map.setStyle( 'mapbox://styles/' + attributes.layer_type_options.style_id );
	},

	addLayer: (map, attributes) => {
		const access_token = typeof(attributes.layer_type_options.access_token) != 'undefined' ? '?access_token=' + attributes.layer_type_options.access_token : '';
		return map.addLayer({
			id: attributes.layer_id,
			source: {
			  type: 'raster',
			  tiles: [ 'https://api.mapbox.com/styles/v1/'  + attributes.layer_type_options.style_id + '/tiles/256/{z}/{x}/{y}@2x' + access_token ]
			},
			type: 'raster'
		});
	}

});
