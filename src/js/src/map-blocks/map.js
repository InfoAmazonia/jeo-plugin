import { forwardRef } from '@wordpress/element';
import mapboxgl from 'mapbox-gl'
import MapGL from 'react-map-gl';

export const MapboxAPIKey = window.jeo_settings.mapbox_key;

/**
 * @typedef {import('react-map-gl').MapProps} MapProps
 * @param {MapProps} props
 */
function Map( props = {}, ref ) {
	return (
		<MapGL
			ref={ ref }
			mapboxAccessToken={ MapboxAPIKey }
			mapLib={ mapboxgl }
			mapStyle="mapbox://styles/mapbox/streets-v11"
			{ ...props }
		/>
	);
}

export default forwardRef( Map );
