class JeoLayerTypes {

	constructor() {
		this.layerTypes = [];
	}

	registerLayerType(layerTypeSlug, layerTypeObject) {
		this.layerTypes[layerTypeSlug] = layerTypeObject;
	}
	getLayerType(layerTypeSlug) {
		return this.layerTypes[layerTypeSlug];
	}
	getLayerTypeSchema(layerTypeSlug) {
		return this.getLayerType(layerTypeSlug).getSchema();
	}
}
const instance = new JeoLayerTypes();
window.JeoLayerTypes = instance;
export default instance;
