import { Modal } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersSettings from './layers-settings';
import MapSettings from './map-settings';
import { TabPanel } from '../common-components';

const tabs = [
	{ name: 'map', title: __( 'Map Settings' ), className: 'tab-map' },
	{ name: 'layers', title: __( 'Map Layers' ), className: 'tab-layers' },
];

const mapDefaults = {
	initial_zoom: jeo_settings.map_defaults.zoom,
	center_lat: jeo_settings.map_defaults.lat,
	center_lon: jeo_settings.map_defaults.lng,
	min_zoom: 0,
	max_zoom: 20,
};

export default function( {
	attributes,
	setAttributes,
	modal,
	setModal,
	loadedLayers,
	loadingLayers,
} ) {
	useEffect( () => {
		const isNewMap = [ 'initial_zoom', 'center_lat', 'center_lon', 'min_zoom', 'max_zoom' ].every( ( key ) => {
			return ! attributes[ key ];
		} );

		if ( isNewMap ) {
			setAttributes( mapDefaults );
		}
	}, [] );

	return (
		<Modal
			className="jeo-map-editor-modal"
			title={ __( 'Map Editor' ) }
			onRequestClose={ () => setModal( false ) }
		>
			<TabPanel
				className="jeo-tabs"
				activeClass="active-tab"
				tabs={ tabs }
				initialTabName={ modal }
			>
				{ ( tab ) => {
					switch ( tab.name ) {
						case 'map':
							return (
								<MapSettings
									attributes={ attributes }
									setAttributes={ setAttributes }
								/>
							);
						case 'layers':
							return (
								<LayersSettings
									attributes={ attributes }
									setAttributes={ setAttributes }
									loadedLayers={ loadedLayers }
									loadingLayers={ loadingLayers }
								/>
							);
					}
				} }
			</TabPanel>
		</Modal>
	);
}
