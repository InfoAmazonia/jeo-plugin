window.JeoLegendTypes.registerLegendType( 'simple-color', {

	/**
	 * Returns the schema fo the legend_type_options for this legend type
	 */
	getSchema() {
		return {
			type: 'object',
			properties: {
				colors: {
					type: 'array',
					description: 'An array of labels and colors',
					items: {
						type: 'object',
						properties: {
							label: {
								type: 'string',
							},
							color: {
								type: 'string',
							},
						},
					},
				},
			},
		};
	},

	render( map, attributes ) {
		const container = document.createElement( 'div' );
		container.classList.add( 'simple-color-container' );

		// const barContainer = document.createElement( 'div' );
		// barContainer.classList.add( 'simple-color-scale-container' );

		attributes.legend_type_options.colors.forEach( ( c ) => {
			const color = document.createElement( 'div' );
			color.classList.add( 'simple-color-item' );

			const box = document.createElement( 'div' );
			box.classList.add( 'simple-color-item-box' );
			box.style.backgroundColor = c.color;

			const itemLabel = document.createElement( 'span' );
			itemLabel.innerHTML = c.label;

			color.appendChild( box );
			color.appendChild( itemLabel );

			container.appendChild( color );
		} );

		// container.appendChild(barContainer);
		// container.appendChild(labelContainer);

		return container;
	},

} );
