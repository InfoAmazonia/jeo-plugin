import {
	Button,
	Spinner,
	TextControl,
	TextareaControl,
	CheckboxControl,
	Dashicon,
	Panel,
	PanelBody,
	Modal,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect, select } from '@wordpress/data';
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Map from './map';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import './map-editor.css';
import './storymap-editor.css';
import { List, arrayMove } from 'react-movable';
import JeoGeoAutoComplete from '../posts-sidebar/geo-auto-complete';

const { map_defaults: mapDefaults } = window.jeo_settings;

const MapEditor = ( {
	attributes,
	setAttributes,
	instanceId,
	loadedLayers,
	loadedMap,
	loadingMap,
} ) => {
	const decodeHtmlEntity = function ( str ) {
		return str.replace( /&#(\d+);/g, function ( match, dec ) {
			return String.fromCharCode( dec );
		} );
	};

	const [ showStorySettings, setShowStorySettings ] = useState( false );
	const [ showSlidesSettings, setShowSlidesSettings ] = useState( false );
	const [ selectedMap, setSelectedMap ] = useState( null );
	const [ currentSlideIndex, setCurrentSlideIndex ] = useState( 0 );
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ key, setKey ] = useState( 0 );

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
			} );
		}
	} );

	let rawLayers = [];
	if ( ! loadingMap && attributes.map_id ) {
		rawLayers = loadedMap.meta.layers;
	}
	const layersContent = [];
	rawLayers.map( ( rawLayer ) => {
		return layersContent.push(
			select( 'core' ).getEntityRecord( 'postType', 'map-layer', rawLayer.id )
		);
	} );

	return (
		<div className="jeo-mapblock">
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && ! loadingMap && (
				<Fragment>
					<div className="jeo-preview-area">
						<Map
							key={ key }
							onStyleLoad={ ( map ) => {
								setSelectedMap( map );
								setAttributes( { ...attributes, loadedLayers } );

								map.addControl(
									new mapboxgl.NavigationControl( { showCompass: false } ),
									'top-right'
								);

								if ( loadedMap.meta.enable_fullscreen ) {
									map.addControl(
										new mapboxgl.FullscreenControl(),
										'top-left'
									);
								}

								if ( loadedMap.meta.disable_scroll_zoom ) {
									map.scrollZoom.disable();
								}

								if ( loadedMap.meta.disable_drag_pan ) {
									map.dragPan.disable();
									map.touchZoomRotate.disable();
								}

								if ( loadedMap.meta.disable_drag_rotate ) {
									map.dragRotate.disable();
								}
							} }
							style="mapbox://styles/mapbox/streets-v11"
							zoom={ [
								attributes.slides[ currentSlideIndex ].zoom || mapDefaults.zoom,
							] }
							center={ [
								attributes.slides[ currentSlideIndex ].longitude ||
									mapDefaults.lng,
								attributes.slides[ currentSlideIndex ].latitude ||
									mapDefaults.lat,
							] }
							bearing={
								[ attributes.slides[ currentSlideIndex ].bearing ] || 0
							}
							pitch={ [ attributes.slides[ currentSlideIndex ].pitch ] || 0 }
							containerStyle={ { height: '70vh' } }
						>
							{ attributes.slides[ currentSlideIndex ].selectedLayers.map(
								( layer ) => {
									const layerOptions = loadedLayers.find(
										( { id } ) => id === layer.id
									);
									if ( layerOptions ) {
										return renderLayer( {
											layer: layerOptions.meta,
											instance: layer,
										} );
									}
								}
							) }
						</Map>
					</div>
					<div className="storymap-controls">
						{ showStorySettings && (
							<div className="story-settings">
								<Button
									className="hide-button"
									onClick={ () => {
										setShowStorySettings( false );
									} }
								>
									<Dashicon icon="hidden" />
								</Button>
								<p className="section-title">{ __( 'Story settings' ) }</p>
								<TextControl
									className="title"
									label={ __( 'Title' ) }
									value={ attributes.title }
									onChange={ ( newTitle ) => {
										setAttributes( {
											...attributes,
											title: newTitle,
										} );
									} }
								/>
								<TextareaControl
									className="description"
									label={ __(
										'Story brief description (allowed to use HTML tags)'
									) }
									value={ attributes.description }
									onChange={ ( newDescription ) => {
										setAttributes( {
											...attributes,
											description: newDescription,
										} );
									} }
								/>
								<CheckboxControl
									className="introduction-button"
									label={ __( 'Storymap Introduction' ) }
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
									label={ __( 'Navigate map button' ) }
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
								<p className="section-title">{ __( 'Story settings' ) }</p>
								<Button
									className="show-button"
									onClick={ () => {
										setShowStorySettings( true );
									} }
								>
									<Dashicon icon="visibility" />
								</Button>
							</div>
						) }
						{ showSlidesSettings && (
							<div className="slides-settings">
								<Button
									className="hide-button"
									onClick={ () => {
										setShowSlidesSettings( false );
									} }
								>
									<Dashicon icon="hidden" />
								</Button>
								<p className="section-title">{ __( 'Slides settings' ) }</p>
								<List
									values={ attributes.slides }
									onChange={ ( { oldIndex, newIndex } ) => {
										const newSLides = [ ...attributes.slides ];
										setAttributes( {
											...attributes,
											slides: arrayMove( newSLides, oldIndex, newIndex ),
										} );
									} }
									renderList={ ( { children, props } ) => {
										return (
											<div className="slides-container" { ...props }>
												{ children }
											</div>
										);
									} }
									renderItem={ ( { value, props } ) => {
										const slide = value;
										const index = attributes.slides.indexOf( value );
										return (
											<div key={ slide.content } className="slide" { ...props }>
												<Panel key={ key } className="slide-panel">
													<PanelBody
														title={ __( 'Slide ' ) + ( index + 1 ) }
														initialOpen={
															index === currentSlideIndex ? true : false
														}
													>
														<TextareaControl
															autoFocus={
																index === currentSlideIndex ? true : false
															}
															onFocus={ ( e ) => {
																//Move cursor to the end of the input
																const val = e.target.value;
																e.target.value = '';
																e.target.value = val;
															} }
															className="content"
															label={ __( 'Title' ) }
															value={ slide.title }
															onChange={ ( newTitle ) => {
																setCurrentSlideIndex( index );

																const oldSlides = [ ...attributes.slides ];
																oldSlides[ index ].title = newTitle;

																setAttributes( {
																	...attributes,
																	slides: oldSlides,
																} );
															} }
														/>
														<TextareaControl
															autoFocus={
																index === currentSlideIndex ? true : false
															}
															onFocus={ ( e ) => {
																//Move cursor to the end of the input
																const val = e.target.value;
																e.target.value = '';
																e.target.value = val;
															} }
															className="content"
															label={ __(
																'Content (allowed to use HTML tags)'
															) }
															value={ slide.content }
															onChange={ ( newContent ) => {
																setCurrentSlideIndex( index );

																const oldSlides = [ ...attributes.slides ];
																oldSlides[ index ].content = newContent;

																setAttributes( {
																	...attributes,
																	slides: oldSlides,
																} );
															} }
														/>
														<p>Layers</p>
														<div className="layers">
															{ layersContent.map( ( layer, layerIndex ) => {
																let layerButtonStyle = {
																	background: 'rgb(240, 240, 240)',
																};

																attributes.slides[ index ].selectedLayers.map(
																	( selectedLayer ) => {
																		if ( selectedLayer.id === layer.id ) {
																			layerButtonStyle = {
																				background: 'rgb(200, 200, 200)',
																			};
																		}
																	}
																);

																return (
																	<Button
																		style={ layerButtonStyle }
																		className="layer"
																		key={ layer.id }
																		onClick={ () => {
																			setCurrentSlideIndex( index );
																			const oldSlides = [
																				...attributes.slides,
																			];
																			let hasBeenRemoved = false;

																			oldSlides[ index ].selectedLayers.map(
																				( selectedLayer, indexOfLayer ) => {
																					if ( selectedLayer.id === layer.id ) {
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
																				oldSlides[ index ].selectedLayers.push(
																					layer
																				);
																			}
																			setAttributes( {
																				...attributes,
																				slides: oldSlides,
																			} );
																		} }
																	>
																		<p>
																			{ decodeHtmlEntity(
																				layer.title.rendered
																			) }
																		</p>
																	</Button>
																);
															} ) }
														</div>
														{ /*
														{ attributes.slides[ index ].selectedLayers.length < 1 && (
															<Button
																disabled
																className="lock-location-button"
															>
																<div>
																	<Dashicon icon="lock" />
																	<p>{ __( 'Lock current spot' ) }</p>
																</div>
															</Button>
														) } */ }
														{ true && (
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
																	<p>{ __( 'Lock current spot' ) }</p>
																</div>
															</Button>
														) }
														<Button
															className="preview-button"
															onClick={ () => {
																setCurrentSlideIndex( index );
																setKey( key + 1 );
															} }
														>
															<div>
																<Dashicon icon="visibility" />
																<p>{ __( 'Preview' ) }</p>
															</div>
														</Button>
														<Button
															className="remove-button"
															onClick={ () => {
																if ( attributes.slides.length <= 1 ) {
																	alert( 'The minimum number of slides is 1.' );

																	return;
																}

																const confirmation = confirm(
																	__(
																		'Do you really want to remove this slide?'
																	)
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
															<div>
																<Dashicon icon="trash" />
																<p>{ __( 'Remove' ) }</p>
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
										setAttributes( {
											...attributes,
											slides: [
												...attributes.slides,
												{
													title: null,
													content: null,
													selectedLayers: [],
													latitude: window.jeo_settings.map_defaults.lat,
													longitude: window.jeo_settings.map_defaults.lng,
													zoom: window.jeo_settings.map_defaults.zoom,
													pitch: 0,
													bearing: 0,
												},
											],
										} );
										setCurrentSlideIndex( attributes.slides.length );
										setKey( key + 1 );
									} }
								>
									<div>
										<Dashicon icon="plus" />
										<p>{ __( 'Add' ) }</p>
									</div>
								</Button>
							</div>
						) }
						{ ! showSlidesSettings && (
							<div className="slides-settings-hide">
								<p className="section-title">{ __( 'Slides settings' ) }</p>
								<Button
									className="show-button"
									onClick={ () => {
										setShowSlidesSettings( true );
									} }
								>
									<Dashicon icon="visibility" />
								</Button>
							</div>
						) }
						<div className="current-slide-box">
							<div>
								<strong>
									{ __( 'Current slide: ' + ( currentSlideIndex + 1 ) ) }
								</strong>
							</div>
						</div>
						<JeoGeoAutoComplete
							className="search-adress-input"
							onSelect={ ( location ) => {
								selectedMap.flyTo( {
									center: [
										parseInt( location.lon ),
										parseInt( location.lat ),
									],
									zoom: parseInt( attributes.slides[ currentSlideIndex ].zoom ),
									bearing: parseInt(
										attributes.slides[ currentSlideIndex ].bearing
									),
									pitch: parseInt(
										attributes.slides[ currentSlideIndex ].pitch
									),
									essential: true,
								} );
							} }
							value={ searchValue }
							onChange={ ( newSearchValue ) => {
								setSearchValue( newSearchValue );
							} }
						/>
					</div>
					<div className="jeo-preview-controls">
						<p>
							<strong>{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong>
						</p>
						<Button
							className="select-another-map"
							isLink
							isLarge
							onClick={ () => {
								const previous_map = attributes.map_id;
								setAttributes( {
									...attributes,
									map_id: undefined,
									previous_map,
								} );
							} }
						>
							<em>{ __( '(Select another map)' ) }</em>
						</Button>
					</div>
				</Fragment>
			) }
			{ ! attributes.map_id && (
				<Fragment>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library' ) + ':' }
					</label>
					<JeoAutosuggest
						inputProps={ {
							placeholder: __( 'Type a map name', 'jeo' ),
							id: `jeo-map-autosuggest-${ instanceId }`,
						} }
						postType="map"
						onSuggestionSelected={ ( e, { suggestion } ) =>
							setAttributes( { ...attributes, map_id: suggestion.id } )
						}
					/>
					{ attributes.previous_map && (
						<Button
							className="select-another-map"
							isLarge
							isPrimary
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel' ) }
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
	loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer', {
		per_page: 100,
		order: 'asc',
		orderby: 'menu_order',
	} ),
	loadingLayers: select( 'core/data' ).isResolving(
		'core',
		'getEntityRecords',
		[ 'postType', 'map-layer' ]
	),
} ) );

export default compose( withInstanceId, applyWithSelect )( MapEditor );
