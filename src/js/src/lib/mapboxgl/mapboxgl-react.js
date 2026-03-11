import { forwardRef, useState } from 'react';
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
 * @typedef {import('react-map-gl/mapbox').MapProps} MapProps
 * @param {MapProps} props
 */
function MapGL( { children, controls = undefined, fullscreen = true, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	return (
		<Mapbox
			ref={ ref }
			mapboxAccessToken={ mapboxToken }
			mapLib={ mapgl }
			mapStyle={ defaultStyle }
			reuseMaps={ false }
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
