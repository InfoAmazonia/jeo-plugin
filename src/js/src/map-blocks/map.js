import mapboxgl from 'mapbox-gl'
import MapGL from 'react-map-gl';

export const MapboxAPIKey = window.jeo_settings.mapbox_key;

/**
 * @typedef {import('react-map-gl').MapProps} MapProps
 * @param {MapProps} props
 */
export default function Map( props = {} ) {
	return (
		<MapGL
			mapboxAccessToken={ MapboxAPIKey }
			mapLib={ mapboxgl }
			mapStyle="mapbox://styles/mapbox/streets-v11"
			{ ...props }
		/>
	);
}
