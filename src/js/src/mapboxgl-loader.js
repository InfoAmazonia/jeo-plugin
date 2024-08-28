import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = jeo_settings.mapbox_key;

window.mapboxgl = mapboxgl;
export default mapboxgl;
