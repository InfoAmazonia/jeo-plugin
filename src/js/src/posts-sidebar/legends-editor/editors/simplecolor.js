import React from 'react';
import { ColorPicker, ColorPalette, TextControl, Dropdown, Button } from '@wordpress/components';
import { Fragment, setState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

class SimplecolorEditor extends React.Component {
	constructor( props ) {
		super( props );
		const legendData = this.props.legendObject;
		this.updateSelectedColor = this.updateSelectedColor.bind( this );
		this.deleteLabel = this.deleteLabel.bind( this );

		if ( legendData.legendSlug !== 'simple-color' ) {
			legendData.attributes = {
				legend_type_options: {
					colors: [ { label: 'Example Color', color: '#ff0909' } ],
				},
			};
		}

		this.state = {
			legendObject: this.props.legendObject,
			selectedColor: {
				color: legendData.attributes.legend_type_options.colors[ 0 ].color,
				label: legendData.attributes.legend_type_options.colors[ 0 ].label,
			},
		};
	}

	updateLegendColor( selectedColor ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors.map( ( item ) => {
				if ( item.label === selectedColor.label ) {
					return {
						color: selectedColor.color, label: item.label,
					};
				}

				return item;
			} );

			legendObject.attributes.legend_type_options.colors = colors;

			return { legendObject };
		} );
	}

	updateSelectedColor( color ) {
		this.setState( { selectedColor: {
			label: this.state.selectedColor.label,
			color,
		} } );

		this.updateLegendColor( this.state.selectedColor );
	}

	deleteLabel( labelData ) {
		this.setState( ( prevState ) => {
			let legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors.filter( ( item ) => {
				if ( item.color === labelData.color && item.label === labelData.label ) {
					return false;
				}

				return true;
			} );

			const size = legendObject.attributes.legend_type_options.colors.length;

			if ( size > 1 ) {
				legendObject.attributes.legend_type_options.colors = colors;
			}

			let selectedColor = { };

			if ( size > 0 ) {
				selectedColor = {
					color: legendObject.attributes.legend_type_options.colors[0].color,
					label: legendObject.attributes.legend_type_options.colors[0].label,
				};
			}

			return { legendObject, selectedColor };
		} );
	}

	render() {
		const colorsData = this.state.legendObject.attributes.legend_type_options.colors.map( ( data ) => {
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
							label: colorsData.find( ( colorDataObj ) => {
								return colorDataObj.color === color;
							} ).name,
						},
					} )
					}
					disableCustomColors={ true }
					clearable={ false }
				/>

				<TextControl
					label={ __( 'Label' ) }
					value={ this.state.selectedColor.label }
					onChange={ ( input ) => {
						this.setState( ( prevState ) => {
							const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
							const colors = this.state.legendObject.attributes.legend_type_options.colors.map( ( item ) => {
								if ( item.color === this.state.selectedColor.color ) {
									return {
										label: input, color: item.color,
									};
								}

								return item;
							} );

							legendObject.attributes.legend_type_options.colors = colors;

							const selectedColor = this.state.selectedColor;
							selectedColor.label = input;

							return { legendObject, selectedColor };
						} );
					} }
				/>

				<SelectedColorOptions selectedColorData={ this.state.selectedColor } updateSelectedColor={ this.updateSelectedColor } deleteLabel={ this.deleteLabel } />

			</Fragment>

		);
	}
}

class SelectedColorOptions extends React.Component {
	constructor( props ) {
		super( props );
		this.deleteLabel = this.deleteLabel.bind( this );

		this.state = {
			color: this.props.selectedColorData.color,
			label: this.props.selectedColorData.label,
		};
	}

	deleteLabel() {
		this.props.deleteLabel( this.state );
	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			color: nextProps.selectedColorData.color,
			label: nextProps.selectedColorData.label,
		};
	}

	render() {
		return (
			<Fragment>

				<Dropdown
					position=""
					renderToggle={ ( { isOpen, onToggle } ) => (
						<div>
							<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
								{ __( 'Select color' ) }
							</Button>

							<Button isSecondary isDestructive onClick={ this.deleteLabel } aria-expanded={ isOpen }>
								{ __( 'Remove label' ) }
							</Button>
						</div>
					) }
					renderContent={ () => (
						<div>
							<ColorPicker
								color={ this.state.color }
								onChangeComplete={ ( color ) => this.props.updateSelectedColor( color.hex ) }
								disableAlpha
							/>
						</div>
					) }
				/>

			</Fragment>
		);
	}
}

export default SimplecolorEditor;
