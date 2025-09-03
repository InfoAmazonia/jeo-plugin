import { Button, Card, CardBody, SelectControl, Spinner, TextControl } from '@wordpress/components';
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

import { arrayMove } from 'react-movable';
import { DragDropContext, Droppable } from "react-beautiful-dnd";

import LayerSettings from './layer-settings';
import { loadLayer } from './utils';

import './layers-settings.css';

const setLayer = ( id ) => ( { id, use: 'fixed', default: true } );

const anySwapDefault = ( settings ) =>
	settings.some( ( s ) => s.use === 'swappable' && s.default );

export default function LayersSettings ( { attributes, setAttributes, loadedLayers, loadingLayers, closeModal } ) {
	const setLayers = ( layers ) => setAttributes( { ...attributes, layers } );
	let widths = [];

	const [ layerTypeFilter, setLayerTypeFilter ] = useState( null );
	const [ layerNameFilter, setLayerNameFilter ] = useState('');

	const searchedLayers = useSelect((select) => {
		if ( ! layerNameFilter && ! layerTypeFilter ) {
			return [];
		}

		return select( 'core' ).getEntityRecords( 'postType', 'map-layer', {
			per_page: -1,
			order: 'asc',
			orderby: 'title',
			layer_name: layerNameFilter,
			layer_type: layerTypeFilter ?? undefined,
		} ) ?? [];
	}, [layerNameFilter, layerTypeFilter]);

	const layerTypeOptions = [
		{ label: 'Select a layer type', value: '' },
		{ label: 'Mapbox', value: 'mapbox' },
		{ label: 'Mapbox-tileset-vector', value: 'mapbox-tileset-vector' },
		{ label: 'Mapbox-tileset-raster', value: 'mapbox-tileset-raster' },
		{ label: 'Tilelayer', value: 'tilelayer' },
		{ label: 'MVT', value: 'mvt' },
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

		setLayers( resultLayers );
	}

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
			</div>
			<h2 className="selected-layers-title" >{ __( 'Selected layers', 'jeo' ) }</h2>
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
										setLayers(
											attributes.layers.map( ( settings ) =>
												settings.id === layer.id
													? { ...settings, style_layers: def }
													: settings
											)
										);
									}

									const switchUseStyle = ( def ) => {
										const currentJeoLayerProps = loadedLayers.find(layerPost => layerPost.id === layer.id);
										const layerType = window.JeoLayerTypes.getLayerType(
											currentJeoLayerProps.meta.type
										);

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
											} );

											setLayers(
												attributes.layers.map( ( settings ) => {
													return settings.id === layer.id?
														{ ...settings, load_as_style: true, style_layers: [] }
														: { ...settings, load_as_style: false, style_layers: [] }
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

									const loadedLayer = loadLayer( loadedLayers, layer );

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
