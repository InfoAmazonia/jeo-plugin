import { Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Form from 'react-jsonschema-form';

import InteractionsSettings from './interactions-settings';

const layerSchema = {
	type: 'object',
	properties: {
		type: { title: __( 'Type' ), type: 'string' },
	},
	required: [ 'type' ],
};

const formUpdater = ( setOptions, setWidgets, typeVector = false ) => ( options ) => {
	const widgets = { layer_type_options: {} };
	Object.entries( options.properties ).forEach( ( [ key, property ] ) => {
		if ( property.description ) {
			widgets.layer_type_options[ key ] = { 'ui:help': property.description };
			delete property.description;
		}
		if ( ! typeVector && key === 'source_layer' ) {
			delete widgets.layer_type_options[ key ];
			delete options.properties[ key ];
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
	const [ styleLayers, setStyleLayers ] = useState( null );

	const [ modalOpen, setModalStatus ] = useState( false );
	const closeModal = useCallback( () => setModalStatus( false ), [ setModalStatus ] );
	const openModal = useCallback( () => setModalStatus( true ), [ setModalStatus ] );

	layerSchema.properties.type.enum = window.JeoLayerTypes.getLayerTypes();
	layerSchema.properties.layer_type_options = options;

	const interactions = useMemo( () => {
		return postMeta.layer_type_options.interactions || [];
	}, [ postMeta.layer_type_options.interactions ] );

	const setInteractions = useCallback( ( e ) => {
		setPostMeta( {
			...postMeta,
			layer_type_options: {
				...postMeta.layer_type_options,
				interactions: e,
			},
		} );
	}, [ postMeta, setPostMeta ] );

	useEffect( () => {
		if ( postMeta.type ) {
			setPostMeta( { layer_type_options: {} } );
			window.JeoLayerTypes
				.getLayerTypeSchema( postMeta )
				.then( formUpdater( setOptions, setWidgets ) );
		} else {
			setOptions( {} );
		}
	}, [ postMeta.type ] );

	useEffect( () => {
		if ( postMeta.type === 'mapbox-tileset' ) {
			const typeVector = postMeta.layer_type_options.style_source_type === 'vector';
			window.JeoLayerTypes
				.getLayerTypeSchema( postMeta )
				.then( formUpdater( setOptions, setWidgets, typeVector ) );
		}
	}, [ postMeta.layer_type_options.style_source_type ] );

	useEffect( () => {
		const layerType = window.JeoLayerTypes.getLayerType( postMeta.type );
		if ( layerType && layerType.getStyleLayers ) {
			layerType.getStyleLayers( postMeta ).then( setStyleLayers );
		} else {
			setStyleLayers( null );
		}
	}, [ postMeta, setStyleLayers ] );

	return (
		<Fragment>
			<Form
				className="jeo-layer-settings"
				schema={ layerSchema }
				uiSchema={ widgets }
				formData={ postMeta }
				onChange={ ( { formData } ) => {
					window.layerFormData = formData;
					setPostMeta( formData );
				} }
			>
				{ /* Hide submit button */ }
				<div />
			</Form>

			{ styleLayers && interactions && (
				<Fragment>
					{ modalOpen && (
						<InteractionsSettings
							layers={ styleLayers }
							onCloseModal={ closeModal }
							interactions={ interactions }
							setInteractions={ setInteractions }
						/>
					) }

					<Button isPrimary onClick={ openModal }>
						{ __( 'Edit interactions', 'jeo' ) }
					</Button>
				</Fragment>
			) }
		</Fragment>
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
