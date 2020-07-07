import { Button } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Form from 'react-jsonschema-form';
import { pickBy } from 'lodash-es';
import InteractionsSettings from './interactions-settings';
import { useDebounce } from 'use-debounce';

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
		if ( property.disabled ) {
			widgets.layer_type_options[ key ] = { 'ui:disabled': true };
			delete property.disabled;
		}
	} );
	setWidgets( widgets );
	setOptions( options );
};

function usePrevious( value ) {
	const ref = useRef();
	useEffect( () => {
		ref.current = value;
	}, [ value ] );
	return ref.current;
}

const LayerSettings = ( { postMeta, setPostMeta } ) => {
	const [ widgets, setWidgets ] = useState( {} );
	const [ options, setOptions ] = useState( {} );
	const [ styleLayers, setStyleLayers ] = useState( null );
	const [ modalOpen, setModalStatus ] = useState( false );
	const closeModal = useCallback( () => setModalStatus( false ), [
		setModalStatus,
	] );
	const openModal = useCallback( () => setModalStatus( true ), [
		setModalStatus,
	] );
	const prevPostMeta = usePrevious( postMeta );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );

	layerSchema.properties.type.enum = window.JeoLayerTypes.getLayerTypes();
	layerSchema.properties.layer_type_options = options;

	const interactions = useMemo( () => {
		return postMeta.layer_type_options.interactions || [];
	}, [ postMeta.layer_type_options.interactions ] );

	const setInteractions = useCallback(
		( e ) => {
			setPostMeta( {
				...postMeta,
				layer_type_options: {
					...postMeta.layer_type_options,
					interactions: e,
				},
			} );
		},
		[ postMeta, setPostMeta ]
	);

	useEffect( () => {
		if ( postMeta.type ) {
			window.JeoLayerTypes.getLayerTypeSchema( postMeta )
				.then( formUpdater( setOptions, setWidgets ) )
				.then( () => {
					if ( postMeta.type ) {
						let layerTypeOptions = {};
						if (
							! prevPostMeta ||
							( prevPostMeta && prevPostMeta.type === postMeta.type )
						) {
							layerTypeOptions = postMeta.layer_type_options;
						}
						setPostMeta( {
							...postMeta,
							layer_type_options: layerTypeOptions,
						} );
						setStyleLayers( null );
					}
				} );
		} else {
			setOptions( {} );
		}
	}, [ postMeta.type ] );

	useEffect( () => {
		const layerType = window.JeoLayerTypes.getLayerType(
			debouncedPostMeta.type
		);
		if ( layerType && layerType.getStyleLayers ) {
			layerType.getStyleLayers( debouncedPostMeta ).then( setStyleLayers );
		} else {
			setStyleLayers( null );
		}
	}, [ debouncedPostMeta ] );

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

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		dispatch( 'core/editor' ).editPost( { meta } );
	},
} ) )(
	withSelect( ( select ) => ( {
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( LayerSettings )
);
