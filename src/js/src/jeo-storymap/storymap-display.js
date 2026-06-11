import { Component, createRoot } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import scrollama from 'scrollama';

import { createMap, MAP_RUNTIME } from '../lib/mapgl-loader';
import { onFirstIntersection } from '../shared/intersect';
import { renderLayer } from '../map-blocks/map-preview-layer';
import JeoMap from '../jeo-map/class-jeo-map';
import { decodeHtmlEntity } from '../shared/html';
import { formatDate, formatHour, joinList } from '../shared/intl';
import { EMPTY_STYLE } from '../shared/styles';
import { setMapLayerVisibility } from './layer-visibility';

import './storymap-display.scss';

/* Map brightness percentage when not fully brightness */
const MAP_DIM = 0.5;

const { map_defaults: mapDefaults } = jeo_settings;

const isSingle = !!document.querySelector('.single-storymap');
const STORYMAP_MAP_CONTAINER_CLASS = 'jeo-storymap-map';
const STORYMAP_MAP_CONTAINER_JS_CLASS = 'js-jeo-storymap-map';

const alignments = {
    'left': 'lefty',
    'center': 'centered',
    'right': 'righty'
}

let storyCounter = 0;

function getAuthorsLinks( storymap ) {
	if ( storymap?.jeo_authors ) {
		// Arrow function is not recognized by `wp i18n make-json`.
		const authorsList = joinList( storymap.jeo_authors.map( function ( author ) {
			return `<a href="${author.permalink}">${author.name}</a>`;
		} ) );
		// translators: %s is the authors list
		return sprintf( __( 'By %s', 'jeo' ), authorsList );
	} else {
		return '';
	}
}

function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

class StoryMapDisplay extends Component {
    constructor( props ) {
		super( props );

		this.map = null;
		this.el = null;
		this.mapContainer = null;
		this.navigable = Boolean(this.props.navigateButton);
		this.navigateMap = null;
		this.cid = ++storyCounter;
		this.isIntroductionScrollLocked = false;
		this.previousBodyOverflow = null;
		this.previousDocumentOverflow = null;
		this.handleFullscreenChange = () => {
			const returnToSlidesContainer = this.el?.querySelector( '.return-to-slides-container' );

			if ( returnToSlidesContainer ) {
				returnToSlidesContainer.style.display = document.fullscreenElement ? 'none' : 'block';
			}

			window.scrollTo( 0, document.body.scrollHeight );
		};

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
			style: EMPTY_STYLE,
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
			hasStartedStorymap: ! props.hasIntroduction,
        };
    }

	componentDidMount() {
		this.eagerInitStorymap();
		this.syncIntroductionScrollLock();

		onFirstIntersection( this.el, this.lazyInitStorymap.bind( this ) );
	}

	componentWillUnmount() {
		this.setIntroductionScrollLocked( false );
		window.removeEventListener( 'resize', this.scroller.resize );
		document.removeEventListener( 'fullscreenchange', this.handleFullscreenChange );
	}

	setIntroductionScrollLocked( locked ) {
		const ownerDocument = this.el?.ownerDocument || document;
		const documentElement = ownerDocument.documentElement;
		const body = ownerDocument.body;

		if ( ! documentElement || ! body || this.isIntroductionScrollLocked === locked ) {
			return;
		}

		if ( locked ) {
			this.previousDocumentOverflow = documentElement.style.overflow;
			this.previousBodyOverflow = body.style.overflow;
			documentElement.style.overflow = 'hidden';
			body.style.overflow = 'hidden';
		} else {
			documentElement.style.overflow = this.previousDocumentOverflow ?? '';
			body.style.overflow = this.previousBodyOverflow ?? '';
		}

		this.isIntroductionScrollLocked = locked;
	}

	syncIntroductionScrollLock() {
		this.setIntroductionScrollLocked(
			Boolean( isSingle && this.isIntroductionActive() && ! this.state.isNavigating )
		);
	}

	isIntroductionActive() {
		return Boolean( this.props.hasIntroduction && this.state.hasStartedStorymap === false );
	}

	startStorymapDisplay() {
		this.setIntroductionScrollLocked( false );
		this.setState( { ...this.state, mapBrightness: 1, inSlides: true, hasStartedStorymap: true }, () => {
			window.requestAnimationFrame( () => {
				this.scroller.resize();
				this.el?.querySelector( '.storymap-features' )?.scrollIntoView();
			} );
		} );
	}

	scheduleInitialMapLibreAttributionSync() {
		if ( MAP_RUNTIME !== 'maplibregl' || ! this.map ) {
			return;
		}

		const sync = () => {
			this.map?.resize();
			this.syncMapLibreAttributionControl();
		};

		sync();
		window.requestAnimationFrame( sync );
		window.setTimeout( sync, 0 );
		window.setTimeout( sync, 150 );
	}

	syncMapLibreAttributionControl() {
		if ( MAP_RUNTIME !== 'maplibregl' ) {
			return;
		}

		const attributionControl = this.mapContainer?.querySelector(
			'details.maplibregl-ctrl-attrib'
		);
		const attributionButton = attributionControl?.querySelector(
			'.maplibregl-ctrl-attrib-button'
		);

		if ( ! attributionControl ) {
			return;
		}

		const mapWidth = this.map?.getCanvasContainer?.().offsetWidth || this.mapContainer?.offsetWidth || 0;
		const shouldCompact = mapWidth > 0 && mapWidth <= 640;

		if ( shouldCompact ) {
			attributionControl.classList.add( 'maplibregl-compact' );
			attributionControl.classList.remove( 'maplibregl-compact-show' );
			attributionControl.removeAttribute( 'open' );
			attributionButton?.removeAttribute( 'hidden' );
			return;
		}

		attributionControl.classList.remove( 'maplibregl-compact', 'maplibregl-compact-show' );
		attributionControl.setAttribute( 'open', '' );
		attributionButton?.setAttribute( 'hidden', 'hidden' );
	}

	setStoryLayerVisibility( layerSlug, visibility ) {
		setMapLayerVisibility( this.map, layerSlug, visibility );
	}

	applyChapterLayerVisibility( chapter, showAllLayers = false ) {
		if ( ! chapter ) {
			return;
		}

		const selectedLayers = chapter.selectedLayers || [];

		this.props.navigateMapLayers.forEach( ( layer ) => {
			const isLayerUsed = selectedLayers.some(
				( selectedLayer ) =>
					selectedLayer.slug === layer.slug || selectedLayer.id === layer.id
			);

			if ( isLayerUsed || showAllLayers ) {
				this.setStoryLayerVisibility( layer.slug, 'visible' );
			}
		} );

		this.props.navigateMapLayers.forEach( ( layer ) => {
			const isLayerUsed = selectedLayers.some(
				( selectedLayer ) =>
					selectedLayer.slug === layer.slug || selectedLayer.id === layer.id
			);

			if ( ! isLayerUsed && ! showAllLayers ) {
				this.setStoryLayerVisibility( layer.slug, 'none' );
			}
		} );
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
				if ( this.isIntroductionActive() ) {
					return;
				}

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

				if ( ! chapter ) {
					return;
				}

				this.setState( { ...this.state, currentChapter: chapter } );
				this.map?.flyTo(chapter.location);
				this.applyChapterLayerVisibility(
					chapter,
					response.index === config.chapters.length - 1
				);
		})
		.onStepExit(response => {
			if ( this.isIntroductionActive() ) {
				return;
			}

			if ( response.index === 0 && response.direction === 'up' ) {
				if ( ! this.props.hasIntroduction || this.state.hasStartedStorymap ) {
					return;
				}

				this.setState( { ...this.state, inSlides: false, mapBrightness: MAP_DIM } );
				this.applyChapterLayerVisibility( firstChapter );
			}
		});

		window.addEventListener('resize', this.scroller.resize);

		if (this.navigable) {
			const navigateMapDiv = document.createElement('div');
			navigateMapDiv.classList.add('jeomap', `${MAP_RUNTIME}-map`, 'storymap');
			navigateMapDiv.dataset.map_id = this.props.map_id;

			this.navigateMap = new JeoMap( navigateMapDiv );
			const navigateMapContainer = this.el?.querySelector( '.navigate-map' );

			if ( navigateMapContainer ) {
				// Mapbox owns the map element after initialization, so storymap controls stay outside it.
				navigateMapContainer.append( navigateMapDiv );
			}
		}

		const postRestBase = this.props.postRestBase || 'storymap';
		const url = `${ window.jeoMapVars.jsonUrl }${ postRestBase }/${ this.props.postID }`;
		window.fetch( url )
			.then( ( response ) => {
				if ( ! response.ok ) {
					return null;
				}
				return response.json();
			} )
			.then( ( json ) => {
				if ( json ) {
					this.setState( { ...this.state, postData: json } );
				}
			} );

		document.addEventListener( 'fullscreenchange', this.handleFullscreenChange );
	}

	enterNavigationMode() {
		this.setState( { isNavigating: true, mapBrightness: 1 }, () => {
			this.el?.scrollIntoView( { block: 'start' } );
			window.requestAnimationFrame( () => {
				this.navigateMap?.forceUpdate?.();
				window.requestAnimationFrame( () => this.navigateMap?.forceUpdate?.() );
			} );
		} );
	}

	exitNavigationMode() {
		if ( document.fullscreenElement ) {
			document.exitFullscreen();
		}

		this.setState( { isNavigating: false, mapBrightness: 1, inSlides: true, hasStartedStorymap: true }, () => {
			this.map?.resize();
			this.el?.scrollIntoView( { block: 'start' } );
		} );
	}

	lazyInitStorymap() {
		if ( this.initialized ) {
			return;
		}
		this.initialized = true;

		const config = this.config;
		const firstChapter = config.chapters[0];
		const initialLocation = firstChapter.location;

		const map = createMap( {
			container: this.mapContainer,
			center: [ initialLocation.center[0] || mapDefaults.lng, initialLocation.center[1] || mapDefaults.lat ],
			zoom: initialLocation.zoom || mapDefaults.zoom,
			...config,
		} );

		this.map = map;
		this.map.on( 'load', () => {
			map.scrollZoom.disable();
			map.dragPan.disable();
			map.touchZoomRotate.disable();
			map.dragRotate.disable();
			this.scheduleInitialMapLibreAttributionSync();
			map.once( 'idle', () => this.scheduleInitialMapLibreAttributionSync() );
			map.on( 'resize', () => this.syncMapLibreAttributionControl() );

			this.props.navigateMapLayers.forEach(layer => {
				const isInitialLayer = firstChapter.selectedLayers.some(selectedLayer => selectedLayer.slug === layer.slug);

				const jeoLayer = new window.JeoLayer(layer.meta.type, { ...layer.meta, layer_id: layer.slug, visible: isInitialLayer });
				jeoLayer.addLayer(map);
			});
			this.applyChapterLayerVisibility( this.state.currentChapter || firstChapter );

			const mapEl = this.el?.querySelector( `.${MAP_RUNTIME}-map` );
			if ( mapEl ) {
				mapEl.style.filter = `brightness(${ this.state.mapBrightness })`;
			}
			this.el?.querySelector( '.the-story' )?.classList.add( 'loaded' );
		});
	}

	componentDidUpdate() {
		this.syncIntroductionScrollLock();

		const mapEl = this.el?.querySelector(`.${MAP_RUNTIME}-map`);
		if (mapEl) {
			mapEl.style.filter = `brightness(${ this.state.mapBrightness })`;
		}

		if(this.state.inSlides) {
			this.state.currentChapter.selectedLayers.map(
				( layer ) => {
					const layerOptions = this.props.navigateMapLayers.find(
						( { slug } ) => slug === layer.slug
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
					const layerCopy = { ...layer, slug: layer.slug + '_final_batch' };

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
		const postTitle = this.state.postData?.title?.rendered;
		const storyDate = this.state.postData?.date ? new Date( this.state.postData.date ) : null;
		const Heading = isSingle ? 'h1' : 'h2';
		const isNavigating = this.state.isNavigating;
		const isIntroductionActive = this.isIntroductionActive();

        return(
			<section
				id={ `story-map-${this.cid}` }
				className={ classNames( 'story-map', {
					'story-map--navigating': isNavigating,
					'story-map--intro-active': isIntroductionActive,
				} ) }
				ref={ ( el ) => ( this.el = el ) }
			>
				<div
					className="not-navigating-map"
					style={ { display: isNavigating ? 'none' : 'block' } }
				>
					<div
						ref={ ( el ) => ( this.mapContainer = el ) }
						className={ classNames(
							'story-map-element',
							STORYMAP_MAP_CONTAINER_CLASS,
							STORYMAP_MAP_CONTAINER_JS_CLASS
						) }
					>
					</div>

					<div className="the-story">
						{ isIntroductionActive &&
							<div className={ classNames( [ 'storymap-header', theme ] ) } style={ { marginBottom: window.innerHeight / 3 } }>
								{ postTitle && (
									<>
										<Heading className="storymap-page-title" dangerouslySetInnerHTML={ { __html: postTitle } } />
										<div className="post-info">
											<p className="author" dangerouslySetInnerHTML={ { __html: getAuthorsLinks( this.state.postData ) } } />
											{ storyDate && (
												<p className="date">{ `${formatDate(storyDate)} ${ __('at', 'jeo') } ${formatHour(storyDate)}` }</p>
											) }
										</div>
									</>
								) }
								{ this.config.subtitle &&
									<h3 className="storymap-description" dangerouslySetInnerHTML={ { __html: decodeHtmlEntity( this.config.subtitle ) } } />
								}

								<button
									className="storymap-start-button"
									onClick={ () => this.startStorymapDisplay() }
								>
									{ __('START', 'jeo') }
								</button>

								{ this.props.navigateButton && (
									<>
										<p
											className="skip-intro-link"
											onClick={ async () => {
												this.el?.querySelector( '.storymap-start-button' )?.click();
												await sleep(1);
												window.scrollTo( 0, this.el?.scrollHeight || document.body.scrollHeight );
												this.el?.querySelector( '.navigate-button-display' )?.click();
											} }
										>
											{ __('skip intro', 'jeo') }
										</p>
										<div
											className="skip-intro-icon"
											onClick={ () => this.startStorymapDisplay() }
										>
											<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="angle-double-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" ><path fill="currentColor" d="M143 256.3L7 120.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0L313 86.3c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.4 9.5-24.6 9.5-34 .1zm34 192l136-136c9.4-9.4 9.4-24.6 0-33.9l-22.6-22.6c-9.4-9.4-24.6-9.4-33.9 0L160 352.1l-96.4-96.4c-9.4-9.4-24.6-9.4-33.9 0L7 278.3c-9.4 9.4-9.4 24.6 0 33.9l136 136c9.4 9.5 24.6 9.5 34 .1z"></path></svg>
										</div>
									</>
								) }
							</div>
						}
						{ ! this.state.inHeader && (
							<>
								<div
									className={ classNames( [
										'storymap-features',
										alignments[ this.config.alignment ],
										{
											'storymap-features--with-navigation-step': this.props.navigateButton,
										},
									] ) }
									style={ isIntroductionActive ? {
										height: 0,
										overflow: 'hidden',
										paddingBottom: 0,
										paddingTop: 0,
										pointerEvents: 'none',
										visibility: 'hidden',
									} : { display: 'block' } }
								>
									{
										this.config.chapters.map( ( chapter, index ) => {
											let isLastChapter = false;

											if ( this.config.chapters.indexOf( this.state.currentChapter ) === this.config.chapters.length - 1 && this.state.currentChapter === chapter ) {
												isLastChapter = true;
											}

											this.lastChapter = { ...chapter };
											this.lastChapter.selectedLayers = this.props.navigateMapLayers;
											this.lastChapter.id = chapter.id;

											if ( index === this.config.chapters.length - 1 ) {
												return(
													<Chapter
														index={ this.config.chapters.length }
														props={ this.props }
														onClickFunction={ () => this.enterNavigationMode() }
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
				<div
					className="navigate-map"
					style={ { display: isNavigating ? 'block' : 'none' } }
				>
					<div className="return-to-slides-container">
						<p className="icon-return">
							<div
								className="icon"
								onClick={ () => this.exitNavigationMode() }
							>
								<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="angle-double-up" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="white" d="M177 255.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 351.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 425.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1zm-34-192L7 199.7c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l96.4-96.4 96.4 96.4c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9l-136-136c-9.2-9.4-24.4-9.4-33.8 0z"></path></svg>
							</div>
						</p>
						<p
							onClick={ () => this.exitNavigationMode() }
						>
							{ __('Back to top', 'jeo') }
						</p>
					</div>
				</div>
			</section>
        );
    }

}

function Chapter({ index, id, theme, title, image, description, currentChapterID, isLastChapter, onClickFunction, props}) {
	const classList = classNames( 'step', {
		active: id === currentChapterID,
		'storymap-navigation-step': isLastChapter,
	} );

    return (
		<>
			{ ! isLastChapter && ( title || description ) && (
				<div data-id={ id } className={ classList }>
					<div className={ theme }>
						{ title &&
							<h3 className="title" dangerouslySetInnerHTML={ { __html: decodeHtmlEntity( title ) } } />
						}
						{ image &&
							<img src={ image } alt={ title }></img>
						}
						{ description &&
							<p className="slide-description" dangerouslySetInnerHTML={ { __html: decodeHtmlEntity( description ) } } />
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
	const root = createRoot( storyMapElement );
	const storyMapProps = JSON.parse( decodeHtml( storyMapElement.dataset.properties ) );
	root.render( <StoryMapDisplay { ...storyMapProps } /> );

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
