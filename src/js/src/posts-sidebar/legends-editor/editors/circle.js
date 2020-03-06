import { Component, Fragment } from '@wordpress/element';
import { TextControl, RangeControl, Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import '../editors/circle.css';

class CircleEditor extends Component {
	constructor( props ) {
		super( props );

		//this.hasChanged = this.hasChanged.bind( this );

		this.state = {
			legendObject: this.props.legendObject,
		};

		this.maxRadius = 0;

		this.state.legendObject.attributes.legend_type_options.circles.map( ( item ) => {
			if ( item.radius > this.maxRadius ) this.maxRadius = item.radius;
		} );
	}

	render() {
		return (
			<Fragment>
				{
					this.state.legendObject.attributes.legend_type_options.circles.map( ( item ) => {
						return ( <CircleItem circleItem={ item } key={ item.id } removeLabel={ this.removeLabel } iconUpdate={ this.iconUpdate } color={ this.state.legendObject.attributes.legend_type_options.color } maxRadius={ this.maxRadius }/> );
					} )
				}
			</Fragment>

		);
	}
}

class CircleItem extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			label: this.props.circleItem.label,
			radius: this.props.circleItem.radius,
			id: this.props.circleItem.id,
			style: '',
		};

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
						label={ __( 'Label' ) }
						value={ this.state.label }
						onChange={ ( label ) => this.setState( { label } ) }
					/>

					<RangeControl
						label={ __( 'Radius' ) }
						value={ this.state.radius }
						onChange={ ( radius ) => this.setState( { radius } ) }
						min={ 1 }
						max={ 100 }
					/>

					<Dropdown
						position=""
						renderToggle={ ( { isOpen, onToggle } ) => (
							<Button isSecondary isButton isLarge aria-expanded={ isOpen } onClick={ onToggle } className="full-width-button">
								{ __( 'See preview' ) }
							</Button>
						) }
						renderContent={ () => (
							<div className={ 'circle-wrapper' } >
								{ __( 'Preview' ) }
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
