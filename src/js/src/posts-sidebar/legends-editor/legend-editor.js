import React from 'react';
import { Fragment } from '@wordpress/element';
import { TextControl, SelectControl } from '@wordpress/components';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';
import JeoLegendTypes from '../../../../includes/legend-types/JeoLegendTypes';
import { __ } from '@wordpress/i18n';

class LegendEditor extends React.Component {
	constructor() {
		super();
		const metadata = wp.data.select( 'core/editor' ).getCurrentPost().meta;

		this.legendObject = new JeoLegend( metadata.legend_type, {
			title: metadata.legend_title,
			legend_type_options: metadata.legend_type_options,
		} );

		console.log( this.legendObject );

	}

	render() {
		return (
			<Fragment>
				<TextControl
					label={ __( 'Title' ) }
					value={ this.legendObject.title }
				/>

				{ /* <SelectControl
					label={ __( 'Type' ) }
					value={ map(JeoLegendTypes.legengTypes, type => type.title) }
					options={ [
						{ label: 'Big', value: '100%' },
						{ label: 'Medium', value: '50%' },
						{ label: 'Small', value: '25%' },
					] }
					onChange={ ( size ) => {}}
				/> */ }

			</Fragment>

		);
	}
}

export default LegendEditor;