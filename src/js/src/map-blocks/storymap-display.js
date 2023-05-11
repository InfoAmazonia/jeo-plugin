import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import parse from 'html-react-parser';
import mapboxgl from 'mapbox-gl';
import React, { Component } from 'react';
import scrollama from 'scrollama';

import { renderLayer } from './map-preview-layer';
import JeoMap from '../jeo-map/class-jeo-map';

import './storymap-display.scss';

/* Map brightness percentage when not fully brightness */
const MAP_DIM = 0.5;

const { map_defaults: mapDefaults } = window.jeo_settings;

const isSingle = !!document.querySelector('.single-storymap');

const dateFormat = new Intl.DateTimeFormat( window.jeoMapVars.currentLang, { year: 'numeric', month: 'long', day: 'numeric' } );
const hourFormat = new Intl.DateTimeFormat( window.jeoMapVars.currentLang, { hour: '2-digit', minute: '2-digit' } );

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty'
}

let storyCounter = 0;

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

		this.map = null;
		this.el = null;
		this.mapContainer = null;
		this.navigateMap = null;
		this.cid = ++storyCounter;

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

			if ( index === props.slides.length -1 ) {
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

		const config = {
			style: 'mapbox://styles/mapbox/empty-v9',
			accessToken: window.jeo_settings.mapbox_key,
			theme: 'light',
			alignment: 'left',
			subtitle: props.description || '',
			byline: '',
			footer: '',
			chapters: slides,
		};
		this.config = config;

		this.scroller = scrollama();

		let mapBrightness;
		let inSlides;

		if ( this.props.hasIntroduction ) {
			inSlides = false;
			mapBrightness = MAP_DIM;
		} else {
			inSlides = true;
			mapBrightness = 1;
		}

		this.initialized = false;

        this.state = {
			currentChapter: config.chapters[0],
			// map: null,
			isNavigating: false,
			mapBrightness,
			postData: null,
			hiddenLayersIds: [],
			inSlides,
        };
    }

    componentDidMount() {
		this.eagerInitStorymap();

		const observer = new IntersectionObserver(this.lazyInitStorymap.bind(this), { threshold: 0 });
		observer.observe(this.el);
	}

	eagerInitStorymap() {
		const config = this.config;
		const firstChapter = config.chapters[0];

		this.scroller
			.setup({
				step: `#story-map-${this.cid} .step`,
				offset: 0.5,
				progress: true,
			})
			.onStepEnter(response => {
				if ( response.index === config.chapters.length - 1 ) {
					this.setState({ ...this.state, mapBrightness: MAP_DIM, inSlides: false })
					this.map?.flyTo({
						center: [ mapDefaults.lng, mapDefaults.lat ]
					});
				} else if ( this.state.mapBrightness === MAP_DIM ) {
					this.setState( { ...this.state, mapBrightness: 1, inSlides: true } )
				}

				const chapter = config.chapters.find( ( chap, index ) => {
					if ( response.element.dataset.id === config.chapters.length && index === config.chapters.length - 1 ) {
						return true
					}

					return chap.id == response.element.dataset.id;
				});

				this.setState( { ...this.state, currentChapter: chapter } );
				this.map?.flyTo(chapter.location);

				// show the ones we need and just after hide the ones we dont need (this forces the map to always have at least one layer)
				this.props.navigateMapLayers.forEach(layer => {
					const isLayerUsed = chapter.selectedLayers.some(selectedLayer => selectedLayer.id === layer.id);

					if( isLayerUsed || response.index === config.chapters.length - 1) {
						this.map?.setPaintProperty(String(layer.id), 'raster-opacity', 1)
					}
				})


				this.props.navigateMapLayers.forEach(layer => {
					const isLayerUsed = chapter.selectedLayers.some(selectedLayer => selectedLayer.id === layer.id);

					if ( !isLayerUsed ) {
						this.map?.setPaintProperty(String(layer.id), 'raster-opacity', 0)
					}
				})
		})
		.onStepExit(response => {
			if ( response.index === 0 && response.direction === 'up' ) {
				this.setState( { ...this.state, inSlides: false, mapBrightness: MAP_DIM } );

				// show the ones we need and just after hide the ones we dont need (this forces the map to always have at least one layer)
				this.props.navigateMapLayers.forEach(layer => {
					const isLayerUsed = firstChapter.selectedLayers.some(selectedLayer => selectedLayer.id === layer.id);

					if( isLayerUsed ) {
						this.map?.setPaintProperty(String(layer.id), 'raster-opacity', 1)
					}
				})

				this.props.navigateMapLayers.forEach(layer => {
					const isLayerUsed = firstChapter.selectedLayers.some(selectedLayer => selectedLayer.id === layer.id);

					if ( !isLayerUsed ) {
						this.map?.setPaintProperty(String(layer.id), 'raster-opacity', 0)
					}
				})
			}
		});

		window.addEventListener('resize', this.scroller.resize);

		const navigateMapDiv = document.createElement('div');
		navigateMapDiv.classList.add('jeomap', 'mapboxgl-map', 'storymap');
		navigateMapDiv.dataset.map_id = this.props.map_id;

		this.navigateMap = new JeoMap( navigateMapDiv );
		this.el.querySelector('.navigate-map').append( navigateMapDiv );

		const url = `${ window.jeoMapVars.jsonUrl }storymap/${ this.props.postID }`;
		window.fetch( url )
			.then( ( response ) => {
				return response.json();
			} )
			.then( ( json ) => this.setState( { ...this.state, postData: json } ) );

		this.el.querySelector('.navigate-map .jeomap').appendChild(this.el.querySelector('.return-to-slides-container'))

		document.addEventListener('fullscreenchange', function() {
			if ( document.fullscreenElement ) {
				this.el.querySelector( '.return-to-slides-container' ).style.display = 'none';
			} else {
				this.el.querySelector( '.return-to-slides-container' ).style.display = 'block';
			}

			window.scrollTo ( 0, document.body.scrollHeight );
		});
	}

	lazyInitStorymap([intersectionEntry]) {
		if (this.initialized || !(intersectionEntry?.isIntersecting)) {
			return;
		}
		this.initialized = true;

		const config = this.config;
		const firstChapter = config.chapters[0];
		const initialLocation = firstChapter.location;

		const map = new mapboxgl.Map( {
			container: this.mapContainer,
			center: [ initialLocation.center[0] || mapDefaults.lng, initialLocation.center[1] || mapDefaults.lat ],
			zoom: initialLocation.zoom || mapDefaults.zoom,
			...config,
		} );
		mapboxgl.accessToken = config.accessToken;

		this.map = map;
		this.map.on( 'load', () => {
			map.scrollZoom.disable();
			map.dragPan.disable();
			map.touchZoomRotate.disable();
			map.dragRotate.disable();

			this.props.navigateMapLayers.forEach(layer => {
				const isInitialLayer = firstChapter.selectedLayers.some(selectedLayer => selectedLayer.id === layer.id);

				const jeoLayer = new window.JeoLayer(layer.meta.type, { ...layer.meta, layer_id: String(layer.id), visible: true });
				jeoLayer.addLayer(map);
				map.setPaintProperty(String(layer.id), 'raster-opacity', isInitialLayer ? 1 : 0);
			});

			this.el.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;
			this.el.querySelector('.the-story').classList.add('loaded');
		});
	}

	componentDidUpdate() {
		this.el.querySelector('.mapboxgl-map').style.filter = `brightness(${ this.state.mapBrightness })`;

		if(this.state.inSlides) {
			this.state.currentChapter.selectedLayers.map(
				( layer ) => {
					const layerOptions = this.props.navigateMapLayers.find(
						( { id } ) => id === layer.id
					);

					if ( layerOptions ) {
						return renderLayer( {
							layer: layerOptions.meta,
							instance: layer,
						} );
					}
				}
			);
		}

		if(!this.state.inSlides){
			this.props.navigateMapLayers.map(
				( layer ) => {
					// This is will force layer reordering to invalidate applied layers cache
					const layerCopy = {...layer};
					layerCopy.id = layerCopy.id + `_final_batch`;

					return renderLayer( {
						layer: layerCopy.meta,
						instance: layerCopy,
					} );
				}
			)
		}
	}

    render() {
        const theme = this.config.theme;
		const currentChapterID = this.state.currentChapter.id;
		const storyDate = this.state.postData ? new Date( this.state.postData.date ) : null;

		const Heading = isSingle ? 'h1' : 'h2';

        return(
			<section id={ `story-map-${this.cid}` } className="story-map" ref={ ( el ) => ( this.el = el ) }>
				<div className="not-navigating-map">
					<div
						ref={ ( el ) => ( this.mapContainer = el ) }
						className="story-map-element"
					>
					</div>

					<div className="the-story">
						{ this.props.hasIntroduction &&
							<div className={ classNames( [ 'storymap-header', theme ] ) } style={ { marginBottom: window.innerHeight / 3 } }>
								{ this.state.postData && (
									<>
										<Heading className="storymap-page-title"> { parse(this.state.postData.title.rendered) }</Heading>
										<div className="post-info">
											<p className="date">{ `${dateFormat.format(storyDate)} ${ __("at", "jeo") } ${hourFormat.format(storyDate)}` }</p>
										</div>
									</>
								) }
								{ this.config.subtitle &&
									<h3 className="storymap-description">{ parse(decodeHtmlEntity( this.config.subtitle )) }</h3>
								}

								<button
									className="storymap-start-button"
									onClick={ () => {
										this.setState( { ...this.state, mapBrightness: 1, inSlides: true } );

										this.el.querySelector( '.storymap-features' ).scrollIntoView();
									} }
								>
									{ __('START', 'jeo') }
								</button>

								{ this.props.navigateButton && (
									<>
										<p
											className="skip-intro-link"
											onClick={ async () => {
												this.el.querySelector('.storymap-start-button').click();
												await sleep(1);
												window.scrollTo( 0, this.el.scrollHeight );
												this.el.querySelector('.navigate-button-display').click();
											} }
										>
											{ __('skip intro', 'jeo') }
										</p>
										<div
											className="skip-intro-icon"
											onClick={ async () => {
												this.setState( { ...this.state, mapBrightness: 1, inSlides: true } );

												this.el.querySelector( '.storymap-features' ).scrollIntoView();
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
								<div className={ classNames( [ 'storymap-features', alignments[ this.config.alignment ] ] ) } style={ { display: 'block' } }>
									{
										this.config.chapters.map( ( chapter, index ) => {
											let isLastChapter = false;

											// If is the last chapter:
											if( this.config.chapters.indexOf( this.state.currentChapter ) === this.config.chapters.length -1 && this.state.currentChapter === chapter ) {
												isLastChapter = true;
											}

											this.lastChapter = { ...chapter };
											this.lastChapter.selectedLayers = this.props.navigateMapLayers
											this.lastChapter.id = chapter.id

											if ( index === this.config.chapters.length - 1 ) {
												return(
													<Chapter
														index={ this.config.chapters.length }
														props={ this.props }
														onClickFunction={ () => {
															this.el.querySelector( '.navigate-map' ).style.display = 'block';
															this.setState( { ...this.state, isNavigating: true, mapBrightness: 1 } )
															this.navigateMap.forceUpdate();
															this.el.querySelector( '.not-navigating-map' ).style.display = ' none ';

															window.scrollTo( 0,this.el.scrollHeight );
														} }
														isLastChapter={ true }
														{ ...this.lastChapter }
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
						<p className="icon-return">
							<div
								className="icon"
								onClick={ () => {
									if ( document.fullscreenElement ) {
										document.exitFullscreen();
									}

									sleep(1000)

									let mapBrightness;

									if ( this.props.hasIntroduction ) {
										mapBrightness = MAP_DIM;
									} else {
										mapBrightness = 1;
									}

									this.setState( { ...this.state, isNavigating: false, mapBrightness } )
									window.scrollTo(0, 0);
									this.el.querySelector('.navigate-map').style.display = 'none';
									this.el.querySelector('.not-navigating-map').style.display = 'block';

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
									mapBrightness = MAP_DIM;
								} else {
									mapBrightness = 1;
								}

								this.setState( { ...this.state, isNavigating: false, mapBrightness } )

								this.el.querySelector('.navigate-map').style.display = 'none';
								this.el.querySelector('.not-navigating-map').style.display = 'block';

								this.map.resize();

								window.scrollTo(0, 0);
							} }
						>
							{ __('Back to top', 'jeo') }
						</p>
					</div>
				</>
			</section>
        );
    }

}

function Chapter({ index, id, theme, title, image, description, currentChapterID, isLastChapter, onClickFunction, props}) {
	const classList = id === currentChapterID ? "step active" : "step";

    return (
		<>
			{ ! isLastChapter && ( title || description ) && (
				<div data-id={ id } className={ classList }>
					<div className={ theme }>
						{ title &&
							<h3 className="title">{ parse(decodeHtmlEntity( title )) }</h3>
						}
						{ image &&
							<img src={ image } alt={ title }></img>
						}
						{ description &&
							<p className="slide-description">{ parse(decodeHtmlEntity( description )) }</p>
						}
					</div>
				</div>
			) }
			{ ! isLastChapter && ! title && ! description && (
				<div data-id={ id } className={ classList } style={ { visibility: 'hidden' } }>
					<div className={ theme }>
						<h3 className="title">{ `Slide ${ index + 1 }` }</h3>
					</div>
				</div>
			) }
			{ isLastChapter && props.navigateButton && (
				<div data-id={ id } className={ classList }>
					<button
						className="navigate-button-display"
						onClick={ onClickFunction }
					>
						{ __('NAVIGATE THE MAP', 'jeo') }
					</button>
				</div>
			) }
		</>
    );
}

function decodeHtml( html ) {
	const txt = document.createElement( 'textarea' );
	txt.innerHTML = html;
	return txt.value;
}

document.querySelectorAll( '.story-map-container' ).forEach( ( storyMapElement ) => {
	const storyMapProps = JSON.parse( decodeHtml( storyMapElement.dataset.properties ) );
	wp.element.render( <StoryMapDisplay { ...storyMapProps } />, storyMapElement );

	// `overflow` avoids `position:sticky`
	let parent = storyMapElement.parentElement;
	while ( parent ) {
		const problematicOverflowValues = [ 'auto', 'hidden', 'overlay', 'scroll' ];
		const overflow = window.getComputedStyle( parent ).overflow;
		if ( problematicOverflowValues.includes( overflow ) ) {
			parent.style.cssText += 'overflow: initial !important';
		}
		parent = parent.parentElement;
	}
} );
