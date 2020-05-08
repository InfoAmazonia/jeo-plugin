import { Component, Fragment } from '@wordpress/element';
import { SelectControl, CheckboxControl } from '@wordpress/components';
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

		this.state = {
			legendObject: new JeoLegend( metadata.legend_type, {
				legend_type_options: metadata.legend_type_options,
				use_legend: metadata.use_legend,
			} ),
		};

		// New post case
		if ( this.state.legendObject.legendSlug.length === 0 ) {
			this.initialType = 'barscale';
			this.state.legendObject.__legendType = this.initialType;
			this.state.legendObject.__legendSlug = this.initialType;
			this.state.legendObject.attributes.legend_type_options = JeoLegend.typeOptionsShape( 'barscale' );
		}

		this.initialType = this.state.legendObject.legendSlug === undefined ? 'barscale' : this.state.legendObject.legendSlug;
		this.inicialAttrType = this.state.legendObject.attributes.legend_type_options;
	}

	componentDidUpdate() {

	}

	hasChanged( legendObject ) {
		wp.data.dispatch( 'core/editor' ).editPost( { meta: JeoLegend.updatedLegendMeta( legendObject ) } );
		this.setState( { legendObject } );
	}

	render() {
		return (
			<Fragment>
				<CheckboxControl
					label={ __( 'Use legend' ) }
					checked={ this.state.legendObject.attributes.use_legend }
					onChange={ () => {
						const newMeta = wp.data.select( 'core/editor' ).getCurrentPost().meta;
						newMeta.use_legend = ! newMeta.use_legend;
						wp.data.dispatch( 'core/editor' ).editPost( { meta: newMeta } );

						this.setState( ( prevState ) => {
							const newState = prevState;
							newState.legendObject.attributes.use_legend = ! newState.legendObject.attributes.use_legend;
							return ( newState );
						} );
					} }
				/>

				{ this.state.legendObject.attributes.use_legend && (
					<>
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
							} }
						/>
						<LegendTypeEdition legendObject={ this.state.legendObject } initialType={ this.initialType } hasChanged={ this.hasChanged } />
					</>
				) }

			</Fragment>

		);
	}
}

export default LegendEditor;
