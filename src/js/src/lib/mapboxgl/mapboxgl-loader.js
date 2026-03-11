import U from 'map-gl-utils'
import MapboxGL from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'

// Fix: Patch HTMLElement's instanceof check for cross-document (iframe) compatibility.
// In WordPress Block API v3, blocks run inside an iframe. MapboxGL checks
// `container instanceof HTMLElement` which fails when the container element
// comes from the iframe document while MapboxGL uses the parent document's
// HTMLElement prototype. This makes the check use duck-typing instead.
try {
	Object.defineProperty( HTMLElement, Symbol.hasInstance, {
		value: ( instance ) => instance != null && typeof instance === 'object' && instance.nodeType === 1,
		configurable: true,
	} );
} catch ( e ) {
	// Symbol.hasInstance may not be configurable in some environments
}

/** @type string */
export const mapboxToken = jeo_settings.mapbox_key

MapboxGL.accessToken = mapboxToken

export const mapgl = MapboxGL
globalThis.mapboxgl = MapboxGL // compat

export const defaultStyle = 'mapbox://styles/mapbox/streets-v11'

export function createMap ({ container, style, ...options }) {
	const map = new MapboxGL.Map({
		accessToken: mapboxToken,
		container: container,
		projection: 'equirectangular',
		style: style ?? defaultStyle,
		...options,
	})

	U.init(map, MapboxGL)

	return map
}

/**
 * @param {import('mapbox-gl').GeoJSONSource} source
 */
export function getClusterLeaves(source, cluster, limit, offset) {
	return new Promise((resolve, reject) => {
		source.getClusterLeaves(cluster, limit, offset, (err, features) => {
			if (err) {
				reject(err)
			} else {
				resolve(features)
			}
		})
	})
}

/**
 * @param {import('mapbox-gl').Map} map
 */
export function loadImage(map, id, url) {
	return new Promise((resolve, reject) => {
		map.loadImage(url, (err, image) => {
			if (err) {
				reject(err)
			} else {
				map.addImage(id, image)
				resolve(id)
			}
		})
	})
}
