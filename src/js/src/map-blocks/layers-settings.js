import { Button, Card, CardBody, Spinner } from '@wordpress/components';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl, TextControl } from '../shared/wp-form-controls';

import { List, arrayMove } from 'react-movable';

import LayerSettings from './layer-settings';
import { mergeLayerTypeOptions } from './layer-type-options';
import { loadLayer } from './utils';
import { decodeHtmlEntity } from '../shared/html';
import { usePaginatedRecords } from '../shared/rest-records';

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
				{ ...firstLayer, use: 'fixed', default: false },
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
			const currentJeoLayerProps = loadedLayers.find(
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
		[ setLayers, loadedLayers ]
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
							<Button
								className="jeo-layers-library-filters-button-clear"
								variant="primary"
								isLarge
								onClick={ () => {
									setLayerTypeFilter( '' );
									setLayerNameFilter('');
								} }
							>
								{ __( 'Clear', 'jeowp' ) }
							</Button>
						</form>
					</div>
				</div>
				<div className="right">
					<Button
						className="create-layer-button"
						variant="primary"
						isLarge
						href="/wp-admin/post-new.php?post_type=map-layer"
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'New Layer', 'jeowp' ) }
					</Button>
				</div>
			</div>
				<div name="map-layers" className="jeo-layers-panel">
					<ul className="jeo-layers-list">
						{ ! searchEnabled && (
							<p>{ __( 'Search layers by name or type to browse the library.', 'jeowp' ) }</p>
						) }
						{ searchEnabled && searchingLayers && ! searchedLayers.length && (
							<Spinner />
						) }
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
							<Card
								key={ layer.id }
								style={ { background: i % 2 !== 0 ? "white": "#f9f9f9" } }
								size="small"
								className="layer-card"
							>
								<CardBody>
									<li className="jeo-setting-layer all-layers-list">
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
													{ decodeHtmlEntity( ( layer.excerpt?.rendered || layer.content?.rendered ).replace( /<[^>]+>/g, '' ) ) }
												</p>
											) }
											{ ( layer.meta.attribution || layer['layer-theme']?.length > 0 ) && (
												<p className="layer-meta">
													{ layer.meta.attribution && (
														<span className="layer-source">
															<strong>{ __( 'Source:', 'jeowp' ) }</strong> { layer.meta.attribution }
														</span>
													) }
													{ layer['layer-theme']?.length > 0 && (
														<span className="layer-themes">
															<strong>{ __( 'Themes:', 'jeowp' ) }</strong> { layer['layer-theme'].map( ( t ) => t.name ).join( ', ' ) }
														</span>
													) }
												</p>
											) }
											<div className="layer-buttons">
												{ ! inUse && (
													<p
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
														className="add-button"
													>
														{ __( 'Add to map', 'jeowp' ) }
													</p>
												) }
												{ inUse && (
													<p
														onClick={ () => {
															const confirmation = confirm( __( 'Do you really want to delete this layer?', 'jeowp' ) );

															if ( confirmation ) {
																return setLayers(
																	attributes.layers.filter( ( settings ) => settings.id !== layer.id )
																);
															}
														} }
														className="remove-button"
													>
														{ __( 'Remove from map', 'jeowp' ) }
													</p>
												) }
											</div>
										</div>
									</li>
								</CardBody>
							</Card>
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

			{ ! loadingLayers && attributes.layers.length > 0 && (
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

										const currentJeoLayerProps = loadedLayers.find(layerPost => layerPost.id === layer.id);
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
											layerType._getStyleDefinition( { ...currentJeoLayerProps.meta, layer_id: currentJeoLayerProps.id  } ).then( response => {
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

									const loadedLayer = loadLayer( loadedLayers, layer );

									if(!loadedLayer.layer) {
										// TODO: Remove deleted layers
										return null;
									}

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
										widths={ widths }
										updateStyleLayers={ updateStyleLayers }
										key={ index }
									/>;
								} }
				/>
			) }
			<Button
				className="done-button"
				variant="primary"
				isLarge
				target="_blank"
				rel="noopener noreferrer"
				onClick={ closeModal }
			>
				{ __( 'Done', 'jeowp' ) }
			</Button>
		</Fragment>
	);
};
