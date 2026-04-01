import { __ } from '@wordpress/i18n';
import JeoLegendTypes from './JeoLegendTypes';
import generateUUID from '../../js/src/util/generate-uuid';

function isPlainObject( value ) {
	return Boolean( value ) && typeof value === 'object' && ! Array.isArray( value );
}

function normalizeBarscaleColors( colors ) {
	if ( ! Array.isArray( colors ) ) {
		return [];
	}

	return colors
		.map( ( color ) => {
			if ( typeof color === 'string' ) {
				return {
					color,
					id: generateUUID(),
				};
			}

			if ( isPlainObject( color ) && typeof color.color === 'string' && color.color ) {
				return {
					...color,
					id: color.id || generateUUID(),
				};
			}

			return null;
		} )
		.filter( Boolean );
}

function normalizeSimpleColors( colors ) {
	if ( ! Array.isArray( colors ) ) {
		return [];
	}

	return colors
		.map( ( color ) => {
			if ( typeof color === 'string' ) {
				return {
					label: '',
					color,
				};
			}

			if ( isPlainObject( color ) && typeof color.color === 'string' && color.color ) {
				return {
					label: color.label || '',
					color: color.color,
				};
			}

			return null;
		} )
		.filter( Boolean );
}

function normalizeIcons( icons ) {
	if ( ! Array.isArray( icons ) ) {
		return [];
	}

	return icons
		.map( ( icon ) => {
			if ( isPlainObject( icon ) && typeof icon.icon === 'string' && icon.icon ) {
				return {
					label: icon.label || '',
					icon: icon.icon,
				};
			}

			return null;
		} )
		.filter( Boolean );
}

function normalizeCircles( circles ) {
	if ( ! Array.isArray( circles ) ) {
		return [];
	}

	return circles
		.map( ( circle ) => {
			if (
				isPlainObject( circle ) &&
				typeof circle.radius !== 'undefined' &&
				Number.isFinite( Number( circle.radius ) )
			) {
				return {
					label: circle.label || '',
					radius: Number( circle.radius ),
				};
			}

			return null;
		} )
		.filter( Boolean );
}

class JeoLegend {
	constructor( legendTypeSlug, attributes ) {
		const normalizedLegendType = JeoLegend.normalizeLegendType(
			legendTypeSlug,
			attributes?.legend_type_options
		);

		this.__legendType = JeoLegendTypes.getLegendType( normalizedLegendType );
		this.__legendSlug = normalizedLegendType;
		this.attributes = JeoLegend.normalizeAttributes(
			normalizedLegendType,
			attributes
		);
	}

	render( map ) {
		if ( ! this.__legendType ) {
			this.__legendType = JeoLegendTypes.getLegendType( this.__legendSlug );
		}

		this.attributes = JeoLegend.normalizeAttributes(
			this.__legendSlug,
			this.attributes
		);

		if ( ! this.__legendType || typeof this.__legendType.render !== 'function' ) {
			return document.createElement( 'div' );
		}

		return this.__legendType.render( map, this.attributes );
	}

	static inferLegendType( legendTypeOptions ) {
		if ( ! isPlainObject( legendTypeOptions ) ) {
			return 'barscale';
		}

		if ( Array.isArray( legendTypeOptions.icons ) ) {
			return 'icons';
		}

		if ( Array.isArray( legendTypeOptions.circles ) ) {
			return 'circles';
		}

		if ( Array.isArray( legendTypeOptions.colors ) ) {
			return (
				Object.hasOwn( legendTypeOptions, 'left_label' ) ||
				Object.hasOwn( legendTypeOptions, 'right_label' )
			)
				? 'barscale'
				: 'simple-color';
		}

		return 'barscale';
	}

	static normalizeLegendType( legendTypeSlug, legendTypeOptions ) {
		if ( typeof legendTypeSlug === 'string' && legendTypeSlug ) {
			return legendTypeSlug;
		}

		return JeoLegend.inferLegendType( legendTypeOptions );
	}

	static typeOptionsShape( type ) {
		// this is the default attributes shape for any new legend
		const options = {
			'simple-color': {
				left_label: '0',
				right_label: '0',
				colors: [ { label: __( 'Default label', 'jeo' ), color: '#ff0909' } ],
			},

			icons: {
				icons: [ { label: __( 'Default label', 'jeo' ), icon: null } ],
			},

			circles: {
				color: '#000',
				circles: [ { label: __( 'Default label', 'jeo' ), radius: 8 } ],
			},

			barscale: {
				left_label: '0',
				right_label: '100',
				colors: [ {
					color: '#ff0909',
					id: generateUUID(),
					},
					{
					color:'#000',
					id: generateUUID(),
					}
				],
			},
		};

		return options[ type ];
	}

	static normalizeTypeOptions( legendTypeSlug, legendTypeOptions ) {
		const normalizedLegendType = JeoLegend.normalizeLegendType(
			legendTypeSlug,
			legendTypeOptions
		);
		const defaultLegendTypeOptions = JeoLegend.typeOptionsShape(
			normalizedLegendType
		);
		const currentLegendTypeOptions = isPlainObject( legendTypeOptions )
			? legendTypeOptions
			: {};

		if ( ! isPlainObject( defaultLegendTypeOptions ) ) {
			return currentLegendTypeOptions;
		}

		switch ( normalizedLegendType ) {
			case 'barscale': {
				const colors = normalizeBarscaleColors( currentLegendTypeOptions.colors );

				return {
					left_label:
						currentLegendTypeOptions.left_label ??
						defaultLegendTypeOptions.left_label,
					right_label:
						currentLegendTypeOptions.right_label ??
						defaultLegendTypeOptions.right_label,
					colors: colors.length ? colors : defaultLegendTypeOptions.colors,
				};
			}

			case 'simple-color': {
				const colors = normalizeSimpleColors( currentLegendTypeOptions.colors );

				return {
					colors: colors.length ? colors : defaultLegendTypeOptions.colors,
				};
			}

			case 'icons': {
				const icons = normalizeIcons( currentLegendTypeOptions.icons );

				return {
					icons: icons.length ? icons : defaultLegendTypeOptions.icons,
				};
			}

			case 'circles': {
				const circles = normalizeCircles( currentLegendTypeOptions.circles );

				return {
					color: currentLegendTypeOptions.color ?? defaultLegendTypeOptions.color,
					circles: circles.length ? circles : defaultLegendTypeOptions.circles,
				};
			}

			default:
				return {
					...defaultLegendTypeOptions,
					...currentLegendTypeOptions,
				};
		}
	}

	static normalizeAttributes( legendTypeSlug, attributes = {} ) {
		const normalizedLegendType = JeoLegend.normalizeLegendType(
			legendTypeSlug,
			attributes?.legend_type_options
		);

		return {
			...attributes,
			use_legend: Boolean( attributes?.use_legend ),
			legend_title: attributes?.legend_title || '',
			legend_type_options: JeoLegend.normalizeTypeOptions(
				normalizedLegendType,
				attributes?.legend_type_options
			),
		};
	}

	get legendSlug() {
		return this.__legendSlug;
	}

	get layer_id() {
		return this.attributes.layer_id;
	}

	get options() {
		return this.attributes.legend_type_options;
	}

	set options( legend_type_options ) {
		this.attributes.legend_type_options = legend_type_options;
	}

	set legendType( legendTypeSlug ) {
		this.__legendType = JeoLegendTypes.getLegendType( legendTypeSlug );
		return this;
	}

	set setlegengSlug( newSlug ) {
		this.__legendSlug = newSlug;
	}

	static updatedLegendMeta( legendObject ) {
		const normalizedLegendTypeOptions = JeoLegend.normalizeTypeOptions(
			legendObject.legendSlug,
			legendObject.attributes.legend_type_options
		);
		const adicionalProps = { };

		switch ( legendObject.__legendSlug ) {
			case 'simple-color':
				adicionalProps.colors = [
					...normalizedLegendTypeOptions.colors,
				];
				break;
			case 'icons':
				adicionalProps.icons = [
					...normalizedLegendTypeOptions.icons,
				];
				break;
			case 'circles':
				adicionalProps.circles = [
					...normalizedLegendTypeOptions.circles,
				];
				adicionalProps.color = normalizedLegendTypeOptions.color;
				break;
			case 'barscale':
				adicionalProps.left_label = normalizedLegendTypeOptions.left_label;
				adicionalProps.right_label = normalizedLegendTypeOptions.right_label;
				adicionalProps.colors = [
					...normalizedLegendTypeOptions.colors,
				];
				break;
		}

		const legendMeta = {
			legend_type: legendObject.legendSlug,
			legend_type_options: {
				...adicionalProps,
			},
		};

		return legendMeta;
	}
}

window.JeoLegend = JeoLegend;
export default JeoLegend;
