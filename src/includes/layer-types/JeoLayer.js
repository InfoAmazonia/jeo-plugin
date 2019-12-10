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
}

export default JeoLayer;
