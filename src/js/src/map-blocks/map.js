import { forwardRef, useState } from '@wordpress/element';
import MapGL, { FullscreenControl, NavigationControl } from 'react-map-gl';
import { computeInlineStart } from '../shared/direction';

/**
 * @typedef {import('react-map-gl').MapProps} MapProps
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

export default forwardRef( Map );
