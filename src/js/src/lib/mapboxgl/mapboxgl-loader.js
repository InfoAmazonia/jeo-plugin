import U from 'map-gl-utils'
import MapboxGL from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css'

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
export function getClusterExpansionZoom(source, cluster) {
	return new Promise((resolve, reject) => {
		source.getClusterExpansionZoom(cluster, (err, zoom) => {
			if (err) {
				reject(err)
			} else {
				resolve(zoom)
			}
		})
	})
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
