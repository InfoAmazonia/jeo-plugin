import { Button, ColorPicker, Dropdown, TextControl } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

import '../editors/simplecolor.css';

class SimplecolorEditor extends Component {
	constructor( props ) {
		super( props );
		this.itemChanged = this.itemChanged.bind( this );
		this.addItem = this.addItem.bind( this );
		this.removeItem = this.removeItem.bind( this );
		this.hasChanged = this.hasChanged.bind( this );

		const legendData = this.props.legendObject;

		this.state = {
			legendObject: {
				...legendData,
				attributes: {
					...legendData.attributes,
					legend_type_options: {
						...legendData.attributes.legend_type_options,
						colors: [ ...legendData.attributes.legend_type_options.colors.map( ( item ) => {
							let result = {};

							if ( typeof item === 'string' ) {
								result = { color: item };
							} else {
								result = { ...item };
							}
							return {
								...result,
								id: crypto.randomUUID(),
							};
						} ) ],
					},
				},
			},
		};
	}

	hasChanged( legendObject ) {
		this.props.hasChanged( legendObject );
	}

	removeItem( itemId ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, this.state.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors.filter( ( item ) => {
				if ( itemId === item.id ) {
					return false;
				}

				return true;
			} );

			const size = legendObject.attributes.legend_type_options.colors.length;

			if ( size > 1 ) {
				legendObject.attributes.legend_type_options.colors = colors;
			}

			this.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	itemChanged( itemUpdated ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			legendObject.attributes.legend_type_options.colors = legendObject.attributes.legend_type_options.colors.map( ( item ) => {
				if ( item.id === itemUpdated.id ) {
					return { ...item, ...itemUpdated };
				}

				return item;
			} );

			this.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	addItem() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const colors = this.state.legendObject.attributes.legend_type_options.colors;

			// math random (0 to 1) -> multiply by giant hexadecial -> bit shift -> string conversion
			let randomColor = '#' + ( Math.random() * 0xFFFFFF << 0 ).toString( 16 );

			if ( randomColor.length < 7 ) {
				randomColor = randomColor.slice( 0, 4 );
			}

			colors.push(
				{ label: 'Default name', color: randomColor, id: crypto.randomUUID() },
			);

			legendObject.attributes.legend_type_options.colors = colors;

			this.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	render() {
		// increment qnty
		const colors = this.state.legendObject.attributes.legend_type_options.colors;
		return (
			<Fragment>
				<div className="itens-wrapper">
					{ colors.map( ( item ) => <ColorItem item={ item } key={ item.id } itemChanged={ this.itemChanged } removeItem={ this.removeItem } />
					) }
					<Button variant="secondary" isButton isLarge onClick={ this.addItem } className="full-width-button">
						{ __( 'Add new label', 'jeo' ) }
					</Button>
				</div>
			</Fragment>

		);
	}
}

class ColorItem extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			...this.props.item,
		};
	}

	render() {
		return (
			<div className="color-item">
				<Dropdown
					className="color-item-wrapper"
					contentClassName="item-drop-content"
					popoverProps={ { placement: 'bottom' } }
					renderToggle={ ( { isOpen, onToggle } ) => (
						<div className="color-item" role="button" tabIndex={ 0 } onClick={ onToggle } aria-expanded={ isOpen } style={ { backgroundColor: this.state.color } }> </div>
					) }
					renderContent={ () => (
						<div>
							<TextControl
								className="label-input-wrapper"
								label={ __( 'Label', 'jeo' ) }
								value={ this.state.label }
								onChange={ ( label ) => {
									// console.log( "selectedColor.id", this.state.selectedColor.id );
									this.setState( { label } );
									this.props.itemChanged( { ...this.state, label } );
								} }
							/>

							<ColorPicker
								color={ this.state.color }
								onChangeComplete={ ( color ) => {
									// console.log( "selectedColor.id", this.state.selectedColor.id );
									this.setState( { color: color.hex } );
									this.props.itemChanged( this.state );
								} }
								disableAlpha
							/>

							<Button className="full-width-button" isDestructive isButton variant="secondary" onClick={ () => this.props.removeItem( this.state.id ) } >
								{ __( 'Remove', 'jeo' ) }
							</Button>
						</div>

					) }
				/>
				<div className="buttons-inputs">
					<TextControl
						className="label-input-wrapper"
						label={ __( 'Label', 'jeo') }
						value={ this.state.label }
						onChange={ ( label ) => {
							// console.log( "selectedColor.id", this.state.selectedColor.id );
							this.setState( { label } );
							this.props.itemChanged( { ...this.state, label } );
						} }
					/>

					<Button icon="minus" label="Remove" onClick={ () => this.props.removeItem( this.state.id ) } className="remove-button" />
				</div>
			</div>
		);
	}
}

export default SimplecolorEditor;
