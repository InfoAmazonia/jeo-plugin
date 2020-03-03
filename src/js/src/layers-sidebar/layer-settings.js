import Form from 'react-jsonschema-form';
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
	const widgets = { layer_type_options: {} };
	Object.entries( options.properties ).forEach( ( [ key, property ] ) => {
		if ( property.description ) {
			widgets.layer_type_options[ key ] = { 'ui:help': property.description };
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
	layerSchema.properties.type.enum = window.JeoLayerTypes.getLayerTypes();
	layerSchema.properties.layer_type_options = options;

	useEffect( () => {
		if ( postMeta.type ) {
			window.JeoLayerTypes
				.getLayerTypeSchema( postMeta.type )
				.then( formUpdater( setOptions, setWidgets ) );
		} else {
			setOptions( {} );
			setWidgets( {} ); // technically unnecessary
		}
	}, [ postMeta.type ] );

	return (
		<Form
			className="jeo-layer-settings"
			schema={ layerSchema }
			uiSchema={ widgets }
			formData={ postMeta }
			onChange={ ( { formData } ) => setPostMeta( formData ) }
		>
			{ /* Hide submit button */ }
			<div />
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
