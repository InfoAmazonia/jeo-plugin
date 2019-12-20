import Form from 'react-jsonschema-form';
import { withDispatch } from '@wordpress/data';

const layerSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		type: { type: 'string', enum: [ 'mapbox', 'other' ] },
		url: { type: 'string' },
	},
	required: [ 'title', 'type', 'url' ],
};

const LayerEditor = ( { save } ) => (
	<Form
		schema={ layerSchema }
		onSubmit={ ( { formData }, event ) => {
			event.preventDefault();
			const { title, ...meta } = formData;
			const query = { title, meta, status: 'publish' };
			save( 'postType', 'map-layer', query ).then( ( savedLayer ) =>
				console.log( savedLayer )
			);
		} }
	/>
);

export default withDispatch( ( dispatch ) => ( {
	save: dispatch( 'core' ).saveEntityRecord,
} ) )( LayerEditor );
