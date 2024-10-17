import { Component, Fragment } from '@wordpress/element';
import { TextControl, RangeControl, Button, Dropdown, ColorPicker } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import '../editors/circle.css';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

class CircleEditor extends Component {
	constructor( props ) {
		super( props );

		//this.hasChanged = this.hasChanged.bind( this );
		this.updateColor = this.updateColor.bind( this );
		this.addNew = this.addNew.bind( this );
		this.removeLabel = this.removeLabel.bind( this );
		this.itemChanged = this.itemChanged.bind( this );

		const legendData = this.props.legendObject;

		this.state = {
			legendObject: {
				...legendData,
				attributes: {
					...legendData.attributes,
					legend_type_options: {
						...legendData.attributes.legend_type_options,
						circles: [ ...legendData.attributes.legend_type_options.circles.map( ( item ) => {
							return {
								...item,
								id: crypto.randomUUID(),
							};
						} ) ],
					},
				},
			},
		};

		this.maxRadius = 0;

		this.state.legendObject.attributes.legend_type_options.circles.forEach( ( item ) => {
			if ( item.radius > this.maxRadius ) {
				this.maxRadius = item.radius;
			}
		} );
	}

	addNew() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const circles = this.state.legendObject.attributes.legend_type_options.circles;

			circles.push(
				{ label: 'Default Label', radius: 50, id: crypto.randomUUID() },
			);

			legendObject.attributes.legend_type_options.circles = circles;

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	removeLabel( id ) {
		this.setState( ( ) => {
			const legendObject = Object.assign( new JeoLegend, this.state.legendObject );
			const circles = this.state.legendObject.attributes.legend_type_options.circles.filter( ( item ) => {
				if ( id === item.id ) {
					return false;
				}

				return true;
			} );

			legendObject.attributes.legend_type_options.circles = circles;

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	updateColor( color ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );

			legendObject.attributes.legend_type_options.color = color;

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	itemChanged( itemState ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			legendObject.attributes.legend_type_options.circles = legendObject.attributes.legend_type_options.circles.map( ( item ) => {
				if ( item.id === itemState.id ) {
					return { ...itemState };
				}

				return item;
			} );

			//console.log(legendObject);

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	render() {
		return (
			<Fragment>
				{ __( 'Circles color', 'jeo' ) }
				<ColorPicker
					color={ this.state.legendObject.attributes.legend_type_options.color }
					onChangeComplete={ ( color ) => {
						this.updateColor( color.hex );
					} }
					disableAlpha
				/>

				{
					this.state.legendObject.attributes.legend_type_options.circles.map( ( item ) => {
						return ( <CircleItem circleItem={ item } key={ item.id } removeLabel={ this.removeLabel } itemChanged={ this.itemChanged } color={ this.state.legendObject.attributes.legend_type_options.color } maxRadius={ this.maxRadius } /> );
					} )
				}

				<Button variant="secondary" isButton isLarge onClick={ this.addNew } className="full-width-button">
					{ __( 'Add new label', 'jeo' ) }
				</Button>
			</Fragment>

		);
	}
}

class CircleItem extends Component {
	constructor( props ) {
		super( props );

		this.itemChanged = this.itemChanged.bind( this );

		this.state = {
			label: this.props.circleItem.label,
			radius: this.props.circleItem.radius,
			id: this.props.circleItem.id,
			style: '',
		};
	}

	itemChanged( changedItem ) {
		this.props.itemChanged( changedItem );
	}

	render() {
		const dynamicStyle = {
			radius: this.state.radius,
			color: this.props.color,
		};

		const styles = {
			circle: {
				width: dynamicStyle.radius * 2,
				height: dynamicStyle.radius * 2,
				backgroundColor: dynamicStyle.color,
				borderRadius: dynamicStyle.radius * 2,
			},

			circleWrapper: {
				width: this.props.maxRadius * 2,
			},
		};

		return (
			<Fragment>

				<div className={ 'legend-wrapper' } >

					<TextControl
						label={ __( 'Label', 'jeo' ) }
						value={ this.state.label }
						onChange={ ( label ) => {
							this.itemChanged( { ...this.state, label } );
							this.setState( { label } );
						} }
					/>

					<RangeControl
						label={ __( 'Radius', 'jeo' ) }
						value={ this.state.radius }
						onChange={ ( radius ) => {
							this.itemChanged( { ...this.state, radius } );
							this.setState( { radius } );
						} }

						min={ 1 }
						max={ 50 }
					/>

					<Dropdown
						renderToggle={ ( { isOpen, onToggle } ) => (
							<div className="buttonsList">
								<Button isDestructive isButton variant="secondary" onClick={ () => this.props.removeLabel( this.state.id ) } >
									{ __( 'Remove', 'jeo' ) }
								</Button>

								<Button variant="secondary" isButton aria-expanded={ isOpen } onClick={ onToggle } >
									{ __( 'See preview', 'jeo' ) }
								</Button>
							</div>
						) }
						renderContent={ () => (
							<div className={ 'circle-wrapper' } >
								{ __( 'Preview', 'jeo' ) }
								<div className="circle" style={ styles.circle } />
							</div>
						) }
					/>

				</div>

			</Fragment>
		);
	}
}

export default CircleEditor;
