import { ColorPicker, ColorPalette, TextControl, Dropdown, Button } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';
import { v4 as uuid } from 'uuid';

import '../editors/simplecolor.css';

class SimplecolorEditor extends Component {
	constructor( props ) {
		super( props );
		this.updateSelectedColor = this.updateSelectedColor.bind( this );
		this.deleteLabel = this.deleteLabel.bind( this );
		this.addLabel = this.addLabel.bind( this );

		const legendData = this.props.legendObject;

		this.state = {
			legendObject: {
				...legendData,
				attributes: {
					...legendData.attributes,
					legend_type_options: {
						colors: [ ...legendData.attributes.legend_type_options.colors.map( ( item ) => {
							return {
								...item,
								id: uuid(),
							};
						} ) ],
					},
				},
			},
			selectedColor: {
				color: legendData.attributes.legend_type_options.colors[ 0 ].color,
				label: legendData.attributes.legend_type_options.colors[ 0 ].label,
			},
		};

		this.state = {
			...this.state,
			selectedColor: {
				...this.state.selectedColor,
				id: this.state.legendObject.attributes.legend_type_options.colors[ 0 ].id,
			},
		};

		// console.log(this.state);
	}

	static getDerivedStateFromProps( nextProps ) {
		return {
			legendObject: nextProps.legendObject,
		};
	}

	updateLegendColor( selectedColor ) {
		//console.log( selectedColor );

		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors.map( ( item ) => {
				if ( item.id === selectedColor.id ) {
					return {
						color: selectedColor.color, label: item.label, id: selectedColor.id,
					};
				}

				return item;
			} );

			legendObject.attributes.legend_type_options.colors = colors;

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	updateSelectedColor( color, id ) {
		this.setState( { selectedColor: {
			label: this.state.selectedColor.label,
			color,
			id,
		} } );

		//console.log( 'id', id );

		this.updateLegendColor( {
			label: this.state.selectedColor.label,
			color,
			id,
		} );
	}

	addLabel() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors;

			// math random (0 to 1) -> multiply by giant hexadecial -> bit shift -> string conversion
			const randomColor = '#' + ( Math.random() * 0xFFFFFF << 0 ).toString( 16 );
			colors.push(
				{ label: '', color: randomColor, id: uuid() },
			);

			legendObject.attributes.legend_type_options.colors = colors;
			const colorsSize = colors.length;

			const selectedColor = {
				color: legendObject.attributes.legend_type_options.colors[ colorsSize - 1 ].color,
				label: legendObject.attributes.legend_type_options.colors[ colorsSize - 1 ].label,
				id: legendObject.attributes.legend_type_options.colors[ colorsSize - 1 ].id,
			};

			this.props.hasChanged( legendObject );

			return { legendObject, selectedColor };
		} );
	}

	deleteLabel( labelData ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors.filter( ( item ) => {
				if ( item.id === labelData.id ) {
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
					color: legendObject.attributes.legend_type_options.colors[ 0 ].color,
					label: legendObject.attributes.legend_type_options.colors[ 0 ].label,
					id: legendObject.attributes.legend_type_options.colors[ 0 ].id,
				};
			}

			this.props.hasChanged( legendObject );

			return { legendObject, selectedColor };
		} );
	}

	render() {
		const colorsData = this.state.legendObject.attributes.legend_type_options.colors.map( ( data ) => {
			return { name: data.label, color: data.color, id: data.id };
		} );

		return (
			<Fragment>
				<ColorPalette
					colors={ colorsData }
					value={ this.state.selectedColor.color }
					onChange={ ( color ) => {
						this.setState( {
							selectedColor: {
								color,
								label: colorsData.find( ( colorDataObj ) => {
									return colorDataObj.color === color;
								} ).name,
							},
						}, );
					} }
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
								if ( item.id === this.state.selectedColor.id ) {
									return {
										label: input, color: item.color, id: item.id,
									};
								}

								return item;
							} );

							legendObject.attributes.legend_type_options.colors = colors;

							const selectedColor = this.state.selectedColor;
							selectedColor.label = input;

							this.props.hasChanged( legendObject );

							return { legendObject, selectedColor };
						} );
					} }
				/>
				<Dropdown
					position=""
					renderToggle={ ( { isOpen, onToggle } ) => (
						<div className="buttons-wrapper">
							<Button isLink onClick={ onToggle } aria-expanded={ isOpen }>
								{ __( 'Select color' ) }
							</Button>

							<Button isDestructive isButton isLink onClick={ this.deleteLabel } aria-expanded={ isOpen }>
								{ __( 'Remove field' ) }
							</Button>
						</div>
					) }
					renderContent={ () => (
						<div>
							<ColorPicker
								color={ this.state.selectedColor.color }
								onChangeComplete={ ( color ) => {
									// console.log( "selectedColor.id", this.state.selectedColor.id );
									this.updateSelectedColor( color.hex, this.state.selectedColor.id );
								} }
								disableAlpha
							/>
						</div>
					) }
				/>

				<Button isSecondary isButton isLarge onClick={ this.addLabel } className="full-width-button">
					{ __( 'Add new label' ) }
				</Button>

			</Fragment>

		);
	}
}

export default SimplecolorEditor;
