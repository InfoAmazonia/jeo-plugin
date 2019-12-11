
var mapboxgl = require('mapbox-gl/dist/mapbox-gl.js');

mapboxgl.accessToken = jeo_settings.mapbox_key;

window.mapboxgl = mapboxgl;
export default mapboxgl;
