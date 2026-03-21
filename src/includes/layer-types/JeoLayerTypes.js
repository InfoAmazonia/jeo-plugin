class JeoLayerTypes {
	constructor() {
		this.layerTypes = {};
	}

	emitChange() {
		if (
			typeof window === 'undefined' ||
			typeof window.dispatchEvent !== 'function' ||
			typeof CustomEvent !== 'function'
		) {
			return;
		}

		window.dispatchEvent(
			new CustomEvent( 'jeo-layer-types-changed', {
				detail: {
					layerTypes: this.getLayerTypes(),
				},
			} )
		);
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
		this.emitChange();
	}
	getLayerType( layerTypeSlug ) {
		return this.layerTypes[ layerTypeSlug ];
	}
	getLayerTypeSchema( attributes ) {
		return this.getLayerType( attributes.type )?.getSchema?.( attributes ) || null;
	}
}
const instance = new JeoLayerTypes();
window.JeoLayerTypes = instance;
export default instance;
