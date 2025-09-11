import { MAP_RUNTIME } from './mapgl-loader'

const { Layer, Map, Source } = await (
	(MAP_RUNTIME === 'maplibregl')
		? import(/* webpackChunkName: "maplibreglReact" */ './maplibregl/maplibregl-react.js')
		: import(/* webpackChunkName: "mapboxglReact" */ './mapboxgl/mapboxgl-react.js')
)

export { Layer, Map, Source }
