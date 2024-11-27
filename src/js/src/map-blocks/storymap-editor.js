import { CKEditor } from '@ckeditor/ckeditor5-react';
import { Button, CheckboxControl, Dashicon, Panel, PanelBody, Spinner } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect, select } from '@wordpress/data';
import { Fragment, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ClassicEditor from 'ckeditor5-build-full';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { List, arrayMove } from 'react-movable';

import { createUploadAdapter } from './cke5-image-upload';
import { baseColors } from './color-palettes';
import Map from './map';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import JeoGeoAutoComplete from '../posts-sidebar/geo-auto-complete';
import './map-editor.css';
import './storymap-editor.scss';

const { map_defaults: mapDefaults } = window.jeo_settings;

const percentageFormatter = new Intl.NumberFormat( 'en-US', {
	style: 'percent',
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
} );
function percentage ( number ) {
	return percentageFormatter.format( number );
}

for (const color of baseColors) {
	if (!color.label) {
		color.label = color.color
	}
	color.hasBorder = true
}

function createInitialViewState () {
	return {
		latitude: mapDefaults.lat,
		longitude: mapDefaults.lng,
		zoom: mapDefaults.zoom,
		bearing: 0,
		pitch: 0,
	};
}

const StoryMapEditor = ( {
	attributes,
	setAttributes,
	instanceId,
	loadedLayers,
	loadedMap,
	loadingMap,
	themeColors,
} ) => {
	const decodeHtmlEntity = function ( str ) {
		return str.replace( /&#(\d+);/g, function ( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	function removeTags(str) {
		if ((str===null) || (str===''))
			return false;
	   else
		str = str.toString();

	   return str.replace(/<[^>]*>/g, '');
	 }

	const reorder = ( list, startIndex, endIndex ) => {
		const result = Array.from( list );
		const [ removed ] = result.splice( startIndex, 1 );
		result.splice( endIndex, 0, removed );

		return result;
	};

	const onDragEndLayers = ( result ) => {
		// dropped outside the list
		if ( !result.destination ) {
		  return;
		}

		const newItems = reorder(
		  storymapLayers,
		  result.source.index,
		  result.destination.index
		);

		setStorymapLayers( newItems );
	}

	const flyTo = ( map, location ) => {

		map.flyTo({
			center: [
				parseFloat( location.lon ),
				parseFloat( location.lat ),
			]
		});
	}

	const [ showStorySettings, setShowStorySettings ] = useState( false );
	const [ showSlidesSettings, setShowSlidesSettings ] = useState( false );
	const [ selectedMap, setSelectedMap ] = useState( null );
	const [ currentSlideIndex, setCurrentSlideIndex ] = useState( 0 );
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ key, setKey ] = useState( 0 );
	const [ storymapLayers, setStorymapLayers ] = useState( [] );
	const [ viewState, setViewState ] = useState( createInitialViewState );

	useEffect( () => {
		const currentSlide = attributes.slides[ currentSlideIndex ];
		setViewState( {
			latitude: currentSlide?.latitude || mapDefaults.lat,
			longitude: currentSlide?.longitude || mapDefaults.lng,
			zoom: currentSlide?.zoom || mapDefaults.zoom,
			bearing: currentSlide?.bearing || 0,
			pitch: currentSlide?.pitch || 0,
		} );
	}, [ attributes.slides, currentSlideIndex, setViewState ] );

	useEffect( () => {
		// Post the already exsists
		if(attributes.slides && loadedMap && loadedLayers) {
			const newSlides = attributes.slides.map(slide => {
				slide.selectedLayers.forEach((selectedLayer, index) => {
					if (!loadedMap.meta.layers.some(layer => layer.id === selectedLayer.id ) || !loadedLayers.some(layer => layer.id === selectedLayer.id )) {
						slide.selectedLayers.splice(index, 1);
					}
				})

				const newOrder = [];

				loadedMap.meta.layers.forEach(mapLayer => {
					const foundLayer = slide.selectedLayers.find(layer => layer.id === mapLayer.id );
					if( foundLayer ) {
						newOrder.push(foundLayer);
					}
				})

				slide.selectedLayers = newOrder;

				return slide;
			})

			let navigateMapLayers = loadedLayers.filter(layer => loadedMap.meta.layers.some(mapLayer => mapLayer.id === layer.id ))
			const newLayers = []

			loadedMap.meta.layers.forEach(mapLayer => {
				const foundLayer = navigateMapLayers.find(layer => layer.id === mapLayer.id );
				if( foundLayer ) {
					newLayers.push(foundLayer);
				}
			})

			navigateMapLayers = newLayers;

			setAttributes( {
				...attributes,
				slides: newSlides,
				loadedLayers,
				navigateMapLayers,
			} );

			return;

		}

		setAttributes( {
			...attributes,
			loadedLayers,
			navigateMapLayers: loadedLayers,
		} );
	}, [ loadingMap, loadedLayers ] );

	const layersContent = useMemo(() => {
		let rawLayers = [];
		if ( attributes.map_id && loadedMap ) {
			rawLayers = loadedMap.meta.layers;
		}

		return rawLayers.map( ( rawLayer ) => {
			return select( 'core' ).getEntityRecord( 'postType', 'map-layer', rawLayer.id );
		} );
	}, [ loadedMap, loadedLayers, attributes.map_id ]);

	const editorConfig = useMemo( () => {
		const layerColors = layersContent.flatMap( ( layer ) => {
			return layer?.meta.legend_type_options?.colors?.map( ( color, i, colors ) => {
				const label = `${layer.title.raw} — ${color.label || percentage( i / ( colors.length - 1 ) )}`
				return { label, color: color.color, hasBorder: true };
			} ) || [];
		} );

		const colors = [
			...layerColors,
			...( themeColors || [] ).map( ( color ) => ( {
				label: color.name,
				color: color.color,
				hasBorder: true,
			} ) ),
			...baseColors,
		];

		return {
			toolbar: 'undo redo | bold italic underline fontColor fontBackgroundColor | heading bulletedList numberedList | link imageUpload htmlEmbed'.split( ' ' ),
			fontBackgroundColor: { colors, columns: 14 },
			fontColor: { colors, columns: 14 },
			image: { toolbar: [ 'imageTextAlternative' ] },
			mediaEmbed: { previewsInData: true },
		};
	}, [ layersContent, themeColors ] );

	useEffect( () => {
		if ( ! attributes.slides ) {
			setAttributes( {
				...attributes,
				slides: [
					{
						title: null,
						content: null,
						selectedLayers: [],
						latitude: mapDefaults.lat,
						longitude: mapDefaults.lng,
						zoom: mapDefaults.zoom,
						pitch: 0,
						bearing: 0,
					},
				],
				loadedLayers,
				navigateMapLayers: [],
			} );
		}
		const postID = wp.data.select( "core/editor" ).getCurrentPostId();
		setAttributes( { ...attributes, postID } );
	}, [] );

	if(attributes.map_id && !loadedMap) {
		return <div>Esse aqui é o loadedMap</div>;
	}

	let globalFontFamily = window.jeo_settings.jeo_typography_name;

	if ( ! globalFontFamily ) {
		globalFontFamily =  'sans-serif';
	}

	document.body.style.setProperty('--globalFontFamily', globalFontFamily);

	return (
		<div className="jeo-mapblock storymap">
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && ! loadingMap && (
				<Fragment>
					<div className="jeo-preview-area">
						<Map
							key={ key }
							controls="top-right"
							fullscreen={ loadedMap.meta.enable_fullscreen }
							style={ { height: '85vh' } }
							latitude={ viewState.latitude }
							longitude={ viewState.longitude }
							zoom={ viewState.zoom }
							bearing={ viewState.bearing }
							pitch={ viewState.pitch }
							onStyleData={ ( event ) => {
								const map = event.style?.map ?? null;
								if ( ! selectedMap && map ) {
									setSelectedMap( map );
									setStorymapLayers( layersContent );
								}
							} }
							onMove={ ( event ) => {
								setViewState( event.viewState );
							} }
						>
							{ attributes.slides[ currentSlideIndex ].selectedLayers.map(
								( layer ) => {
									if(attributes.navigateMapLayers) {
										const layerOptions = attributes.navigateMapLayers.find(
											( { id } ) => id === layer.id
										);
										if ( layerOptions ) {
											return renderLayer( {
												layer: layerOptions.meta,
												instance: layer,
											} );
										}
									}
								}
							) }
						</Map>
					</div>
					<div className="storymap-controls">
						{ showStorySettings && (
							<div className="story-settings">
								<div className="heading">
									<span className="section-title">{ __( 'Story settings', 'jeo' ) }</span>
									<Button
										className="hide-button"
										onClick={ () => {
											setShowStorySettings( false );
										} }
									>
										<Dashicon icon="arrow-down-alt2" />
									</Button>
								</div>
								<label className="input-label">{ __('Brief description', 'jeo' ) }</label>
								<CKEditor
									editor={ ClassicEditor }
									data={ attributes.description }
									config={ editorConfig }
									onReady={ ( editor ) => {
										editor.plugins.get( 'FileRepository' ).createUploadAdapter = createUploadAdapter;
									} }
									onChange={ ( event, editor ) =>  {
										setAttributes( {
											...attributes,
											description: editor.getData(),
										} );
									} }
								/>
								<CheckboxControl
									className="introduction-button"
									label={ __( 'Show story map introduction', 'jeo'  ) }
									checked={ attributes.hasIntroduction }
									onChange={ ( newHasIntroduction ) => {
										setAttributes( {
											...attributes,
											hasIntroduction: newHasIntroduction,
										} );
									} }
								/>
								<CheckboxControl
									className="navigate-button"
									label={ __( 'Use "Navigate to map" button', 'jeo'  ) }
									checked={ attributes.navigateButton }
									onChange={ ( newNavigateButton ) => {
										setAttributes( {
											...attributes,
											navigateButton: newNavigateButton,
										} );
									} }
								/>
							</div>
						) }
						{ ! showStorySettings && (
							<div className="story-settings-hide">
								<span className="section-title">{ __( 'Story settings', 'jeo'  ) }</span>
								<Button
									className="show-button"
									disabled={ !( loadedMap && loadedLayers ) }
									onClick={ () => {
										setShowStorySettings( true );
									} }
								>
									<Dashicon icon="arrow-up-alt2" />
								</Button>
							</div>
						) }
						{ showSlidesSettings && (
							<div className="slides-settings">
								<div className="heading">
									<span className="section-title">{ __( 'Slides settings', 'jeo' ) }</span>
									<Button
										className="hide-button"
										onClick={ () => {
											setShowSlidesSettings( false );
										} }
									>
										<Dashicon icon="arrow-down-alt2" />
									</Button>
								</div>
								<List
									values={ attributes.slides }
									onChange={ ( { oldIndex, newIndex } ) => {
										let newSlides = JSON.parse(JSON.stringify(attributes.slides));
										newSlides = arrayMove( newSlides, oldIndex, newIndex );

										setAttributes( {
											...attributes,
											slides: newSlides,
										} );
									} }
									renderList={ ( { children, props } ) => {
										return (
											<div className="slides-container" { ...props }>
												{ children }
											</div>
										);
									} }
									renderItem={ ( { value, isDragged, props } ) => {
										const slide = value;
										const index = attributes.slides.indexOf( value );
										return (
											<div key={ slide.content } className="slide" { ...props }>
												 <button
													data-movable-handle
													tabIndex={-1}
													>
													=
												</button>
												<Panel key={ key } className="slide-panel">
													<PanelBody
														title={ slide.title? removeTags( slide.title ).replace(/\&nbsp;/g, '') : __( 'Slide', 'jeo' ) + ' ' + ( index + 1 ) }
														initialOpen={
															(index === currentSlideIndex ? true : false) && !isDragged
														}
														onToggle={ (props) => {
															if(index !== currentSlideIndex) {
																setCurrentSlideIndex(index);
															}
														} }
													>
														<span className="input-label">{ __("Layers", "jeo") }</span>
														<DragDropContext onDragEnd={ onDragEndLayers }>
															<Droppable droppableId="droppable">
																{ ( provided, snapshot ) => (
																	<div
																		{ ...provided.droppableProps }
																		ref={ provided.innerRef }
																		className="layers"
																>
																		{ attributes.navigateMapLayers.map( ( item, index_ ) => (
																			<Draggable key={ `${ index_ }` } draggableId={ `${ index_ }` } index={ index_ }>
																				{ ( provided, snapshot ) => {
																					let layerButtonStyle = {
																						background: 'rgb(240, 240, 240)',
																					};

																					attributes.slides[ index ].selectedLayers.map(
																						( selectedLayer ) => {
																							if ( selectedLayer.id === item.id ) {
																								layerButtonStyle = {
																									background: 'rgb(200, 200, 200)',
																								};
																							}
																						}
																					);

																					if ( item ) {
																						return (
																							<div
																								ref={ provided.innerRef }
																								{ ...provided.draggableProps }
																								{ ...provided.dragHandleProps }
																							>
																								<Button

																									style={ layerButtonStyle }
																									className="layer"
																									key={ item.id }
																									onClick={ () => {
																										setCurrentSlideIndex( index );

																										const oldSlides = JSON.parse(JSON.stringify(attributes.slides));
																										let hasBeenRemoved = false;

																										oldSlides[ index ].selectedLayers.map(
																											( selectedLayer, indexOfLayer ) => {
																												if ( selectedLayer.id === item.id ) {
																													oldSlides[
																														index
																													].selectedLayers.splice(
																														indexOfLayer,
																														1
																													);
																													hasBeenRemoved = true;
																												}
																											}
																										);

																										if ( ! hasBeenRemoved ) {

																											let defaultOrder = Array(loadedMap.meta.layers.length).fill(null);
																											let itemPosition = false;

																											const findItemPostion = (item) => {
																												let itemPosition = -1;

																												loadedMap.meta.layers.forEach( (layer, index) => {
																													if( item.id === layer.id ) {
																														itemPosition = index;
																													}
																												})

																												return itemPosition;
																											}

																											oldSlides[ index ].selectedLayers.map( (layer) => {
																												const position = findItemPostion(layer);
																												if(position >= 0) {
																													defaultOrder[ position ] = layer;
																												}
																											})

																											itemPosition = findItemPostion(item)
																											defaultOrder[itemPosition] = item;

																											defaultOrder = defaultOrder.filter(slot => slot !== null);

																											oldSlides[ index ].selectedLayers = defaultOrder;
																										}

																										setKey(key + 1);

																										setAttributes( {
																											...attributes,
																											slides: oldSlides,
																										} );
																									} }
																								>
																									<span>
																										{ decodeHtmlEntity(
																											item.title.rendered
																										) }
																									</span>
																								</Button>
																							</div>
																						);
																					}

																					return null;
																				} }
																			</Draggable>
																	) ) }
																		{ provided.placeholder }
																	</div>
															) }
															</Droppable>
														</DragDropContext>
														<div style={ { display: 'flex' } }>
															{
																attributes.slides[ index ].latitude == mapDefaults.lat &&
																attributes.slides[ index ].longitude == mapDefaults.lng &&
																attributes.slides[ index ].zoom == mapDefaults.zoom &&
																attributes.slides[ index ].bearing == 0 &&
																attributes.slides[ index ].pitch == 0 && (
																	<Button
																		className="lock-location-button"
																		onClick={ () => {
																			setCurrentSlideIndex( index );
																			const latitude = selectedMap.getCenter().lat;
																			const longitude = selectedMap.getCenter().lng;
																			const zoom =
																				Math.round( selectedMap.getZoom() * 10 ) /
																				10;
																			const pitch = selectedMap.getPitch();
																			const bearing = selectedMap.getBearing();

																			const newSlides = [ ...attributes.slides ];
																			newSlides[ index ].latitude = latitude;
																			newSlides[ index ].longitude = longitude;
																			newSlides[ index ].zoom = zoom;
																			newSlides[ index ].pitch = pitch;
																			newSlides[ index ].bearing = bearing;

																			setAttributes( {
																				...attributes,
																				slides: newSlides,
																			} );
																		} }
																	>
																		<div className="flex-center">
																			<Dashicon icon="unlock" />
																			<span>{ __( 'Lock current spot', 'jeo' ) }</span>
																		</div>
																	</Button>
																)
															}
															{
																! ( attributes.slides[ index ].latitude == mapDefaults.lat &&
																attributes.slides[ index ].longitude == mapDefaults.lng &&
																attributes.slides[ index ].zoom == mapDefaults.zoom &&
																attributes.slides[ index ].bearing == 0 &&
																attributes.slides[ index ].pitch == 0 ) && (
																	<Button
																		className="lock-location-button"
																		onClick={ () => {
																			setCurrentSlideIndex( index );
																			const latitude = selectedMap.getCenter().lat;
																			const longitude = selectedMap.getCenter().lng;
																			const zoom =
																				Math.round( selectedMap.getZoom() * 10 ) /
																				10;
																			const pitch = selectedMap.getPitch();
																			const bearing = selectedMap.getBearing();

																			const newSlides = [ ...attributes.slides ];
																			newSlides[ index ].latitude = latitude;
																			newSlides[ index ].longitude = longitude;
																			newSlides[ index ].zoom = zoom;
																			newSlides[ index ].pitch = pitch;
																			newSlides[ index ].bearing = bearing;

																			setAttributes( {
																				...attributes,
																				slides: newSlides,
																			} );
																		} }
																	>
																		<div>
																			<Dashicon icon="lock" />
																			<span>{ __( 'Lock current spot', 'jeo' ) }</span>
																		</div>
																	</Button>
																)
															}
															{ /*
															<div className="tooltip">
																<p>lalala</p>
															</div>
															*/ }
														</div>
														<Button
															className="preview-button"
															onClick={ () => {
																setCurrentSlideIndex( index );
																setKey( key + 1 );
															} }
														>
															<div className="flex-center">
																<Dashicon icon="visibility" />
																<span>{ __( 'Preview', 'jeo'  ) }</span>
															</div>
														</Button>

														<span className="input-label">{ __( 'Title', 'jeo' ) }</span>
														<CKEditor
															atributo="meuatributo"
															editor={ ClassicEditor }
															data={ slide.title }
															config={ editorConfig }
															onReady={ ( editor ) => {
																editor.plugins.get( 'FileRepository' ).createUploadAdapter = createUploadAdapter;
															} }
															onChange={ ( event, editor ) => {
																// Set role 'button' to editor element so it isn't affected by drag and drop events
																editor.ui.getEditableElement().setAttribute('role', 'button')

																setCurrentSlideIndex( index );

																const oldSlides = [ ...attributes.slides ];
																oldSlides[ index ].title = editor.getData();

																setAttributes( {
																	...attributes,
																	slides: oldSlides,
																} );
															} }
														/>
														<span className="input-label">{ __(
																'Content', 'jeo'
														) }</span>
														<CKEditor
															editor={ ClassicEditor }
															data={ slide.content }
															config={ editorConfig }
															onReady={ ( editor ) => {
																editor.plugins.get( 'FileRepository' ).createUploadAdapter = createUploadAdapter;
															} }
															onChange={ ( event, editor ) => {
																// Set role 'button' to editor element so it isn't affected by drag and drop events
																editor.ui.getEditableElement().setAttribute('role', 'button')

																setCurrentSlideIndex( index );

																const oldSlides = [ ...attributes.slides ];
																oldSlides[ index ].content = editor.getData();

																setAttributes( {
																	...attributes,
																	slides: oldSlides,
																} );
															} }
														/>
														<Button
															className="remove-button"
															onClick={ () => {
																if ( attributes.slides.length <= 1 ) {
																	alert( __( 'The minimum number of slides is 1.', 'jeo' ) );

																	return;
																}

																const confirmation = confirm(
																	__( 'Do you really want to remove this slide?', 'jeo' )
																);
																if (
																	confirmation &&
																	attributes.slides.length >= 2
																) {
																	setCurrentSlideIndex( 0 );

																	const oldSlides = [ ...attributes.slides ];
																	oldSlides.splice( index, 1 );
																	setAttributes( {
																		...attributes,
																		slides: oldSlides,
																	} );
																}
															} }
														>
															<div className="flex-center">
																<Dashicon icon="trash" />
																<span>{ __( 'Remove', 'jeo' ) }</span>
															</div>
														</Button>
													</PanelBody>
												</Panel>
											</div>
										);
									} }
								/>
								<Button
									className="add-button"
									onClick={ () => {
										let lastSlide = attributes.slides.slice(-1);
										setAttributes( {
											...attributes,
											slides: [
												...attributes.slides,
												{
													title: null,
													content: null,
													selectedLayers: lastSlide[0].selectedLayers,
													latitude: lastSlide[0].latitude,
													longitude: lastSlide[0].longitude,
													zoom: lastSlide[0].zoom,
													pitch: lastSlide[0].pitch,
													bearing: lastSlide[0].bearing,
												},
											],
										} );
										setCurrentSlideIndex( attributes.slides.length );
										setKey( key + 1 );
									} }
								>
									<div className="flex-center">
										<Dashicon icon="plus" />
										<span>{ __( 'Add', 'jeo' ) }</span>
									</div>
								</Button>
							</div>
						) }
						{ ! showSlidesSettings && (
							<div className="slides-settings-hide">
								<span className="section-title">{ __( 'Slides settings', 'jeo' ) }</span>
								<Button
									className="show-button"
									disabled={ !( loadedMap && loadedLayers ) }
									onClick={ () => {
										setShowSlidesSettings( true );
									} }
								>
									<Dashicon icon="arrow-up-alt2" />
								</Button>
							</div>
						) }
						<div className="current-slide-box">
							<div>
								<strong>
								{ __('Current slide:', 'jeo' ) + ' ' }{ attributes.slides[ currentSlideIndex ].title ? removeTags( attributes.slides[ currentSlideIndex ].title ).replace(/\&nbsp;/g, '') : __( 'Slide', 'jeo' ) + ' ' + ( currentSlideIndex + 1 ) }
								</strong>
							</div>
						</div>
						<JeoGeoAutoComplete
							className="search-adress-input"
							onSelect={ ( location ) => {
								flyTo( selectedMap, location );

								/*
								selectedMap.flyTo( {
									center: [
										parseFloat( location.lat ),
										parseFloat( location.lon ),
									],
									zoom: parseFloat( attributes.slides[ currentSlideIndex ].zoom ),
									bearing: parseFloat(
										attributes.slides[ currentSlideIndex ].bearing
									),
									pitch: parseFloat(
										attributes.slides[ currentSlideIndex ].pitch
									),
									essential: true,
								} );
								*/
							} }
							value={ searchValue }
							onChange={ ( newSearchValue ) => {
								setSearchValue( newSearchValue );
							} }
						/>
					</div>
					<div className="jeo-preview-controls">
						<span>
							<strong>
								{ __("Map:", "jeo") + ' ' }
								{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong>
						</span>
					</div>
				</Fragment>
			) }
			{ ! attributes.map_id && (
				<Fragment>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library', 'jeo' ) + ':' }
					</label>
					<JeoAutosuggest
						inputProps={ {
							placeholder: __( 'Type a map name', 'jeo' ),
							id: `jeo-map-autosuggest-${ instanceId }`,
						} }
						postType="map"
						onSuggestionSelected={ ( e, { suggestion } ) =>
							setAttributes( {
								...attributes,
								map_id: suggestion.id,
								slides: [
									{
										title: null,
										content: null,
										selectedLayers: [],
										latitude: mapDefaults.lat,
										longitude: mapDefaults.lng,
										zoom: mapDefaults.zoom,
										pitch: 0,
										bearing: 0,
									},
								],
								loadedLayers,
								navigateMapLayers: [],
							} )
						}
					/>
					{ attributes.previous_map && (
						<Button
							className="select-another-map"
							isLarge
							variant="primary"
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel', 'jeo' ) }
						</Button>
					) }
				</Fragment>
			) }
		</div>
	);
};

const applyWithSelect = withSelect( ( select, { attributes } ) => ( {
	loadedMap:
		attributes.map_id &&
		select( 'core' ).getEntityRecord( 'postType', 'map', attributes.map_id ),
	loadingMap:
		attributes.map_id &&
		select( 'core/data' ).isResolving( 'core', 'getEntityRecord', [
			'postType',
			'map',
			attributes.map_id,
		] ),
	loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer', { per_page: -1, order: 'asc', orderby: 'title' } ),
	loadingLayers: select( 'core/data' ).isResolving(
		'core',
		'getEntityRecords',
		[ 'postType', 'map-layer' ]
	),
	themeColors: select( 'core/editor' ).getEditorSettings().colors,
} ) );

export default compose( withInstanceId, applyWithSelect )( StoryMapEditor );
