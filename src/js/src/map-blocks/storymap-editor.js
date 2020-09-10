import { Button, Spinner, TextControl, TextareaControl, CheckboxControl, Dashicon, Panel, PanelBody,  } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect, select } from '@wordpress/data';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Map from './map';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import './map-editor.css';
import './storymap-editor.css';

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

	//Only for visual
	const [ slides, setSlides ] = useState( [ {
		content: null,
		selectedLayers: [],
	} ] );

	let rawLayers = [];
	if ( ! loadingMap && attributes.map_id ) {
		rawLayers = loadedMap.meta.layers;
	}
	const layersContent = [];
	rawLayers.map( ( rawLayer ) => {
		layersContent.push( select( 'core' ).getEntityRecord( 'postType', 'map-layer', rawLayer.id ) );
	} );
    
	return (
		<div className="jeo-mapblock">
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && ! loadingMap && (
				<Fragment>
					<div className="jeo-preview-area">
						<Map
							onStyleLoad={ ( map ) => {
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
							zoom={ [ loadedMap.meta.initial_zoom || mapDefaults.zoom ] }
							center={ [
								loadedMap.meta.center_lon || mapDefaults.lng,
								loadedMap.meta.center_lat || mapDefaults.lat,
							] }
							containerStyle={ { height: '70vh' } }
						>
							{ /* loadedLayers &&
								loadedMap.meta.layers.map( ( layer ) => {
									const layerOptions = loadedLayers.find(
										( { id } ) => id === layer.id
									);
									if ( layerOptions ) {
										return renderLayer( {
											layer: layerOptions.meta,
											instance: layer,
										} );
									}
								} ) */ }
						</Map>
					</div>
					<div className="storymap-controls">
						{ showStorySettings && (
							<div className="story-settings">
								<Button
									className="hide-button"
									onClick={ () => {
										setShowStorySettings(false);
									} }
								>
									<Dashicon icon="minus" />
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
									label={ __( 'Story brief description' ) }
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
										setShowStorySettings(true);
									} }
								>
									<Dashicon icon="plus" />
								</Button>
							</div>
						) }
						{ showSlidesSettings && (
							<div className="slides-settings">
								<Button
									className="hide-button"
									onClick={ () => {
										setShowSlidesSettings(false);
									} }
								>
									<Dashicon icon="minus" />
								</Button>
								<p className="section-title">{ __( 'Slides settings' ) }</p>
								{ slides.map( ( slide, index ) => {
									return(
										<div key={ slide.content } className="slide">
											<Panel className="slide-panel">
												<PanelBody title={ __( 'Slide' ) } initialOpen={ false }>
													<TextareaControl 
														className="content"
														label={ __( 'Content (allowed to use HTML tags)' ) }
														value={ slide.content }
														onChange={ ( newContent ) => {
															const oldSlides = slides;
															oldSlides[ index ].content = newContent;
															setSlides( oldSlides );
														} }
													/>
													<p>Layers</p>
													<div className="layers">
														{ layersContent.map( ( layer ) => {
															let layerButtonStyle = null;
															if ( slides[ index ].selectedLayers.includes( layer ) ) {
																layerButtonStyle = { background: 'black' }
															} else {
																layerButtonStyle = { background: 'grey' }
															}

															return(
																<Button
																	className="layer"
																	key={ layer.id }
																	onClick={ () => {
																		const oldSlides = slides;

																		if ( oldSlides[ index ].selectedLayers.includes( layer ) ) {
																		oldSlides[ index ].selectedLayers.pop( layer );
																			
																		} else {
																			oldSlides[ index ].selectedLayers.push( layer );
																		}

																		setSlides( oldSlides );
																	} }
																>
																	<p>{ decodeHtmlEntity( layer.title.rendered ) }</p>
																</Button>
															);
														} ) }
													</div>
												</PanelBody>
											</Panel>
										</div>
									);
								} ) }
								<Button
									className="add-button"
									onClick={ () => {
										setSlides( [ ...slides, {
											content: null,
											selectedLayers: [],
										} ] )
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
										setShowSlidesSettings(true);
									} }
								>
									<Dashicon icon="plus" />
								</Button>
							</div>
						) }
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
	loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer', { per_page: 100, order: 'asc', orderby: 'menu_order' } ),
	loadingLayers: select( 'core/data' ).isResolving(
		'core',
		'getEntityRecords',
		[ 'postType', 'map-layer' ]
	),
} ) );

export default compose( withInstanceId, applyWithSelect )( MapEditor );
