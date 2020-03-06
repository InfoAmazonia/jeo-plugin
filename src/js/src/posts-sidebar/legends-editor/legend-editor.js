import { Component, Fragment } from '@wordpress/element';
import { TextControl, SelectControl, Button } from '@wordpress/components';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';
import JeoLegendTypes from '../../../../includes/legend-types/JeoLegendTypes';
import { __ } from '@wordpress/i18n';
import LegendTypeEdition from './legend-type-edition';

class LegendEditor extends Component {
	constructor() {
		super();
		this.legendTypes = Object.keys( JeoLegendTypes.legendTypes );
		this.hasChanged = this.hasChanged.bind( this );

		const metadata = wp.data.select( 'core/editor' ).getCurrentPost().meta;
		console.log(metadata);

		this.state = {
			legendObject: new JeoLegend( metadata.legend_type, {
				title: metadata.legend_title,
				legend_type_options: metadata.legend_type_options,
			} ),
		};

		this.initialType = this.state.legendObject.legendSlug === undefined ? 'barscale' : this.state.legendObject.legendSlug;
		this.inicialAttrType = this.state.legendObject.attributes.legend_type_options;
		//console.log( this.state.legendObject );
	}

	componentDidUpdate() {

	}

	hasChanged( legendObject ) {
		this.setState( { legendObject } );
		wp.data.dispatch( 'core/editor' ).editPost( { meta: JeoLegend.updatedLegendMeta( this.state.legendObject ) } );
	}

	render() {
		return (
			<Fragment>
				<TextControl
					label={ __( 'Title' ) }
					value={ this.state.legendObject.attributes.title }
					onChange={ ( input ) => {
						this.setState( ( prevState ) => {
							const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
							legendObject.attributes.title = input;

							this.hasChanged( legendObject );

							return { legendObject };
						} );

						//wp.data.dispatch( 'core/editor' ).editPost( { meta: { legend_title: input } } );
					} }
				/>

				<SelectControl
					label={ __( 'Type' ) }
					value={ this.state.legendObject.legendSlug }
					options={ [	...this.legendTypes.map( ( item ) => {
						return { label: item, value: item };
					} )	] }

					onChange={ ( newLegendType ) => {
						this.setState( ( prevState ) => {
							const legendObject = Object.assign( new JeoLegend, prevState.legendObject );
							legendObject.legendType = newLegendType;
							legendObject.setlegengSlug = newLegendType;

							if ( this.initialType !== newLegendType ) {
								legendObject.attributes.legend_type_options = JeoLegend.typeOptionsShape( newLegendType );
							} else {
								legendObject.attributes.legend_type_options = this.inicialAttrType;
							}

							this.hasChanged( legendObject );

							return { legendObject };
						} );

						//wp.data.dispatch( 'core/editor' ).editPost( { meta: { 'legend_type': newLegendType } } );
					} }
				/>

				<LegendTypeEdition legendObject={ this.state.legendObject } initialType={ this.initialType } hasChanged={ this.hasChanged } />

				{/* <Button isPrimary isButton isLarge onClick={ 'asd' } className="full-width-button">
					{ __( 'Save' ) }
				</Button> */}

			</Fragment>

		);
	}
}

export default LegendEditor;
