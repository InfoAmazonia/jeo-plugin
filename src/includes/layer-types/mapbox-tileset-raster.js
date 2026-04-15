( function() {
const { __ } = wp.i18n;

window.JeoLayerTypes.registerLayerType( 'mapbox-tileset-raster', {
	label: __( 'Raster Mapbox Tiled Source', 'jeo' ),

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
				},
			],
		} );
	},

	addLayer( map, attributes, addLayerParams = null ) {
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
			layout: {
				visibility: attributes.visible ? 'visible' : 'none',
			},
		};

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer(layer);
	},

	getSchema( attributes ) {
		return {
			type: 'object',
			required: [ 'tileset_id', 'style_source_type', 'type' ],
			properties: {
				tileset_id: {
					type: 'string',
					title: __( 'Tileset ID', 'jeo' ),
					description: __( 'Example: username.tilesetid', 'jeo' ),
				},
				style_source_type: {
					title: __( 'Style Source Type', 'jeo' ),
					description: __( 'Which data the map should display', 'jeo' ),
					type: 'string',
					default: 'raster',
					enum: [ 'raster', 'raster-dem' ],
				},
				type: {
					title: __( 'Layer Type', 'jeo' ),
					description:
						__(
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.',
							'jeo'
						),
					type: 'string',
					default: 'raster',
					disabled: true,
				},
			},
		};
	},
} );
} )();
