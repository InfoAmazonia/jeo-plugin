import { forwardRef } from '@wordpress/element';
import mapboxgl from 'mapbox-gl'
import MapGL, { FullscreenControl, NavigationControl } from 'react-map-gl';

export const MapboxAPIKey = window.jeo_settings.mapbox_key;

/**
 * @typedef {import('react-map-gl').MapProps} MapProps
 * @param {MapProps} props
 */
function Map( { children, controls = 'top-left', fullscreen = true, ...props }, ref ) {
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
				<FullscreenControl position={ controls } />
			) : null }
			<NavigationControl position={ controls } showCompass={ false } />
		</MapGL>
	);
}

export default forwardRef( Map );
