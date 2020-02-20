window.JeoLegendTypes.registerLegendType( 'icons', {

	/**
	 * Returns the schema fo the legend_type_options for this legend type
	 */
	getSchema() {
		return {
			type: 'object',
			properties: {
				colors: {
					type: 'array',
					description: 'An array of labels and icons',
					items: {
						type: 'object',
						properties: {
							label: {
								type: 'string'
							},
							icon: {
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

		const container = document.createElement( 'div' );
		container.classList.add( 'icons-container' );

		const title = document.createElement( 'h4' );
		title.innerHTML = attributes.title;

		container.appendChild(title);

		attributes.legend_type_options.icons.forEach( c => {
			const iconItem = document.createElement( 'div' );
			iconItem.classList.add( 'icons-item' );

			const box = document.createElement( 'img' );
			box.classList.add( 'icons-item-img' );
			box.src = c.icon;

			const itemLabel = document.createElement('span');
			itemLabel.innerHTML = c.label;

			iconItem.appendChild(box);
			iconItem.appendChild(itemLabel);


			container.appendChild(iconItem);
		});

		return container;

	}

} );
