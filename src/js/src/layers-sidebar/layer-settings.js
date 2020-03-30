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
		attribution: { title: __( 'Map attribution link' ), type: 'string' },
	},
	required: [ 'type', 'attribution' ],
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
	const [ styleLayers, setStyleLayers ] = useState( null );
	const [ modalOpen, setModalStatus ] = useState( false );

	layerSchema.properties.type.enum = window.JeoLayerTypes.getLayerTypes();
	layerSchema.properties.layer_type_options = options;

	useEffect( () => {
		if ( postMeta.type ) {
			window.JeoLayerTypes
				.getLayerTypeSchema( postMeta )
				.then( formUpdater( setOptions, setWidgets ) );
		} else {
			setOptions( {} );
			setWidgets( {} ); // technically unnecessary
		}
	}, [ postMeta.type ] );

	useEffect( () => {
		const layerType = window.JeoLayerTypes.getLayerType( postMeta.type );
		if ( layerType && layerType.getStyleLayers ) {
			layerType.getStyleLayers( postMeta ).then( setStyleLayers );
		} else {
			setStyleLayers( null );
		}
	}, [ postMeta, setStyleLayers ] );

	const closeModal = useCallback( () => setModalStatus( false ), [ setModalStatus ] );
	const openModal = useCallback( () => setModalStatus( true ), [ setModalStatus ] );

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

	return (
		<Fragment>
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

			{ styleLayers && (
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
