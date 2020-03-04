import React from 'react';
import { ColorPicker, ColorPalette, TextControl } from '@wordpress/components';
import { Fragment, setState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class SimplecolorEditor extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			attributes: this.props.legendObject.attributes,
			selectedColor: this.props.legendObject.attributes.legend_type_options.colors[ 0 ],
		};
	}

	render() {
		const colorsData = this.state.attributes.legend_type_options.colors.map( ( data, index ) => {
			return { name: data.label, color: data.color };
		} );

		return (
			<Fragment>
				<ColorPalette
					colors={ colorsData }
					value={ this.state.selectedColor.color }
					onChange={ ( color ) => this.setState( {
						selectedColor: {
							color,
							name: colorsData.find( ( colorDataObj ) => {
								return colorDataObj.color === color;
							} ).name,
						},
					} )
					}
					disableCustomColors={ true }
					clearable={ false }
				/>

				<SelectedColorOptions selectedColorData={ this.state.selectedColor }>

				</SelectedColorOptions>

			</Fragment>

		);
	}
}

class SelectedColorOptions extends React.Component {
	constructor( props ) {
		super( props );

		this.state = {
			color: this.props.selectedColorData.color,
			name: this.props.selectedColorData.label,
		};
	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			color: nextProps.selectedColorData.color,
			name: nextProps.selectedColorData.name,
		};
	}

	render() {
		//console.log(this.state.color);
		return (
			<Fragment>
				<TextControl
					label={ __( 'Label' ) }
					value={ this.state.name }
				/>

				<ColorPicker
					color={ this.state.color }
					onChangeComplete={ ( color ) => 'setState( { color } )' }
					disableAlpha
				/>
			</Fragment>
		);
	}
}

export default SimplecolorEditor;
