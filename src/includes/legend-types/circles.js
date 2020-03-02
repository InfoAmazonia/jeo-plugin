window.JeoLegendTypes.registerLegendType( 'circles', {

	/**
	 * Returns the schema fo the legend_type_options for this legend type
	 */
	getSchema() {
		return {
			type: 'object',
			properties: {
				colors: {
					type: 'array',
					description: 'An array of labels and radius',
					items: {
						type: 'object',
						properties: {
							label: {
								type: 'string'
							},
							circle: {
								type: 'string',
								description: 'url'
							}
						}
					}
				}
			}
		};
	},

	render( map, attributes ) {
		console.log(attributes);
		const container = document.createElement( 'div' );
		container.classList.add( 'circles-container' );

		const title = document.createElement( 'h4' );
		title.innerHTML = attributes.title;

		const barContainer = document.createElement( 'div' );
		barContainer.classList.add( 'circles-scale-container' );

		const size = attributes.legend_type_options.circles.length;
		const eachSize = 100 / size;

		attributes.legend_type_options.circles.forEach( c => {
			const circleItem = document.createElement( 'div' );
			const circle = document.createElement( 'div' );
			circle.classList.add( 'circles-item' );
			circle.style.backgroundColor = attributes.legend_type_options.color;
			circle.style.width = ( c.radius * 2 ) + 'px';
			circle.style.height = ( c.radius * 2 ) + 'px';

			const circleLabel = document.createElement( 'p' );
			circleLabel.innerHTML = c.label;

			circleItem.appendChild(circle);
			circleItem.appendChild(circleLabel);


			barContainer.appendChild(circleItem);


		});

		container.appendChild(title);
		container.appendChild(barContainer);

		return container;

	}

} );
