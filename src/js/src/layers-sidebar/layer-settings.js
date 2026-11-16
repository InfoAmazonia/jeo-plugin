import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { select, withDispatch, withSelect } from '@wordpress/data';
import {
	Fragment,
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import InteractionsSettings from './interactions-settings';
import { isEmpty, isEqual } from 'lodash-es';
import { useDebounce, useDebouncedCallback } from 'use-debounce';
import SchemaForm, { mergeSchemaFormData } from '../shared/schema-form';
import { mergeLayerTypeOptions } from '../map-blocks/layer-type-options';
import {
	coreLayerTypeOptions,
	getEditorLayerTypeSchema,
} from './layer-type-definitions';
import { validateLayerFormData } from './form-validation';
import {
	learnInjectedDefaults,
	stripInjectedDefaults,
} from './commit-sanitize';

const baseLayerSchema = {
	type: 'object',
	properties: {
		type: { title: __( 'Type', 'jeowp' ), type: 'string' },
	},
	required: [ 'type' ],
};

function isPlainObject( value ) {
	return (
		Boolean( value ) &&
		typeof value === 'object' &&
		! Array.isArray( value )
	);
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
			Object.entries( options.properties || {} ).map(
				( [ key, property ] ) => [ key, { ...property } ]
			)
		),
	};

	Object.entries( nextOptions.properties ).forEach( ( [ key, property ] ) => {
		if ( property.description ) {
			widgets.layer_type_options[ key ] = {
				'ui:help': property.description,
			};
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

const LayerSettings = ( { postId, postMeta, sendNotice, setPostMeta } ) => {
	const [ widgets, setWidgets ] = useState( {} );
	const [ options, setOptions ] = useState( {} );
	const [ formData, setFormData ] = useState( () =>
		normalizeLayerFormData( postMeta )
	);
	const [ layerTypeOptions, setLayerTypeOptions ] = useState( () =>
		getLayerTypeOptions()
	);
	const [ styleLayers, setStyleLayers ] = useState( null );
	const [ styleDefinition, setStyleDefinition ] = useState( null );
	const [ modalOpen, setModalStatus ] = useState( false );
	const [ isRefreshingComposerCache, setIsRefreshingComposerCache ] =
		useState( false );
	const closeModal = useCallback(
		() => setModalStatus( false ),
		[ setModalStatus ]
	);
	const openModal = useCallback(
		() => setModalStatus( true ),
		[ setModalStatus ]
	);
	const prevLayerType = usePrevious( formData.type );
	const serializedPostMeta = JSON.stringify(
		normalizeLayerFormData( postMeta )
	);
	const [ debouncedFormData ] = useDebounce( formData, 1500 );
	const debouncedSetPostMeta = useDebouncedCallback( setPostMeta, 500 );

	// Per-type option stash: switching the layer type never destroys typed
	// values — the previous type's options are kept in memory and restored
	// if the user switches back (item 1.6 / K-7).
	const optionsByTypeRef = useRef( {} );
	// Set when the type switch (including the options reset) was already
	// handled in the SchemaForm onChange path, so the type-change effect
	// does not reset the options a second time.
	const typeSwitchHandledRef = useRef( false );
	// Bump to remount the SchemaForm and force it to resync from the
	// preserved form data — needed when a type switch is cancelled, because
	// the RJSF select keeps its own internal state (Gate 2 — G2).
	const [ formResetKey, setFormResetKey ] = useState( 0 );

	// R3B-G1 (a): the SchemaForm injects schema defaults into the meta on
	// mount (e.g. `scheme: 'xyz'`), dirtying the post and racing the preview
	// error lifecycle. The server meta at mount is the baseline; injected
	// defaults are stripped from COMMITS only (render keeps them).
	const initialServerMetaRef = useRef( null );
	if ( initialServerMetaRef.current === null ) {
		initialServerMetaRef.current = normalizeLayerFormData( postMeta );
	}
	const injectedDefaultsRef = useRef( new Set() );
	const injectionCapturedRef = useRef( false );

	// Strip untouched schema-default injections before persisting. Required
	// keys are never stripped (the publish lock depends on them).
	const sanitizeForCommit = useCallback( ( data ) => {
		const commitSchema = getEditorLayerTypeSchema( data );
		if ( ! injectionCapturedRef.current ) {
			learnInjectedDefaults( {
				formData: data,
				initialFormData: initialServerMetaRef.current,
				schema: commitSchema,
				injectedKeys: injectedDefaultsRef.current,
			} );
			injectionCapturedRef.current = true;
		}
		return stripInjectedDefaults( {
			formData: data,
			schema: commitSchema,
			injectedKeys: injectedDefaultsRef.current,
		} );
	}, [] );

	const getLayerTypeLabel = useCallback(
		( slug ) =>
			layerTypeOptions.find( ( option ) => option.value === slug )
				?.label || slug,
		[ layerTypeOptions ]
	);

	const hasFilledOptions = useCallback( ( options = {} ) => {
		return Object.values( options ).some(
			( value ) =>
				value !== undefined &&
				value !== null &&
				value !== '' &&
				( ! Array.isArray( value ) || value.length > 0 )
		);
	}, [] );

	const handleFormChange = useCallback(
		( { formData: nextPartialFormData } ) => {
			const nextFormData = normalizeLayerFormData(
				mergeSchemaFormData( formData, nextPartialFormData )
			);
			window.layerFormData = nextFormData;
			if ( isEqual( nextFormData, formData ) ) {
				return;
			}

			const typeChanged =
				formData.type &&
				nextFormData.type &&
				nextFormData.type !== formData.type;

			if ( typeChanged ) {
				const previousOptions = formData.layer_type_options || {};
				optionsByTypeRef.current[ formData.type ] = previousOptions;

				if ( hasFilledOptions( previousOptions ) ) {
					const confirmed = window.confirm(
						sprintf(
							/* translators: %s: label of the previous layer type. */
							__(
								'Changing the layer type clears the fields filled for "%s". The values are kept and restored if you switch back. Change the layer type?',
								'jeowp'
							),
							getLayerTypeLabel( formData.type )
						)
					);

					if ( ! confirmed ) {
						// Cancel: keep the current type and its values untouched.
						// The SchemaForm select is not controlled in practice (it
						// already updated its internal state to the new type), so
						// remount it to revert the visual selection.
						setFormResetKey( ( key ) => key + 1 );
						return;
					}
				}

				// Confirmed (or nothing to lose): apply the new type with its
				// stashed options (if the user had configured it before) or a
				// clean set.
				const stashedOptions =
					optionsByTypeRef.current[ nextFormData.type ];
				const switchedFormData = {
					...nextFormData,
					layer_type_options: stashedOptions
						? { ...stashedOptions }
						: {},
				};
				typeSwitchHandledRef.current = true;
				setFormData( switchedFormData );
				debouncedSetPostMeta( sanitizeForCommit( switchedFormData ) );
				return;
			}

			setFormData( nextFormData );
			debouncedSetPostMeta( sanitizeForCommit( nextFormData ) );
		},
		[ formData, debouncedSetPostMeta, getLayerTypeLabel, hasFilledOptions, sanitizeForCommit ]
	);

	const schema = useMemo(
		() => ( {
			...baseLayerSchema,
			properties: {
				type: {
					...baseLayerSchema.properties.type,
					enum: layerTypeOptions.map( ( option ) => option.value ),
					enumNames: layerTypeOptions.map(
						( option ) => option.label
					),
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

	const refreshComposerCache = useCallback( async () => {
		if ( ! postId || isRefreshingComposerCache ) {
			return;
		}

		setIsRefreshingComposerCache( true );

		try {
			const response = await apiFetch( {
				path: `/jeo/v1/map-style/layer/${ postId }/refresh`,
				method: 'POST',
			} );
			const refreshed = Number.parseInt( response?.refreshed || 0, 10 );
			const failed = Number.parseInt( response?.failed || 0, 10 );
			const refreshedLabel = sprintf(
				/* translators: %d: number of maps whose composed style cache was refreshed. */
				_n( '%d map', '%d maps', refreshed, 'jeowp' ),
				refreshed
			);
			const failedLabel = sprintf(
				/* translators: %d: number of map refresh failures. */
				_n( '%d failure', '%d failures', failed, 'jeowp' ),
				failed
			);

			if ( failed > 0 ) {
				sendNotice(
					'warning',
					sprintf(
						/* translators: 1: refreshed maps count label, 2: failed refresh count label. */
						__(
							'Composed style cache refreshed for %1$s, with %2$s.',
							'jeowp'
						),
						refreshedLabel,
						failedLabel
					)
				);
			} else {
				sendNotice(
					'success',
					sprintf(
						/* translators: %s: refreshed maps count label. */
						__( 'Composed style cache refreshed for %s.', 'jeowp' ),
						refreshedLabel
					)
				);
			}
		} catch ( error ) {
			sendNotice(
				'error',
				error?.message ||
					__( 'Unable to refresh composed style cache.', 'jeowp' )
			);
		} finally {
			setIsRefreshingComposerCache( false );
		}
	}, [ isRefreshingComposerCache, postId, sendNotice ] );

	useEffect( () => {
		const next = normalizeLayerFormData( postMeta );
		if ( ! isEqual( next, formData ) ) {
			setFormData( next );
		}
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
			setPostMeta( sanitizeForCommit( nextFormData ) );
		},
		[ formData, setPostMeta, sanitizeForCommit ]
	);

	useEffect( () => {
		const syncLayerTypeOptions = () => {
			setLayerTypeOptions( getLayerTypeOptions() );
		};

		syncLayerTypeOptions();
		window.addEventListener(
			'jeo-layer-types-changed',
			syncLayerTypeOptions
		);

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
				if ( typeSwitchHandledRef.current ) {
					// The SchemaForm onChange path already confirmed the switch
					// with the user and applied the per-type option stash.
					typeSwitchHandledRef.current = false;
				} else {
					// Non-interactive type change (undo/redo, meta sync): keep
					// the historical behavior of resetting the options.
					const nextFormData = {
						...formData,
						layer_type_options: {},
					};
					setFormData( nextFormData );
					setPostMeta( nextFormData );
				}
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

		// Only ask the layer type for style definitions when the required
		// fields are filled — an incomplete form would make the Mapbox
		// requests fail (previously an invisible console error, item 1.6).
		if (
			layerType &&
			layerType.getStyleLayers &&
			hasLayerTypeOptions &&
			validateLayerFormData( debouncedFormData ).complete
		) {
			try {
				Promise.resolve(
					layerType._getStyleDefinition( debouncedFormData )
				)
					.then( setStyleDefinition )
					.catch( () => setStyleDefinition( null ) );
				Promise.resolve( layerType.getStyleLayers( debouncedFormData ) )
					.then( setStyleLayers )
					.catch( () => setStyleLayers( null ) );
			} catch ( error ) {
				setStyleLayers( null );
				setStyleDefinition( null );
			}
		} else {
			setStyleLayers( null );
			setStyleDefinition( null );
		}
	}, [ debouncedFormData ] );

	return (
		<Fragment>
			<SchemaForm
				key={ formResetKey }
				className="jeo-layer-settings"
				schema={ schema }
				uiSchema={ widgets }
				formData={ formData }
				onChange={ handleFormChange }
			>
				{ /* Hide submit button */ }
				<div />
			</SchemaForm>

			{ formData.type === 'mapbox' && (
				<Button
					isBusy={ isRefreshingComposerCache }
					disabled={ isRefreshingComposerCache || ! postId }
					onClick={ refreshComposerCache }
					variant="secondary"
				>
					{ isRefreshingComposerCache
						? __( 'Refreshing composed style cache', 'jeowp' )
						: __( 'Refresh composed style cache', 'jeowp' ) }
				</Button>
			) }

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
						{ __( 'Edit interactions', 'jeowp' ) }
					</Button>
				</Fragment>
			) }
		</Fragment>
	);
};

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		const currentMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};

		dispatch( 'core/editor' ).editPost( {
			meta: { ...currentMeta, ...meta },
		} );
	},
	sendNotice: ( type, message ) => {
		dispatch( 'core/notices' ).createNotice( type, message, {
			id: 'jeo-layer-composer-cache-refresh',
			isDismissible: true,
		} );
	},
} ) )(
	withSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		postMeta:
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {},
	} ) )( LayerSettings )
);
