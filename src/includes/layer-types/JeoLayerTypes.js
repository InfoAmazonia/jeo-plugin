class JeoLayerTypes {
	constructor() {
		this.layerTypes = {};
	}

	emitChange() {
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

	/**
	 * Returns a sensible default paint object for a Mapbox/MapLibre geometry type.
	 *
	 * Vector layers (mvt / mapbox-tileset-vector) selected by the AI Minimap from
	 * the layer catalog frequently have no saved style. Without an explicit paint,
	 * Mapbox renders them with near-invisible defaults, so the layer appears to be
	 * "missing" even though it was added (only the pins show up). This provides a
	 * visible, editable fallback so the feature is at least perceivable on the map.
	 *
	 * @param {string} geometryType One of fill, line, circle, fill-extrusion, etc.
	 * @return {Object|null} A paint object, or null when no fallback should be forced.
	 */
	getFallbackPaint( geometryType ) {
		switch ( geometryType ) {
			case 'fill':
				return {
					'fill-color': '#e15a2d',
					'fill-opacity': 0.35,
					'fill-outline-color': '#b8431c',
				};
			case 'line':
				return {
					'line-color': '#e15a2d',
					'line-width': 2,
				};
			case 'circle':
				return {
					'circle-radius': 5,
					'circle-color': '#e15a2d',
					'circle-opacity': 0.85,
					'circle-stroke-width': 1,
					'circle-stroke-color': '#ffffff',
				};
			case 'fill-extrusion':
				return {
					'fill-extrusion-color': '#e15a2d',
					'fill-extrusion-opacity': 0.6,
				};
			default:
				// symbol, heatmap, hillshade, background: keep engine defaults.
				return null;
		}
	}

	/**
	 * Whether a layer's resolved style would leave the layer effectively invisible,
	 * i.e. it has no paint of its own and would rely on a forced fallback.
	 *
	 * @param {Object} attributes Layer attributes (style / default_style / layer_type_options).
	 * @return {boolean} True when a fallback paint would be applied.
	 */
	needsFallbackStyle( attributes ) {
		const effectiveStyle = attributes?.style?.use_default
			? attributes?.default_style || {}
			: attributes?.style || {};
		return ! effectiveStyle.paint;
	}
}
const instance = new JeoLayerTypes();
window.JeoLayerTypes = instance;
export default instance;
