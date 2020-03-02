import Form from 'react-jsonschema-form';
import { Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const layerSchema = {
	type: 'object',
	properties: {
		type: { title: __( 'Type' ), type: 'string' },
	},
	required: [ 'type' ],
};

const formUpdater = ( setOptions, setWidgets ) => ( options ) => {
	const widgets = { options: {} };
	Object.entries( options.properties ).forEach( ( [ key, property ] ) => {
		if ( property.description ) {
			widgets.options[ key ] = { 'ui:help': property.description };
			delete property.description;
		}
	} );
	setWidgets( widgets );
	setOptions( options );
};

const LayerSettings = ( {
	postMeta,
	setPostMeta,
} ) => {
	const [ widgets, setWidgets ] = useState( {} );
	const [ options, setOptions ] = useState( {} );
	const [ formState, setFormState ] = useState( postMeta );
	layerSchema.properties.type.enum = window.JeoLayerTypes.getLayerTypes();
	layerSchema.properties.layer_type_options = options;

	useEffect( () => {
		if ( formState.type ) {
			window.JeoLayerTypes
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
				const { type, layer_type_options } = formData;
				setPostMeta( { type, layer_type_options } );
			} }
		>
			<Button
				className="save-layer"
				type="submit"
				isLarge={ true }
				isPrimary={ true }
			>
				{ __( 'Save' ) }
			</Button>
		</Form>
	);
};

export default withDispatch(
	( dispatch ) => ( {
		setPostMeta: ( meta ) => {
			dispatch( 'core/editor' ).editPost( { meta } );
		},
	} )
)( withSelect(
	( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} )
)( LayerSettings ) );
