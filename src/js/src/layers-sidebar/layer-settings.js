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
import SchemaForm from '../shared/schema-form';
import { mergeLayerTypeOptions } from '../map-blocks/layer-type-options';

const baseLayerSchema = {
	type: 'object',
	properties: {
		type: { title: __( 'Type', 'jeo' ), type: 'string' },
	},
	required: [ 'type' ],
};

const fallbackLayerTypeOptions = [
	{ label: __( 'Mapbox Style', 'jeo' ), value: 'mapbox' },
	{
		label: __( 'Vector Mapbox Tiled Source', 'jeo' ),
		value: 'mapbox-tileset-vector',
	},
	{
		label: __( 'Raster Mapbox Tiled Source', 'jeo' ),
		value: 'mapbox-tileset-raster',
	},
	{ label: __( 'Raster Tiled Source', 'jeo' ), value: 'tilelayer' },
	{ label: __( 'Mapbox Vector Tiles (MVT)', 'jeo' ), value: 'mvt' },
];

function getLayerTypeOptions() {
	const registeredLayerTypeOptions =
		window.JeoLayerTypes?.getLayerTypes?.().map( ( slug ) => ( {
			label: window.JeoLayerTypes.getLayerType( slug )?.label || slug,
			value: slug,
		} ) ) ?? [];

	return mergeLayerTypeOptions(
		fallbackLayerTypeOptions,
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
	const prevPostMeta = usePrevious( postMeta );
	const [ debouncedPostMeta ] = useDebounce( postMeta, 1500 );

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
		return postMeta.layer_type_options?.interactions || [];
	}, [ postMeta.layer_type_options?.interactions ] );

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
		if ( postMeta.type ) {
			const schema = window.JeoLayerTypes.getLayerTypeSchema( postMeta );
			if ( ! schema ) {
				setOptions( {} );
				setWidgets( {} );
				return;
			}
			formUpdater( setOptions, setWidgets, schema );

			if ( postMeta.type ) {
				const layerTypeOptions =
					prevPostMeta?.type && prevPostMeta.type !== postMeta.type
						? {}
						: postMeta.layer_type_options || {};

				if ( postMeta.layer_type_options !== layerTypeOptions ) {
				setPostMeta( {
					...postMeta,
					layer_type_options: layerTypeOptions,
				} );
				}
				setStyleLayers( null );
			}
		} else {
			setOptions( {} );
			setWidgets( {} );
		}
	}, [ postMeta.type, layerTypeOptions ] );

	useEffect( () => {
		const layerType = window.JeoLayerTypes.getLayerType(
			debouncedPostMeta.type
		);
		if ( layerType && layerType.getStyleLayers ) {
			layerType._getStyleDefinition( debouncedPostMeta ).then( setStyleDefinition );
			layerType.getStyleLayers( debouncedPostMeta ).then( setStyleLayers );
		} else {
			setStyleLayers( null );
		}
	}, [ debouncedPostMeta ] );

	return (
		<Fragment>
			<SchemaForm
				className="jeo-layer-settings"
				schema={ schema }
				uiSchema={ widgets }
				formData={ postMeta }
				onChange={ ( { formData } ) => {
					window.layerFormData = formData;
					setPostMeta( formData );
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
