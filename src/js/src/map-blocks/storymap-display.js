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
		if ( element.className != 'site-content' ) {
			element.style.display = 'none';
		}
	}

	for ( const element of document.querySelector( '#main' ).children ) {
		if ( ! element.classList.contains( 'post' ) && ! element.classList.contains( 'page' ) ) {
			element.style.display = 'none';
		} else {
			for ( const element_ of element.children ) {
				if ( element_.className != 'entry-content' ) {
					element_.style.display = 'none';						}
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
				const lastSlide = slides[ slides.length - 1 ];
				lastSlide.selectedLayers = this.props.navigateMapLayers;
				slides.push( lastSlide );
			}
		} );


		config = {
			style: 'mapbox://styles/mapbox/streets-v11',
			accessToken: window.jeo_settings.mapbox_key,
			showMarkers: false,
			theme: 'light',
			alignment: 'left',
			title: props.title || '',
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
        };
        // this.setState = this.setState.bind(this);
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
				
			} else if ( element.classList.containsf( 'page' ) ) {
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
							zoom={ [ mapStart.zoom ] }
							containerStyle={ { height: '100vh', width: '100vw' } }
							pitch={ [ mapStart.pitch ] }
							bearing={ [ mapStart.bearing ] }
							style={ config.style }
							center={ mapStart.center }
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
										const chapter = config.chapters.find(chap => {
											console.log(chap)
											console.log(response)
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
									<p className="storymap-title">{ config.title }</p>
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
													this.setState( { ...this.state, isNavigating: true, mapBrightness: 1 } );
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
												lastChapter.id = chapter.id + 1
												
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
							zoom={ [ mapStart.zoom ] }
							pitch={ [ mapStart.pitch ] }
							bearing={ [ mapStart.bearing ] }
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
										if ( layerOptions ) {
											return renderLayer( {
												layer: layerOptions.meta,
												instance: layer,
											} );
										}
									}
							) }
						</Map>
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
    const classList = id === currentChapterID ? "step active" : "step";
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

