( () => {
	const { __ } = wp.i18n;

	window.JeoLayerTypes.registerLayerType( 'mapbox-tileset-vector', {
	label: __( 'Vector Mapbox Tiled Source', 'jeowp' ),

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
					url: tileset_id,
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
		let tileset_id = attributes.layer_type_options.tileset_id;

		if ( tileset_id && ! tileset_id.includes( 'mapbox://' ) ) {
			tileset_id = 'mapbox://' + tileset_id;
		}

		map.addSource( attributes.layer_id, {
			type: attributes.layer_type_options.style_source_type,
			url: tileset_id,
		} );

		const layer = {
			id: attributes.layer_id,
			type: attributes.layer_type_options.type,
			source: attributes.layer_id,
			'source-layer': attributes.layer_type_options.source_layer,
			layout: {
				visibility: attributes.visible ? 'visible' : 'none',
			},
		};

		const effectiveStyle = ( attributes.style?.use_default )
			? ( attributes.default_style || {} )
			: ( attributes.style || {} );

		if ( effectiveStyle.filter ) {
			layer.filter = effectiveStyle.filter;
		}

		if ( effectiveStyle.paint ) {
			layer.paint = { ...effectiveStyle.paint };
		}

		const opacity = typeof attributes.opacity === 'number' ? attributes.opacity : 1;
		if ( opacity < 1 ) {
			const opacityProps = [ 'fill-opacity', 'line-opacity', 'circle-opacity', 'symbol-opacity', 'heatmap-opacity', 'fill-extrusion-opacity' ];
			const paint = layer.paint || {};
			opacityProps.forEach( ( prop ) => {
				if ( typeof paint[ prop ] === 'number' ) {
					paint[ prop ] = paint[ prop ] * opacity;
				}
			} );
			layer.paint = paint;
		}

		if ( ! layer.paint ) {
			// No saved/AI style: apply a visible fallback so catalog layers picked
			// by the Minimap don't render invisibly (see JeoLayerTypes.getFallbackPaint).
			const fallbackPaint = window.JeoLayerTypes?.getFallbackPaint?.(
				attributes.layer_type_options.type
			);
			if ( fallbackPaint ) {
				layer.paint = fallbackPaint;
			}
		}

		if ( effectiveStyle.layout ) {
			layer.layout = { ...layer.layout, ...effectiveStyle.layout };
		}

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer(layer);
	},

	getSchema( attributes ) {
		return {
			type: 'object',
			required: [ 'tileset_id', 'style_source_type', 'type', 'source_layer' ],
			properties: {
				tileset_id: {
					type: 'string',
					title: __( 'Tileset ID', 'jeowp' ),
					description: __( 'Example: username.tilesetid', 'jeowp' ),
				},
				source_layer: {
					type: 'string',
					title: __( 'Source layer', 'jeowp' ),
					description: __( 'Which data the map should display.', 'jeowp' ),
				},
				type: {
					title: __( 'Layer Type', 'jeowp' ),
					description:
						__(
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.',
							'jeowp'
						),
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
					title: __( 'Style Source Type', 'jeowp' ),
					description: __( 'The layer source type style', 'jeowp' ),
					type: 'string',
					default: 'vector',
					disabled: true,
				},
			},
		};
	},
	} );
} )();
