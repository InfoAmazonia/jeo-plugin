import React, { Component } from 'react';
import { useFetch } from 'react-async';

import { renderLayer } from './map-preview-layer';
import mapboxgl from 'mapbox-gl';
import scrollama from 'scrollama';
import Map from './map';

import './storymap-display.css';

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty'
}

let config = null;

let lastChapter;

const { map_defaults: mapDefaults } = window.jeo_settings;

const scroller = scrollama();


const cleanPage = () => {
	for( const element of document.querySelector( '#page' ).children ) {
		if ( element.className != 'site-content' && element.tagName != 'HEADER' ) {
			element.style.display = 'none';
		}
	}

	for ( const element of document.querySelector( '#main' ).children ) {
		if ( ! element.classList.contains( 'post' ) && ! element.classList.contains( 'page' ) ) {
			element.style.display = 'none';
		} else {
			for ( const element_ of element.children ) {
				if ( element_.className != 'entry-content' ) {
					element_.style.display = 'none';						
				}
			}
		}
	}
}

class StoryMapDisplay extends Component {
    constructor(props) {
		super(props);

		const slides = [];
		props.slides.map( ( slide, index ) => {
			slides.push( {
				id: index,
				title: slide.title || '',
				image: '',
				description: slide.content || '',
				location: {
					center: [ slide.longitude || mapDefaults.lng, slide.latitude || mapDefaults.lat ],
					zoom: slide.zoom || mapDefaults.zoom,
					pitch: slide.pitch || 0,
					bearing: slide.bearing || 0,
				},
				selectedLayers: slide.selectedLayers || [],
			} );

			if ( index == props.slides.length -1 ) {
				const lastSlide = { ...slides[ slides.length - 1 ] };
				lastSlide.selectedLayers = this.props.navigateMapLayers;
				lastSlide.id += 1;
				lastSlide.location = {
					center: [ mapDefaults.lng, mapDefaults.lat ],
					zoom: mapDefaults.zoom,
					pitch: 0,
					bearing: 0,
				};
				slides.push( lastSlide );
			}
		} );


		config = {
			style: 'mapbox://styles/mapbox/streets-v11',
			accessToken: window.jeo_settings.mapbox_key,
			showMarkers: false,
			theme: 'light',
			alignment: 'left',
			subtitle: props.description || '',
			byline: '',
			footer: '',
			chapters: slides,
		}

		let slidesDisplay;
		let mapBrightness;

		if ( this.props.hasIntroduction ) {
			slidesDisplay = 'none';
			mapBrightness = 0.5;
		} else {
			slidesDisplay = 'block';
			mapBrightness = 1;
		}

        this.state = {
			currentChapter: config.chapters[0],
			map: null,
			isNavigating: false,
			slidesDisplay,
			mapBrightness,
			postData: null,
			hiddenLayersIds: [],
        };
    }

    componentDidMount() {
		cleanPage();
        mapboxgl.accessToken = config.accessToken;
		window.addEventListener('resize', scroller.resize);
		document.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;

		let URL;

		for ( const element of document.querySelector( '#main' ).children ) {
			if ( element.classList.contains( 'post' ) ) {
				URL = `${ window.jeoMapVars.jsonUrl }posts/${ this.props.postID }`;
				
			} else if ( element.classList.contains( 'page' ) ) {
				URL = `${ window.jeoMapVars.jsonUrl }pages/${ this.props.postID }`;
			}

			
		}
	
	
		fetch( URL )
			.then( ( response ) => {
				return response.json();
			} )
			.then( ( json ) => this.setState( { ...this.state, postData: json } ) );

	}
	
	componentDidUpdate() {
		document.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;
	}		


    render() {
		const mapStart = config.chapters[0].location;
        const theme = config.theme;
		const currentChapterID = this.state.currentChapter.id;

        return(
			<>
				{ ! this.state.isNavigating && (
					<div>
						<Map
							zoom={ [ mapDefaults.zoom ] }
							containerStyle={ { height: '100vh', width: '100vw' } }
							pitch={ [ 0 ] }
							bearing={ [ 0 ] }
							style={ config.style }
							center={ [ mapDefaults.lng, mapDefaults.lat ] }
							onStyleDataLoading={ ( map ) => {
								this.setState( { ...this.state, map } );
							} }
							onStyleLoad={ ( map ) => {
								map.scrollZoom.disable();
								map.dragPan.disable();
								map.touchZoomRotate.disable();
								map.dragRotate.disable();

								const setState = this.setState.bind(this);
								const marker = new mapboxgl.Marker();
								if (config.showMarkers) {
									marker.setLngLat(mapStart.center).addTo(map);
								}

								scroller
									.setup({
										step: '.step',
										offset: 0.5,
										progress: true
									})
									.onStepEnter(response => {
										if ( response.index == config.chapters.length - 1 ) {
											setState({ ...this.state, mapBrightness: 0.5 })
										}

										const chapter = config.chapters.find( ( chap, index ) => {
											if ( response.element.id == config.chapters.length && index == config.chapters.length - 1 ) {
												return true
											}

											return chap.id == response.element.id
										});

										setState({ ...this.state, currentChapter: chapter });
										map.flyTo(chapter.location);

										if (config.showMarkers) {
											marker.setLngLat(chapter.location.center);
										}
										
								})
							} }
						>
							{ this.state.currentChapter.selectedLayers.map(
								( layer ) => {
									const layerOptions = this.props.loadedLayers.find(
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
							{
								this.props.navigateMapLayers.map(
									( layer ) => {
										if ( this.state.slidesDisplay == 'block' ) {
											return;
										}

										const layerOptions = this.props.loadedLayers.find(
											( { id } ) => id === layer.id
										);
										if ( layerOptions ) {
											return renderLayer( {
												layer: layerOptions.meta,
												instance: layer,
											} );
										}
									}
								)
							}
						</Map>
						<div id="story">
							{ this.props.hasIntroduction && this.state.slidesDisplay == 'none' &&
								<div id="header" className={ theme }>
									{ this.state.postData && (
										<>
											<p className="storymap-page-title">{ this.state.postData.title.rendered }</p>
											<div className="post-info">
												<p className="author">Authors</p>
												<p className="date">{ this.state.postData.date }</p>
											</div>
										</>
									) }
									{ config.subtitle &&
										<p className="storymap-description">{ config.subtitle }</p>
									}

									<button
										className="storymap-start-button"
										onClick={ () => {
											this.setState( { ...this.state, slidesDisplay: 'block', mapBrightness: 1 } );
											window.scrollTo(0, 0);
										} }
									>
										START
									</button>
									{ this.props.navigateButton && (
										<>
											<p
												className="skip-intro-link"
												onClick={ () => {
													this.setState( { ...this.state, isNavigating: true, mapBrightness: 1 } );
												} }
											>
												skip intro
											</p>
											<img
												alt="icon"
												className="skip-intro-icon"
												onClick={ () => {
													this.setState( { ...this.state, slidesDisplay: 'block', mapBrightness: 1 } );
													window.scrollTo(0, 0);
												} }
												src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUwIDUwOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgNTAgNTAiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxnIGlkPSJMYXllcl8xXzFfIj48cG9seWdvbiBwb2ludHM9IjQ4LjcwNywxOS4zNTMgNDcuMjkzLDE3Ljk0IDI1LDQwLjIzMiAyLjcwNywxNy45NCAxLjI5MywxOS4zNTMgMjUsNDMuMDYgICIvPjxwb2x5Z29uIHBvaW50cz0iNDguNzA3LDguMzUzIDQ3LjI5Myw2Ljk0IDI1LDI5LjIzMiAyLjcwNyw2Ljk0IDEuMjkzLDguMzUzIDI1LDMyLjA2ICAiLz48L2c+PC9zdmc+"
											>
											</img>
										</>
									) }
								</div>
							}
							{ ! this.state.inHeader && (
								<>
									<div id="features" style={ { display: this.state.slidesDisplay } } className={ alignments[config.alignment] }>
										{
											config.chapters.map( ( chapter, index ) => {
												let isLastChapter = false;

												// If is the last chapter:
												if( config.chapters.indexOf( this.state.currentChapter ) == config.chapters.length -1 && this.state.currentChapter == chapter ) {
													isLastChapter = true;
												}

												lastChapter = { ...chapter };
												lastChapter.selectedLayers = this.props.navigateMapLayers
												lastChapter.id = chapter.id
												
												if ( index == config.chapters.length - 1 ) {
													return(
														<Chapter
															index={ config.chapters.length }
															props={ this.props }
															onClickFunction={ () => {
																this.setState( { ...this.state, isNavigating: true, mapBrightness: 1 } );
															} }
															isLastChapter={ true }
															{ ...lastChapter }
															theme={ theme }
															currentChapterID={ currentChapterID }
														/>
													);
												}

												return (
													<Chapter
														index={ index }
														props={ this.props }
														isLastChapter={ false }
														key={ chapter.id }
														theme={ theme }
														{ ...chapter }
														currentChapterID={ currentChapterID }
													/>
													
												);
											} )

										}
									</div>
								</>
							) }
						</div>
					</div>
				) }
				{ this.state.isNavigating && (
					<>
						<Map
							zoom={ [ mapDefaults.zoom ] }
							pitch={ [ 0 ] }
							bearing={ [ 0 ] }
							style={ config.style }
							containerStyle={ { height: '100vh', width: '100vw' } }
							onStyleLoad={ ( map ) => {
								map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
								map.addControl(
									new mapboxgl.NavigationControl( { showCompass: false } ),
									'top-left'
								);
							} }
						>
							{ this.props.navigateMapLayers.map(
									( layer ) => {
										const layerOptions = this.props.loadedLayers.find(
											( { id } ) => id === layer.id
										);
										if ( layerOptions && ! this.state.hiddenLayersIds.includes( layer.id ) ) {
											return renderLayer( {
												layer: layerOptions.meta,
												instance: layer,
											} );
										}
									}
							) }
						</Map>
						<nav className="layers-selection">
							<div className="layer-selection-title">
								<div className="legends-title">
									<div className="text-icon">
										<span className="text">Layers</span>
									</div>
									<div
										onClick={ () => {
											document.querySelector('.layers-wrapper').style.display = 'block';

											document.querySelector('.angle-up-icon').style.display = 'none';
											document.querySelector('.angle-down-icon').style.display = 'block';
										} }
										className="angle-up-icon"
									>
										<img 
											alt="layers-selection-icon"
											className="layers-selection-icon"
											src="data:image/png;base64,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gQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEBAADADBAgQIEAgUEAACGy6kgkQIECAgABgBggQIECAQKCAABDYdCUTIECAAAEBwHBN5ooAAACJSURBVAwQIECAAIFAAQEgsOlKJkCAAAECAoAZIECAAAECgQICQGDTlUyAAAECBAQAM0CAAAECBAIFBIDApiuZAAECBAgIAGaAAAECBAgECggAgU1XMgECBAgQEADMAAECBAgQCBQQAAKbrmQCBAgQICAAmAECBAgQIBAoIAAENl3JBAgQIEDg/wFybK1MJbnfkwAAAABJRU5ErkJggg=="
											></img>
									</div>
									<div 
										onClick={ () => {
											document.querySelector('.layers-wrapper').style.display = 'none';

											document.querySelector('.angle-down-icon').style.display = 'none';
											document.querySelector('.angle-up-icon').style.display = 'block';
										} }
										className="angle-down-icon"
									>
										<img 
											alt="layers-selection-icon"
											className="layers-selection-icon"
											src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAgAElEQVR4Xu3dS5Zl11EG4PAAgIUYCI+OTVu1LHeZA+/5AAaWx+AuBtGW3LI8EKlRHgCsK1VKqarKvI+zT+zYOz513NC9Z8f+ItLx5ynZ+kn4iwABAgQIEGgn8JN2N3ZhAgQIECBAIAQAQ0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBAgQIEBAADADBAgQIECgoYAA0LDprkyAAAECBAQAM0CAAAECBBoKCAANm+7KBN4J/Pm7//w9EQIE+gkIAP167sYELgJ/ERGfv6P4NCKEAHNBoJmAANCs4a5L4Nny/7N3Gl9HhBBgNAg0ExAAmjXcddsLPP3m/7T8n0CEgPajAaCbgADQrePu21ngpeUvBHSeCndvKyAAtG29izcTuLb8hYBmA+G6BAQAM0Bgf4Fbl78QsP8suCGB7wUEAMNAYG+Be5e/ELD3PLgdAQHADBBoIPDo8hcCGgyHKxLwBsAMENhT4OjyFwL2nAu3IuANgBkgsLHAqOUvBGw8JK5GwBsAM0BgL4HRy18I2Gs+3IaANwBmgMCGAmctfyFgw2FxJQLeAJgBAnsI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AgQIZAsIANniziNAgAABAgUEBIACTVACAQIECBDIFhAAssWdR4AAAQIECggIAAWaoAQCBAgQIJAtIABkizuPAAECBAgUEBAACjRBCQQIECBAIFtAAMgWdx4BAgQIECggIAAUaIISCBAgQIBAtoAAkC3uPAIECBAgUEBAACjQBCUQIECAAIFsAQEgW9x5BAgQIECggIAAUKAJSiBAgAABAtkCAkC2uPMIECBAgEABAQGgQBOUQIAAAQIEsgUEgGxx5xEgQIAAgQICAkCBJiiBAAECBAhkCwgA2eLOI0CAAAECBQQEgAJNUAIBAgQIEMgWEACyxZ1HgAABAgQKCAgABZqgBAIECBAgkC0gAGSLO48AAQIECBQQEAAKNEEJBAgQIEAgW0AAyBZ3HgECBAgQKCAgABRoghIIECBAgEC2gACQLe48AgQIECBQQEAAKNAEJRAgQIAAgWwBASBb3HkECBAgQKCAgABQoAlKIECAAAEC2QICQLa48wgQIECAQAEBAaBAE5RAgAABAgSyBQSAbHHnESBAgACBAgICQIEmKIEAAQIECGQLCADZ4s4jQIAAAQIFBASAAk1QAgECBAgQyBYQALLFnUeAAAECBAoICAAFmqAEAgQIECCQLSAAZIs7jwABAgQIFBAQAAo0QQkECBAgQCBbQADIFnceAQIECBAoICAAFGiCEggQIECAQLaAAJAt7jwCBAgQIFBAQAAo0AQlECBAgACBbAEBIFvceQQIECBAoICAAFCgCUogQIAAAQLZAgJAtrjzCBAgQIBAAQEBoEATlECAAAECBLIFBIBscecRIECAAIECAgJAgSYogQABAgQIZAsIANniziNAgAABAgUEBIACTVACAQIECBDIFhAAssWdR4AAAQIECggIAAWaoAQCBAgQIJAtIABkizuPAAECBAgUEBAACjRBCQQIECBAIFtAAMgWdx4BAgQIECggIAAUaIISCBAgQIBAtoAAkC3uPAIECBAgUEBAACjQBCUQIECAAIFsAQEgW9x5BAgQIECggIAAUKAJSiBAgAABAtkCAkC2uPMIECBAgEABAQGgQBOUQIAAAQIEsgUEgGxx5xEgQIAAgQICAkCBJiiBAAECBAhkCwgA2eLOI0CAAAECBQQEgAJNUAIBAgQIEMgWEACyxZ1HgAABAgQKCAgABZqgBAIECBAgkC0gAGSLO48AAQIECBQQEAAKNEEJBAgQIEAgW0AAyBZ3HgECBAgQKCAgABRoghIIECBAgEC2gACQLe48AgQIECBQQEAAKNAEJRAgQIAAgWwBASBb3HkECBAgQKCAgABQoAlKIECAAAEC2QICQLa48wgQIECAQAEBAaBAE5RAgAABAgSyBQSAbHHnESBAgIf2RW8AAAFRSURBVACBAgICQIEmKIEAAQIECGQLCADZ4s4jQIAAAQIFBASAAk1QAgECBAgQyBYQALLFnUeAAAECBAoICAAFmqAEAgQIECCQLSAAZIs7jwABAgQIFBAQAAo0QQkECBAgQCBbQADIFnceAQIECBAoICAAFGiCEggQIECAQLaAAJAt7jwCBAgQIFBAQAAo0AQlECBAgACBbAEBIFvceQQIECBAoICAAFCgCUogQIAAAQLZAgJAtrjzCBAgQIBAAQEBoEATlECAAAECBLIFBIBscecRIECAAIECAgJAgSYogQABAgQIZAsIANniziNAgAABAgUEBIACTVACAQIECBDIFhAAssWdR4AAAQIECggIAAWaoAQCBAgQIJAtIABkizuPAAECBAgUEBAACjRBCQQIECBAIFtAAMgWdx4BAgQIECggIAAUaIISCBAgQIBAtsD/Ay0srUxdI2/EAAAAAElFTkSuQmCC"
											></img>
									</div>
								</div>
							</div>
							<div className="layers-wrapper">
								{ this.props.navigateMapLayers.map(
									( layer ) => {
										const removeLayer = () => {
											const newLayersIds = [ ...this.state.hiddenLayersIds ];

											const index = newLayersIds.indexOf( layer.id );
											newLayersIds.splice( index, 1) ;

											this.setState( { ...this.state, hiddenLayersIds: newLayersIds } );
										}

										const addLayer = () => {
											this.setState( { ...this.state, hiddenLayersIds: [ ...this.state.hiddenLayersIds, layer.id ] } );
										}

										return(
											<div className="layer" key={ layer.id }>
												{ this.state.hiddenLayersIds.includes( layer.id ) && (
													<input id={ layer.id } type="checkbox" onClick={ removeLayer }></input>
												) }
												{ ! this.state.hiddenLayersIds.includes( layer.id ) && (
													<input id={ layer.id } type="checkbox" checked onClick={ addLayer }></input>
												) }

												<label htmlFor={ layer.id }> { layer.title.rendered } </label>
											</div>
										)
									}
								) }
							</div>
						</nav>
						<div className="return-to-slides-container">
							<img
								alt="icon"
								className="icon"
								onClick={ () => {
									let mapBrightness;
									let slidesDisplay;

									if ( this.props.hasIntroduction ) {
										mapBrightness = 0.5;
										slidesDisplay = 'none';
									} else {
										mapBrightness = 1;
										slidesDisplay = 'block';
									}

									this.setState( { ...this.state, isNavigating: false, slidesDisplay, mapBrightness } )
									window.scrollTo(0, 0);
								} }
								src="data:image/png;base64,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"></img>
							<p
								onClick={ () => {
									let mapBrightness;
									let slidesDisplay;

									if ( this.props.hasIntroduction ) {
										mapBrightness = 0.5;
										slidesDisplay = 'none';
									} else {
										mapBrightness = 1;
										slidesDisplay = 'block';
									}

									this.setState( { ...this.state, isNavigating: false, slidesDisplay, mapBrightness } )
									window.scrollTo(0, 0);
								} }
							>
								Voltar ao topo
							</p>
						</div>
					</>
				) }
			</>
        );
    }

}

function Chapter({ index, id, theme, title, image, description, currentChapterID, isLastChapter, onClickFunction, props}) {
	let classList = id === currentChapterID ? "step active" : "step";
	
    return (
		<>
			{ ! isLastChapter && (
				<div id={ id } className={ classList }>
					<div className={ theme }>
						{ title &&
							<h3 className="title">{ title }</h3>
						}
						{ image &&
							<img src={ image } alt={ title }></img>
						}
						{ description &&
							<p>{ description }</p>
						}
						{ ! title && ! description &&
							<h3 className="title">{ `Slide ${ index + 1 }` }</h3>
						}
					</div>
				</div>
			) }
			{ isLastChapter && props.navigateButton && (
				<div id={ id } className={ classList }>
					<button
						className="navigate-button-display"
						onClick={ onClickFunction }
					>
						NAVIGATE THE MAP
					</button>
				</div>
			) }
		</>
    );
}

const storyMapElement = document.getElementById('story-map');
let storyMapProps = null;
if(storyMapElement) {
	storyMapProps = JSON.parse(storyMapElement.getAttribute('data-properties'));
	wp.element.render(<StoryMapDisplay { ...storyMapProps } />, storyMapElement);
}

