import U from 'map-gl-utils'
import MapLibreGL from 'maplibre-gl'
import { isMapboxURL, transformMapboxStyle, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer'

import 'maplibre-gl/dist/maplibre-gl.css'

// Fix: Patch HTMLElement's instanceof check for cross-document (iframe) compatibility.
// In WordPress Block API v3, blocks run inside an iframe. MapLibreGL checks
// `container instanceof HTMLElement` which fails when the container element
// comes from the iframe document while MapLibreGL uses the parent document's
// HTMLElement prototype. This makes the check use duck-typing instead.
// IMPORTANT: Must use `function` (not arrow) so `this` is the right-hand
// constructor. For subclasses (e.g. HTMLInputElement), we fall back to a
// standard prototype-chain walk to avoid false positives.
try {
	Object.defineProperty( HTMLElement, Symbol.hasInstance, {
		value: function ( instance ) {
			if ( instance == null || typeof instance !== 'object' ) return false;
			if ( this === HTMLElement ) {
				// Duck-type: any DOM element node, regardless of document origin
				return instance.nodeType === 1;
			}
			// Subclass check (e.g. HTMLInputElement): walk the prototype chain
			let proto = Object.getPrototypeOf( instance );
			const targetProto = this.prototype;
			while ( proto !== null ) {
				if ( proto === targetProto ) return true;
				proto = Object.getPrototypeOf( proto );
			}
			return false;
		},
		configurable: true,
	} );
} catch ( e ) {
	// Symbol.hasInstance may not be configurable in some environments
}

/** @type string */
export const mapboxToken = jeo_settings.mapbox_key

export const mapgl = MapLibreGL
globalThis.mapboxgl = MapLibreGL // compat

export const defaultStyle = {
	version: 8,
	glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
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

export function mapboxTransformRequest(url, resourceType) {
	if (isMapboxURL(url)) {
		return transformMapboxUrl(url, resourceType, mapboxToken)
  	} else if (url.includes('tiles.mapbox.com') && url.includes('.jpg?')) {
		// MapLibreGL don't remove black backgrounds from Mapbox JPEG static tiles
		return { url: url.replace('.jpg?', '.webp?') }
	}
    return { url }
}

function createTransformRequest(baseTransformRequest) {
	if (baseTransformRequest) {
		return (url, resourceType) => {
			const { url: baseUrl } = baseTransformRequest(url, resourceType)
			return mapboxTransformRequest(baseUrl, resourceType)
		}
	} else {
		return mapboxTransformRequest
	}
}

export function createMap({ container, style, transformRequest, ...options }) {
	const map = new MapLibreGL.Map({
		container: container,
		projection: 'equirectangular',
		validateStyle: false,
		transformRequest: createTransformRequest(transformRequest),
		...options,
	})

	map.setStyle(style ?? defaultStyle, {
		transformStyle: transformMapboxStyle,
	})

	U.init(map, MapLibreGL)

	return map
}

/**
 * @param {import('maplibre-gl').GeoJSONSource} source
 */
export function getClusterLeaves(source, cluster, limit, offset) {
	return source.getClusterLeaves(cluster, limit, offset)
}

/**
 * @param {import('maplibre-gl').Map} map
 */
export function loadImage(map, id, url) {
	return new Promise((resolve, reject) => {
		map.loadImage(url).then((image) => {
			map.addImage(id, image.data)
			resolve(id)
		}).catch(reject)
	})
}
