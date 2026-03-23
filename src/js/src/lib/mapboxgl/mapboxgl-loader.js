import U from 'map-gl-utils'

const MAPBOX_CSS_WARNING =
	'This page appears to be missing CSS declarations for Mapbox GL JS, which may cause the map to display incorrectly. Please ensure your page includes the external Mapbox GL JS stylesheet.'

let runtimePatched = false

function getExternalMapboxGL() {
	const runtime = globalThis.mapboxgl
	return runtime && typeof runtime.Map === 'function' ? runtime : null
}

function getMapboxGLOrThrow() {
	const runtime = getExternalMapboxGL()
	if ( ! runtime ) {
		throw new Error( 'Mapbox GL JS runtime was not found on globalThis.mapboxgl.' )
	}

	return runtime
}

export function isMapboxRuntimeAvailable() {
	return Boolean( getExternalMapboxGL() )
}

function hasMapboxRuntimeStyles( targetDocument ) {
	return Boolean(
		targetDocument?.querySelector(
			'link[href*="api.mapbox.com/mapbox-gl-js"], link[href*="mapbox-gl.css"], link[data-jeo-mapbox-runtime], style[data-jeo-mapbox-runtime], style[data-jeo-mapbox-canary]'
		)
	);
}

function copyMapboxRuntimeStyles( sourceDocument, targetDocument ) {
	if (
		! sourceDocument ||
		! targetDocument ||
		sourceDocument === targetDocument ||
		hasMapboxRuntimeStyles( targetDocument )
	) {
		return;
	}

	const runtimeStyles = Array.from(
		sourceDocument.querySelectorAll( 'link[rel="stylesheet"], style' )
	).filter( ( node ) => {
		if ( node.tagName === 'STYLE' ) {
			return node.textContent?.includes( '.mapboxgl-canary' );
		}

		const href = node.getAttribute( 'href' ) || '';
		return (
			href.includes( 'api.mapbox.com/mapbox-gl-js' ) ||
			href.includes( 'mapbox-gl.css' )
		);
	} );

	runtimeStyles.forEach( ( node ) => {
		const clone = node.cloneNode( true );
		clone.setAttribute( 'data-jeo-mapbox-runtime', 'true' );
		targetDocument.head.appendChild( clone );
	} );
}

function ensureMapboxCanaryStyle( targetDocument ) {
	if (
		! targetDocument ||
		targetDocument.querySelector( 'style[data-jeo-mapbox-canary]' )
	) {
		return;
	}

	const styleNode = targetDocument.createElement( 'style' );
	styleNode.setAttribute( 'data-jeo-mapbox-canary', 'true' );
	styleNode.textContent = '.mapboxgl-canary{background-color:salmon!important;}';
	targetDocument.head.appendChild( styleNode );
}

function patchHTMLElementInstanceOf() {
	try {
		Object.defineProperty( HTMLElement, Symbol.hasInstance, {
			value: function ( instance ) {
				if ( instance == null || typeof instance !== 'object' ) return false;
				if ( this === HTMLElement ) {
					return instance.nodeType === 1;
				}
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
}

function patchMissingCSSDetection( MapboxGL ) {
	const proto = MapboxGL.Map?.prototype;
	if ( ! proto ) return;

	proto._detectMissingCSS = function () {
		const ownerDocument =
			this._missingCSSCanary?.ownerDocument ||
			this._container?.ownerDocument ||
			document;
		const ownerWindow = ownerDocument?.defaultView || window;

		copyMapboxRuntimeStyles( document, ownerDocument );
		ensureMapboxCanaryStyle( ownerDocument );

		const computedColor = ownerWindow
			.getComputedStyle( this._missingCSSCanary )
			.getPropertyValue( 'background-color' );

		if ( computedColor !== 'rgb(250, 128, 114)' ) {
			console.warn( MAPBOX_CSS_WARNING );
		}
	};
}

function patchDeprecatedLightApi( MapboxGL ) {
	const proto = MapboxGL.Map?.prototype;
	if ( ! proto || typeof proto.getLights !== 'function' ) {
		return;
	}

	proto.getLight = function () {
		const lights = this.getLights();

		if ( Array.isArray( lights ) ) {
			return lights[ 0 ] ?? null;
		}

		if ( Array.isArray( lights?.lights ) ) {
			return lights.lights[ 0 ] ?? null;
		}

		return lights ?? null;
	};
}

// Fix: Patch FullscreenControl for cross-document (iframe) compatibility.
// Same issue as MapLibreGL: the control uses `document` (parent window) for
// fullscreenElement, exitFullscreen(), and fullscreenchange listeners.
// In the iframe editor the container lives in the iframe document, so
// fullscreen state is tracked there — not on the parent document.
//
// MapboxGL's constructor uses bindAll() for _onClickFullscreen and
// _changeIcon, creating bound instance methods that shadow prototype
// patches. We must override onAdd to replace them at instance level.
function patchFullscreenControl( MapboxGL ) {
	const FSC = MapboxGL.FullscreenControl;
	if ( ! FSC ) return;
	const proto = FSC.prototype;
	const origOnAdd = proto.onAdd;

	proto.onAdd = function ( map ) {
		const result = origOnAdd.call( this, map );
		const ownerDoc = this._container && this._container.ownerDocument;
		if ( ! ownerDoc || ownerDoc === document ) {
			return result; // same document — no patching needed
		}

		const self = this;

		// 1. Move fullscreenchange listener from parent doc to iframe doc
		const oldChangeIcon = this._changeIcon;
		document.removeEventListener( this._fullscreenchange, oldChangeIcon );
		this._changeIcon = function () {
			const fse = ownerDoc.fullscreenElement || ownerDoc.webkitFullscreenElement;
			if ( ( fse === self._container ) !== self._fullscreen ) {
				self._fullscreen = ! self._fullscreen;
				self._fullscreenButton.classList.toggle( 'mapboxgl-ctrl-shrink' );
				self._fullscreenButton.classList.toggle( 'mapboxgl-ctrl-fullscreen' );
				self._updateTitle();
			}
		};
		ownerDoc.addEventListener( this._fullscreenchange, this._changeIcon );

		// 2. Replace click handler to exit on the correct document
		const oldClick = this._onClickFullscreen;
		this._onClickFullscreen = function () {
			if ( self._isFullscreen() ) {
				if ( ownerDoc.exitFullscreen ) {
					ownerDoc.exitFullscreen();
				} else if ( ownerDoc.webkitCancelFullScreen ) {
					ownerDoc.webkitCancelFullScreen();
				}
			} else if ( self._container.requestFullscreen ) {
				self._container.requestFullscreen();
			} else if ( self._container.webkitRequestFullscreen ) {
				self._container.webkitRequestFullscreen();
			}
		};
		this._fullscreenButton.removeEventListener( 'click', oldClick );
		this._fullscreenButton.addEventListener( 'click', this._onClickFullscreen );

		return result;
	};

	// onRemove: clean up from the correct document
	const origOnRemove = proto.onRemove;
	proto.onRemove = function () {
		const ownerDoc = ( this._container && this._container.ownerDocument ) || document;
		ownerDoc.removeEventListener( this._fullscreenchange, this._changeIcon );
		if ( typeof origOnRemove === 'function' ) {
			origOnRemove.call( this );
			return;
		}
		this._controlContainer.remove();
		this._map = null;
	};
}

function ensureMapboxRuntimePatched() {
	const MapboxGL = getMapboxGLOrThrow()
	if ( runtimePatched ) {
		MapboxGL.accessToken = mapboxToken
		return MapboxGL
	}

	patchHTMLElementInstanceOf()
	patchDeprecatedLightApi( MapboxGL )
	patchMissingCSSDetection( MapboxGL )
	patchFullscreenControl( MapboxGL )

	MapboxGL.accessToken = mapboxToken
	runtimePatched = true

	return MapboxGL
}

/** @type string */
export const mapboxToken = jeo_settings.mapbox_key

export const defaultStyle = 'mapbox://styles/mapbox/streets-v11'
export const transformRequest = undefined

export function getMapLibrary() {
	return ensureMapboxRuntimePatched()
}

export function createMap ({ container, style, ...options }) {
	const MapboxGL = ensureMapboxRuntimePatched()
	const map = new MapboxGL.Map({
		accessToken: mapboxToken,
		container: container,
		logoPosition: 'bottom-left',
		projection: 'equirectangular',
		style: style ?? defaultStyle,
		...options,
	})

	U.init(map, MapboxGL)

	return map
}

/**
 * @param {import('mapbox-gl').GeoJSONSource} source
 */
export function getClusterLeaves(source, cluster, limit, offset) {
	return new Promise((resolve, reject) => {
		source.getClusterLeaves(cluster, limit, offset, (err, features) => {
			if (err) {
				reject(err)
			} else {
				resolve(features)
			}
		})
	})
}

/**
 * @param {import('mapbox-gl').Map} map
 */
export function loadImage(map, id, url) {
	return new Promise((resolve, reject) => {
		map.loadImage(url, (err, image) => {
			if (err) {
				reject(err)
			} else {
				map.addImage(id, image)
				resolve(id)
			}
		})
	})
}
