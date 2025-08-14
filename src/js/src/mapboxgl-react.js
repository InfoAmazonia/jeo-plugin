import { forwardRef, useState } from 'react';
import MapGL, { FullscreenControl, Layer, NavigationControl, Source } from 'react-map-gl/mapbox';
import { computeInlineStart } from './shared/direction';

/**
 * @typedef {import('react-map-gl/mapbox').MapProps} MapProps
 * @param {MapProps} props
 */
function Map( { children, controls = undefined, fullscreen = true, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	return (
		<MapGL
			ref={ ref }
			mapboxAccessToken={ globalThis.mapglLoader.mapboxToken }
			mapLib={ globalThis.mapgl }
			mapStyle={ globalThis.mapglLoader.defaultStyle }
			reuseMaps={ true }
			{ ...props }
		>
			{children}
			{ fullscreen ? (
				<FullscreenControl position={ controlsPosition } />
			) : null }
			<NavigationControl position={ controlsPosition } showCompass={ false } />
		</MapGL>
	);
}

globalThis.ReactMapGL = {
	Layer,
	Map: forwardRef(Map),
	Source,
}
