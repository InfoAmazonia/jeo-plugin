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
								type: 'string',
							},
							circle: {
								type: 'string',
								description: 'url',
							},
						},
					},
				},
			},
		};
	},

	render( map, attributes ) {
		const container = document.createElement( 'div' );
		container.classList.add( 'circles-container' );

		const barContainer = document.createElement( 'div' );
		barContainer.classList.add( 'circles-scale-container' );

		const size = attributes.legend_type_options.circles.length;
		const eachSize = 100 / size;

		let maxRadius = 0;
		attributes.legend_type_options.circles.forEach( ( c ) => {
			if ( c.radius > maxRadius ) {
				maxRadius = c.radius;
			}
		} );

		maxRadius += 6;

		const circles = attributes.legend_type_options.circles;
		circles.sort( ( a, b ) => a.radius - b.radius );

		circles.forEach( ( c ) => {
			const circleItem = document.createElement( 'div' );
			const circle = document.createElement( 'div' );
			const circleWrap = document.createElement( 'div' );

			circleWrap.classList.add( 'circle-wrapper' );
			circleItem.classList.add( 'circle-item' );
			circle.classList.add( 'circle-shape' );

			circle.style.backgroundColor = attributes.legend_type_options.color;
			circle.style.width = ( c.radius * 2 ) + 'px';
			circle.style.height = ( c.radius * 2 ) + 'px';

			circleWrap.style.minWidth = ( maxRadius * 2 ) + 'px';

			const circleLabel = document.createElement( 'p' );
			circleLabel.innerHTML = c.label;

			circleWrap.appendChild( circle );
			circleItem.appendChild( circleWrap );

			//circleItem.appendChild( circle );
			circleItem.appendChild( circleLabel );

			barContainer.appendChild( circleItem );
		} );

		container.appendChild( barContainer );

		return container;
	},

} );
