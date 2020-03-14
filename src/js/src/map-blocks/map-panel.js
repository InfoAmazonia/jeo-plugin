import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import MapSettings from './map-settings';

const SettingDisplay = ( { title, value } ) => (
	<div className="jeo-setting">
		<span className="jeo-setting__title">{ `${ title }:` }</span>
		<span className="jeo-setting__value">
			{ value === undefined ? __( 'Unset' ) : value }
		</span>
	</div>
);

export default ( { attributes, setAttributes, panel: Panel, setModal } ) => (
	<Panel title={ __( 'Map settings' ) } className="jeo-map-panel">
		<MapSettings attributes={ attributes } setAttributes={ setAttributes } />
	</Panel>
);
