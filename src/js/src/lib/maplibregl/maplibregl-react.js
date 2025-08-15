import { forwardRef, useState } from 'react';
import MapLibre, { FullscreenControl, NavigationControl } from 'react-map-gl/maplibre';
import { computeInlineStart } from '../../shared/direction';

/**
 * @typedef {import('react-map-gl/maplibre').MapProps} MapProps
 * @param {MapProps} props
 */
function MapGL( { children, controls = undefined, fullscreen = true, ...props }, ref ) {
	const [ inlineStart ] = useState( computeInlineStart );
	const controlsPosition = controls ?? `top-${inlineStart}`;

	return (
		<MapLibre
			ref={ ref }
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
		</MapLibre>
	);
}

export const Map = forwardRef(MapGL)

export { Layer, Source } from 'react-map-gl/maplibre'
