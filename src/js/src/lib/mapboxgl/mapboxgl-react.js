import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import Mapbox, { FullscreenControl, NavigationControl } from 'react-map-gl/mapbox';

import { computeInlineStart } from '../../shared/direction';
import { defaultStyle, mapboxToken, mapgl } from './mapboxgl-loader'

// Fix: Ensure the HTMLElement instanceof patch is also applied in this chunk.
// With splitChunks disabled, react-map-gl may bundle its own copy of mapbox-gl
// in this chunk, using a separate HTMLElement reference from the loader chunk.
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
 * Fix: In WordPress Block API v3 the edit component runs inside an iframe,
 * but MapboxGL binds its drag-critical `mousemove` (capture) and `mouseup`
 * listeners to the module-scope `document` and `window` objects, which may
 * point to the parent frame.  This duplicates them on the iframe's own
 * document/window so drag/pan works correctly.
 *
 * Additionally, the canvas may not fill its container on initial render
 * because the container size is not yet finalised when the map is created.
 * A ResizeObserver triggers `map.resize()` to fix this.
 */
function patchIframeAndResize( map ) {
	const container = map.getCanvasContainer();
	const ownerDoc = container.ownerDocument;
	const ownerWin = ownerDoc.defaultView;
	const cleanups = [];

	// -- iframe listener patch (same approach as MapLibreGL wrapper) --
	if ( ownerDoc !== document || ownerWin !== window ) {
		// MapboxGL stores the HandlerManager differently (_handlers is internal)
		// but the property name on the map is the same structure as MapLibreGL.
		const hm = map.handlers ?? map._handlers;
		if ( hm && hm._listeners ) {
			for ( const [ target, type, options ] of hm._listeners ) {
				if ( target === document ) {
					const fn = hm.handleWindowEvent;
					ownerDoc.addEventListener( type, fn, options ?? undefined );
					cleanups.push( () => ownerDoc.removeEventListener( type, fn, options ?? undefined ) );
				} else if ( target === window ) {
					const fn = hm.handleEvent;
					ownerWin.addEventListener( type, fn, options ?? undefined );
					cleanups.push( () => ownerWin.removeEventListener( type, fn, options ?? undefined ) );
				}
			}
		}
	}

	// -- canvas resize fix --
	// The container may not have its final dimensions when the map is created
	// inside the iframe editor.  A ResizeObserver triggers map.resize() once
	// the layout stabilises so the canvas fills the container correctly.
	const mapContainer = map.getContainer();
	if ( typeof ResizeObserver !== 'undefined' ) {
		const ro = new ResizeObserver( () => {
			map.resize();
		} );
		ro.observe( mapContainer );
		cleanups.push( () => ro.disconnect() );
	}

	return cleanups.length
		? () => cleanups.forEach( ( fn ) => fn() )
		: undefined;
}

/**
 * @typedef {import('react-map-gl/mapbox').MapProps} MapProps
 * @param {MapProps} props
 */
function MapGL( { children, controls = undefined, fullscreen = true, onLoad, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	const innerRef = useRef( null );
	const cleanupRef = useRef( null );

	const setRef = useCallback( ( instance ) => {
		innerRef.current = instance;
		if ( typeof ref === 'function' ) {
			ref( instance );
		} else if ( ref ) {
			ref.current = instance;
		}
	}, [ ref ] );

	const handleLoad = useCallback( ( e ) => {
		cleanupRef.current = patchIframeAndResize( e.target );
		if ( onLoad ) {
			onLoad( e );
		}
	}, [ onLoad ] );

	useEffect( () => {
		return () => {
			if ( cleanupRef.current ) {
				cleanupRef.current();
				cleanupRef.current = null;
			}
		};
	}, [] );

	return (
		<Mapbox
			ref={ setRef }
			mapboxAccessToken={ mapboxToken }
			mapLib={ mapgl }
			mapStyle={ defaultStyle }
			reuseMaps={ false }
			onLoad={ handleLoad }
			{ ...props }
		>
			{children}
			{ fullscreen ? (
				<FullscreenControl position={ controlsPosition } />
			) : null }
			<NavigationControl position={ controlsPosition } showCompass={ false } />
		</Mapbox>
	);
}

export const Map = forwardRef(MapGL)

export { Layer, Source } from 'react-map-gl/mapbox'
