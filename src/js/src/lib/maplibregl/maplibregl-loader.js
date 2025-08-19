import U from 'map-gl-utils'
import MapLibreGL from 'maplibre-gl'
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer'

import 'maplibre-gl/dist/maplibre-gl.css'

/** @type string */
export const mapboxToken = jeo_settings.mapbox_key

export const mapgl = MapLibreGL
globalThis.mapboxgl = MapLibreGL // compat

export const defaultStyle = {
	version: 8,
	sources: {
		osm: {
			type: 'raster',
			tiles: [
				'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
				'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
			],
			tileSize: 256,
			attribution: '© OpenStreetMap Contributors',
			maxzoom: 19,
		},
	},
	layers: [
		{
			id: 'osm',
			type: 'raster',
			source: 'osm',
		},
	],
}

function transformRequest(url, resourceType) {
	if (isMapboxURL(url)) {
		return transformMapboxUrl(url, resourceType, mapboxToken)
  	}
    return { url }
}

export function createMap({ container, style, ...options }) {
	const map = new MapLibreGL.Map({
		container: container,
		projection: 'equirectangular',
		style: style ?? this.defaultStyle,
		validateStyle: false,
		transformRequest,
		...options,
	})

	U.init(map, MapLibreGL)

	return map
}
