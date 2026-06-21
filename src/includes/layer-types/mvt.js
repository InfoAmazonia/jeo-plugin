( () => {
	const { __ } = wp.i18n;

	window.JeoLayerTypes.registerLayerType( 'mvt', {
	label: __( 'Mapbox Vector Tiles (MVT)', 'jeowp' ),

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

		const layer = {
			id: attributes.layer_id,
			type: attributes.layer_type_options.type,
			source: attributes.layer_id,
			'source-layer': attributes.layer_type_options.source_layer,
		};

		const effectiveStyle = attributes.style?.use_default
			? attributes.default_style || {}
			: attributes.style || {};

		if ( effectiveStyle.filter ) {
			layer.filter = effectiveStyle.filter;
		}

		if ( effectiveStyle.paint ) {
			layer.paint = { ...effectiveStyle.paint };
		} else {
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
			layer.layout = { ...effectiveStyle.layout };
		}

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer( layer );
	},

	getSchema( attributes ) {
		return {
			type: 'object',
			required: [ 'url', 'type', 'source_layer' ],
			properties: {
				url: {
					type: 'string',
					title: __( 'URL', 'jeowp' ),
				},
				source_layer: {
					type: 'string',
					title: __( 'Source layer', 'jeowp' ),
					description: __( 'Layer to use from a vector tile source.', 'jeowp' ),
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
					title: __( 'Style Source Type', 'jeowp' ),
					description: __( 'Which data the map should display', 'jeowp' ),
					type: 'string',
					default: 'vector',
					disabled: true,
				},
			},
		};
	},
	} );
} )();
