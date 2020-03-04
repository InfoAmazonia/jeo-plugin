import JeoLegendTypes from './JeoLegendTypes';

class JeoLegend {
	constructor( legendTypeSlug, attributes ) {
		this.__legendType = JeoLegendTypes.getLegendType( legendTypeSlug );
		this.__legendSlug = legendTypeSlug;
		this.attributes = attributes;
	}

	render( map ) {
		return this.legendType.render( map, this.attributes );
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
}

window.JeoLegend = JeoLegend;
export default JeoLegend;
