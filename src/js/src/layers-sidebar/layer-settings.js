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
import InteractionsSettings from './interactions-settings';
import { useDebounce } from 'use-debounce';
import SchemaForm, { mergeSchemaFormData } from '../shared/schema-form';
import { mergeLayerTypeOptions } from '../map-blocks/layer-type-options';
import {
	coreLayerTypeOptions,
	getEditorLayerTypeSchema,
} from './layer-type-definitions';

const baseLayerSchema = {
	type: 'object',
	properties: {
		type: { title: __( 'Type', 'jeo' ), type: 'string' },
	},
	required: [ 'type' ],
};

function isPlainObject( value ) {
	return Boolean( value ) && typeof value === 'object' && ! Array.isArray( value );
}

function normalizeLayerFormData( postMeta = {} ) {
	return {
		...postMeta,
		layer_type_options: isPlainObject( postMeta.layer_type_options )
			? postMeta.layer_type_options
			: {},
	};
}

function getLayerTypeOptions() {
	const registeredLayerTypeOptions =
		window.JeoLayerTypes?.getLayerTypes?.().map( ( slug ) => ( {
			label: window.JeoLayerTypes.getLayerType( slug )?.label || slug,
			value: slug,
		} ) ) ?? [];

	return mergeLayerTypeOptions(
		coreLayerTypeOptions,
		registeredLayerTypeOptions
	);
}

const formUpdater = ( setOptions, setWidgets, options ) => {
	const widgets = { layer_type_options: {} };
	const nextOptions = {
		...options,
		properties: Object.fromEntries(
			Object.entries( options.properties || {} ).map( ( [ key, property ] ) => [
				key,
				{ ...property },
			] )
		),
	};

	Object.entries( nextOptions.properties ).forEach( ( [ key, property ] ) => {
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
	setOptions( nextOptions );
};

function usePrevious( value ) {
	const ref = useRef( undefined );
	useEffect( () => {
		ref.current = value;
	}, [ value ] );
	return ref.current;
}

const LayerSettings = ( { postMeta, setPostMeta } ) => {
	const [ widgets, setWidgets ] = useState( {} );
	const [ options, setOptions ] = useState( {} );
	const [ formData, setFormData ] = useState( () =>
		normalizeLayerFormData( postMeta )
	);
	const [ layerTypeOptions, setLayerTypeOptions ] = useState( () =>
		getLayerTypeOptions()
	);
	const [ styleLayers, setStyleLayers ] = useState( null );
	const [ styleDefinition, setStyleDefinition ]= useState( null );
	const [ modalOpen, setModalStatus ] = useState( false );
	const closeModal = useCallback( () => setModalStatus( false ), [
		setModalStatus,
	] );
	const openModal = useCallback( () => setModalStatus( true ), [
		setModalStatus,
	] );
	const prevLayerType = usePrevious( formData.type );
	const serializedPostMeta = JSON.stringify( normalizeLayerFormData( postMeta ) );
	const [ debouncedFormData ] = useDebounce( formData, 1500 );

	const schema = useMemo(
		() => ( {
			...baseLayerSchema,
			properties: {
				type: {
					...baseLayerSchema.properties.type,
					enum: layerTypeOptions.map( ( option ) => option.value ),
					enumNames: layerTypeOptions.map( ( option ) => option.label ),
				},
				...( options?.type === 'object'
					? { layer_type_options: options }
					: {} ),
			},
		} ),
		[ layerTypeOptions, options ]
	);

	const interactions = useMemo( () => {
		return formData.layer_type_options?.interactions || [];
	}, [ formData.layer_type_options?.interactions ] );

	useEffect( () => {
		setFormData( normalizeLayerFormData( postMeta ) );
	}, [ serializedPostMeta ] );

	const setInteractions = useCallback(
		( e ) => {
			const nextFormData = {
				...formData,
				layer_type_options: {
					...formData.layer_type_options,
					interactions: e,
				},
			};
			setFormData( nextFormData );
			setPostMeta( nextFormData );
		},
		[ formData, setPostMeta ]
	);

	useEffect( () => {
		const syncLayerTypeOptions = () => {
			setLayerTypeOptions( getLayerTypeOptions() );
		};

		syncLayerTypeOptions();
		window.addEventListener( 'jeo-layer-types-changed', syncLayerTypeOptions );

		return () => {
			window.removeEventListener(
				'jeo-layer-types-changed',
				syncLayerTypeOptions
			);
		};
	}, [] );

	useEffect( () => {
		if ( formData.type ) {
			const nextSchema = getEditorLayerTypeSchema( formData );
			if ( ! nextSchema ) {
				setOptions( {} );
				setWidgets( {} );
				return;
			}
			formUpdater( setOptions, setWidgets, nextSchema );

			if ( prevLayerType && prevLayerType !== formData.type ) {
				const nextFormData = {
					...formData,
					layer_type_options: {},
				};
				setFormData( nextFormData );
				setPostMeta( nextFormData );
				}
				setStyleLayers( null );
		} else {
			setOptions( {} );
			setWidgets( {} );
		}
	}, [ formData.type, layerTypeOptions ] );

	useEffect( () => {
		const layerType = window.JeoLayerTypes.getLayerType(
			debouncedFormData.type
		);
		const layerTypeOptions = debouncedFormData.layer_type_options;
		const hasLayerTypeOptions =
			layerTypeOptions && typeof layerTypeOptions === 'object';

		if ( layerType && layerType.getStyleLayers && hasLayerTypeOptions ) {
			layerType._getStyleDefinition( debouncedFormData ).then( setStyleDefinition );
			layerType.getStyleLayers( debouncedFormData ).then( setStyleLayers );
		} else {
			setStyleLayers( null );
			setStyleDefinition( null );
		}
	}, [ debouncedFormData ] );

	return (
		<Fragment>
			<SchemaForm
				className="jeo-layer-settings"
				schema={ schema }
				uiSchema={ widgets }
				formData={ formData }
				onChange={ ( { formData: nextPartialFormData } ) => {
					const nextFormData = normalizeLayerFormData(
						mergeSchemaFormData( formData, nextPartialFormData )
					);
					window.layerFormData = nextFormData;
					setFormData( nextFormData );
					setPostMeta( nextFormData );
				} }
			>
				{ /* Hide submit button */ }
				<div />
			</SchemaForm>

			{ styleLayers && interactions && (
				<Fragment>
					{ modalOpen && (
						<InteractionsSettings
							sources={ styleLayers }
							styleDefinition={ styleDefinition }
							onCloseModal={ closeModal }
							interactions={ interactions }
							setInteractions={ setInteractions }
						/>
					) }

					<Button variant="primary" onClick={ openModal }>
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
