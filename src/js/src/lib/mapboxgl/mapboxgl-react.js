import { forwardRef, useState } from 'react';
import Mapbox, { FullscreenControl, NavigationControl } from 'react-map-gl/mapbox';

import { computeInlineStart } from '../../shared/direction';
import { defaultStyle, mapboxToken, mapgl } from './mapboxgl-loader'

// Fix: Ensure the HTMLElement instanceof patch is also applied in this chunk.
// With splitChunks disabled, react-map-gl may bundle its own copy of mapbox-gl
// in this chunk, using a separate HTMLElement reference from the loader chunk.
try {
	Object.defineProperty( HTMLElement, Symbol.hasInstance, {
		value: ( instance ) => instance != null && typeof instance === 'object' && instance.nodeType === 1,
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
