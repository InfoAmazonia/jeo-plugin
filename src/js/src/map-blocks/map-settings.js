import Form from 'react-jsonschema-form';
import { __ } from '@wordpress/i18n';

const mapSchema = {
	type: 'object',
	properties: {
		center_lat: { title: __( 'Center Latitude' ), type: 'number' },
		center_lon: { title: __( 'Center Longitude' ), type: 'number' },
		initial_zoom: { title: __( 'Initial Zoom' ), type: 'number' },
		min_zoom: { title: __( 'Min Zoom' ), type: 'number' },
		max_zoom: { title: __( 'Max Zoom' ), type: 'number' },
	},
};

export default ( { setMap } ) => (
	<Form
		className="jeo-map-settings"
		schema={ mapSchema }
		onSubmit={ ( { formData }, event ) => {
			event.preventDefault();
			setMap( formData );
		} }
	/>
);
