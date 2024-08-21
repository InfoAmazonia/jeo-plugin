import { Component, Fragment } from '@wordpress/element';
import { ColorPicker, Dropdown, Button, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

import '../editors/barscale.css';

class BarscaleEditor extends Component {
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

	static getDerivedStateFromProps( nextProps ) {
		return {
			legendObject: nextProps.legendObject,
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

			if ( size > 2 ) {
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
				{ color: randomColor, id: crypto.randomUUID() },
			);

			legendObject.attributes.legend_type_options.colors = colors;

			this.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	render() {
		// increment qnty
		const colors = this.state.legendObject.attributes.legend_type_options.colors;
		const step = 100 / ( colors.length - 1 );
		let gradient = 'linear-gradient(to right, ';

		for ( let i = 0, j = 0; i <= 101; i += step, j++ ) {
			gradient += `${ colors[ j ].color } ${ i }%` + ( j === colors.length - 1 ? '' : ', ' );
		}

		gradient += ')';

		const eachSize = 100 / colors.length;

		return (
			<Fragment>
				<TextControl
					label={ __( 'Left Label', 'jeo' ) }
					value={ this.state.legendObject.attributes.legend_type_options.left_label }
					onChange={ ( value ) => this.setState( ( prevState ) => {
						const legendObject = Object.assign( new JeoLegend, prevState.legendObject );

						legendObject.attributes.legend_type_options.left_label = value;

						this.hasChanged( legendObject );
						return { legendObject };
					} ) }
					type="text"
				/>

				<TextControl
					label={ __( 'Right Label', 'jeo' ) }
					value={ this.state.legendObject.attributes.legend_type_options.right_label }
					onChange={ ( value ) => this.setState( ( prevState ) => {
						const legendObject = Object.assign( new JeoLegend, prevState.legendObject );

						legendObject.attributes.legend_type_options.right_label = value;

						this.hasChanged( legendObject );
						return { legendObject };
					} ) }
					type="text"
				/>

				<div className="gradient-legend" style={ { background: gradient } }>
					{ colors.map( ( c ) => {
						return ( <div key={ c.id } className="barscale-color" style={ { backgroundColor: c.color, width: eachSize + '%' } }> </div> );
					} ) }

				</div>
				<div className="itens-wrapper">
					{ colors.map( ( item ) => <ColorItem item={ item } key={ item.id } itemChanged={ this.itemChanged } removeItem={ this.removeItem } /> ) }
					<div className="color-item-wrapper add-item" onClick={ this.addItem }>
						<span> + </span>
					</div>
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
			<Dropdown
				className="color-item-wrapper"
				position="bottom center"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<div className="color-item" onClick={ onToggle } aria-expanded={ isOpen } style={ { backgroundColor: this.state.color } }> </div>
				) }
				renderContent={ () => (
					<div>
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

		);
	}
}

export default BarscaleEditor;
