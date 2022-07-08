window.JeoLayerTypes.registerLayerType( 'mapbox-tileset-vector', {
	label: 'Vector Mapbox Tiled Source',

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
					'source-layer': attributes.layer_type_options.source_layer,
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
			'source-layer': attributes.layer_type_options.source_layer,
		};

		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}

		if ( addLayerParams ) {
			return map.addLayer(
				layer, ...addLayerParams
			);
		}

		return map.addLayer(layer);
	},

	getSchema( attributes ) {
		return new Promise( function ( resolve ) {
			resolve( {
				type: 'object',
				required: [ 'tileset_id', 'style_source_type', 'type', 'source_layer' ],
				properties: {
					tileset_id: {
						type: 'string',
						title: 'Tileset ID',
						description: 'Example: username.tilesetid',
					},
					source_layer: {
						type: 'string',
						title: 'Source layer',
						description: 'Which data the map should display.',
					},
					type: {
						title: 'Layer Type',
						description:
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.						',
						type: 'string',
						default: 'fill',
						enum: [
							'fill',
							'line',
							'symbol',
							'circle',
							'heatmap',
							'fill-extrusion',
							'hillshade',
							'background',
						],
					},
					style_source_type: {
						title: 'Style Source Type',
						description: 'The layer source type style',
						type: 'string',
						default: 'vector',
						disabled: true,
					},
				},
			} );
		} );
	},
} );
