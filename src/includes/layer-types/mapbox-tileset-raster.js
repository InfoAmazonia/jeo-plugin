window.JeoLayerTypes.registerLayerType( 'mapbox-tileset-raster', {
	label: 'Raster Mapbox Tiled Source',

	addStyle( map, attributes ) {
		const name = attributes.layer_id;
		let tileset_id = attributes.layer_type_options.tileset_id;

		if ( tileset_id && ! tileset_id.includes( 'mapbox://' ) ) {
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
			layers: [
				{
					id: attributes.layer_id,
					type: attributes.layer_type_options.type,
					source: attributes.layer_id,
					'source-layer': '',
				},
			],
		} );
	},

	addLayer( map, attributes, addLayerParams ) {
		let tileset_id = attributes.layer_type_options.tileset_id;

		if ( tileset_id && ! tileset_id.includes( 'mapbox://' ) ) {
			tileset_id = 'mapbox://' + tileset_id;
		}

		map.addSource( attributes.layer_id, {
			type: attributes.layer_type_options.style_source_type,
			url: 'mapbox://' + attributes.layer_type_options.tileset_id,
		} );

		const layer = {
			id: attributes.layer_id,
			type: attributes.layer_type_options.type,
			source: attributes.layer_id,
			'source-layer': '',
		};

		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}

		if ( addLayerParams ) {
			return map.addLayer(
				layer,
				...addLayerParams
			);
		}

		return map.addLayer(layer);
	},

	getSchema( attributes ) {
		return new Promise( function ( resolve ) {
			resolve( {
				type: 'object',
				required: [ 'tileset_id', 'style_source_type', 'type' ],
				properties: {
					tileset_id: {
						type: 'string',
						title: 'Tileset ID',
						description: 'Example: username.tilesetid',
					},
					style_source_type: {
						title: 'Style Source Type',
						description: 'Which data the map should display',
						type: 'string',
						default: 'raster',
						enum: [ 'raster', 'raster-dem' ],
					},
					type: {
						title: 'Layer Type',
						description:
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.',
						type: 'string',
						default: 'raster',
						disabled: true,
					},
				},
			} );
		} );
	},
} );
