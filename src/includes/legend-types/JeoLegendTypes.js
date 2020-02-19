class JeoLegendTypes {
	constructor() {
		this.legendTypes = {};
	}

	getLegendTypes() {
		return Object.keys( this.legendTypes );
	}
	registerLegendType( legendTypeSlug, legendTypeObject ) {
		this.legendTypes[ legendTypeSlug ] = legendTypeObject;
	}
	getLegendType( legendTypeSlug ) {
		return this.legendTypes[ legendTypeSlug ];
	}
	getLegendTypeSchema( legendTypeSlug ) {
		return this.getLegendType( legendTypeSlug ).getSchema();
	}
}
const instance = new JeoLegendTypes();
window.JeoLegendTypes = instance;
export default instance;
