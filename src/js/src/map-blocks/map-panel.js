import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

const SettingDisplay = ( { title, value } ) => (
	<div className="jeo-setting">
		<span className="jeo-setting__title">{ `${ title }:` }</span>
		<span className="jeo-setting__value">
			{ value === undefined ? __( 'Unset' ) : value }
		</span>
	</div>
);

export default ( { attributes, panel: Panel, setModal } ) => (
	<Panel title={ __( 'Map settings' ) } className="jeo-map-panel">
		<h2>{ __( 'Initial map center' ) }</h2>
		<SettingDisplay title={ __( 'Latitude' ) } value={ attributes.center_lat } />
		<SettingDisplay title={ __( 'Longitude' ) } value={ attributes.center_lon } />
		<h2>{ __( 'Zoom Settings' ) }</h2>
		<SettingDisplay
			title={ __( 'Initial zoom' ) }
			value={ attributes.initial_zoom }
		/>
		<SettingDisplay title={ __( 'Minimum zoom' ) } value={ attributes.min_zoom } />
		<SettingDisplay title={ __( 'Maximum zoom' ) } value={ attributes.max_zoom } />
		<Button isPrimary isLarge onClick={ () => setModal( 'map' ) }>
			{ __( 'Edit map settings' ) }
		</Button>
	</Panel>
);
