import {
	Button,
	Spinner,
	Dashicon,
	CheckboxControl,
    SelectControl,
    TextControl,
    Card,
    CardBody,
    CardHeader,
    CardDivider,
    CardFooter,
} from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';

import classNames from 'classnames';
import { List, arrayMove } from 'react-movable';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import LayerSettings from './layer-settings';
import { layerLoader } from './utils';

import './layers-settings.css';

const setLayer = ( id ) => ( { id, use: 'fixed', default: true } );

const anySwapDefault = ( settings ) =>
	settings.some( ( s ) => s.use === 'swappable' && s.default );

const LayersSettings = ( {
	instanceId,
	attributes,
	setAttributes,
	loadingLayers,
	loadedLayers,
	closeModal,
} ) => {
	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	const loadLayer = layerLoader( loadedLayers );
	let widths = [];

	const [ allLayers, setAllLayers ] = useState([]);
	const [ filteredLayers, setFilteredLayers ] = useState([]);

	useEffect( () => {
		// TODO paginate this results. getEntityRecords accept 'page' parameter
		const allLayersData = select( 'core' ).getEntityRecords(
			'postType',
			'map-layer',
			{ per_page: -1, order: 'asc', orderby: 'menu_order' }
		);
		if ( ! allLayersData ) {
			setAllLayers( [] );
		} else {
			setAllLayers( allLayersData );
		}
	} );

	allLayers.sort( function ( a, b ) {
		if ( a.title.rendered.toLowerCase() < b.title.rendered.toLowerCase() ) {
			return -1;
		}
		if ( a.title.rendered.toLowerCase() > b.title.rendered.toLowerCase() ) {
			return 1;
		}
		return 0;
	} );

	const [ layerTypeFilter, setLayerTypeFilter ] = useState( null );
	const [ layerLegendFilter, setLayerLegendFilter ] = useState( null );
	const [ layerNameFilter, setLayerNameFilter ] = useState('');

	const layerTypeOptions = [
		{ label: 'Select a layer type', value: '' },
		{ label: 'Mapbox', value: 'mapbox' },
		{ label: 'Mapbox-tileset-vector', value: 'mapbox-tileset-vector' },
		{ label: 'Mapbox-tileset-raster', value: 'mapbox-tileset-raster' },
		{ label: 'Tilelayer', value: 'tilelayer' },
		{ label: 'MVT', value: 'mvt' },
	];

	const legendTypeOptions = [
		{ label: 'Select a legend type', value: '' },
		{ label: 'Barscale', value: 'barscale' },
		{ label: 'Simple-color', value: 'simple-color' },
		{ label: 'Icons', value: 'icons' },
		{ label: 'Circles', value: 'circles' },
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

	const decodeHtmlEntity = function ( str ) {
		return str.replace( /&#(\d+);/g, function ( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	function filterLayers() {
		const layers = []

		allLayers.map( ( layer ) => {
			if ( layerTypeFilter && layerTypeFilter !== layer.meta.type ) {
				return;
			}

			/* TODO: Make layers that don't use legend to not be shown when filtering by legend
			if ( layerLegendFilter && layerLegendFilter !== layer.meta.legend_type ) {
				return;
			}
			*/

			if ( layerNameFilter && ! layer.title.raw.toLowerCase().includes( layerNameFilter.toLowerCase() ) ) {
				return;
			}

			return layers.push( layer );
		} );
		setFilteredLayers( layers );
	}

	const onDragEnd = (result) => {
		if (!result.destination) {
			return;
		}

		if (result.destination.index === result.source.index) {
			return;
		}


		const resultLayers = arrayMove( attributes.layers, result.source.index, result.destination.index );

		// Set base layer always as fixed
		if(resultLayers.length) {
			resultLayers[0].use = "fixed";
		}

		// Reset fixed default param
		resultLayers.forEach(setting => {
			if(setting.use === "fixed") {
				setting.default = true;
			}
		})

		// console.log(resultLayers);
		// console.log(resultLayers);

		setLayers( resultLayers )
	}

	return (
		<Fragment>
			<div className="jeo-layers-library-controls">
				<div className="left">
					<div>
						<form onSubmit={ filterLayers } action="javascript:void(0);" style={ { display: "flex" }}>
							<TextControl
								placeholder="Enter keywords to search layers"
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
							{
								/* TODO: Make layers that don't use legend to not be shown when filtering by legend
									<SelectControl
										className="jeo-layers-library-filters"
										hideLabelFromVision={ true }
										label={ __( 'Legend type' ) }
										options={ legendTypeOptions }
										value={ layerLegendFilter }
										onChange={ ( value ) => {
											setLayerLegendFilter( value )
										} }
									/>
								*/
							}
							<Button
								className="jeo-layers-library-filters-button-filter"
								variant="primary"
								isLarge
								onClick={ filterLayers }
							>
								{ __( 'Filter', 'jeo' ) }
							</Button>
							<Button
								className="jeo-layers-library-filters-button-clear"
								variant="primary"
								isLarge
								onClick={ () => {
									setFilteredLayers([]);
									setLayerTypeFilter( '' );
									setLayerLegendFilter( '' );
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
					{ filteredLayers.map( ( layer, i ) => {
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
														Add to map
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
														Remove from map
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
			</div>
			<h2 className="selected-layers-title" >{ __( 'Selected layers', 'jeo' ) }</h2>
			{ loadingLayers && <Spinner /> }
			{ ! loadingLayers && ! attributes.layers.length && (
				<p className="jeo-layers-list">
					{ __( 'No layers have been added to this map.', 'jeo' ) }
				</p>
			) }

			{ ! loadingLayers && attributes.layers.length > 0 && (
				<DragDropContext onDragEnd={ onDragEnd }>
					<Droppable droppableId="list">
						{ provided => (
							<div className="jeo-layers-list" ref={ provided.innerRef } { ...provided.droppableProps }>
								{ attributes.layers.map((layer, index) => {
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
										//console.log("updateStyleLayers");

										setLayers(
											attributes.layers.map( ( settings ) =>
												settings.id === layer.id
													? { ...settings, style_layers: def }
													: settings
											)
										);
									}

									const switchUseStyle = ( def ) => {
										// let count = 0;
										// let limitCount = true;

										const currentLayer = attributes.layers.find((alayer)  => alayer.id === layer.id);

										// attributes.layers.forEach((layer) => {
										// 	if( layer.load_as_style ) {
										// 		count++;
										// 	}
										// });

										// if(count >= 1) {
										// 	if(!currentLayer.load_as_style) {
										// 		limitCount = confirm( __("Loading more than one style in a single map instance may cause unexpected behaviour.") );
										// 	}
										// }

										const currentJeoLayerProps = loadedLayers.find(layerPost => layerPost.id === layer.id);
										const layerType = window.JeoLayerTypes.getLayerType(
											currentJeoLayerProps.meta.type
										);

										// if(limitCount) {
											if(def) {
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
																: { ...settings, load_as_style: false, style_layers: [] }
														} )
													);

													// console.log(def);
												} );

												setLayers(
													attributes.layers.map( ( settings ) => {
														return settings.id === layer.id?
															{ ...settings, load_as_style: true, style_layers: [] }
															: { ...settings, load_as_style: false, style_layers: [] }
													} )
												);
											}
											// else {
											// 	setLayers(
											// 		attributes.layers.map( ( settings ) => {
											// 			return settings.id === layer.id?
											// 				{ ...settings, load_as_style: def, style_layers: [] }
											// 				: { ...settings, load_as_style: false, style_layers: [] }
											// 		} )
											// 	);
											// }
										// }
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
											__( 'Do you really want to delete this layer?', 'jeo' )
										);

										if ( confirmation ) {
											return setLayers(
												attributes.layers.filter(
													( settings ) => settings.id !== layer.id
												)
											);
										}
									};

									const loadedLayer = loadLayer( layer );

									if(!loadedLayer.layer) {
										return setLayers(
											attributes.layers.filter(
												( settings ) => settings.id !== loadedLayer.id
											)
										);
									}

									return <LayerSettings
										index={ index }
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
								} ) }
								{ provided.placeholder }
							</div>
						) }
					</Droppable>
				</DragDropContext>
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

export default withInstanceId( LayersSettings );
