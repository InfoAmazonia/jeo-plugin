import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import MapLibre, { FullscreenControl, NavigationControl } from 'react-map-gl/maplibre';

import { computeInlineStart } from '../../shared/direction';
import { defaultStyle, mapboxTransformRequest, mapgl } from './maplibregl-loader'

// Fix: Ensure the HTMLElement instanceof patch is also applied in this chunk.
// With splitChunks disabled, react-map-gl may bundle its own copy of maplibre-gl
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
 * but MapLibreGL binds its drag-critical `mousemove` (capture) and `mouseup`
 * listeners to the module-scope `document` and `window` objects, which may
 * point to the parent frame.  When the map canvas lives in the iframe those
 * events never fire on the parent, so drag/pan is completely broken.
 *
 * After the map loads we detect this mismatch and duplicate the listeners
 * on the iframe's own `document` / `window` so they actually receive mouse
 * events.
 */
function patchIframeListeners( map ) {
	const container = map.getCanvasContainer();
	const ownerDoc = container.ownerDocument;
	const ownerWin = ownerDoc.defaultView;

	// Nothing to patch when the map already lives in the same document
	if ( ownerDoc === document && ownerWin === window ) {
		return undefined;
	}

	const hm = map.handlers; // public HandlerManager instance
	if ( ! hm || ! hm._listeners ) {
		return undefined;
	}

	const added = [];

	for ( const [ target, type, options ] of hm._listeners ) {
		if ( target === document ) {
			ownerDoc.addEventListener( type, hm.handleWindowEvent, options ?? undefined );
			added.push( [ ownerDoc, type, hm.handleWindowEvent, options ?? undefined ] );
		} else if ( target === window ) {
			ownerWin.addEventListener( type, hm.handleEvent, options ?? undefined );
			added.push( [ ownerWin, type, hm.handleEvent, options ?? undefined ] );
		}
	}

	return () => {
		for ( const [ t, ev, fn, opts ] of added ) {
			t.removeEventListener( ev, fn, opts );
		}
	};
}

/**
 * @typedef {import('react-map-gl/maplibre').MapProps} MapProps
 * @param {MapProps} props
 */
function MapGL( { children, controls = undefined, fullscreen = true, onLoad, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	// Keep a local ref to patch iframe listeners after load.
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
		// Patch iframe document listeners for drag to work.
		const map = e.target;
		cleanupRef.current = patchIframeListeners( map );

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
			mapStyle={ defaultStyle }
			reuseMaps={ false }
			transformRequest={ mapboxTransformRequest }
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

export { Layer, Source } from 'react-map-gl/maplibre'
