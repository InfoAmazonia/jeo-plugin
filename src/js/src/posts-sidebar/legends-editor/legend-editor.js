import React from 'react';
import { Fragment } from '@wordpress/element';
import { TextControl, SelectControl } from '@wordpress/components';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';
import JeoLegendTypes from '../../../../includes/legend-types/JeoLegendTypes';
import { __ } from '@wordpress/i18n';
import LegendTypeEdition from './legend-type-edition';

class LegendEditor extends React.Component {
	constructor() {
		super();
		this.legendTypes = Object.keys( JeoLegendTypes.legendTypes );

		const metadata = wp.data.select( 'core/editor' ).getCurrentPost().meta;

		this.state = {
			legendObject: new JeoLegend( metadata.legend_type, {
				title: metadata.legend_title,
				legend_type_options: metadata.legend_type_options,
			} ),
		};

		//console.log( this.state.legendObject );

	}

	render() {
		return (
			<Fragment>
				<TextControl
					label={ __( 'Title' ) }
					value={ this.state.legendObject.title }
					onChange={ ( input ) => {
						this.setState( ( prevState ) => {
							const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
							legendObject.attributes.title = input;
							return { legendObject };
						} );
					} }
				/>

				<SelectControl
					label={ __( 'Type' ) }
					value={ this.state.legendObject.legendSlug }
					options={ [	...this.legendTypes.map( ( item ) => {
						return { label: item, value: item };
					} )	] }

					onChange={ ( newLegendType ) => {
						this.setState( ( prevState ) => {
							const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
							legendObject.legendType = newLegendType;
							legendObject.setlegengSlug = newLegendType;
							return { legendObject };
						} );
					} }
				/>

				<LegendTypeEdition legendObject={ this.state.legendObject }>

				</LegendTypeEdition>

			</Fragment>

		);
	}
}

export default LegendEditor;
