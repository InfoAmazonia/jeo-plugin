import Form from 'react-jsonschema-form';
import { withDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const registry = window.JeoLayerTypes;

const layerSchema = {
	type: 'object',
	properties: {
		title: { title: __( 'Title' ), type: 'string' },
		type: { title: __( 'Type' ), type: 'string' },
	},
	required: [ 'title', 'type' ],
};

const formUpdater = ( setOptions, setWidgets ) => ( options ) => {
	const widgets = { options: {} };
	Object.entries( options.properties ).forEach( ( [ key, property ] ) => {
		if ( property.description ) {
			widgets.options[ key ] = { 'ui:help': property.description };
			delete property.description;
		}
	} );
	options.title = ''; // hides options title
	setWidgets( widgets );
	setOptions( options );
};

const LayerEditor = ( { save } ) => {
	const [ widgets, setWidgets ] = useState( {} );
	const [ options, setOptions ] = useState( {} );
	const [ formState, setFormState ] = useState( {} );
	layerSchema.properties.type.enum = registry.getLayerTypes();
	layerSchema.properties.options = options;

	useEffect( () => {
		if ( formState.type ) {
			registry
				.getLayerTypeSchema( formState.type )
				.then( formUpdater( setOptions, setWidgets ) );
		} else {
			setOptions( {} );
			setWidgets( {} ); // technically unnecessary
		}
	}, [ formState.type ] );

	return (
		<Form
			className="jeo-layer-editor"
			schema={ layerSchema }
			uiSchema={ widgets }
			formData={ formState }
			onChange={ ( { formData } ) => setFormState( formData ) }
			onSubmit={ ( { formData }, event ) => {
				event.preventDefault();
				const { title, type, options: layerTypeOptions } = formData;
				const query = {
					title,
					meta: { type, layer_type_options: layerTypeOptions },
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
