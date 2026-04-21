( () => {
	const { __ } = wp.i18n;

	window.JeoLayerTypes.registerLayerType( 'mvt', {
	label: __( 'Mapbox Vector Tiles (MVT)', 'jeo' ),

	addStyle( map, attributes ) {
		const name = attributes.layer_id;
		return map.setStyle( {
			version: 8,
			sources: {
				[ name ]: {
					type: 'vector',
					tiles: [ attributes.layer_type_options.url ],
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

	addLayer( map, attributes, addLayerParams = null ) {
		map.addSource( attributes.layer_id, {
			type: 'vector',
			tiles: [ attributes.layer_type_options.url ],
		} );

		if ( addLayerParams ) {
			return map.addLayer(
				{
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
				},
				...addLayerParams
			);
		}

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
		return {
			type: 'object',
			required: [ 'url', 'type', 'source_layer' ],
			properties: {
				url: {
					type: 'string',
					title: __( 'URL', 'jeo' ),
				},
				source_layer: {
					type: 'string',
					title: __( 'Source layer', 'jeo' ),
					description: __( 'Layer to use from a vector tile source.', 'jeo' ),
				},
				type: {
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
					title: __( 'Style Source Type', 'jeo' ),
					description: __( 'Which data the map should display', 'jeo' ),
					type: 'string',
					default: 'vector',
					disabled: true,
				},
			},
		};
	},
	} );
} )();
