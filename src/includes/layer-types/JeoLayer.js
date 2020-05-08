import JeoLayerTypes from './JeoLayerTypes';

class JeoLayer {
	constructor( layerTypeSlug, attributes ) {
		this.layerType = JeoLayerTypes.getLayerType( layerTypeSlug );
		this.attributes = attributes;
	}
	addStyle( map ) {
		return this.layerType.addStyle( map, this.attributes );
	}
	addLayer( map ) {
		return this.layerType.addLayer( map, this.attributes );
	}

	getSchema() {
		return this.layerType.getSchema( this.attributes );
	}

	addInteractions( map ) {
		if ( typeof this.layerType.addInteractions === 'function' ) {
			return this.layerType.addInteractions( map, this.attributes );
		}
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

	get source_url() {
		return this.attributes.source_url;
	}

	get attribution_name() {
		return this.attributes.attribution_name;
	}

}

window.JeoLayer = JeoLayer;
export default JeoLayer;
