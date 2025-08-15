import U from 'map-gl-utils'
import MapLibreGL from 'maplibre-gl'

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

export function createMap({ container, style, ...options }) {
	const map = new MapLibreGL.Map({
		container: container,
		projection: 'equirectangular',
		style: style ?? this.defaultStyle,
		...options,
	})

	U.init(map, MapLibreGL)

	return map
}
