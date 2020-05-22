import { Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Form from 'react-jsonschema-form';

import InteractionsSettings from './interactions-settings';

const layerSchema = {
	type: 'object',
	properties: {
		source_url: { title: __( 'Source data download link' ), type: 'string' },
		attribution: { title: __( 'Data attribution link' ), type: 'string' },
		attribution_name: { title: __( 'Source name' ), type: 'string' },
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
				onChange={ ( { formData } ) => {
					const regex = new RegExp( /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi );

					let attributionLink = formData.attribution;
					let sourceLink = formData.source_url;

					if ( formData.attribution && ! formData.attribution.includes( 'http' ) ) {
						if ( formData.attribution.match( regex ) ) {
							attributionLink = `https://${ formData.attribution }`;
						} else if ( formData.attribution[ 0 ] !== '/' ) {
							attributionLink = '/' + attributionLink;
						}
					}
					formData.attribution = attributionLink;

					if ( formData.source_url && ! formData.source_url.includes( 'http' ) ) {
						if ( formData.source_url.match( regex ) ) {
							sourceLink = `https://${ formData.source_url }`;
						} else if ( formData.source_url[ 0 ] !== '/' ) {
							sourceLink = '/' + sourceLink;
						}
					}
					formData.source_url = sourceLink;

					if ( ! formData.attribution_name ) {
						formData.attribution_name = '';
					}
					if ( ! formData.attribution ) {
						formData.attribution = '';
					}

					if ( ! formData.source_url ) {
						formData.source_url = '';
					}

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
