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
