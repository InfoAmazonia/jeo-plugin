import React from 'react';
import { Fragment } from '@wordpress/element';
import { FormFileUpload, Icon, Button, 	IconButton, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

import '../editors/icons.css';

class IconEditor extends React.Component {
	constructor( props ) {
		super( props );
		this.addLabel = this.addLabel.bind( this );
		this.removeLabel = this.removeLabel.bind( this );

		this.state = {
			legendObject: this.props.legendObject,
			newObjCounter: 0,
		};
	}

	componentDidUpdate() {
		console.log( this.state.legendObject );
	}

	addLabel() {
		this.setState( ( prevState ) => {
			const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
			const icons = this.state.legendObject.attributes.legend_type_options.icons;

			icons.push(
				{ label: 'Example Label', icon: 'http://via.placeholder.com/20x20' },
			);

			legendObject.attributes.legend_type_options.icons = icons;
			const counter = this.state.newObjCounter + 1;

			return { legendObject, newObjCounter: counter };
		} );
	}

	removeLabel( obj ) {
		//console.log("Received id: ", id );

		// this.setState( ( prevState ) => {
		// 	const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
		// 	const icons = this.state.legendObject.attributes.legend_type_options.icons.filter( ( item ) => {
		// 		//console.log("Comparing ", id, " with ", hash( item ) );
		// 		if ( obj === item ) {
		// 			//console.log("found.");
		// 			//console.log("titles: ", item.label );
		// 			return false;
		// 		}

		// 		return true;
		// 	} );

		// 	legendObject.attributes.legend_type_options.icons = icons;

		// 	console.log( icons );

		// 	return { legendObject };
		// } );

	}

	render() {
		const icons = [];

		for ( const icon of this.state.legendObject.attributes.legend_type_options.icons ) {
			icons.push(
				<IconItem iconData={ icon } removeLabel={ this.removeLabel } />
			);
		}

		return (
			<Fragment>
				{ icons }
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
		console.log( "Remove label sent id, title: ", this.props.id, this.state.iconData.label );
		this.props.removeLabel( this.state.iconData );
	}

	render() {
		const { MediaUpload } = wp.editor;

		return (
			<div className="icon-item">
				<MediaUpload
					onSelect={ ( value ) => {
						this.setState( {
							iconData: {
								label: this.state.iconData.label,
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
										onChange={ ( label ) => this.setState( { iconData: { label, icon: this.state.iconData.icon } } ) }
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
