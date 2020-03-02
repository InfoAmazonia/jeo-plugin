import React from 'react';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';

class LegendEditor extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select( 'core/editor' ).getCurrentPost().meta;

		const legendObject = new JeoLegend( metadata.legend_type, {
			title: metadata.legend_title,
			legend_type_options: metadata.legend_type_options,
		} );

		console.log( metadata, legendObject );
	}

	render() {
		return '';
	}
}

export default LegendEditor;
