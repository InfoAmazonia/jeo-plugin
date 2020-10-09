import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

import { renderLayer } from './map-preview-layer';
import mapboxgl from 'mapbox-gl';
import scrollama from 'scrollama';
import Map from './map';
import JeoMap from '../jeo-map/class-jeo-map';

import './storymap-display.css';

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty'
}

let config = null;

let lastChapter;

let navigateMap;

const { map_defaults: mapDefaults } = window.jeo_settings;

const scroller = scrollama();

function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, function ( match, dec ) {
		return String.fromCharCode( dec );
	} );
};

class StoryMapDisplay extends Component {
    constructor( props ) {
		super( props );

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

		let mapBrightness;
		let inSlides;

		if ( this.props.hasIntroduction ) {
			inSlides = false;
			mapBrightness = 0.5;
		} else {
			inSlides = true;
			mapBrightness = 1;
		}

        this.state = {
			currentChapter: config.chapters[0],
			map: null,
			isNavigating: false,
			mapBrightness,
			postData: null,
			hiddenLayersIds: [],
			inSlides,
        };
    }

    componentDidMount() {
        mapboxgl.accessToken = config.accessToken;
		window.addEventListener('resize', scroller.resize);
		document.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;

		let URL;

		if ( document.querySelector( '.single-post' ) ) {
			URL = `${ window.jeoMapVars.jsonUrl }posts/${ this.props.postID }`;
		} else if ( document.querySelector( '.page' ) ) {
			URL = `${ window.jeoMapVars.jsonUrl }pages/${ this.props.postID }`;
		} else if ( document.querySelector( '.single-storymap' ) ) {
			URL = `${ window.jeoMapVars.jsonUrl }storymap/${ this.props.postID }`
		}

		const navigateMapDiv = document.createElement('div');
		navigateMapDiv.classList.add('jeomap', 'mapboxgl-map', 'storymap');
		navigateMapDiv.dataset.map_id = this.props.map_id;

		navigateMap = new JeoMap( navigateMapDiv );
		document.querySelector('.navigate-map').append( navigateMapDiv );

		fetch( URL )
			.then( ( response ) => {
				return response.json();
			} )
			.then( ( json ) => this.setState( { ...this.state, postData: json } ) );

		document.querySelector('.navigate-map .jeomap').appendChild(document.querySelector('.return-to-slides-container'))

		document.addEventListener("fullscreenchange", function() {
			if ( document.fullscreenElement ) {
				document.querySelector( '.return-to-slides-container' ).style.display = 'none';
			} else {
				document.querySelector( '.return-to-slides-container' ).style.display = 'block';
			}

			window.scrollTo ( 0, document.body.scrollHeight );
		});
	}
	
	componentDidUpdate() {
		document.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;
	}		


    render() {
		const mapStart = config.chapters[ 0 ].location;
        const theme = config.theme;
		const currentChapterID = this.state.currentChapter.id;

        return(
			<div className="story-map">
				<div className="not-navigating-map">
					<Map
						zoom={ [ mapDefaults.zoom ] }
						containerStyle={ { height: '100vh', width: '100vw' } }
						pitch={ [ 0 ] }
						bearing={ [ 0 ] }
						style={ config.style }
						center={ [ mapDefaults.lng, mapDefaults.lat ] }
						onStyleLoad={ ( map ) => {
							this.setState( { ...this.state, map } );

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
										setState({ ...this.state, mapBrightness: 0.5, inSlides: false })
									} else {
										if ( this.state.mapBrightness == 0.5 ) {
											setState( { ...this.state, mapBrightness: 1, inSlides: true } )
										}
									}

									const chapter = config.chapters.find( ( chap, index ) => {
										if ( response.element.id == config.chapters.length && index == config.chapters.length - 1 ) {
											return true
										}

										return chap.id == response.element.id
									});

									setState( { ...this.state, currentChapter: chapter } );
									map.flyTo(chapter.location);

									if ( config.showMarkers ) {
										marker.setLngLat( chapter.location.center );
									}
									
							})
							.onStepExit(response => {
								if ( response.index == 0 && response.direction == 'up' ) {
									setState( { ...this.state, inSlides: false, mapBrightness: 0.5 } );
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
									if ( this.state.inSlides ) {
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
						{ this.props.hasIntroduction &&
							<div id="header" style={ { marginBottom: window.innerHeight / 3 } } className={ theme }>
								{ this.state.postData && (
									<>
										<p className="storymap-page-title">{ this.state.postData.title.rendered }</p>
										<div className="post-info">
											<p className="author">{ 'Authors' }</p>
											<p className="date">{ this.state.postData.date }</p>
										</div>
									</>
								) }
								{ config.subtitle &&
									<p className="storymap-description" dangerouslySetInnerHTML={ { __html: decodeHtmlEntity( config.subtitle ) } }></p>
								}

								<button
									className="storymap-start-button"
									onClick={ () => {
										this.setState( { ...this.state, mapBrightness: 1, inSlides: true } );

										document.querySelector( '#features' ).scrollIntoView();
									} }
								>
									{ 'START' }
								</button>
								
								{ this.props.navigateButton && (
									<>
										<p
											className="skip-intro-link"
											onClick={ async () => {
												document.querySelector('.storymap-start-button').click();
												await sleep(1);
												window.scrollTo( 0, document.body.scrollHeight );
												document.querySelector('.navigate-button-display').click();
											} }
										>
											{ 'skip intro' }
										</p>
										<div
											className="skip-intro-icon"
											onClick={ async () => {
												this.setState( { ...this.state, mapBrightness: 1, inSlides: true } );

												document.querySelector( '#features' ).scrollIntoView();
											} }
										>
											<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="angle-double-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" ><path fill="currentColor" d="M143 256.3L7 120.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0L313 86.3c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.4 9.5-24.6 9.5-34 .1zm34 192l136-136c9.4-9.4 9.4-24.6 0-33.9l-22.6-22.6c-9.4-9.4-24.6-9.4-33.9 0L160 352.1l-96.4-96.4c-9.4-9.4-24.6-9.4-33.9 0L7 278.3c-9.4 9.4-9.4 24.6 0 33.9l136 136c9.4 9.5 24.6 9.5 34 .1z"></path></svg>
										</div>
									</>
								) }
							</div>
						}
						{ ! this.state.inHeader && (
							<>
								<div id="features" style={ { display: 'block' } } className={ alignments[config.alignment] }>
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
															document.querySelector( '.navigate-map' ).style.display = 'block';
															this.setState( { ...this.state, isNavigating: true, mapBrightness: 1 } )
															navigateMap.forceUpdate();
															document.querySelector( '.not-navigating-map' ).style.display = ' none ';

															window.scrollTo( 0,document.body.scrollHeight );
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
				<div style={ { display: 'none' } } className="navigate-map"></div>						
				<>
					<div className="return-to-slides-container">
						<p>
							<div
								className="icon"
								onClick={ () => {
									if ( document.fullscreenElement ) {
										document.exitFullscreen();
									}

									sleep(1000)

									let mapBrightness;

									if ( this.props.hasIntroduction ) {
										mapBrightness = 0.5;
									} else {
										mapBrightness = 1;
									}

									this.setState( { ...this.state, isNavigating: false, mapBrightness } )
									window.scrollTo(0, 0);
									document.querySelector('.navigate-map').style.display = 'none';
									document.querySelector('.not-navigating-map').style.display = 'block';

									this.state.map.resize();
								} }
							>
								<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="angle-double-up" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="white" d="M177 255.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 351.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 425.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1zm-34-192L7 199.7c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l96.4-96.4 96.4 96.4c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9l-136-136c-9.2-9.4-24.4-9.4-33.8 0z"></path></svg>
							</div>
						</p>
						<p
							onClick={ async () => {
								if ( document.fullscreenElement ) {
									document.exitFullscreen();
								}

								let mapBrightness;

								if ( this.props.hasIntroduction ) {
									mapBrightness = 0.5;
								} else {
									mapBrightness = 1;
								}

								this.setState( { ...this.state, isNavigating: false, mapBrightness } )
								
								document.querySelector('.navigate-map').style.display = 'none';
								document.querySelector('.not-navigating-map').style.display = 'block';
								
								this.state.map.resize();

								window.scrollTo(0, 0);
							} }
						>
							{ 'Voltar ao topo' }
						</p>
					</div>
				</>
			</div>
        );
    }

}

function Chapter({ index, id, theme, title, image, description, currentChapterID, isLastChapter, onClickFunction, props}) {
	const classList = id === currentChapterID ? "step active" : "step";
	
    return (
		<>
			{ ! isLastChapter && ( title || description ) && (
				<div id={ id } className={ classList }>
					<div className={ theme }>
						{ title &&
							<h3 className="title">{ title }</h3>
						}
						{ image &&
							<img src={ image } alt={ title }></img>
						}
						{ description &&
							<p dangerouslySetInnerHTML={ { __html: decodeHtmlEntity( description ) } }></p>
						}
					</div>
				</div>
			) }
			{ ! isLastChapter && ! title && ! description && (
				<div id={ id } className={ classList } style={ { visibility: 'hidden' } }>
					<div className={ theme }>
						<h3 className="title">{ `Slide ${ index + 1 }` }</h3>
					</div>
				</div>
			) }
			{ isLastChapter && props.navigateButton && (
				<div id={ id } className={ classList }>
					<button
						className="navigate-button-display"
						onClick={ onClickFunction }
					>
						{ 'NAVIGATE THE MAP' }
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

