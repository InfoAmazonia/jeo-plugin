import React from 'react';
import { Fragment } from '@wordpress/element';
import { TextControl } from '@wordpress/components';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';
import { __ } from '@wordpress/i18n';

class LegendEditor extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select( 'core/editor' ).getCurrentPost().meta;

		this.legendObject = new JeoLegend( metadata.legend_type, {
			title: metadata.legend_title,
			legend_type_options: metadata.legend_type_options,
		} );

		console.log(this.legendObject);
	}

	render() {
		return (
			<Fragment>
				<TextControl
					label={ __( 'Legend Title' ) }
					value={ this.legendObject.title }
				/>

			</Fragment>

		);
	}
}

export default LegendEditor;
