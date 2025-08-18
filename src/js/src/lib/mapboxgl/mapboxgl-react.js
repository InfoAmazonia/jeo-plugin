import { forwardRef, useState } from 'react';
import Mapbox, { FullscreenControl, NavigationControl } from 'react-map-gl/mapbox';

import { computeInlineStart } from '../../shared/direction';
import { defaultStyle, mapboxToken, mapgl } from './mapboxgl-loader'

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
			reuseMaps={ true }
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
