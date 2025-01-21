import { forwardRef, useState } from '@wordpress/element';
import mapboxgl from 'mapbox-gl'
import MapGL, { FullscreenControl, NavigationControl } from 'react-map-gl';
import { computeInlineStart } from '../shared/direction';

export const MapboxAPIKey = window.jeo_settings.mapbox_key;

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
			mapboxAccessToken={ MapboxAPIKey }
			mapLib={ mapboxgl }
			mapStyle="mapbox://styles/mapbox/streets-v11"
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
