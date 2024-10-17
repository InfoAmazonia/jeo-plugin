import { Component, Fragment } from '@wordpress/element';
import { Button, Dashicon, Modal, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JeoLegend from '../../../../../includes/legend-types/JeoLegend';

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
								id: crypto.randomUUID(),
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
				{ label: 'Default Label', icon: null, id: crypto.randomUUID() },
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
				<Button variant="secondary" isButton isLarge onClick={ this.addLabel } className="full-width-button">
					{ __( 'Add new label', 'jeo' ) }
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
			openModal: false,
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
			<>
				{ this.state.openModal && (
					<Modal
						className="jeo-interactions-settings__modal"
						title={ __( 'Icon legend', 'jeo' ) }
						isDismissible={ false }
						onRequestClose={ () => {
							this.setState( {
								...this.state,
								openModal: false,
							} );
						} }
					>
						<h4>The uploaded icon is too small. The minimum size required is 60x60 pixels.</h4>
						<Button
							isLarge
							variant="primary"
							style={ { marginTop: '10px' } }
							onClick={ () => {
								this.setState( {
									...this.state,
									openModal: false,
								} );
							} }
						>
							{ __( 'Ok', 'jeo' ) }
						</Button>
					</Modal>
				) }

				<div className="icon-item">
					<MediaUpload
						onSelect={ ( value ) => {
							const image = new Image();
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
									this.setState( {
										...this.state,
										openModal: true,
									} );
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
											label={ __( 'Label', 'jeo' ) }
											value={ this.state.iconData.label }
											onChange={ ( label ) => {
												this.setState( { iconData: { ...this.state.iconData, label } }, this.iconUpdate( label ) );
											} }
										/>

										<Button icon="minus" label="Remove" onClick={ this.removeLabel } className="remove-button" />
									</div>
								</div>
							);
						} }
					/>
				</div>
			</>
		);
	}
}
