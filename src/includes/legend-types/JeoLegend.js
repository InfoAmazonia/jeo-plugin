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
				icons: [ { label: 'Default Item', icon: 'http://via.placeholder.com/60x60' } ],
			},

			circles: {

			},

			barscale: {

			},
		};

		return options[ type ];
	}

	get legendSlug() {
		return this.__legendSlug;
	}

	get title() {
		return this.attributes.title;
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
		//console.log({ legendObject.attributes.legend_type_options);
		// this is necessary because '...' wont turn arrays into objects with the matching index
		const legendTypeSpec = {
		};

		console.log(legendObject);

		const legendMeta = {
			legend_type: legendObject.legendSlug,
			legend_title: legendObject.title,
			legend_type_options: {
				colors: {
					...legendObject.attributes.legend_type_options.colors,
				},

				icons: {
					...legendObject.attributes.legend_type_options.icons,
				},
			},
		};

		//console.log(legendMeta,legendMeta2)

		return legendMeta;
	}
}

window.JeoLegend = JeoLegend;
export default JeoLegend;
