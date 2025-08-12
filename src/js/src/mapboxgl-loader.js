import MapboxGL from 'mapbox-gl'
import U from 'map-gl-utils'

import 'mapbox-gl/dist/mapbox-gl.css'

MapboxGL.accessToken = jeo_settings.mapbox_key

globalThis.mapgl = MapboxGL
globalThis.mapboxgl = MapboxGL // compat

globalThis.mapglLoader = {
	mapboxToken: jeo_settings.mapbox_key,
	defaultStyle: 'mapbox://styles/mapbox/streets-v11',
	createMap ({ container, style, ...options }) {
		const map = new MapboxGL.Map({
			accessToken: this.mapboxToken,
			container: container,
			projection: 'equirectangular',
			style: style ?? this.defaultStyle,
			...options,
		})

		U.init(map, MapboxGL)

		return map
	},
}
