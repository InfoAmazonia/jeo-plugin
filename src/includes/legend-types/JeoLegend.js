import JeoLegendTypes from './JeoLegendTypes';

class JeoLegend {
	constructor( legendTypeSlug, attributes ) {
		this.__legendType = JeoLegendTypes.getLegendType( legendTypeSlug );
		this.__legendSlug = legendTypeSlug;
		this.attributes = attributes;
	}

	render( map ) {
		return this.__legendType.render( map, this.attributes );
	}

	static typeOptionsShape( type ) {
		// this is the default attributes shape for any new legend
		const options = {
			'simple-color': {
				left_label: '0',
				right_label: '0',
				colors: [ { label: 'Default Item', color: '#ff0909' } ],
			},

			icons: {
				icons: [ { label: 'Default Item', icon: null } ],
			},

			circles: {
				color: '#000',
				circles: [ { label: 'Default Item', radius: 8 } ],
			},

			barscale: {
				left_label: '0',
				right_label: '100',
				colors: [ {
					color: '#ff0909',
					id: crypto.randomUUID(),
					},
					{
					color:'#000',
					id: crypto.randomUUID(),
					}
				],
			},
		};

		return options[ type ];
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
		const adicionalProps = { };

		switch ( legendObject.__legendSlug ) {
			case 'simple-color':
				adicionalProps.colors = [
					...legendObject.attributes.legend_type_options.colors,
				];
				break;
			case 'icons':
				adicionalProps.icons = [
					...legendObject.attributes.legend_type_options.icons,
				];
				break;
			case 'circles':
				adicionalProps.circles = [
					...legendObject.attributes.legend_type_options.circles,
				];
				adicionalProps.color = legendObject.attributes.legend_type_options.color;
				break;
			case 'barscale':
				adicionalProps.left_label = legendObject.attributes.legend_type_options.left_label;
				adicionalProps.right_label = legendObject.attributes.legend_type_options.right_label;
				adicionalProps.colors = [
					...legendObject.attributes.legend_type_options.colors,
				];
				break;
		}

		const legendMeta = {
			legend_type: legendObject.legendSlug,
			legend_type_options: {
				...adicionalProps,
			},
		};

		//console.log(legendMeta)

		return legendMeta;
	}
}

window.JeoLegend = JeoLegend;
export default JeoLegend;
