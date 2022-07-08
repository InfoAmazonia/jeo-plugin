class JeoLayerTypes {
	constructor() {
		this.layerTypes = {};
	}

	getLayerTypes() {
		return Object.keys( this.layerTypes );
	}
	getLayerTypesLabels () {
		return Object.entries( this.layerTypes ).map( ( [ key, value ] ) => {
			return value.label || key;
		} );
	}
	registerLayerType( layerTypeSlug, layerTypeObject ) {
		this.layerTypes[ layerTypeSlug ] = layerTypeObject;
	}
	getLayerType( layerTypeSlug ) {
		return this.layerTypes[ layerTypeSlug ];
	}
	getLayerTypeSchema( attributes ) {
		return this.getLayerType( attributes.type ).getSchema( attributes );
	}
}
const instance = new JeoLayerTypes();
window.JeoLayerTypes = instance;
export default instance;
