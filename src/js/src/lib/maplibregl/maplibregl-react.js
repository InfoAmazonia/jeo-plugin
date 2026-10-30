import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import MapLibre, { FullscreenControl, NavigationControl } from 'react-map-gl/maplibre';

import { computeInlineStart } from '../../shared/direction';
import { defaultStyle, mapgl, transformRequest } from '../mapgl-loader'

// MapLibre does not support equirectangular projection yet.
const defaultProjection = { type: 'mercator' };

// Fix: Ensure the HTMLElement instanceof patch is also applied in this chunk.
// Depending on how webpack groups the runtime and vendor code, react-map-gl may
// still evaluate against a different HTMLElement reference from the loader chunk.
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

/**
 * Keep the map in sync with container size changes. MapLibre GL JS binds its
 * event handlers to the map container's own document, so no extra patching
 * is needed when the map renders inside the Gutenberg editor iframe.
 *
 * @param {import('maplibre-gl').Map} map
 */
function observeMapResize( map ) {
	const mapContainer = map.getContainer();

	if ( typeof ResizeObserver === 'undefined' ) {
		return undefined;
	}

	const resizeObserver = new ResizeObserver( () => {
		map.resize();
	} );
	resizeObserver.observe( mapContainer );

	return () => resizeObserver.disconnect();
}

/**
 * @typedef {import('react-map-gl/maplibre').MapProps} MapProps
 * @param {MapProps} props
 */
function MapGL( { children, controls = undefined, fullscreen = true, mapStyle = defaultStyle, onLoad, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	// Keep a local ref to attach the resize observer after load.
	const innerRef = useRef( null );
	const cleanupRef = useRef( null );

	// Combine the forwarded ref with our internal ref.
	const setRef = useCallback( ( instance ) => {
		innerRef.current = instance;
		if ( typeof ref === 'function' ) {
			ref( instance );
		} else if ( ref ) {
			ref.current = instance;
		}
	}, [ ref ] );

	const handleLoad = useCallback( ( e ) => {
		const map = e.target;
		cleanupRef.current = observeMapResize( map );

		// Forward the original onLoad callback.
		if ( onLoad ) {
			onLoad( e );
		}
	}, [ onLoad ] );

	// Cleanup on unmount.
	useEffect( () => {
		return () => {
			if ( cleanupRef.current ) {
				cleanupRef.current();
				cleanupRef.current = null;
			}
		};
	}, [] );

	return (
		<MapLibre
			ref={ setRef }
			mapLib={ mapgl }
			mapStyle={ mapStyle }
			projection={ defaultProjection }
			validateStyle={ false }
			reuseMaps={ false }
			transformRequest={ transformRequest }
			onLoad={ handleLoad }
			{ ...props }
		>
			{children}
			{ fullscreen ? (
				<FullscreenControl position={ controlsPosition } />
			) : null }
			<NavigationControl position={ controlsPosition } showCompass={ false } />
		</MapLibre>
	);
}

export const Map = forwardRef(MapGL)

export { Layer, Marker, Source } from 'react-map-gl/maplibre'
