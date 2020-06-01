window.JeoLayerTypes.registerLayerType( 'mapbox-tileset', {

	addStyle( map, attributes ) {
		const name = attributes.layer_id;
		let tileset_id = attributes.layer_type_options.tileset_id;

		if ( ! tileset_id.includes( 'mapbox://' ) ) {
			tileset_id = 'mapbox://' + tileset_id;
		}

		return map.setStyle( {
			version: 8,
			sources: {
				[ name ]: {
					type: attributes.layer_type_options.style_source_type,
					url: 'mapbox://' + attributes.layer_type_options.tileset_id,
				},
			},
			layers: [ {
				id: attributes.layer_id,
				type: attributes.layer_type_options.type,
				source: attributes.layer_id,
				'source-layer': attributes.layer_type_options.source_layer,
			} ],
		} );
	},

	addLayer( map, attributes ) {
		let tileset_id = attributes.layer_type_options.tileset_id;

		if ( ! tileset_id.includes( 'mapbox://' ) ) {
			tileset_id = 'mapbox://' + tileset_id;
		}

		map.addSource( attributes.layer_id, {
			type: attributes.layer_type_options.style_source_type,
			url: 'mapbox://' + attributes.layer_type_options.tileset_id,
		} );

		return map.addLayer( {
			id: attributes.layer_id,
			type: attributes.layer_type_options.type,
			source: attributes.layer_id,
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
		} );
	},

	getSchema( attributes ) {
		return new Promise( function( resolve ) {
			resolve( {
				type: 'object',
				required: [
					'tileset_id', 'style_source_type', 'type',
				],
				properties: {
					tileset_id: {
						type: 'string',
						title: 'Tileset ID',
						description: 'Example: username.tilesetid or mapbox://username.tilesetid',
					},
					style_source_type: {
						title: 'Style Source Type',
						description: 'Which data the map should display',
						type: 'string',
						enum: [
							'vector',
							'raster',
							'raster-dem',
						],
					},
					source_layer: {
						type: 'string',
						title: 'Source layer',
						description: 'Layer to use from a vector tile source. ',
					},
					type: {
						title: 'Layer Type',
						description: 'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.						',
						type: 'string',
						enum: [
							'fill',
							'line',
							'symbol',
							'circle',
							'heatmap',
							'fill-extrusion',
							'hillshade',
							'background',
							'raster',
						],
					},
				},
			} );
		} );
	},

} );
