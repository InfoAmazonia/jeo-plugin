import maplibregl from 'maplibre-gl';

maplibregl.accessToken = jeo_settings.mapbox_key;
globalThis.mapboxgl = maplibregl;

export default maplibregl;
