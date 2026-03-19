__webpack_public_path__ = jeo_settings.public_path

import {
	createMap as createMapMapLibre,
	defaultStyle as defaultStyleMapLibre,
	getClusterLeaves as getClusterLeavesMapLibre,
	loadImage as loadImageMapLibre,
	mapboxToken as configuredMapboxToken,
	mapgl as mapLibreRuntime,
	transformRequest as mapLibreTransformRequest,
} from './maplibregl/maplibregl-loader'
import {
	createMap as createMapMapbox,
	defaultStyle as defaultStyleMapbox,
	getClusterLeaves as getClusterLeavesMapbox,
	getMapLibrary as getMapboxRuntime,
	isMapboxRuntimeAvailable,
	loadImage as loadImageMapbox,
	transformRequest as mapboxTransformRequest,
} from './mapboxgl/mapboxgl-loader'

const MAPBOX_FALLBACK_NOTICE_ID = 'jeo-mapbox-runtime-fallback'

/** @type string */
export const MAP_RUNTIME_REQUESTED = jeo_settings.map_runtime ?? 'maplibregl'

function reportMapboxFallback( reason ) {
	if ( MAP_RUNTIME_REQUESTED !== 'mapboxgl' ) {
		return;
	}

	const message = reason === 'missing_token'
		? jeo_settings.runtime_messages?.mapbox_missing_token
		: jeo_settings.runtime_messages?.mapbox_runtime_unavailable

	console.warn( message )

	if ( typeof document === 'undefined' || ! document.body?.classList.contains( 'wp-admin' ) ) {
		return;
	}

	const notify = () => {
		if ( globalThis.wp?.data?.dispatch ) {
			globalThis.wp.data.dispatch( 'core/notices' ).createNotice(
				'warning',
				message,
				{
					id: MAPBOX_FALLBACK_NOTICE_ID,
					isDismissible: false,
				}
			)
			return;
		}

		if ( document.getElementById( MAPBOX_FALLBACK_NOTICE_ID ) ) {
			return;
		}

		const container = document.querySelector( '.wrap' ) || document.querySelector( '.interface-interface-skeleton__content' )
		if ( ! container ) {
			return;
		}

		const notice = document.createElement( 'div' )
		notice.id = MAPBOX_FALLBACK_NOTICE_ID
		notice.className = 'notice notice-warning'
		notice.innerHTML = `<p>${message}</p>`
		container.prepend( notice )
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', notify, { once: true } )
	} else {
		notify()
	}
}

const hasMapboxToken = typeof configuredMapboxToken === 'string' && configuredMapboxToken.trim().length > 0
const canUseMapboxRuntime = MAP_RUNTIME_REQUESTED === 'mapboxgl' && hasMapboxToken && isMapboxRuntimeAvailable()

if ( MAP_RUNTIME_REQUESTED === 'mapboxgl' && ! canUseMapboxRuntime ) {
	reportMapboxFallback( hasMapboxToken ? 'runtime_unavailable' : 'missing_token' )
}

/** @type string */
export const MAP_RUNTIME = canUseMapboxRuntime ? 'mapboxgl' : 'maplibregl'

const activeRuntime = MAP_RUNTIME === 'mapboxgl'
	? {
		createMap: createMapMapbox,
		defaultStyle: defaultStyleMapbox,
		getClusterLeaves: getClusterLeavesMapbox,
		loadImage: loadImageMapbox,
		mapgl: getMapboxRuntime(),
		transformRequest: mapboxTransformRequest,
	}
	: {
		createMap: createMapMapLibre,
		defaultStyle: defaultStyleMapLibre,
		getClusterLeaves: getClusterLeavesMapLibre,
		loadImage: loadImageMapLibre,
		mapgl: mapLibreRuntime,
		transformRequest: mapLibreTransformRequest,
	}

globalThis.mapboxgl = activeRuntime.mapgl

const {
	createMap,
	defaultStyle,
	getClusterLeaves,
	loadImage,
	mapgl,
	transformRequest,
} = activeRuntime

export {
	createMap,
	defaultStyle,
	getClusterLeaves,
	loadImage,
	configuredMapboxToken as mapboxToken,
	mapgl,
	transformRequest,
}
