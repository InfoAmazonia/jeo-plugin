import ReactMapboxGl from 'react-mapbox-gl';

export const MapboxAPIKey = window.jeo_settings.mapbox_key;

export default ReactMapboxGl( { accessToken: MapboxAPIKey } );
