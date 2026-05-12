import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import MapSettings from './map-settings';

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

export default function MapPanel( {
	attributes,
	setAttributes,
	renderPanel: Panel,
	setPanLimitsFromMap
} ) {
	useEffect( () => {
		const isNewMap = [
			'initial_zoom',
			'center_lat',
			'center_lon',
			'min_zoom',
			'max_zoom',
		].every( ( key ) => {
			return ! attributes[ key ];
		} );

		if ( isNewMap ) {
			setAttributes( mapDefaults );
		}
	}, [] );

	const handleSetPanLimitsFromMap = useCallback( () => {
		if ( typeof setPanLimitsFromMap === 'function' ) {
			setPanLimitsFromMap();
			return;
		}

		if ( typeof window.__jeoSetPanLimitsFromMap === 'function' ) {
			window.__jeoSetPanLimitsFromMap();
			return;
		}

		const iframeWindow = Array.from( document.querySelectorAll( 'iframe' ) )
			.map( ( iframe ) => iframe.contentWindow )
			.find(
				( frame ) =>
					frame &&
					typeof frame.__jeoSetPanLimitsFromMap === 'function'
			);

		if ( iframeWindow ) {
			iframeWindow.__jeoSetPanLimitsFromMap();
		}
	}, [ setPanLimitsFromMap ] );

	return (
		<Panel
			name="map-settings"
			title={ __( 'Map settings', 'jeo' ) }
			className="jeo-map-panel"
		>
			<MapSettings
				attributes={ attributes }
				setAttributes={ setAttributes }
				setPanLimitsFromMap={ handleSetPanLimitsFromMap }
			/>
		</Panel>
	);
}
