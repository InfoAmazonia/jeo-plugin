import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = jeo_settings.mapbox_key;

window.mapboxgl = mapboxgl;
export default mapboxgl;
