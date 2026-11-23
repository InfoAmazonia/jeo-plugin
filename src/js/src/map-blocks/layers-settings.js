import { Button, Card, CardBody, Spinner } from '@wordpress/components';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl, TextControl } from '../shared/wp-form-controls';

import { List, arrayMove } from 'react-movable';

import LayerSettings from './layer-settings';
import { mergeLayerTypeOptions } from './layer-type-options';
import { loadLayer } from './utils';
import { decodeHtmlEntity, decodeHtmlEntities, sanitizeHtml } from '../shared/html';
import { usePaginatedRecords } from '../shared/rest-records';
import { getLayerOrigin } from '../shared/layer-origin-badge';

import './layers-settings.css';

const setLayer = ( id ) => ( { id, use: 'fixed', default: true, provenance: 'manual' } );

const anySwapDefault = ( settings ) => {
	return settings.some( ( s ) => s.use === 'swappable' && s.default );
}

export default function LayersSettings ( { attributes, setAttributes, loadedLayers, loadingLayers, closeModal } ) {
	const attributesRef = useRef( attributes );
	useEffect( () => {
		attributesRef.current = attributes;
	}, [ attributes ] );

	const setLayers = useCallback( ( layers ) => {
		setAttributes( { layers } );
	}, [ setAttributes ] );

	// Keep the last non-empty loadedLayers snapshot so the list never unmounts
	// (or drops items) while the entity query re-resolves after layers change.
	const loadedLayersRef = useRef( loadedLayers );
	useEffect( () => {
		if ( ( loadedLayers || [] ).length > 0 ) {
			loadedLayersRef.current = loadedLayers;
		}
	}, [ loadedLayers ] );
	const stableLoadedLayers =
		( loadedLayers || [] ).length > 0
			? loadedLayers
			: loadedLayersRef.current || [];

	const widths = useMemo( () => [], [] );

	const [ layerTypeFilter, setLayerTypeFilter ] = useState( '' );
	const [ layerNameFilter, setLayerNameFilter ] = useState( '' );
	const searchEnabled =
		layerNameFilter.trim().length > 0 || layerTypeFilter.length > 0;
	const {
		records: searchedLayers,
		isLoading: searchingLayers,
		hasMore: hasMoreSearchedLayers,
		loadMore: loadMoreSearchedLayers,
	} = usePaginatedRecords( {
		path: '/wp/v2/map-layer',
		enabled: searchEnabled,
		pageSize: 20,
		query: {
			context: 'edit',
			order: 'asc',
			orderby: 'title',
			layer_name: layerNameFilter.trim() || undefined,
			layer_type: layerTypeFilter || undefined,
		},
	} );

	const fallbackLayerTypeOptions = [
		{ label: __( 'Mapbox Style', 'jeowp' ), value: 'mapbox' },
		{ label: __( 'Vector Mapbox Tiled Source', 'jeowp' ), value: 'mapbox-tileset-vector' },
		{ label: __( 'Raster Mapbox Tiled Source', 'jeowp' ), value: 'mapbox-tileset-raster' },
		{ label: __( 'Raster Tiled Source', 'jeowp' ), value: 'tilelayer' },
		{ label: __( 'Mapbox Vector Tiles (MVT)', 'jeowp' ), value: 'mvt' },
	];
	const registeredLayerTypeOptions =
		window.JeoLayerTypes?.getLayerTypes?.().map( ( slug ) => ( {
			label: window.JeoLayerTypes.getLayerType( slug )?.label || slug,
			value: slug,
		} ) ) ?? [];
	const layerTypeOptions = [
		{ label: __( 'Select a layer type', 'jeowp' ), value: '' },
		...mergeLayerTypeOptions(
			fallbackLayerTypeOptions,
			registeredLayerTypeOptions
		),
	];

	useEffect( () => {
		const [ firstLayer, ...otherLayers ] = attributes.layers;
		if ( firstLayer && firstLayer.use !== 'fixed' ) {
			setLayers( [
				{ ...firstLayer, use: 'fixed', default: true },
				...otherLayers,
			] );
		}
	}, [ attributes, setAttributes ] );

	const onLayerOrderChange = useCallback(
		( { oldIndex, newIndex } ) => {
			if ( oldIndex === newIndex ) {
				return;
			}

			const resultLayers = arrayMove(
				attributesRef.current.layers,
				oldIndex,
				newIndex
			);

			// Set base layer always as fixed
			if ( resultLayers.length ) {
				resultLayers[ 0 ].use = 'fixed';
			}

			// Reset fixed default param
			resultLayers.forEach( ( setting ) => {
				if ( setting.use === 'fixed' ) {
					setting.default = true;
				}
			} );

			setLayers( resultLayers );
		},
		[ setLayers ]
	);

	// W4 §8: keyboard alternative to drag — move an item one position.
	const moveLayerBy = useCallback(
		( id, delta ) => {
			const layers = [ ...attributesRef.current.layers ];
			const from = layers.findIndex( ( l ) => l.id === id );
			const to = from + delta;
			if ( from < 0 || to < 0 || to >= layers.length ) {
				return;
			}
			const moved = arrayMove( layers, from, to );
			if ( moved.length ) {
				moved[ 0 ].use = 'fixed';
			}
			moved.forEach( ( setting ) => {
				if ( setting.use === 'fixed' ) {
					setting.default = true;
				}
			} );
			setLayers( moved );
		},
		[ setLayers ]
	);

	const handleSwitchDefault = useCallback(
		( id, def ) =>
			setLayers(
				attributesRef.current.layers.map( ( settings ) =>
					settings.id === id ? { ...settings, default: def } : settings
				)
			),
		[ setLayers ]
	);

	const handleSwitchShowLegend = useCallback(
		( id, def ) => {
			setLayers(
				attributesRef.current.layers.map( ( settings ) =>
					settings.id === id ? { ...settings, show_legend: def } : settings
				)
			);
		},
		[ setLayers ]
	);

	const handleUpdateStyleLayers = useCallback(
		( id, def ) => {
			setLayers(
				attributesRef.current.layers.map( ( settings ) =>
					settings.id === id ? { ...settings, style_layers: def } : settings
				)
			);
		},
		[ setLayers ]
	);

	const handleSwitchUseStyle = useCallback(
		( id, def ) => {
			const currentJeoLayerProps = stableLoadedLayers.find(
				( layerPost ) => layerPost.id === id
			);
			const layerType = window.JeoLayerTypes.getLayerType(
				currentJeoLayerProps.meta.type
			);

			if ( def ) {
				layerType
					._getStyleDefinition( {
						...currentJeoLayerProps.meta,
						layer_id: currentJeoLayerProps.id,
					} )
					.catch( () => null )
					.then( ( response ) => {
						if ( ! response ) {
							return;
						}

						let styleLayers = response.layers;

						styleLayers = styleLayers.map( ( layer ) => {
							if (
								layer.layout &&
								typeof layer.layout.visibility !== 'undefined' &&
								layer.layout.visibility === 'none'
							) {
								return {
									id: layer.id,
									show: false,
								};
							}

							return {
								id: layer.id,
								show: true,
							};
						} );

						setLayers(
							attributesRef.current.layers.map( ( settings ) => {
								return settings.id === id
									? {
											...settings,
											load_as_style: true,
											style_layers: styleLayers,
									  }
									: {
											...settings,
											load_as_style: false,
											style_layers: [],
									  };
							} )
						);
					} );

				setLayers(
					attributesRef.current.layers.map( ( settings ) => {
						return settings.id === id
							? { ...settings, load_as_style: true, style_layers: [] }
							: {
									...settings,
									load_as_style: false,
									style_layers: [],
							  };
					} )
				);
			}
		},
		[ setLayers, stableLoadedLayers ]
	);

	const handleSwapDefault = useCallback(
		( id, def ) =>
			def && // radio-like behavior: can only be turned on.
			setLayers(
				attributesRef.current.layers.map( ( settings ) => ( {
					...settings,
					default:
						settings.use === 'swappable' // update only the swappable layers
							? settings.id === id // radio-like behavior: turn off all other swappable layers
							: settings.default,
				} ) )
			),
		[ setLayers ]
	);

	const handleUpdateUse = useCallback(
		( id, use ) =>
			setLayers(
				attributesRef.current.layers.map( ( settings ) => {
					if ( settings.id !== id ) {
						return settings;
					}
					return {
						...settings,
						use,
						default:
							use === 'swappable'
								? ! anySwapDefault( attributesRef.current.layers )
								: use === 'fixed'
								? true
								: settings.default,
					};
				} )
			),
		[ setLayers ]
	);

	const handleRemoveLayer = useCallback(
		( id ) => {
			const confirmation = confirm(
				__( 'Do you really want to delete this layer?', 'jeowp' )
			);

			if ( confirmation ) {
				return setLayers(
					attributesRef.current.layers.filter(
						( settings ) => settings.id !== id
					)
				);
			}
		},
		[ setLayers ]
	);

	const handleUpdateStyle = useCallback(
		( id, style ) => {
			setLayers(
				attributesRef.current.layers.map( ( settings ) =>
					settings.id === id ? { ...settings, style } : settings
				)
			);
		},
		[ setLayers ]
	);

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<div className="left">
					<div>
						<form action="javascript:void(0);" style={ { display: "flex" }}>
							<TextControl
								label={ __( 'Search layers', 'jeowp' ) }
								hideLabelFromVision={ true }
								placeholder={ __( 'Enter keywords to search layers', 'jeowp' ) }
								value={ layerNameFilter }
								onChange={ ( value ) => {
									setLayerNameFilter( value );
								} }
							/>
							<SelectControl
								className="jeo-layers-library-filters"
								hideLabelFromVision={ true }
								label={ __( 'Layer type', 'jeowp' ) }
								options={ layerTypeOptions }
								value={ layerTypeFilter }
								onChange={ ( value ) => {
									setLayerTypeFilter( value )
								} }
							/>
							{ /* W4 §2.2: "Clear" is tertiary and only
							     visible while a filter is active — never a
							     co-primary next to "New Layer". */ }
							{ searchEnabled && (
								<Button
									className="jeo-layers-library-filters-button-clear"
									variant="tertiary"
									isLarge
									onClick={ () => {
										setLayerTypeFilter( '' );
										setLayerNameFilter('');
									} }
								>
									{ __( 'Clear', 'jeowp' ) }
								</Button>
							) }
						</form>
					</div>
				</div>
				<div className="right">
					{ /* W4 §2.2: secondary — the modal's only primary is the
					     "Done" in the fixed footer. */ }
					<Button
						className="create-layer-button"
						variant="secondary"
						isLarge
						href="/wp-admin/post-new.php?post_type=map-layer"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'New Layer', 'jeowp' ) }
					</Button>
				</div>
			</div>
				{ /* C-3 (a11y): the results region (list + spinner + empty
				     state) updates async after each search — it must be
				     announced. */ }
				<div
					name="map-layers"
					className="jeo-layers-panel"
					role="status"
					aria-live="polite"
				>
					{ ! searchEnabled && (
						<p>{ __( 'Search layers by name or type to browse the library.', 'jeowp' ) }</p>
					) }
					{ searchEnabled && searchingLayers && ! searchedLayers.length && (
						<Spinner />
					) }
					{ /* C-1 (a11y): the <ul> may only contain <li> children —
					     the hint/spinner live above it and each card is wrapped
					     in an <li> (the inner element is a plain <div>). */ }
					<ul className="jeo-layers-list">
						{ searchedLayers.map( ( layer, i ) => {
						let inUse = false;
						attributes.layers.map( ( l ) => {
							if ( layer.id === l.id ) {
								inUse = true;
							}
						} );

						if ( ! layer.meta.type ) {
							return;
						}

						return (
							<li key={ layer.id } className="layer-card-item">
							<Card
								style={ { background: i % 2 !== 0 ? "white": "#f9f9f9" } }
								size="small"
								className="layer-card"
							>
								<CardBody>
									<div className="jeo-setting-layer all-layers-list">
										<div className="layer-info">
											<p className="layer-info__single-row">
												<a
													className="all-layers-list-link"
													href={ `/wp-admin/post.php?post=${ layer.id }&action=edit` }
													target="_blank"
													rel="noopener noreferrer"
												>
													<strong className="layer-title">{ decodeHtmlEntity( layer.title.rendered ) }</strong> | { layer.meta.type }
												</a>
											</p>
											{ ( layer.excerpt?.rendered || layer.content?.rendered ) && (
												<p className="layer-description">
													{ decodeHtmlEntities( ( layer.excerpt?.rendered || layer.content?.rendered ).replace( /<[^>]+>/g, '' ) ) }
												</p>
											) }
											{ ( layer.meta.attribution || layer['layer-theme']?.length > 0 ) && (
												<p className="layer-meta">
												{ layer.meta.attribution && (
													<span className="layer-source">
														<strong>{ __( 'Source:', 'jeowp' ) }</strong>{ ' ' }
														<span dangerouslySetInnerHTML={ { __html: sanitizeHtml( layer.meta.attribution ) } } />
													</span>
												) }
													{ layer['layer-theme']?.length > 0 && (
														<span className="layer-themes">
															<strong>{ __( 'Themes:', 'jeowp' ) }</strong> { layer['layer-theme'].map( ( t ) => t.name ).join( ', ' ) }
														</span>
													) }
												</p>
											) }
										{ /* W4 §3.4 (M-5): real buttons, visible at
										     rest (no hover reveal), keyboard/SR
										     reachable. In-use layers show a disabled
										     "Added" with the reason on the tooltip. */ }
											<div className="layer-buttons">
												{ ! inUse && (
													<Button
														variant="link"
														className="add-button"
														onClick={ () => {
															const new_layer = setLayer( layer.id );
															const existing_ids = new Set( attributes.layers.map( ( l ) => l.id ) );
															if ( existing_ids.has( new_layer.id ) ) {
																return;
															}
															setAttributes( {
																layers: [ ...attributes.layers, new_layer ],
															} );
														} }
													>
														{ __( 'Add to map', 'jeowp' ) }
													</Button>
												) }
												{ inUse && (
													<>
														<Button
															variant="link"
															className="add-button add-button--added"
															disabled
															aria-disabled={ true }
															title={ __( 'Already on this map', 'jeowp' ) }
														>
															{ __( 'Added', 'jeowp' ) }
														</Button>
														<Button
															variant="link"
															className="remove-button"
															onClick={ () => {
																const confirmation = confirm( __( 'Do you really want to delete this layer?', 'jeowp' ) );

																if ( confirmation ) {
																	return setLayers(
																		attributes.layers.filter( ( settings ) => settings.id !== layer.id )
																	);
																}
															} }
														>
															{ __( 'Remove from map', 'jeowp' ) }
														</Button>
													</>
												) }
											</div>
										</div>
									</div>
								</CardBody>
							</Card>
							</li>
						);
						} ) }
					</ul>
					{ searchEnabled && ! searchingLayers && ! searchedLayers.length && (
						<p>{ __( 'No layers matched the current search filters.', 'jeowp' ) }</p>
					) }
					{ hasMoreSearchedLayers && (
						<Button
							variant="secondary"
							onClick={ loadMoreSearchedLayers }
						>
							{ __( 'Load more layers', 'jeowp' ) }
						</Button>
					) }
				</div>
			<h2 className="selected-layers-title" >{ __( 'Selected layers', 'jeowp' ) }</h2>
			{ ! loadingLayers && ! attributes.layers.length && (
				<p className="jeo-layers-list">
					{ __( 'No layers have been added to this map.', 'jeowp' ) }
				</p>
			) }

	{ ( ! loadingLayers || stableLoadedLayers.length > 0 ) && attributes.layers.length > 0 && (
		<List
					values={ attributes.layers }
					onChange={ onLayerOrderChange }
					renderList={ ( { children, props } ) => (
						<div className="jeo-layers-list" { ...props }>
							{ children }
						</div>
					) }
					renderItem={ ( {
						value: layer,
						props,
						isDragged,
						isSelected,
						isOutOfBounds,
						index,
					} ) => {
									const switchDefault = ( def ) =>
										setLayers(
											attributes.layers.map( ( settings ) =>
												settings.id === layer.id
													? { ...settings, default: def }
													: settings
											)
										);

									const switchShowLegend = ( def ) => {
										setLayers(
											attributes.layers.map( ( settings ) =>
												settings.id === layer.id
													? { ...settings, show_legend: def }
													: settings
											)
										);
									};

									const updateStyleLayers = (def) => {
										setLayers(
											attributes.layers.map( ( settings ) =>
												settings.id === layer.id
													? { ...settings, style_layers: def }
													: settings
											)
										);
									}

									const switchUseStyle = ( def ) => {
										if ( ! def ) {
											setLayers(
												attributes.layers.map( ( settings ) => {
													return settings.id === layer.id
														? { ...settings, load_as_style: false, style_layers: [] }
														: settings;
												} )
											);
											return;
										}

										const currentJeoLayerProps = stableLoadedLayers.find(layerPost => layerPost.id === layer.id);
										if ( ! currentJeoLayerProps ) {
											return;
										}

										const layerType = window.JeoLayerTypes.getLayerType(
											currentJeoLayerProps.meta.type
										);
										if ( ! layerType?._getStyleDefinition ) {
											return;
										}

										if ( def ) {
											layerType._getStyleDefinition( { ...currentJeoLayerProps.meta, layer_id: currentJeoLayerProps.id  } ).catch( () => null ).then( response => {
												if(!response) {
													return;
												}

												let styleLayers = response.layers;

												styleLayers = styleLayers.map(layer => {
													if(layer.layout && typeof layer.layout.visibility !== 'undefined' && layer.layout.visibility === 'none') {
														return {
															id: layer.id,
															show: false,
														}
													}

													return {
														id: layer.id,
														show: true,
													}
												})

												setLayers(
													attributes.layers.map( ( settings ) => {
														return settings.id === layer.id?
															{ ...settings, load_as_style: true, style_layers: styleLayers }
															: settings
													} )
												);
											} );

											setLayers(
												attributes.layers.map( ( settings ) => {
													return settings.id === layer.id?
														{ ...settings, load_as_style: true, style_layers: [] }
														: settings
												} )
											);
										}
									};

									const swapDefault = ( def ) =>
										def && // radio-like behavior: can only be turned on.
										setLayers(
											attributes.layers.map( ( settings ) => ( {
												...settings,
												default:
													settings.use === 'swappable' // update only the swappable layers
														? settings.id === layer.id // radio-like behavior: turn off all other swappable layers
														: settings.default,
											} ) )
										);

								const updateStyle = ( style ) =>
									setLayers(
										attributesRef.current.layers.map( ( settings ) =>
											settings.id === layer.id
												? { ...settings, style }
												: settings
										)
									);

								const updateUse = ( use ) =>
										setLayers(
											attributes.layers.map( ( settings ) => {
												if ( settings.id !== layer.id ) {
													return settings;
												}
												return {
													...settings,
													use,
													default:
														use === 'swappable' ? ! anySwapDefault( attributes.layers ) :
														use === 'fixed' ? true :
														settings.default,
												};
											} )
										);

									const removeLayer = () => {
										const confirmation = confirm(
											__( 'Do you really want to delete this layer?', 'jeowp' )
										);

										if ( confirmation ) {
											return setLayers(
												attributes.layers.filter(
													( settings ) => settings.id !== layer.id
												)
											);
										}
									};

									const loadedLayer = loadLayer( stableLoadedLayers, layer );

									if(!loadedLayer.layer) {
										// TODO: Remove deleted layers
										return null;
									}

									// W4 §5 (Contrato O): origin badge on the
									// selected instance; "Manual" only shows when
									// the list mixes in AI layers.
									const layerOrigin = getLayerOrigin( {
										instance: layer,
										record: loadedLayer.layer,
									} );
									const showManualBadge = attributes.layers.some(
										( l ) =>
											getLayerOrigin( {
												instance: l,
												record: stableLoadedLayers.find(
													( r ) => r.id === l.id
												),
											} ) === 'ai'
									);

									return <LayerSettings
										itemProps={ props }
										index={ index }
										isDragged={ isDragged }
										isSelected={ isSelected }
										isOutOfBounds={ isOutOfBounds }
										removeLayer={ removeLayer }
										settings={ loadedLayer }
										switchUseStyle={ switchUseStyle }
										switchDefault={ switchDefault }
										switchShowLegend={ switchShowLegend }
										swapDefault={ swapDefault }
										updateUse={ updateUse }
										updateStyle={ updateStyle }
										widths={ widths }
										updateStyleLayers={ updateStyleLayers }
										moveLayerBy={ moveLayerBy }
										totalLayers={ attributes.layers.length }
										origin={ layerOrigin }
										showManualBadge={ showManualBadge }
										key={ layer.id }
									/>;
								} }
				/>
			) }
			{ /* W4 §2.2/§3.3: "Done" lives in the modal's fixed footer
			     (rendered by LayersSettingsModal) — the single primary. */ }
		</Fragment>
	);
};
