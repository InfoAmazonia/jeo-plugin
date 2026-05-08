import { Button, Card, CardBody, Spinner } from '@wordpress/components';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SelectControl, TextControl } from '../shared/wp-form-controls';

import { List, arrayMove } from 'react-movable';

import LayerSettings from './layer-settings';
import { mergeLayerTypeOptions } from './layer-type-options';
import { loadLayer } from './utils';
import { decodeHtmlEntity } from '../shared/html';
import { usePaginatedRecords } from '../shared/rest-records';

import './layers-settings.css';

const setLayer = ( id ) => ( { id, use: 'fixed', default: true } );

const anySwapDefault = ( settings ) => {
	return settings.some( ( s ) => s.use === 'swappable' && s.default );
}

const LayerListItem = memo(
	( {
		layer,
		index,
		isDragged,
		isSelected,
		isOutOfBounds,
		itemProps,
		loadedLayers,
		widths,
		handleRemoveLayer,
		handleSwitchUseStyle,
		handleSwitchDefault,
		handleSwitchShowLegend,
		handleSwapDefault,
		handleUpdateUse,
		handleUpdateStyle,
		handleUpdateStyleLayers,
	} ) => {
		const loadedLayer = useMemo( () => loadLayer( loadedLayers, layer ), [
			loadedLayers,
			layer,
		] );

		const removeLayer = useCallback( () => handleRemoveLayer( layer.id ), [
			handleRemoveLayer,
			layer.id,
		] );
		const switchUseStyle = useCallback( ( def ) => handleSwitchUseStyle( layer.id, def ), [
			handleSwitchUseStyle,
			layer.id,
		] );
		const switchDefault = useCallback( ( def ) => handleSwitchDefault( layer.id, def ), [
			handleSwitchDefault,
			layer.id,
		] );
		const switchShowLegend = useCallback( ( def ) => handleSwitchShowLegend( layer.id, def ), [
			handleSwitchShowLegend,
			layer.id,
		] );
		const swapDefault = useCallback( ( def ) => handleSwapDefault( layer.id, def ), [
			handleSwapDefault,
			layer.id,
		] );
		const updateUse = useCallback( ( use ) => handleUpdateUse( layer.id, use ), [
			handleUpdateUse,
			layer.id,
		] );
		const updateStyle = useCallback( ( style ) => handleUpdateStyle( layer.id, style ), [
			handleUpdateStyle,
			layer.id,
		] );
		const updateStyleLayers = useCallback( ( def ) => handleUpdateStyleLayers( layer.id, def ), [
			handleUpdateStyleLayers,
			layer.id,
		] );

		if ( ! loadedLayer.layer ) {
			return null;
		}

		return (
			<LayerSettings
				itemProps={ itemProps }
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
			/>
		);
	}
);

export default function LayersSettings ( { attributes, setAttributes, loadedLayers, loadingLayers, closeModal } ) {
	const attributesRef = useRef( attributes );
	useEffect( () => {
		attributesRef.current = attributes;
	}, [ attributes ] );

	const setLayers = useCallback( ( layers ) => {
		setAttributes( { ...attributesRef.current, layers } );
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
		{ label: __( 'Mapbox Style', 'jeo' ), value: 'mapbox' },
		{ label: __( 'Vector Mapbox Tiled Source', 'jeo' ), value: 'mapbox-tileset-vector' },
		{ label: __( 'Raster Mapbox Tiled Source', 'jeo' ), value: 'mapbox-tileset-raster' },
		{ label: __( 'Raster Tiled Source', 'jeo' ), value: 'tilelayer' },
		{ label: __( 'Mapbox Vector Tiles (MVT)', 'jeo' ), value: 'mvt' },
	];
	const registeredLayerTypeOptions =
		window.JeoLayerTypes?.getLayerTypes?.().map( ( slug ) => ( {
			label: window.JeoLayerTypes.getLayerType( slug )?.label || slug,
			value: slug,
		} ) ) ?? [];
	const layerTypeOptions = [
		{ label: __( 'Select a layer type', 'jeo' ), value: '' },
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
				__( 'Do you really want to delete this layer?', 'jeo' )
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

	const renderLayerListItem = useCallback(
		( { value: layer, props, isDragged, isSelected, isOutOfBounds, index } ) => {
			return (
				<LayerListItem
					key={ layer.id }
					layer={ layer }
					index={ index }
					isDragged={ isDragged }
					isSelected={ isSelected }
					isOutOfBounds={ isOutOfBounds }
					itemProps={ props }
					loadedLayers={ loadedLayers }
					widths={ widths }
					handleRemoveLayer={ handleRemoveLayer }
					handleSwitchUseStyle={ handleSwitchUseStyle }
					handleSwitchDefault={ handleSwitchDefault }
					handleSwitchShowLegend={ handleSwitchShowLegend }
					handleSwapDefault={ handleSwapDefault }
					handleUpdateUse={ handleUpdateUse }
					handleUpdateStyle={ handleUpdateStyle }
					handleUpdateStyleLayers={ handleUpdateStyleLayers }
				/>
			);
		},
		[
			loadedLayers,
			widths,
			handleRemoveLayer,
			handleSwitchUseStyle,
			handleSwitchDefault,
			handleSwitchShowLegend,
			handleSwapDefault,
			handleUpdateUse,
			handleUpdateStyle,
			handleUpdateStyleLayers,
		]
	);

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<div className="left">
					<div>
						<form action="javascript:void(0);" style={ { display: "flex" }}>
							<TextControl
								placeholder={ __( 'Enter keywords to search layers', 'jeo' ) }
								value={ layerNameFilter }
								onChange={ ( value ) => {
									setLayerNameFilter( value );
								} }
							/>
							<SelectControl
								className="jeo-layers-library-filters"
								hideLabelFromVision={ true }
								label={ __( 'Layer type', 'jeo' ) }
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
								{ __( 'Clear', 'jeo' ) }
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
						{ __( 'New Layer', 'jeo' ) }
					</Button>
				</div>
			</div>
				<div name="map-layers" className="jeo-layers-panel">
					<ul className="jeo-layers-list">
						{ ! searchEnabled && (
							<p>{ __( 'Search layers by name or type to browse the library.', 'jeo' ) }</p>
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
											<div className="layer-buttons">
												{ ! inUse && (
													<p
														onClick={ () => {
															setAttributes( {
																...attributes,
																layers: [ ...attributes.layers, setLayer( layer.id ) ],
															} );
														} }
														className="add-button"
													>
														{ __( 'Add to map', 'jeo' ) }
													</p>
												) }
												{ inUse && (
													<p
														onClick={ () => {
															const confirmation = confirm( __( 'Do you really want to delete this layer?', 'jeo' ) );

															if ( confirmation ) {
																return setLayers(
																	attributes.layers.filter( ( settings ) => settings.id !== layer.id )
																);
															}
														} }
														className="remove-button"
													>
														{ __( 'Remove from map', 'jeo' ) }
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
						<p>{ __( 'No layers matched the current search filters.', 'jeo' ) }</p>
					) }
					{ hasMoreSearchedLayers && (
						<Button
							variant="secondary"
							onClick={ loadMoreSearchedLayers }
						>
							{ __( 'Load more layers', 'jeo' ) }
						</Button>
					) }
				</div>
			<h2 className="selected-layers-title" >{ __( 'Selected layers', 'jeo' ) }</h2>
			{ ! loadingLayers && ! attributes.layers.length && (
				<p className="jeo-layers-list">
					{ __( 'No layers have been added to this map.', 'jeo' ) }
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
					renderItem={ renderLayerListItem }
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
				{ __( 'Done', 'jeo' ) }
			</Button>
		</Fragment>
	);
};
