import React from 'react';
import { Fragment } from '@wordpress/element';
import { FormFileUpload, Icon, Button, 	IconButton, TextControl, ColorIndicator } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';
import { v4 as uuid } from 'uuid';

import '../editors/icons.css';

class IconEditor extends React.Component {
	constructor( props ) {
		super( props );
		this.addLabel = this.addLabel.bind( this );
		this.removeLabel = this.removeLabel.bind( this );
		this.iconUpdate = this.iconUpdate.bind( this );

		this.state = {
			legendObject: {
				...this.props.legendObject,
				attributes: {
					...this.props.legendObject.attributes,
					legend_type_options: {
						icons: [ ...this.props.legendObject.attributes.legend_type_options.icons.map( ( item ) => {
							return {
								...item,
								id: uuid(),
							};
						} ) ],
					},
				},
			},
		};

		if ( this.state.legendObject.attributes.legend_type_options.icons === undefined ) {
			this.setState( {
				legendObject: {
					...this.state.legendObject,
					attributes: {
						...this.state.legendObject.attributes,
						legend_type_options: {
							...this.state.legendObject.attributes.legend_type_options,
							icons: [],
						},
					},
				},
			} );
		}
	}

	componentDidUpdate() {

	}

	iconUpdate( iconUpdated ) {
		this.setState( ( ) => {
			const legendObject = this.state.legendObject;
			legendObject.attributes.legend_type_options.icons = legendObject.attributes.legend_type_options.icons.map( ( item, index ) => {
				if ( item.id === iconUpdated.id ) {
					return { ...item, ...iconUpdated };
				}

				return item;
			} );

			return { legendObject };
		} );
	}

	addLabel() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const icons = this.state.legendObject.attributes.legend_type_options.icons;

			icons.push(
				{ label: 'Example Label', icon: 'http://via.placeholder.com/20x20', id: uuid() },
			);

			legendObject.attributes.legend_type_options.icons = icons;

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

class IconItem extends React.Component {
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

	iconUpdate( label ) {
		this.props.iconUpdate( { label, id: this.state.iconData.id } );
	}

	render() {
		const { MediaUpload } = wp.blockEditor;

		return (
			<div className="icon-item">
				<MediaUpload
					onSelect={ ( value ) => {
						this.setState( {
							iconData: {
								...this.state.iconData,
								icon: value.url,
							},
						} );
					} }

					render={ ( { open } ) => {
						return (
							<div className="content-wrapper">
								<div className="image" onClick={ open }>
									<img src={ this.state.iconData.icon } width="50" height="50" alt="Logo" />
								</div>
								<div className="buttons-inputs">
									<TextControl
										label={ 'Label' }
										value={ this.state.iconData.label }
										onChange={ ( label ) => {
											this.setState( { iconData: { ...this.state.iconData, label } }, this.iconUpdate(label) );
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
