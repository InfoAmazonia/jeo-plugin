import { Component, Fragment } from '@wordpress/element';
import { v4 as uuid } from 'uuid';

import '../editors/barscale.css';

class BarscaleEditor extends Component {
	constructor( props ) {
		super( props );
		const legendData = this.props.legendObject;

		this.state = {
			legendObject: {
				...legendData,
				attributes: {
					...legendData.attributes,
					legend_type_options: {
						...legendData.legend_type_options,
						colors: [ ...legendData.attributes.legend_type_options.colors.map( ( item ) => {
							return {
								color: item,
								id: uuid(),
							};
						} ) ],
					},
				},
			},
		};
	}

	render() {
		// increment qnty
		const colors = this.state.legendObject.attributes.legend_type_options.colors;
		const step = 100 / ( colors.length - 1 );
		let gradient = 'linear-gradient(180deg, ';

		for ( let i = 0, j = 0; i <= 100; i += step, j++ ) {
			console.log( colors[ j ] );
			gradient += `${ colors[ j ].color } ${ i }%` + ( j === colors.length - 1 ? '' : ', ' );
		}

		gradient += ')';
		console.log( gradient );

		return (
			<Fragment>
				<div className="gradientLegend" style={ { background: gradient } }></div>
			</Fragment>

		);
	}
}

export default BarscaleEditor;
