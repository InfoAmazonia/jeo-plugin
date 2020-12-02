window.JeoLayerTypes.registerLayerType( 'tilelayer', {
	addStyle( map, attributes ) {
		const name = attributes.layer_id;
		return map.setStyle( {
			version: 8,
			sources: {
				[ name ]: {
					type: 'raster',
					tiles: [ attributes.layer_type_options.url ],
					tileSize: 256,
				},
			},
			layers: [
				{
					id: attributes.layer_id,
					type: 'raster',
					source: attributes.layer_id,
				},
			],
		} );
	},

	addLayer( map, attributes, addLayerParams ) {
		const layer = {
			id: attributes.layer_id,
			source: {
				type: 'raster',
				tiles: [ attributes.layer_type_options.url ],
				tileSize: 256,
			},
			type: 'raster',
		};
		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer( layer );
	},

	getSchema( attributes ) {
		return new Promise( function ( resolve ) {
			resolve( {
				type: 'object',
				required: [ 'url' ],
				properties: {
					url: {
						type: 'string',
						title: 'URL',
					},
				},
			} );
		} );
	},
} );
