import JeoLayerTypes from './JeoLayerTypes'

class JeoLayer {
	constructor(layerTypeSlug, attributes) {
		this.layerType = JeoLayerTypes.getLayerType(layerTypeSlug);
		this.attributes = attributes;
	}
	addStyle(map) {
		return this.layerType.addStyle(map, this.attributes);
	}
	addLayer(map) {
		return this.layerType.addLayer(map, this.attributes);
	}

	getSchema() {
		return this.layerType.getSchema(this.attributes);
	}

	get layer_name() {
		return this.attributes.layer_name;
	}

	get layer_id() {
		return this.attributes.layer_id;
	}

	get attribution() {
		return this.attributes.attribution;
	}

	get options() {
		return this.attributes.layer_type_options;
	}
}

window.JeoLayer = JeoLayer;
export default JeoLayer;
