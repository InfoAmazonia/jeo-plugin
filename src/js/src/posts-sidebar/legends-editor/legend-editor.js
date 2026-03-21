import { Component, Fragment } from '@wordpress/element';
import { SelectControl, CheckboxControl, TextControl } from '../../shared/wp-form-controls';
import JeoLegend from '../../../../includes/legend-types/JeoLegend';
import JeoLegendTypes from '../../../../includes/legend-types/JeoLegendTypes';
import { __ } from '@wordpress/i18n';
import LegendTypeEdition from './legend-type-edition';

const CORE_LEGEND_TYPES = [
	{ value: 'barscale', label: __( 'Color scale', 'jeo' ) },
	{ value: 'simple-color', label: __( 'Color categories', 'jeo' ) },
	{ value: 'icons', label: __( 'Icon categories', 'jeo' ) },
	{ value: 'circles', label: __( 'Circle sizes', 'jeo' ) },
];

function isPlainObject( value ) {
	return Boolean( value ) && typeof value === 'object' && ! Array.isArray( value );
}

function getRegisteredLegendTypes() {
	const registeredLegendTypes = Object.keys( JeoLegendTypes.legendTypes || {} ).map(
		( slug ) => ( {
			value: slug,
			label: JeoLegendTypes.getLegendType( slug )?.label || slug,
		} )
	);

	return registeredLegendTypes.length ? registeredLegendTypes : CORE_LEGEND_TYPES;
}

function normalizeLegendTypeOptions( legendType, legendTypeOptions ) {
	const defaultLegendTypeOptions = JeoLegend.typeOptionsShape( legendType );

	if ( ! isPlainObject( defaultLegendTypeOptions ) ) {
		return {};
	}

	const currentLegendTypeOptions = isPlainObject( legendTypeOptions )
		? legendTypeOptions
		: {};

	switch ( legendType ) {
		case 'barscale':
			return {
				left_label:
					currentLegendTypeOptions.left_label ?? defaultLegendTypeOptions.left_label,
				right_label:
					currentLegendTypeOptions.right_label ??
					defaultLegendTypeOptions.right_label,
				colors:
					Array.isArray( currentLegendTypeOptions.colors ) &&
					currentLegendTypeOptions.colors.length
						? currentLegendTypeOptions.colors
						: defaultLegendTypeOptions.colors,
			};

		case 'simple-color':
			return {
				colors:
					Array.isArray( currentLegendTypeOptions.colors ) &&
					currentLegendTypeOptions.colors.length
						? currentLegendTypeOptions.colors
						: defaultLegendTypeOptions.colors,
			};

		case 'icons':
			return {
				icons:
					Array.isArray( currentLegendTypeOptions.icons ) &&
					currentLegendTypeOptions.icons.length
						? currentLegendTypeOptions.icons
						: defaultLegendTypeOptions.icons,
			};

		case 'circles':
			return {
				color: currentLegendTypeOptions.color ?? defaultLegendTypeOptions.color,
				circles:
					Array.isArray( currentLegendTypeOptions.circles ) &&
					currentLegendTypeOptions.circles.length
						? currentLegendTypeOptions.circles
						: defaultLegendTypeOptions.circles,
			};

		default:
			return {
				...defaultLegendTypeOptions,
				...currentLegendTypeOptions,
			};
	}
}

function buildLegendObject( legendType = 'barscale', attributes = {} ) {
	return new JeoLegend( legendType, {
		use_legend: Boolean( attributes.use_legend ),
		legend_title: attributes.legend_title ? attributes.legend_title : '',
		legend_type_options: normalizeLegendTypeOptions(
			legendType,
			attributes.legend_type_options
		),
	} );
}

class LegendEditor extends Component {
	constructor() {
		super();
		this.legendTypes = getRegisteredLegendTypes();
		this.hasChanged = this.hasChanged.bind( this );

		const metadata =
			wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
		const legendType = metadata.legend_type || 'barscale';
		const legendObject = buildLegendObject( legendType, {
			legend_type_options: metadata.legend_type_options,
			use_legend: metadata.use_legend,
			legend_title: metadata.legend_title,
		} );

		this.state = {
			legendObject,
		};

		this.initialType = legendObject.legendSlug || 'barscale';
		this.inicialAttrType = normalizeLegendTypeOptions(
			this.initialType,
			legendObject.attributes.legend_type_options
		);

		// Update layer with the initialized legend
		wp.data.dispatch( 'core/editor' ).editPost( {
			meta: {
				...metadata,
				...JeoLegend.updatedLegendMeta( legendObject ),
			},
		} );
	}

	hasChanged( legendObject ) {
		const metadata =
			wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
		wp.data.dispatch( 'core/editor' ).editPost( {
			meta: {
				...metadata,
				...JeoLegend.updatedLegendMeta( legendObject ),
			},
		} );
		this.setState( { legendObject } );
	}

	render() {
		const legendType = this.state.legendObject.legendSlug || 'barscale';
		const legendObject = buildLegendObject( legendType, {
			...this.state.legendObject.attributes,
			legend_type_options: this.state.legendObject.attributes.legend_type_options,
		} );

		return (
			<Fragment>
				<CheckboxControl
					label={ __( 'Use legend', 'jeo' ) }
					checked={ legendObject.attributes.use_legend }
					onChange={ () => {
						const metadata =
							wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
						const nextLegendObject = buildLegendObject( legendType, {
							...legendObject.attributes,
							use_legend: ! legendObject.attributes.use_legend,
						} );
						wp.data.dispatch( 'core/editor' ).editPost( {
							meta: {
								...metadata,
								use_legend: nextLegendObject.attributes.use_legend,
							},
						} );
						this.setState( { legendObject: nextLegendObject } );
					} }
				/>

				{ legendObject.attributes.use_legend && <TextControl
					className="label-input-wrapper"
					label={ __( 'Legend title', 'jeo' ) }
					value={ legendObject.attributes.legend_title }
					onChange={ ( value ) => {
						const metadata =
							wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
						const nextLegendObject = buildLegendObject( legendType, {
							...legendObject.attributes,
							legend_title: value,
						} );
						wp.data.dispatch( 'core/editor' ).editPost( {
							meta: {
								...metadata,
								legend_title: value,
							},
						} );
						this.setState( { legendObject: nextLegendObject } );
					} }
				/> }

				{ legendObject.attributes.use_legend && (
					<>
						<SelectControl
							label={ __( 'Type', 'jeo' ) }
							value={ legendType }
							options={ this.legendTypes }
							onChange={ ( newLegendType ) => {
								const nextLegendObject = buildLegendObject( newLegendType, {
									...legendObject.attributes,
									legend_type_options:
										this.initialType === newLegendType
											? this.inicialAttrType
											: JeoLegend.typeOptionsShape( newLegendType ),
								} );
								this.hasChanged( nextLegendObject );
							} }
						/>
						<LegendTypeEdition legendObject={ legendObject } hasChanged={ this.hasChanged } />
					</>
				) }

			</Fragment>

		);
	}
}

export default LegendEditor;
