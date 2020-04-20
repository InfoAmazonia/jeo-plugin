import { Component, Fragment } from '@wordpress/element';
import { Button, IconButton, TextControl, Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';
import { v4 as uuid } from 'uuid';

import '../editors/icons.css';

class IconEditor extends Component {
	constructor( props ) {
		super( props );
		this.addLabel = this.addLabel.bind( this );
		this.removeLabel = this.removeLabel.bind( this );
		this.iconUpdate = this.iconUpdate.bind( this );

		const legendData = this.props.legendObject;

		this.state = {
			legendObject: {
				...legendData,
				attributes: {
					...legendData.attributes,
					legend_type_options: {
						icons: [ ...legendData.attributes.legend_type_options.icons.map( ( item ) => {
							return {
								...item,
								id: uuid(),
							};
						} ) ],
					},
				},
			},
		};
	}

	iconUpdate( iconUpdated ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			legendObject.attributes.legend_type_options.icons = legendObject.attributes.legend_type_options.icons.map( ( item ) => {
				if ( item.id === iconUpdated.id ) {
					return { ...item, ...iconUpdated };
				}

				return item;
			} );

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	addLabel() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const icons = this.state.legendObject.attributes.legend_type_options.icons;

			icons.push(
				{ label: 'Default Label', icon: null, id: uuid() },
			);

			legendObject.attributes.legend_type_options.icons = icons;

			this.props.hasChanged( legendObject );

			return { legendObject };
		} );
	}

	removeLabel( itemId ) {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, this.state.legendObject );
			const icons = this.state.legendObject.attributes.legend_type_options.icons.filter( ( item ) => {
				if ( itemId === item.id ) {
					return false;
				}

				return true;
			} );

			legendObject.attributes.legend_type_options.icons = icons;

			return { legendObject };
		} );
	}

	render() {
		return (
			<Fragment>
				<div className="size-warning">
					<span className="warning-character">* </span> <span className="warning-text">Minimum size: 60x60</span>
				</div>
				{
					this.state.legendObject.attributes.legend_type_options.icons.map( ( item ) => {
						return ( <IconItem iconData={ item } key={ item.id } removeLabel={ this.removeLabel } iconUpdate={ this.iconUpdate } /> );
					} )
				}
				<Button isSecondary isButton isLarge onClick={ this.addLabel } className="full-width-button">
					{ __( 'Add new label' ) }
				</Button>
			</Fragment>
		);
	}
}

export default IconEditor;

class IconItem extends Component {
	constructor( props ) {
		super( props );
		this.removeLabel = this.removeLabel.bind( this );

		this.state = {
			iconData: this.props.iconData,
		};
	}

	removeLabel() {
		this.props.removeLabel( this.state.iconData.id );
	}

	iconUpdate( label, icon = this.state.iconData.icon ) {
		this.props.iconUpdate( { label, id: this.state.iconData.id, icon } );
	}

	render() {
		const { MediaUpload } = wp.blockEditor;

		return (
			<div className="icon-item">
				<MediaUpload
					onSelect={ ( value ) => {
						let image = new Image();
						image.src = value.url;
						image.onload = () => {
							if ( image.width >= 60 && image.height >= 60 ) {
								this.setState( {
									iconData: {
										...this.state.iconData,
										icon: value.url,
									},
								}, this.iconUpdate( this.state.iconData.label, value.url ) );
							} else {
								image = null;
								alert( __( 'Minimum size: 60x60' ) );
							}
						};
					} }

					render={ ( { open } ) => {
						return (
							<div className="content-wrapper">
								<div className="image" role="button" tabIndex={ 0 } onClick={ open }>
									{ this.state.iconData.icon && (
										<img src={ this.state.iconData.icon } width="50" height="50" alt="Logo" />
									) }
									{ ! this.state.iconData.icon && (
										<Dashicon icon="format-image" width="50" height="50" />
									) }
								</div>
								<div className="buttons-inputs">
									<TextControl
										label={ __( 'Label' ) }
										value={ this.state.iconData.label }
										onChange={ ( label ) => {
											this.setState( { iconData: { ...this.state.iconData, label } }, this.iconUpdate( label ) );
										} }
									/>

									<IconButton icon="minus" label="Remove" onClick={ this.removeLabel } className="remove-button" />
								</div>
							</div>
						);
					} }
				/>
			</div>
		);
	}
}
