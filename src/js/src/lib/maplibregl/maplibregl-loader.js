import U from 'map-gl-utils'
import MapLibreGL from 'maplibre-gl'
import { isMapboxURL, transformMapboxStyle, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer'

import 'maplibre-gl/dist/maplibre-gl.css'

// Fix: Patch instanceof checks for cross-document (iframe) compatibility.
// In WordPress Block API v3, blocks run inside an iframe. The JS module
// is evaluated in one document context but DOM elements and events may
// originate from a different document (the iframe).  The native
// `instanceof` operator compares against the constructor of the *current*
// document, so `iframeElement instanceof HTMLElement` or
// `iframeEvent instanceof MouseEvent` returns false.
//
// MapLibreGL relies on these checks in two critical places:
//   1. `container instanceof HTMLElement`  — to validate the map container
//   2. `event instanceof MouseEvent`       — inside `isPointableEvent()` to
//      decide whether to process mouse events (mousedown, mousemove, etc.).
//      When this returns false the HandlerManager silently drops the event,
//      completely breaking drag/pan/zoom interaction.
//
// We patch `Symbol.hasInstance` on each constructor so the check uses
// duck-typing (nodeType for elements, type string for events) instead of
// a strict prototype-chain walk that fails across documents.

/**
 * Generic cross-document instanceof patch via Symbol.hasInstance.
 * @param {Function} Ctor       — the constructor to patch (e.g. HTMLElement, MouseEvent)
 * @param {Function} duckTest   — (instance) => boolean for the base class
 */
function patchInstanceOf( Ctor, duckTest ) {
	try {
		Object.defineProperty( Ctor, Symbol.hasInstance, {
			value: function ( instance ) {
				if ( instance == null || typeof instance !== 'object' ) return false;
				// Base class: use duck-typing
				if ( this === Ctor ) {
					return duckTest( instance );
				}
				// Subclass: standard prototype-chain walk
				let proto = Object.getPrototypeOf( instance );
				const target = this.prototype;
				while ( proto !== null ) {
					if ( proto === target ) return true;
					proto = Object.getPrototypeOf( proto );
				}
				return false;
			},
			configurable: true,
		} );
	} catch ( e ) {
		// Symbol.hasInstance may not be configurable in some environments
	}
}

// HTMLElement — duck-type as any DOM element node (nodeType === 1)
patchInstanceOf( HTMLElement, ( i ) => i.nodeType === 1 );

// MouseEvent — duck-type: has clientX/clientY and is an Event
patchInstanceOf( MouseEvent, ( i ) =>
	typeof i.clientX === 'number' && typeof i.clientY === 'number' && typeof i.type === 'string'
);

// WheelEvent — duck-type: has deltaY and is a MouseEvent
patchInstanceOf( WheelEvent, ( i ) =>
	typeof i.deltaY === 'number' && typeof i.clientX === 'number' && typeof i.type === 'string'
);

// Fix: Patch FullscreenControl for cross-document (iframe) compatibility.
// The control uses `window.document` for fullscreenElement, exitFullscreen(),
// and fullscreenchange event listeners. In the iframe editor, fullscreen is
// requested on the container element (in the iframe document), so the
// fullscreenchange event fires on the iframe's document and
// fullscreenElement is set on the iframe's document — not window.document
// (the parent).
//
// Both _onFullscreenChange and _onClickFullscreen are assigned as instance
// closures in the constructor, so prototype patches are shadowed. We must
// override onAdd to replace them at instance level after construction.
( function patchFullscreenControl() {
	const FSC = MapLibreGL.FullscreenControl;
	if ( ! FSC ) return;
	const proto = FSC.prototype;
	const origOnAdd = proto.onAdd;

	proto.onAdd = function ( map ) {
		const result = origOnAdd.call( this, map );
		const ownerDoc = this._container && this._container.ownerDocument;
		if ( ! ownerDoc || ownerDoc === window.document ) {
			return result; // same document — no patching needed
		}

		const self = this;

		// 1. Move fullscreenchange listener from parent doc to iframe doc
		const oldFSChange = this._onFullscreenChange;
		window.document.removeEventListener( this._fullscreenchange, oldFSChange );
		this._onFullscreenChange = function () {
			let fse = ownerDoc.fullscreenElement ||
				ownerDoc.mozFullScreenElement ||
				ownerDoc.webkitFullscreenElement ||
				ownerDoc.msFullscreenElement;
			while ( fse?.shadowRoot?.fullscreenElement ) {
				fse = fse.shadowRoot.fullscreenElement;
			}
			if ( ( fse === self._container ) !== self._fullscreen ) {
				self._handleFullscreenChange();
			}
		};
		ownerDoc.addEventListener( this._fullscreenchange, this._onFullscreenChange );

		// 2. Replace click handler to exit on the correct document
		const oldClick = this._onClickFullscreen;
		this._onClickFullscreen = function () {
			if ( self._isFullscreen() ) {
				if ( ownerDoc.exitFullscreen ) {
					ownerDoc.exitFullscreen();
				} else if ( ownerDoc.mozCancelFullScreen ) {
					ownerDoc.mozCancelFullScreen();
				} else if ( ownerDoc.msExitFullscreen ) {
					ownerDoc.msExitFullscreen();
				} else if ( ownerDoc.webkitCancelFullScreen ) {
					ownerDoc.webkitCancelFullScreen();
				} else {
					self._togglePseudoFullScreen();
				}
			} else {
				self._requestFullscreen();
			}
		};
		this._fullscreenButton.removeEventListener( 'click', oldClick );
		this._fullscreenButton.addEventListener( 'click', this._onClickFullscreen );

		return result;
	};

	// onRemove: clean up from the correct document
	proto.onRemove = function () {
		const ownerDoc = ( this._container && this._container.ownerDocument ) || window.document;
		ownerDoc.removeEventListener( this._fullscreenchange, this._onFullscreenChange );
		if ( this._controlContainer && this._controlContainer.parentNode ) {
			this._controlContainer.parentNode.removeChild( this._controlContainer );
		}
		this._map = null;
	};
} )();

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
