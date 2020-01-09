import Form from 'react-jsonschema-form';
import { withDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

const registry = window.JeoLayerTypes;

const layerSchema = {
	type: 'object',
	properties: {
		title: { type: 'string' },
		type: { type: 'string' },
	},
	required: [ 'title', 'type' ],
};

const LayerEditor = ( { save } ) => {
	const [ options, setOptions ] = useState( {} );
	const [ formState, setFormState ] = useState( {} );
	layerSchema.properties.type.enum = registry.getLayerTypes();
	layerSchema.properties.options = options;

	useEffect( () => {
		if ( formState.type ) {
			registry.getLayerTypeSchema( formState.type ).then( setOptions );
		} else {
			setOptions( {} );
		}
	}, [ formState.type ] );

	return (
		<Form
			schema={ layerSchema }
			formData={ formState }
			onChange={ ( { formData } ) => {
				setFormState( formData );
			} }
			onSubmit={ ( { formData }, event ) => {
				event.preventDefault();
				const { title, type, options } = formData;
				const query = {
					title,
					meta: { type, layer_type_options: options },
					status: 'publish',
				};
				save( 'postType', 'map-layer', query ).then( ( savedLayer ) =>
					console.log( savedLayer )
				);
			} }
		/>
	);
};

export default withDispatch( ( dispatch ) => ( {
	save: dispatch( 'core' ).saveEntityRecord,
} ) )( LayerEditor );
