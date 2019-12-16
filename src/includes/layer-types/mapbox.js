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

	getSchema: function(attributes) {

		var self = this;

		return new Promise( function(resolve, reject) {

			var form_layers = [];

			self._getStyleLayers(attributes).then( function(layers) {

				if (layers.vector_layers) {
					//console.log(layers.vector_layers);
					for (var l=0; l<layers.vector_layers.length; l++) {
						var new_layer = {
							name: layers.vector_layers[l].source_name,
							fields: layers.vector_layers[l].fields
						};
						form_layers.push(new_layer);
					}
				}

				var base_schema = {
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
				};

				// TODO: merge form_layers to the schema
				console.log(form_layers);

				resolve(base_schema);
			} )
			.catch( function(error) {
				reject(error)
			});

		});

	},

	_styleDefinitions: [],
	_styleLayers: [],

	_getStyleDefinition: function(attributes) {

		var self = this;

		return new Promise( function(resolve, reject) {

			// cache
			if ( self._styleDefinitions[ attributes.layer_id ] ) {
				resolve( self._styleDefinitions[ attributes.layer_id ] );
			}

			const access_token = typeof(attributes.layer_type_options.access_token) != 'undefined' ? attributes.layer_type_options.access_token : window.mapboxgl.accessToken;

			jQuery.get(
				'https://api.mapbox.com/styles/v1/' + attributes.layer_type_options.style_id + '?access_token=' + access_token,
				function(data) {

					self._styleDefinitions[ attributes.layer_id ] = data;
					resolve(data);

				}
			);

		});
	},

	_getStyleLayers: function(attributes) {

		var self = this;

		return new Promise( function(resolve, reject) {

			// cache
			if ( self._styleLayers[ attributes.layer_id ] ) {
				resolve( self._styleLayers[ attributes.layer_id ] );
			}



			const access_token = typeof(attributes.layer_type_options.access_token) != 'undefined' ? attributes.layer_type_options.access_token : window.mapboxgl.accessToken;

			self._getStyleDefinition(attributes).then( function(styleDefinition) {

				const composite = self._styleDefinitions[ attributes.layer_id ].sources.composite;

				if ( typeof composite === 'object' ) {

					const layers = composite.url.replace('mapbox://', '');
					//console.log(composite);
					jQuery.get(
						'https://api.mapbox.com/v4/' + layers + '.json?secure&access_token=' + access_token,
						function(data) {

							self._styleLayers[ attributes.layer_id ] = data;
							resolve(data);

						}
					);

				} else {
					reject('No composite source');
				}


			});



		});
	}


});
