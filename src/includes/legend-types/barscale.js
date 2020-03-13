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
					description: 'The label shown at the left end of the bar',
				},
				right_label: {
					type: 'string',
					description: 'The label shown at the right end of the bar',
				},
				colors: {
					type: 'array',
					description: 'An array of hexadecimal color values',
					items: {
						type: 'string',
					},
				},
			},
		};
	},

	render( map, attributes ) {
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
			color.style.backgroundColor = c.color;
			color.style.width = eachSize + '%';
			barContainer.appendChild( color );
		} );

		const colors = attributes.legend_type_options.colors;
		const step = 100 / ( colors.length - 1 );
		let gradient = 'linear-gradient(to right, ';

		for ( let i = 0, j = 0; i <= 101; i += step, j++ ) {
			gradient += `${ colors[ j ].color } ${ i }%` + ( j === colors.length - 1 ? '' : ', ' );
		}
		gradient += ')';

		barContainer.style.background = gradient;

		const labelContainer = document.createElement( 'div' );
		labelContainer.classList.add( 'barscale-labels-container' );
		labelContainer.appendChild( left );
		labelContainer.appendChild( right );

		function mapValues( n, start1, stop1, start2, stop2 ) {
			return ( ( n - start1 ) / ( stop1 - start1 ) ) * ( stop2 - start2 ) + start2;
		}

		const moveableLabel = document.createElement( 'span' );
		moveableLabel.classList.add( 'dynamic-label' );

		barContainer.addEventListener( 'mousemove', ( event ) => {
			if ( event.offsetY > 21 ) {
				moveableLabel.innerHTML = Math.round( mapValues( event.offsetX, 0, labelContainer.offsetWidth, parseInt( attributes.legend_type_options.left_label ), parseInt( attributes.legend_type_options.right_label ) ) );
				moveableLabel.style.left = event.offsetX < labelContainer.offsetWidth / 2 ? event.offsetX + 'px' : event.offsetX - moveableLabel.offsetWidth + 'px';
			}
		} );

		barContainer.addEventListener( 'mouseout', ( event ) => {
			moveableLabel.innerHTML = '';
		} );

		labelContainer.appendChild( moveableLabel );

		container.appendChild( title );
		container.appendChild( barContainer );
		container.appendChild( labelContainer );

		return container;
	}
} );
