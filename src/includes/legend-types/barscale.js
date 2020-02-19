window.JeoLegendTypes.registerLegendType( 'barscale', {

	/**
	 * Returns the schema fo the legend_type_options for this legend type
	 */
	getSchema() {
		return {
			type: 'object',
			properties: {
				left_label: {
					type: 'string',
					description: 'The label shown at the left end of the bar'
				},
				right_label: {
					type: 'string',
					description: 'The label shown at the right end of the bar'
				},
				colors: {
					type: 'array',
					description: 'An array of hexadecimal color values',
					items: {
						type: 'string'
					}
				}
			}
		};
	},

	render( map, attributes ) {
		console.log(attributes);
		const container = document.createElement( 'div' );
		container.classList.add( 'barscale-container' );

		const title = document.createElement( 'h4' );
		title.innerHTML = attributes.title;

		const barContainer = document.createElement( 'div' );
		barContainer.classList.add( 'barscale-scale-container' );

		const size = attributes.legend_type_options.colors.length;
		const eachSize = 100 / size;

		const left = document.createElement( 'span' );
		left.classList.add( 'barscale-left-label' );
		left.innerHTML = attributes.legend_type_options.left_label;

		const right = document.createElement( 'span' );
		right.classList.add( 'barscale-right-label' );
		right.innerHTML = attributes.legend_type_options.right_label;

		attributes.legend_type_options.colors.forEach( c => {
			const color = document.createElement( 'div' );
			color.classList.add( 'barscale-color' );
			color.style.backgroundColor = c;
			color.style.width = eachSize + '%';
			barContainer.appendChild(color);
		});

		const labelContainer = document.createElement('div');
		labelContainer.classList.add( 'barscale-labels-container' );
		labelContainer.appendChild(left);
		labelContainer.appendChild(right);


		container.appendChild(title);
		container.appendChild(barContainer);
		container.appendChild(labelContainer);


		return container;

	}

} );
