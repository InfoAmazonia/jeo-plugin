( () => {
	const { __ } = wp.i18n;

	window.JeoLayerTypes.registerLayerType( 'style-json', {
		label: __( 'Style JSON', 'jeowp' ),

		isStyle: true,

		addStyle( map, attributes ) {
			const style = this.getStyle( attributes );

			if ( style ) {
				return map.setStyle( style );
			}
		},

		addLayer( map, attributes ) {
			console.warn(
				'[JEO] The "style-json" layer type only supports the base layer position and was skipped:',
				attributes?.layer_id
			);
		},

		getSchema() {
			return {
				type: 'object',
				properties: {
					style_url: {
						type: 'string',
						title: __( 'Style URL', 'jeowp' ),
						description: __(
							'Public URL of a MapLibre GL style JSON file. Used when no inline style is provided. Works with keyless providers such as OpenFreeMap (e.g. https://tiles.openfreemap.org/styles/dark).',
							'jeowp'
						),
					},
					inline_style: {
						type: 'string',
						format: 'textarea',
						title: __( 'Inline style JSON', 'jeowp' ),
						description: __(
							'Optional. Paste a raw MapLibre GL style object. Takes precedence over the URL — useful for small, self-contained styles.',
							'jeowp'
						),
					},
				},
			};
		},

		getStyleUrl( attributes ) {
			const options = attributes?.layer_type_options || {};
			const url = ( options.style_url || '' ).trim();

			return url || null;
		},

		getInlineStyle( attributes ) {
			const options = attributes?.layer_type_options || {};
			const raw = ( options.inline_style || '' ).trim();

			if ( ! raw ) {
				return null;
			}

			try {
				const parsed = JSON.parse( raw );
				return parsed && typeof parsed === 'object' ? parsed : null;
			} catch ( error ) {
				console.warn(
					'[JEO] Invalid inline style JSON for layer:',
					attributes?.layer_id,
					error
				);
				return null;
			}
		},

		getStyle( attributes ) {
			return this.getInlineStyle( attributes ) || this.getStyleUrl( attributes );
		},
	} );
} )();
