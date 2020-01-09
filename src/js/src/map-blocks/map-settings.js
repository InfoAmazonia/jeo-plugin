import Form from 'react-jsonschema-form';

const mapSchema = {
	type: 'object',
	properties: {
		center_lat: { type: 'number' },
		center_lon: { type: 'number' },
		initial_zoom: { type: 'number' },
	},
};

export default ( { setMap } ) => (
	<Form
		schema={ mapSchema }
		onSubmit={ ( { formData }, event ) => {
			event.preventDefault();
			setMap( formData );
		} }
	/>
);
