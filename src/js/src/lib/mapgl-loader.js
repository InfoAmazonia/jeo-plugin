__webpack_public_path__ = jeo_settings.public_path

/** @type string */
export const MAP_RUNTIME = jeo_settings.map_runtime

const {
	createMap,
	defaultStyle,
	getClusterExpansionZoom,
	getClusterLeaves,
	loadImage,
	mapboxToken,
	mapgl,
} = await (
	(MAP_RUNTIME === 'maplibregl')
		? import(/* webpackChunkName: "maplibreglLoader" */ './maplibregl/maplibregl-loader.js')
		: import(/* webpackChunkName: "mapboxglLoader" */ './mapboxgl/mapboxgl-loader.js')
)

export {
	createMap,
	defaultStyle,
	getClusterExpansionZoom,
	getClusterLeaves,
	loadImage,
	mapboxToken,
	mapgl,
}
