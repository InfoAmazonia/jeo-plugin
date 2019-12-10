class JeoLayerTypes {

	constructor() {
		this.layerTypes = [];
	}

	registerLayerType(layerTypeSlug, layerTypeObject) {
		this.layerTypes[layerTypeSlug] = layerTypeObject;
	}
	getLayerType(layerTypeSlug) {
		console.log(this.layerTypes[layerTypeSlug]);
		return this.layerTypes[layerTypeSlug];
	}
	getLayerTypeSchema(layerTypeSlug) {
		return this.getLayerType(layerTypeSlug).getSchema();
	}
}

export default (new JeoLayerTypes);
