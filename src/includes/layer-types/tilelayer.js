window.JeoLayerTypes.registerLayerType( 'tilelayer', {

	addStyle( map, attributes ) {
		const name = attributes.layer_id;
		return map.setStyle( {
			version: 8,
			sources: {
				[ name ]: {
					type: 'vector',
					tiles: [ attributes.layer_type_options.url ],
					tileSize: 256,
				},
			},
			layers: [ {
				id: attributes.layer_id,
				type: 'vector',
				source: attributes.layer_id,
			} ],
		} );
	},

	addLayer( map, attributes ) {
		const layer = {
			id: attributes.layer_id,
			source: {
				type: 'vector',
				tiles: [ attributes.layer_type_options.url ],
				tileSize: 256,
			},
			type: 'vector',
		};
		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}
		return map.addLayer( layer );
	},

	getSchema( attributes ) {
		return new Promise( function( resolve ) {
			resolve( {
				type: 'object',
				required: [
					'url',
				],
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
