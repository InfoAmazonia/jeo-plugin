import JeoLegendTypes from './JeoLegendTypes';

class JeoLegend {
	constructor( legendTypeSlug, attributes ) {
		this.legendType = JeoLegendTypes.getLegendType( legendTypeSlug );
		this.attributes = attributes;

	}
	render(map) {
		return this.legendType.render(map, this.attributes);
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
}

window.JeoLegend = JeoLegend;
export default JeoLegend;
