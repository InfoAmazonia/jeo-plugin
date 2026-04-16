( () => {
	const { __ } = wp.i18n;

	window.JeoLayerTypes.registerLayerType( 'tilelayer', {
	label: __( 'Raster Tiled Source', 'jeo' ),

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

	addLayer( map, attributes, addLayerParams = null ) {
		const layer = {
			id: attributes.layer_id,
			source: {
				type: 'raster',
				tiles: [ attributes.layer_type_options.url ],
				tileSize: 256,
				scheme: attributes.layer_type_options.scheme || 'xyz',
			},
			type: 'raster',
			layout: {
				visibility: attributes.visible ? 'visible' : 'none',
			},
		};

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer( layer );
	},

	getSchema( attributes ) {
		return {
			type: 'object',
			required: [ 'url' ],
			properties: {
				url: {
					type: 'string',
					title: __( 'URL', 'jeo' ),
				},
				scheme: {
					type: 'string',
					title: __( 'Scheme', 'jeo' ),
					description: __( 'Influences the Y direction of the tile coordinates.', 'jeo' ),
					enum: ['xyz', 'tms'],
					enumNames: [
						__( 'Slippy Map tilenames (XYZ)', 'jeo' ),
						__( 'OSGeo spec (TMS)', 'jeo' ),
					],
					default: 'xyz',
				}
			},
		};
	},
	} );
} )();
