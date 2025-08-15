/** @type string */
export const MAP_RUNTIME = jeo_settings.map_runtime

const { createMap, defaultStyle, mapboxToken, mapgl } = await (
	(MAP_RUNTIME === 'maplibregl')
		? import(/* webpackChunkName: "maplibreglLoader" */ './maplibregl/maplibregl-loader.js')
		: import(/* webpackChunkName: "mapboxglLoader" */ './mapboxgl/mapboxgl-loader.js')
)

export { createMap, defaultStyle, mapboxToken, mapgl }
