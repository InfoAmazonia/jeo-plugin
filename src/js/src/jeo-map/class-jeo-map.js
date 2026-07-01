import Spiderfy from '@nazka/map-gl-js-spiderfy';
import { __, _n, sprintf } from '@wordpress/i18n';

import { createMap, getClusterLeaves, loadImage, mapgl, MAP_RUNTIME } from '../lib/mapgl-loader';
import { loadComposedStyleData } from '../shared/composed-style-data';
import {
	addComposedInteractions,
	getComposedLayerVisibility,
	hasComposedStyle,
	setComposedLayerVisibility,
} from '../shared/composed-style-layers';
import { computeInlineEnd, computeInlineStart } from '../shared/direction';
import { onFirstIntersection } from '../shared/intersect';
import { appendRestQueryParams } from '../shared/rest-query';
import { buildRelatedPostsGeoJson } from '../shared/story-geojson';
import { EMPTY_STYLE } from '../shared/styles';
import { normalizeOptionalUrl } from '../shared/url-normalization';
import { waitMapEvent } from '../shared/wait';
import { toFiniteNumber } from './map-numbers';
import { getPanLimitsMaxBounds } from './pan-limits';
import { compileEtaTemplate } from './template-compiler';

import '../../../css/jeo-map.scss';

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, ( match, dec ) => {
		return String.fromCharCode( dec );
	} );
};

const chevronLeftSmallIcon = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="m13.1 16-3.4-4 3.4-4 1.1 1-2.6 3 2.6 3-1.1 1z" />
	</svg>
`;

const chevronRightSmallIcon = `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
		<path d="M10.8622 8.04053L14.2805 12.0286L10.8622 16.0167L9.72327 15.0405L12.3049 12.0286L9.72327 9.01672L10.8622 8.04053Z" />
	</svg>
`;

const RELATED_POSTS_CLUSTER_BADGE_PREFIX = 'jeo-related-posts-cluster-badge-';
const SMALL_MAP_CONTROL_MAX_WIDTH = 420;

function mergeUniqueStoriesById( currentStories = [], nextStories = [] ) {
	const storiesById = new Map();

	[ ...currentStories, ...nextStories ].forEach( ( story ) => {
		const storyId = Number.parseInt( story?.id, 10 );

		if ( Number.isFinite( storyId ) ) {
			storiesById.set( storyId, story );
		}
	} );

	return Array.from( storiesById.values() );
}

function compileTemplate ( template, config = {} ) {
	return compileEtaTemplate( template, config );
}

globalThis.Spiderfy = Spiderfy;

export default class JeoMap {
	constructor( element ) {
		this.element = element;
		this.args = element.attributes;
		this.customTokens = {};
		this.markers = [];
		this.layers = [];
		this.legends = [];
		this.composedStyleMetadata = null;
		this.composedManifest = null;
		this.usingComposedStyle = false;
		this.composedStyleError = null;
		this.initialized = false;
		this.popup = null;
		this.attributionResizeObserver = null;
		this.relatedPostsClusterBadgeBaseImage = null;
		this.relatedPostsClusterBadgeHandlerRegistered = false;

		this.isEmbed = this.element.getAttribute( 'data-embed' );

		this.options = jQuery( this.element ).data( 'options' );

		this.moreInfoTemplate = compileTemplate( window.jeoMapVars.templates.moreInfo, {
			functionHeader: 'const { map } = it;',
		} );

		this.popupTemplate = compileTemplate( `<article class="popup popup-wmt">${ window.jeoMapVars.templates.postPopup }</article>`, {
			functionHeader: 'const { post, read_more, show_featured_media } = it;',
		} );

		this.dataFetched = this.fetchMapData();

		onFirstIntersection( element, this.lazyInitMap.bind( this ) );
	}

	lazyInitMap() {
		const inlineStart = computeInlineStart();
		const inlineEnd = computeInlineEnd();

		if ( this.initialized ) {
			return;
		}
		this.initialized = true;

		this.dataFetched
			.then( () => {
				const map = createMap({
					container: this.element,
					attributionControl: false,
					style: this.getStyleLayer(),
					transformRequest: this.transformRequestUrl.bind( this ),
				});

				this.map = map;
				this.mapLoaded = waitMapEvent( map, 'load' );
				this.styleLoaded = waitMapEvent( map, 'style.load' );

				this.spiderifier = new Spiderfy(map, {
					renderMethod: '3D',
					// minZoomLevel: this.getArg( 'max_zoom' ) - 2,
					minZoomLevel: 12,
					zoomIncrement: 2,
					closeOnLeafClick: false,
					spiderLeavesLayout: {
						'icon-allow-overlap': true,
            			'icon-image': 'news-marker',
						'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news-marker'].icon_size ),
        			},
					spiderLeavesPaint: {
						'icon-opacity': 1,
					},
					onLeafClick: (feature, e) => {
						this.showPostPopup(feature, e.lngLat);
					},
				});

				if ( this.getArg( 'layers' ) && this.getArg( 'layers' ).length > 0 ) {
					const initialZoom = toFiniteNumber( this.getArg( 'initial_zoom' ) );
					const centerLon = toFiniteNumber( this.getArg( 'center_lon' ) );
					const centerLat = toFiniteNumber( this.getArg( 'center_lat' ) );
					const initialCenter = centerLon !== null && centerLat !== null ?
						[ centerLon, centerLat ] :
						null;

					if ( initialZoom !== null ) {
						map.setZoom( initialZoom );
					}

					if ( initialCenter ) {
						map.setCenter( initialCenter );
					}

					map.addControl(
						new mapgl.NavigationControl( { showCompass: false } ),
						`top-${inlineStart}`
					);

					if ( this.getArg( 'disable_scroll_zoom' ) ) {
						map.scrollZoom?.disable();
					}

					if ( this.getArg( 'disable_drag_pan' ) ) {
						map.dragPan?.disable();
						map.touchZoomRotate?.disable();
					}

					if ( this.getArg( 'disable_drag_rotate' ) ) {
						map.dragRotate?.disable();
					}

					if ( this.getArg( 'enable_fullscreen' ) ) {
						map.addControl( new mapgl.FullscreenControl(), `top-${inlineStart}` );
						this.bindAlignedFullscreenReset();
					}

					const panLimitsMaxBounds = getPanLimitsMaxBounds(
						this.getArg( 'pan_limits' ),
						initialCenter
					);

					if ( panLimitsMaxBounds ) {
						map.setMaxBounds( panLimitsMaxBounds );
					}

					const minZoom = toFiniteNumber( this.getArg( 'min_zoom' ) );
					const maxZoom = toFiniteNumber( this.getArg( 'max_zoom' ) );

					if ( minZoom !== null ) {
						map.setMinZoom( minZoom );
					}
					if ( maxZoom !== null ) {
						map.setMaxZoom( maxZoom );
					}

					// Only used for manipulating the map from outside Jeo
					globalThis.map = map;
				}
			} )
			.then( () => {
				const map = this.map;

				// Show a message when a map doesn't have layers
				if ( this.getArg( 'layers' ) && this.getArg( 'layers' ).length === 0 ) {
					this.addMapWithoutLayersMessage();
				} else {
					const layers = this.layers;
					const amountLayers = layers.length;

					if (
						this.getArg( 'layers' ) &&
						this.getArg( 'layers' ).length > 0 &&
						amountLayers > 0
					) {
						const usingComposedStyle = this.hasComposedStyle();

						layers.forEach( ( layer ) => {
							// Register custom accessTokens, if found, to request transformer
							this.checkCustomToken( layer.attributes );
						} );

						// When style is done loading (don't try to add layers before style is ready)
						this.mapLoaded.then( () => {
							if ( usingComposedStyle ) {
								addComposedInteractions( map, this.composedManifest );
							} else {
								this.addComposedStyleWarningMessage();
								layers.forEach( ( layer ) => {
									if ( this.isMapboxStyleLayer( layer ) ) {
										return;
									}

									layer.addLayer( map );
								} );
							}

							// Add attributions
							const customAttribution = [];
							layers.forEach( ( layer ) => {
								if ( layer.attribution ) {
									const attributionLink = normalizeOptionalUrl(
										layer.attribution
									);
									const attributionName = layer.attribution_name;
									const attributionLabel = String(
										attributionName || ''
									).replace(
										/\s/g,
										''
									).length
										? attributionName
										: attributionLink;
									customAttribution.push(
										`<a href="${ attributionLink }">${ attributionLabel }</a>`
									);
								}
							} );

							const isMobileViewport = window.matchMedia
								? window.matchMedia( '(max-width: 599px)' ).matches
								: window.innerWidth < 600;
							const shouldCompactAttribution =
								isMobileViewport || this.shouldStartControlsCollapsed();
							const controlPostion = MAP_RUNTIME === 'mapboxgl'
								? 'bottom-right'
								: `bottom-${inlineEnd}`;
							const attributionOptions = {
								customAttribution,
							};

							if ( MAP_RUNTIME === 'mapboxgl' || shouldCompactAttribution ) {
								attributionOptions.compact = shouldCompactAttribution;
							}

							const attributionControl = new mapgl.AttributionControl(
								attributionOptions
							);

							map.addControl(
								attributionControl,
								controlPostion
							);
							this.syncAttributionSpacing();
							this.queueCompactAttributionCollapse();
							map.once?.( 'idle', () => this.queueCompactAttributionCollapse() );
							map.on( 'resize', () => this.queueCompactAttributionCollapse() );

							this.getRelatedPosts();
						} );

						this.addLayersControl( amountLayers );
						this.addMoreButtonAndLegends();
						this.syncSmallMapControlState();
					}

					// Show a message when a map doesn't have layers
					if ( amountLayers === 0 ) {
						this.addMapWithoutLayersMessage();
					}
				}
			} )
			.then( () => {
				// Remove all empty jeo map blocks
				jQuery(
					`.jeomap.wp-block-jeo-map.${MAP_RUNTIME}-map:not([data-map_id])`
				).remove();
			} );
	}

	async fetchMapData() {
		const previewMapPayload = this.element.dataset.previewMap;
		if ( previewMapPayload ) {
			try {
				this.map_post_object = JSON.parse( previewMapPayload );
				await this.getLayers();
				return;
			} catch ( error ) {
				console.warn( 'Unable to parse preview map payload. Falling back to REST data.', error );
			}
		}

		if ( this.getArg( 'map_id' ) ) {
			const data = await jQuery.ajax( {
				type: 'GET',
				beforeSend: function ( request ) {
					if ( jeoMapVars.nonce ) {
						request.setRequestHeader( 'X-WP-Nonce', jeoMapVars.nonce );
					}
				},
				url: jeoMapVars.jsonUrl + 'map/' + this.getArg( 'map_id' ),
			} );

			this.map_post_object = data;

			await this.getLayers();
			await this.fetchComposedStyleData( data.id );
		} else if ( this.getArg( 'layers' ) ) {
			// One-time maps have no map_id but store layer settings
			// in the data-layers attribute. We still need to fetch
			// the full layer objects so direct layer types can render.
			await this.getLayers();
			await this.fetchOnetimeComposedStyleData();
		}
	}

	async fetchComposedStyleData( mapId ) {
		if (
			! mapId ||
			! window.jeoMapVars?.composedStyleUrlBase
		) {
			return;
		}

		await this.loadComposedStyleData(
			() => loadComposedStyleData( {
				mapId,
				unavailableMessage: __(
					'Mapbox style composition is unavailable for this map.',
					'jeowp'
				),
				emptyManifestMessage: __(
					'Mapbox style composition did not return renderable layers for this map.',
					'jeowp'
				),
			} ),
			__(
				'Unable to load composed Mapbox style for this map.',
				'jeowp'
			),
			'Unable to load composed Mapbox style. Mapbox style layers will be omitted.'
		);
	}

	async fetchOnetimeComposedStyleData() {
		if (
			! window.jeoMapVars?.composedStyleComposeUrl ||
			! this.layers.some( ( layer ) => this.isMapboxStyleLayer( layer ) )
		) {
			return;
		}

		await this.loadComposedStyleData(
			() => loadComposedStyleData( {
				payload: this.getOnetimeComposedStylePayload(),
				unavailableMessage: __(
					'Mapbox style composition is unavailable for this one-time map.',
					'jeowp'
				),
				emptyManifestMessage: __(
					'Mapbox style composition did not return renderable layers for this one-time map.',
					'jeowp'
				),
			} ),
			__(
				'Unable to load composed Mapbox style for this one-time map.',
				'jeowp'
			),
			'Unable to load composed Mapbox style for one-time map. Mapbox style layers will be omitted.'
		);
	}

	async loadComposedStyleData( fetchData, fallbackErrorMessage, consoleMessage ) {
		try {
			const { manifest, metadata } = await fetchData();

			this.composedStyleMetadata = metadata;
			this.composedManifest = manifest;
			this.usingComposedStyle = true;
			this.composedStyleError = null;
		} catch ( error ) {
			this.composedStyleMetadata = null;
			this.composedManifest = null;
			this.usingComposedStyle = false;
			this.composedStyleError = error?.message || fallbackErrorMessage;
			console.warn( consoleMessage, error );
		}
	}

	getOnetimeComposedStylePayload() {
		return {
			scope: 'onetime',
			kind: 'onetime-map',
			layers: this.layersDefinitions || this.getArg( 'layers' ) || [],
			center_lat: this.getArg( 'center_lat' ) || null,
			center_lon: this.getArg( 'center_lon' ) || null,
			initial_zoom: this.getArg( 'initial_zoom' ) || null,
		};
	}

	isMapboxStyleLayer( layer ) {
		return layer?.attributes?.layer_type === 'mapbox';
	}

	addComposedStyleWarningMessage() {
		if (
			! this.layers.some( ( layer ) => this.isMapboxStyleLayer( layer ) ) ||
			this.element.querySelector( '.jeomap-composed-style-warning' )
		) {
			return;
		}

		const warning = document.createElement( 'div' );
		warning.className = 'jeomap-composed-style-warning';
		warning.innerHTML = `<p class="jeomap-no-layers__text">${ __(
			'Mapbox style layers could not be loaded because the composed style is unavailable.',
			'jeowp'
		) }</p>`;
		this.element.appendChild( warning );

		if ( this.composedStyleError ) {
			console.warn( this.composedStyleError );
		}
	}

	addMapWithoutLayersMessage() {
		const layers = document.createElement( 'div' );
		layers.innerHTML += `<p class="jeomap-no-layers__text">${ __(
			"This map doesn't have layers",
			'jeowp'
		) }</p>`;
		this.element.appendChild( layers );
		jQuery( this.element ).addClass( 'jeo-without-layers' );
		jQuery( this.element ).find( '.mapboxgl-control-container, .maplibregl-control-container' ).remove();
		jQuery( this.element ).find( '.mapboxgl-canvas-container, .maplibregl-canvas-container' ).remove();
	}

	shouldStartControlsCollapsed() {
		const width =
			this.element.getBoundingClientRect().width ||
			this.element.clientWidth ||
			0;
		const shouldCollapse = width > 0 && width <= SMALL_MAP_CONTROL_MAX_WIDTH;

		this.element.classList.toggle( 'jeo-small-controls', shouldCollapse );
		return shouldCollapse;
	}

	queueCompactAttributionCollapse() {
		this.collapseCompactAttribution();
		window.requestAnimationFrame( () => this.collapseCompactAttribution() );
		[ 100, 500, 1000 ].forEach( ( delay ) => {
			window.setTimeout(
				() => this.collapseCompactAttribution(),
				delay
			);
		} );
	}

	collapseCompactAttribution() {
		const attributionControl = this.element.querySelector(
			'.mapboxgl-ctrl-attrib.mapboxgl-compact, .maplibregl-ctrl-attrib.maplibregl-compact'
		);

		if ( attributionControl ) {
			attributionControl.classList.remove(
				'mapboxgl-compact-show',
				'maplibregl-compact-show'
			);
			attributionControl.removeAttribute( 'open' );
		}
	}

	syncSmallMapControlState() {
		if ( ! this.shouldStartControlsCollapsed() ) {
			return;
		}

		const layersControl = this.element.querySelector( 'nav.layers-selection' );
		const layersTitle = layersControl?.querySelector( '.layer-selection-title' );
		const layersWrapper = layersControl?.querySelector( '.layers-wrapper' );
		const layersArrow = layersTitle?.querySelector( '.arrow-icon' );

		if ( layersTitle && layersWrapper ) {
			layersControl.classList.add( 'hidden' );
			layersWrapper.style.display = 'none';
			layersArrow?.classList.remove( 'active' );
		}

		const legendControl = this.element.querySelector( '.legend-container' );
		const legendTitle = legendControl?.querySelector( '.legends-title' );
		const legendContent = legendControl?.querySelector( '.hideable-content' );
		const legendArrow = legendTitle?.querySelector( '.arrow-icon' );

		if ( legendTitle && legendContent ) {
			legendControl.classList.add( 'hidden' );
			legendContent.style.display = 'none';
			legendArrow?.classList.remove( 'active' );
		}

		this.queueCompactAttributionCollapse();
	}

	syncAttributionSpacing() {
		const updateSpacing = () => {
			const attributionControl = this.element.querySelector(
				'.mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib'
			);
			const attributionHeight = attributionControl
				? Math.ceil( attributionControl.getBoundingClientRect().height )
				: 0;

			this.element.style.setProperty(
				'--jeo-attribution-offset',
				attributionHeight > 0 ? `${ attributionHeight + 8 }px` : '0px'
			);
		};

		updateSpacing();

		if ( this.attributionResizeObserver ) {
			this.attributionResizeObserver.disconnect();
			this.attributionResizeObserver = null;
		}

		const attributionControl = this.element.querySelector(
			'.mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib'
		);
		if (
			attributionControl &&
			typeof ResizeObserver !== 'undefined'
		) {
			this.attributionResizeObserver = new ResizeObserver( updateSpacing );
			this.attributionResizeObserver.observe( attributionControl );
		}

		window.requestAnimationFrame( updateSpacing );
	}

	bindAlignedFullscreenReset() {
		if ( ! this.element.matches( '.alignleft, .alignright' ) ) {
			return;
		}

		const ownerDoc = this.element.ownerDocument || document;
		const pseudoFullscreenClasses = [
			'mapboxgl-pseudo-fullscreen',
			'maplibregl-pseudo-fullscreen',
		];
		const fullscreenControlSelector = [
			'.mapboxgl-ctrl-fullscreen',
			'.mapboxgl-ctrl-shrink',
			'.maplibregl-ctrl-fullscreen',
			'.maplibregl-ctrl-shrink',
		].join( ',' );
		const shrinkControlSelector = [
			'.mapboxgl-ctrl-shrink',
			'.maplibregl-ctrl-shrink',
		].join( ',' );

		let previousStyle = null;
		let previousSize = null;
		let trackedFullscreen = false;

		const isNativeFullscreen = () =>
			ownerDoc.fullscreenElement === this.element ||
			ownerDoc.webkitFullscreenElement === this.element;

		const hasPseudoFullscreenClass = () =>
			pseudoFullscreenClasses.some( ( className ) =>
				this.element.classList.contains( className )
			);

		const isFullscreenActive = () =>
			isNativeFullscreen() ||
			( hasPseudoFullscreenClass() &&
				this.element.querySelector( shrinkControlSelector ) );

		const resizeMap = () => {
			if ( typeof this.map?.resize !== 'function' ) {
				return;
			}
			window.requestAnimationFrame( () => this.map.resize() );
			window.setTimeout( () => this.map.resize(), 50 );
			window.setTimeout( () => this.map.resize(), 250 );
		};

		const restorePreviousStyle = () => {
			if ( previousStyle === null ) {
				this.element.removeAttribute( 'style' );
			} else {
				this.element.setAttribute( 'style', previousStyle );
			}
		};

		const applyPreviousSize = () => {
			if ( ! previousSize?.width || ! previousSize?.height ) {
				return false;
			}

			this.element.style.width = `${ previousSize.width }px`;
			this.element.style.height = `${ previousSize.height }px`;
			return true;
		};

		const releasePreviousSize = () => {
			restorePreviousStyle();
			previousStyle = null;
			previousSize = null;
			resizeMap();
		};

		const restoreAfterExit = () => {
			window.setTimeout( () => {
				if ( ! trackedFullscreen || isFullscreenActive() ) {
					return;
				}

				trackedFullscreen = false;
				pseudoFullscreenClasses.forEach( ( className ) => {
					this.element.classList.remove( className );
				} );

				restorePreviousStyle();
				const constrained = applyPreviousSize();
				resizeMap();

				if ( constrained ) {
					window.requestAnimationFrame( () => {
						window.requestAnimationFrame( releasePreviousSize );
					} );
					window.setTimeout( releasePreviousSize, 300 );
				} else {
					previousStyle = null;
					previousSize = null;
				}
			}, 0 );
		};

		this.element.addEventListener(
			'click',
			( event ) => {
				if ( ! event.target.closest( fullscreenControlSelector ) ) {
					return;
				}

				if ( ! isFullscreenActive() ) {
					previousStyle = this.element.getAttribute( 'style' );
					previousSize = this.element.getBoundingClientRect();
					trackedFullscreen = true;
				}

				restoreAfterExit();
				window.setTimeout( restoreAfterExit, 100 );
				window.setTimeout( restoreAfterExit, 300 );
			},
			true
		);

		ownerDoc.addEventListener( 'fullscreenchange', restoreAfterExit );
		ownerDoc.addEventListener( 'webkitfullscreenchange', restoreAfterExit );
	}

	/**
	 * Adds the "More" button that opens map post content or layer source
	 * information in an overlayer.
	 */
	hasMeaningfulHtml( html = '' ) {
		if ( ! html ) {
			return false;
		}

		if ( typeof document !== 'undefined' ) {
			const wrapper = document.createElement( 'div' );
			wrapper.innerHTML = html;

			const textContent = ( wrapper.textContent || '' )
				.replace( /\u00a0/g, ' ' )
				.trim();

			if ( textContent.length ) {
				return true;
			}

			return Boolean(
				wrapper.querySelector(
					'img,video,audio,iframe,table,ul,ol,svg'
				)
			);
		}

		return String( html )
			.replace( /<[^>]+>/g, '' )
			.replace( /&nbsp;|&#160;/gi, ' ' )
			.trim().length > 0;
	}

	getMoreInfoContent() {
		if ( this.map_post_object ) {
			if (
				! this.hasMeaningfulHtml(
					this.map_post_object?.content?.rendered
				)
			) {
				return '';
			}

			return this.moreInfoTemplate( {
				map: this.map_post_object,
			} );
		}

		let innerHTML = '';

		this.layers.forEach( ( layer ) => {
			const layerInfo = [];
			const attributionLink = normalizeOptionalUrl(
				layer.attributes.attribution
			);
			const attributionName = layer.attributes.attribution_name;
			const sourceLink = normalizeOptionalUrl( layer.source_url );

			if ( attributionLink ) {
				const attributionLabel = attributionName || attributionLink;
				layerInfo.push(
					`<p>${ __(
						'Attribution:',
						'jeowp'
					) } <a href="${ attributionLink }">${ attributionLabel }</a></p>`
				);
			}

			if ( sourceLink ) {
				layerInfo.push(
					`<a
						style="font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
						background: #fff;
						border: 1px solid rgba(0,0,0,0.4);
						color: #404040;
						margin-top: 8px;
						padding: 4px 10px;
						text-decoration: none;
						border-bottom: 1px solid rgba(0,0,0,0.25);
						text-align: center;
						cursor: pointer;
						display: inline-block;
						font-size: 16px;
						font-weight: bold;
						transition: all .2 ease-in-out;"
						href="${ sourceLink }" class="download-source">${ __(
							'Download from source',
							'jeowp'
						) }
					</a>`
				);
			}

			if ( layerInfo.length ) {
				innerHTML += `<h3>${ layer.attributes.layer_name }</h3>${ layerInfo.join(
					''
				) }`;
			}
		} );

		return innerHTML;
	}

	addMoreButtonAndLegends() {
		const container = document.createElement( 'div' );
		container.classList.add( 'legend-container' );
		const startCollapsed = this.shouldStartControlsCollapsed();
		const moreInfoHtml = this.getMoreInfoContent();
		const hasMoreInfo = Boolean( moreInfoHtml.trim() );

		const hideableContent = document.createElement( 'div' );
		hideableContent.classList.add( 'hideable-content' );

		let appearingLegends = 0;

		this.legends.forEach( ( legend ) => {
			if ( ! legend.attributes.use_legend ) {
				return;
			}
			appearingLegends++;
		} );

		const hasAppearingLegends =
			this.legends.length > 0 && appearingLegends > 0;

		if ( hasAppearingLegends ) {
			if ( startCollapsed ) {
				container.classList.add( 'hidden' );
				hideableContent.style.display = 'none';
			}

			/*const legendsTitle = document.createElement( 'div' );
			legendsTitle.classList.add( 'legends-title' );
			legendsTitle.innerHTML = '<span class="text"> Legend </span>';*/
			const legendsTitle = document.createElement( 'div' );
			legendsTitle.classList.add( 'legends-title' );

			const legendTextIcon = document.createElement( 'div' );
			legendTextIcon.classList.add( 'text-icon' );

			const layerIcon = document.createElement( 'i' );
			layerIcon.classList.add( 'legend-icon' );

			legendTextIcon.appendChild( layerIcon );
			legendTextIcon.innerHTML += `<span class="text"> ${ __(
				'Legend',
				'jeowp'
			) } </span>`;

			legendsTitle.appendChild( legendTextIcon );

			const legendsHideIcon = document.createElement( 'i' );
			legendsHideIcon.classList.add( 'arrow-icon' );
			if ( ! startCollapsed ) {
				legendsHideIcon.classList.add( 'active' );
			}

			legendsTitle.appendChild( legendsHideIcon );
			container.appendChild( legendsTitle );

			legendsTitle.addEventListener( 'click', function () {
				if ( legendsHideIcon.classList.contains( 'active' ) ) {
					container.classList.add( 'hidden' );
					legendsHideIcon.classList.remove( 'active' );
					jQuery(
						this.parentNode.querySelector( '.hideable-content' )
					).slideToggle( 'slow' );
				} else {
					container.classList.remove( 'hidden' );
					legendsHideIcon.classList.add( 'active' );
					jQuery(
						this.parentNode.querySelector( '.hideable-content' )
					).slideToggle( 'slow' );
				}
			} );

			const legendsWrapper = document.createElement( 'div' );
			legendsWrapper.classList.add( 'legends-wrapper' );
			hideableContent.appendChild( legendsWrapper );

			this.legends.forEach( ( legend ) => {
				if ( ! legend.attributes.use_legend ) {
					return;
				}
				const legendContainer = document.createElement( 'div' );
				legendContainer.classList.add( 'legend-for-' + legend.layer_id );

				if ( legend.attributes.legend_title ) {
					const legendTitle = document.createElement( 'span' );
					legendTitle.classList.add( 'legend-single-title' );
					legendTitle.innerText = legend.attributes.legend_title;

					legendContainer.appendChild( legendTitle );
				}

				legendContainer.appendChild( legend.render() );
				legendsWrapper.appendChild( legendContainer );
			} );
		}

		if ( ! hasAppearingLegends && ! hasMoreInfo ) {
			return;
		}

		if ( ! hasAppearingLegends ) {
			if ( startCollapsed ) {
				container.classList.add( 'hidden' );
				hideableContent.style.display = 'none';
			}

			const moreInfoTitle = document.createElement( 'div' );
			moreInfoTitle.classList.add( 'legends-title', 'more-info-title' );
			moreInfoTitle.setAttribute( 'role', 'button' );
			moreInfoTitle.tabIndex = 0;

			const moreInfoTextIcon = document.createElement( 'div' );
			moreInfoTextIcon.classList.add( 'text-icon' );

			const moreInfoIcon = document.createElement( 'i' );
			moreInfoIcon.classList.add( 'info-icon' );

			const moreInfoText = document.createElement( 'span' );
			moreInfoText.classList.add( 'text' );
			moreInfoText.innerText = ` ${ __( 'Info', 'jeowp' ) } `;

			moreInfoTextIcon.appendChild( moreInfoIcon );
			moreInfoTextIcon.appendChild( moreInfoText );
			moreInfoTitle.appendChild( moreInfoTextIcon );
			container.appendChild( moreInfoTitle );

			const openMoreInfoModal = ( e ) => {
				e.preventDefault();
				e.stopPropagation();
				jQuery( container ).siblings( '.more-info-overlayer' ).show();
			};

			moreInfoTitle.addEventListener( 'click', openMoreInfoModal );
			moreInfoTitle.addEventListener( 'keydown', ( e ) => {
				if ( e.key === 'Enter' || e.key === ' ' ) {
					openMoreInfoModal( e );
				}
			} );
		}

		if ( hasMoreInfo ) {
			const moreDiv = document.createElement( 'div' );

			moreDiv.classList.add( 'more-info-overlayer' );
			moreDiv.innerHTML = moreInfoHtml;

			const closeButton = document.createElement( 'div' );
			closeButton.classList.add( 'more-info-close' );
			closeButton.innerHTML =
				`<button class="${MAP_RUNTIME}-popup-close-button" type="button" aria-label="${ __(
					'Close popup',
					'jeowp'
				) }"><span>×</span></button>`;

			closeButton.click( function ( e ) {} );

			closeButton.onclick = ( e ) => {
				e.preventDefault();
				e.stopPropagation();

				jQuery( e.currentTarget ).parent().hide();
			};

			moreDiv.appendChild( closeButton );

			const moreButton = document.createElement( 'a' );
			moreButton.classList.add( 'more-info-button' );
			moreButton.innerHTML = __( 'Info', 'jeowp' );

			moreButton.onclick = ( e ) => {
				e.preventDefault();
				e.stopPropagation();
				jQuery( e.currentTarget )
					.parent()
					.parent()
					.siblings( '.more-info-overlayer' )
					.show();
			};

			this.element.appendChild( moreDiv );
			hideableContent.appendChild( moreButton );
		}

		container.appendChild( hideableContent );
		this.element.appendChild( container );

		// hide legends from hidden layers
		this.layers.forEach( ( l, i ) => {
			if ( i == 0 ) {
				return;
			}
			if ( l.attributes.visible !== true ) {
				jQuery( this.element )
					.find( '.legend-for-' + l.layer_id )
					.hide();
			}
		} );
	}

	getArg( argName ) {
		let value;
		if ( this.map_post_object ) {
			value = this.map_post_object.meta[ argName ];
		} else {
			value = jQuery( this.element ).data( argName );
		}

		if ( value ) {
			return value;
		}
		return false;
	}

	getLayers() {
		return new Promise( ( resolve, reject ) => {
			const layersDefinitions = this.getArg( 'layers' );
			this.layersDefinitions = layersDefinitions;

			if ( ! Array.isArray( layersDefinitions ) || layersDefinitions.length === 0 ) {
				this.layers = [];
				this.legends = [];
				resolve( [] );
				return;
			}

			if ( layersDefinitions ) {
				const layersIds = layersDefinitions.map( ( el ) => el.id );

				jQuery.get(
					jeoMapVars.layersUrl,
					{
						include: layersIds,
						context: 'view',
					},
					( data ) => {
						const returnLayers = [];
						const returnLegends = [];
						const ordered = [];
						layersIds.forEach( ( el, index ) => {
							ordered[ index ] = data.find( ( l ) => l.id == el );
						} );

						ordered.forEach( ( layerObject, i ) => {
							if ( layerObject ) {
								returnLayers[ i ] = (
									new window.JeoLayer( layerObject.meta.type, {
										layer_post_id: layerObject.id,
										layer_id: layerObject.slug,
										layer_type: layerObject.meta.type,
										layer_name: layerObject.title.rendered,
										attribution: layerObject.meta.attribution,
										attribution_name: layerObject.meta.attribution_name,
										visible: layersDefinitions[ i ].default,
										layer_type_options: layerObject.meta.layer_type_options,
										source_url: layerObject.meta.source_url,
									} )
								);

								if (
									layerObject.meta.legend_type !== 'none' &&
									layersDefinitions[ i ].show_legend !== false
								) {
									returnLegends[ i ] = (
										new window.JeoLegend( layerObject.meta.legend_type, {
											layer_post_id: layerObject.id,
											layer_id: layerObject.slug,
											legend_type_options: layerObject.meta.legend_type_options,
											use_legend: layerObject.meta.use_legend,
											legend_title: layerObject.meta.legend_title,
										} )
									);
								}
							}
						} );

						this.layers = returnLayers;
						this.legends = returnLegends;
						resolve( returnLayers );
					}
				);
			}
		} );
	}

	hasComposedStyle() {
		return this.usingComposedStyle &&
			hasComposedStyle( this.composedStyleMetadata, this.composedManifest );
	}

	getStyleLayer() {
		if ( this.hasComposedStyle() ) {
			return this.composedStyleMetadata.style;
		}

		return EMPTY_STYLE;
	}

	getRelatedPosts() {
		return ( async () => {
			try {
				const relatedPostsCriteria = this.getArg( 'related_posts' ) || {};
				this.relatedPostsCriteria = relatedPostsCriteria;

				if ( ! this.getArg( 'relate_posts' ) ) {
					return [];
				}

				const query = {
					per_page: 100,
					_fields: 'id,meta,title,link,date,featured_media,categories',
				};

				if ( relatedPostsCriteria.after || relatedPostsCriteria.before ) {
					query.orderby = 'date';
					query.order = 'desc';
				}

				Object.entries( relatedPostsCriteria ).forEach( ( [ key, value ] ) => {
					if ( value !== undefined && value !== null && value !== '' ) {
						query[ key ] = value;
					}
				} );

				const buildRelatedPostsUrl = ( page = null ) => {
					const targetUrl = new URL( jeoMapVars.jsonUrl + 'posts' );
					appendRestQueryParams( targetUrl.searchParams, query );

					if ( page !== null ) {
						targetUrl.searchParams.set( 'page', page );
					}

					if ( jeoMapVars.currentLang ) {
						targetUrl.searchParams.append( 'lang', jeoMapVars.currentLang );
					}
					return targetUrl;
				};

				const fetchPostsPage = async ( page = null ) => {
					const response = await fetch( buildRelatedPostsUrl( page ), {
						cache: 'no-store',
					} );
					const data = await response.json();

					return {
						data: Array.isArray( data ) ? data : [],
						totalPages: Number.parseInt(
							response.headers.get( 'x-wp-totalpages' ) || '1',
							10
						),
					};
				};

				const { data, totalPages } = await fetchPostsPage();
				let cumulativePosts = data;

				const buildRelatedPosts = ( map ) => {
					const sourceData = this.buildPostsGeoJson( cumulativePosts );
					this.relatedPostsGeoJson = sourceData;

					map.addSource( 'storiesSource', {
						type: 'geojson',
						data: sourceData,
						cluster: true,
						clusterRadius: 40,
					} );

					const relatedPostsImages = [
						loadImage( map, 'cluster', jeoMapVars.images['/js/src/icons/cluster'].url ),
						loadImage( map, 'news-marker', jeoMapVars.images['/js/src/icons/news-marker'].url ),
						loadImage( map, 'news-marker-hover', jeoMapVars.images['/js/src/icons/news-marker-hover'].url ),
					];

					if ( MAP_RUNTIME !== 'mapboxgl' ) {
						relatedPostsImages.push(
							loadImage( map, 'news-no-marker', jeoMapVars.images['/js/src/icons/news'].url )
						);
					}

					Promise.all( relatedPostsImages ).then( () => {
						if ( MAP_RUNTIME === 'mapboxgl' ) {
							this.registerRelatedPostsClusterBadgeHandler( map );
						}

						map.addLayer( {
							id: 'unclustered-points-hitarea',
							type: 'symbol',
							source: 'storiesSource',
							filter: [ '!', [ 'has', 'point_count' ] ],
							layout: {
								'icon-image': 'news-marker',
								'icon-size': parseFloat(
									jeoMapVars.images['/js/src/icons/news-marker'].icon_size
								) * 1.6,
								'icon-allow-overlap': true,
							},
							paint: {
								'icon-opacity': 0.001,
							},
						} );

						map.addLayer( {
							id: 'unclustered-points',
							type: 'symbol',
							source: 'storiesSource',
							layout: {
								'icon-allow-overlap': true,
								'icon-image': [
									'case',
									[ 'boolean', [ 'has', 'point_count' ], false ],
									'cluster',
									'news-marker',
								],
								'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news-marker'].icon_size ),
							},
						} );

						map.on( 'click', 'unclustered-points', () => {} );

						map.on( 'click', 'unclustered-points-hitarea', ( e ) => {
							const point = e.point
								? { x: e.point.x, y: e.point.y }
								: null;
							const featuresAtPoint = e.point
								? map.queryRenderedFeatures( point, {
									layers: [ 'unclustered-points-hitarea' ],
								} )
								: e.features;
							const relatedCoordinateFeatures = this.resolvePopupFeatures(
								featuresAtPoint
							);

							if ( relatedCoordinateFeatures.length ) {
								this.showPostPopup(
									relatedCoordinateFeatures,
									e.lngLat ?? relatedCoordinateFeatures[ 0 ].geometry.coordinates
								);
							}
						} );

						map.addLayer( {
							id: 'cluster-layer',
							type: 'circle',
							source: 'storiesSource',
							filter: [ 'has', 'point_count' ],
							paint: {
								'circle-color': jeoMapVars.cluster.circle_color,
								'circle-radius': 20,
								'circle-stroke-color': '#ffffff',
								'circle-stroke-opacity': 0.4,
								'circle-stroke-width': 9,
							},
						} );

						map.addLayer( {
							id: 'cluster-count',
							type: 'symbol',
							source: 'storiesSource',
							filter: [ 'has', 'point_count' ],
							layout: MAP_RUNTIME === 'mapboxgl'
								? {
									'icon-image': [
										'concat',
										RELATED_POSTS_CLUSTER_BADGE_PREFIX,
										[
											'to-string',
											[
												'coalesce',
												[ 'get', 'point_count_abbreviated' ],
												[ 'get', 'point_count' ],
											],
										],
									],
									'icon-size': 1,
									'icon-allow-overlap': true,
									'icon-ignore-placement': true,
								}
								: {
									'icon-image': 'news-no-marker',
									'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news'].icon_size ),
									'icon-allow-overlap': true,
									'icon-ignore-placement': true,
									'icon-offset': [ 0, -30 ],
									'text-field': '{point_count}',
									'text-font': [ 'Open Sans Bold' ],
									'text-size': 12,
									'text-transform': 'uppercase',
									'text-letter-spacing': 0.05,
									'text-offset': [ 0, 0.8 ],
									'text-allow-overlap': true,
									'text-ignore-placement': true,
								},
							paint: MAP_RUNTIME === 'mapboxgl'
								? {}
								: {
									'text-color': jeoMapVars.images['/js/src/icons/news'].text_color,
								},
						} );

						map.on( 'click', 'cluster-layer', ( e ) => {
							this.openClusterPostsPopup( e.features?.[ 0 ], e.lngLat );
						} );

						map.on( 'click', 'cluster-count', ( e ) => {
							this.openClusterPostsPopup( e.features?.[ 0 ], e.lngLat );
						} );

						map.on( 'mouseenter', [ 'unclustered-points-hitarea', 'cluster-layer', 'cluster-count' ], () => {
							map.getCanvas().style.cursor = 'pointer';
						} );
						map.on( 'mouseleave', [ 'unclustered-points-hitarea', 'cluster-layer', 'cluster-count' ], () => {
							map.getCanvas().style.cursor = '';
						} );
					} );
				};

				buildRelatedPosts( this.map );

				const maxPage = Number.isFinite( totalPages ) ? Math.min( totalPages, 99 ) : 1;
				for ( let page = 2; page <= maxPage; page++ ) {
					const { data: moreResults } = await fetchPostsPage( page );
					cumulativePosts = mergeUniqueStoriesById(
						cumulativePosts,
						moreResults
					);

					const sourceData = this.buildPostsGeoJson( cumulativePosts );
					this.relatedPostsGeoJson = sourceData;
					this.map.getSource( 'storiesSource' )?.setData( sourceData );
				}

				return cumulativePosts;
			} catch ( error ) {
				console.error( 'Unable to load related posts.', error );
				return [];
			}
		} )();
	}

	getCircleSvg( { fill, radius = 20 } ) {
		const width = 2 * radius
		return `data:image/svg+xml;charset=utf-8,<svg width='${width}' height='${width}' version='1.1' viewBox='0 0 ${width} ${width}' xmlns='http://www.w3.org/2000/svg'>
			<circle cx='${radius}' cy='${radius}' r='${radius}' fill='${fill}'/>
		</svg>`
	}

	getRelatedPostsClusterBadgeImageId( label ) {
		return `${ RELATED_POSTS_CLUSTER_BADGE_PREFIX }${ label }`;
	}

	getRelatedPostsClusterBadgeLabel( value ) {
		const count = Number.parseInt( value, 10 );

		if ( ! Number.isFinite( count ) ) {
			return String( value ?? '' );
		}

		if ( count >= 1000000 ) {
			return `${ Math.round( count / 100000 ) / 10 }m`.replace( '.0m', 'm' );
		}

		if ( count >= 1000 ) {
			return `${ Math.round( count / 100 ) / 10 }k`.replace( '.0k', 'k' );
		}

		return String( count );
	}

	getRelatedPostsClusterBadgeBaseImage() {
		if ( this.relatedPostsClusterBadgeBaseImage ) {
			return this.relatedPostsClusterBadgeBaseImage;
		}

		this.relatedPostsClusterBadgeBaseImage = new Promise( ( resolve, reject ) => {
			const image = new Image();
			image.decoding = 'async';
			image.crossOrigin = 'anonymous';
			image.onload = () => resolve( image );
			image.onerror = () => reject( new Error( 'Unable to load cluster badge icon.' ) );
			image.src = jeoMapVars.images['/js/src/icons/news'].url;
		} );

		return this.relatedPostsClusterBadgeBaseImage;
	}

	async createRelatedPostsClusterBadgeImage( label ) {
		const iconImage = await this.getRelatedPostsClusterBadgeBaseImage();
		const pixelRatio = 2;
		const displaySize = 40;
		const size = displaySize * pixelRatio;
		const canvas = document.createElement( 'canvas' );
		canvas.width = size;
		canvas.height = size;

		const context = canvas.getContext( '2d' );

		if ( ! context ) {
			throw new Error( 'Unable to create cluster badge canvas.' );
		}

		context.clearRect( 0, 0, size, size );
		context.drawImage( iconImage, 20, 12, 40, 28 );

		const safeLabel = String( label ?? '' ).trim();
		const fontSize = safeLabel.length >= 4 ? 22 : safeLabel.length === 3 ? 24 : 28;

		context.fillStyle = jeoMapVars.images['/js/src/icons/news'].text_color || '#202202';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.font = `700 ${ fontSize }px sans-serif`;
		context.fillText( safeLabel, size / 2, 58 );

		const imageData = context.getImageData( 0, 0, size, size );

		return {
			width: imageData.width,
			height: imageData.height,
			data: imageData.data,
			pixelRatio,
		};
	}

	registerRelatedPostsClusterBadgeHandler( map ) {
		if ( MAP_RUNTIME !== 'mapboxgl' || this.relatedPostsClusterBadgeHandlerRegistered ) {
			return;
		}

		this.relatedPostsClusterBadgeHandlerRegistered = true;

		map.on( 'styleimagemissing', async ( event ) => {
			const imageId = event?.id;

			if (
				typeof imageId !== 'string' ||
				! imageId.startsWith( RELATED_POSTS_CLUSTER_BADGE_PREFIX ) ||
				map.hasImage( imageId )
			) {
				return;
			}

			const label = imageId.slice( RELATED_POSTS_CLUSTER_BADGE_PREFIX.length );

			try {
				const image = await this.createRelatedPostsClusterBadgeImage( label );

				if ( ! map.hasImage( imageId ) ) {
					map.addImage( imageId, image, { pixelRatio: image.pixelRatio } );
				}
			} catch ( error ) {
				console.error( 'Unable to build related posts cluster badge.', error );
			}
		} );
	}

	buildPostsGeoJson( stories ) {
		return buildRelatedPostsGeoJson( stories );
	}

	getPopupFeatures( features = [] ) {
		const seenFeatures = new Set();

		return ( features ?? [] )
			.filter(
				( feature ) =>
					! feature?.properties?.cluster && ! feature?.properties?.point_count
			)
			.filter( ( feature ) => {
				const coordinates = feature?.geometry?.coordinates ?? [];
				const uniqueKey =
					feature?.properties?.link ||
					`${ feature?.id ?? 'story' }:${ coordinates.join( ',' ) }`;

				if ( seenFeatures.has( uniqueKey ) ) {
					return false;
				}

				seenFeatures.add( uniqueKey );
				return true;
			} );
	}

	getPopupFeaturesForCoordinates( coordinates ) {
		const coordinateKey = this.getCoordinatesKey( coordinates );

		if ( ! coordinateKey ) {
			return [];
		}

		return this.getPopupFeatures(
			( this.relatedPostsGeoJson?.features ?? [] ).filter(
				( feature ) =>
					this.getCoordinatesKey( feature?.geometry?.coordinates ) ===
					coordinateKey
			)
		);
	}

	getPopupFeaturesForFeature( feature ) {
		const sourceFeatures = this.relatedPostsGeoJson?.features ?? [];
		const coordinateKey = this.getCoordinatesKey( feature?.geometry?.coordinates );
		const featureId = feature?.id ?? feature?.properties?.id ?? null;
		const featureLink = feature?.properties?.link ?? null;

		return this.getPopupFeatures(
			sourceFeatures.filter( ( sourceFeature ) => {
				if ( featureLink && sourceFeature?.properties?.link === featureLink ) {
					return true;
				}

				if (
					featureId !== null &&
					( sourceFeature?.id === featureId ||
						sourceFeature?.properties?.id === featureId )
				) {
					return true;
				}

				if (
					coordinateKey &&
					this.getCoordinatesKey( sourceFeature?.geometry?.coordinates ) ===
						coordinateKey
				) {
					return true;
				}

				return false;
			} )
		);
	}

	resolvePopupFeatures( features = [] ) {
		const popupFeatures = this.getPopupFeatures( features );

		if ( ! popupFeatures.length ) {
			return [];
		}

		const sourceResolvedFeatures = popupFeatures.flatMap( ( feature ) =>
			this.getPopupFeaturesForFeature( feature )
		);

		if ( sourceResolvedFeatures.length ) {
			return this.getPopupFeatures( sourceResolvedFeatures );
		}

		if ( popupFeatures.length === 1 ) {
			return this.getPopupFeaturesForCoordinates(
				popupFeatures[ 0 ]?.geometry?.coordinates
			);
		}

		return popupFeatures;
	}

	getCoordinatesKey( coordinates ) {
		if ( ! Array.isArray( coordinates ) || coordinates.length < 2 ) {
			return null;
		}

		return coordinates
			.slice( 0, 2 )
			.map( ( value ) => Number.parseFloat( value ).toFixed( 6 ) )
			.join( ':' );
	}
	openClusterPostsPopup( feature, lngLat ) {
		const clusterId = feature?.properties?.cluster_id;
		const pointCount = feature?.properties?.point_count;

		if ( ! clusterId || ! pointCount ) {
			return;
		}

		getClusterLeaves(
			this.map.getSource( 'storiesSource' ),
			clusterId,
			pointCount,
			0
		).then( ( leaves ) => {
			const popupFeatures = this.getPopupFeatures( leaves );

			if ( popupFeatures.length ) {
				this.showPostPopup(
					popupFeatures,
					lngLat ?? feature.geometry.coordinates,
					{ totalCount: pointCount }
				);
			}
		} );
	}

	parsePopupTitle( title ) {
		if ( typeof title !== 'string' ) {
			return title;
		}

		try {
			return JSON.parse( title );
		} catch ( error ) {
			return { rendered: title };
		}
	}

	buildPopupPost( feature ) {
		const title = this.parsePopupTitle( feature?.properties?.title );

		return {
			date: feature?.properties?.date,
			link: feature?.properties?.link,
			title: {
				rendered: title?.rendered,
			},
		};
	}

	buildPopupHTML( feature ) {
		return this.popupTemplate( {
			post: this.buildPopupPost( feature ),
			read_more: jeoMapVars.string_read_more,
			show_featured_media: false,
		} );
	}

	createPopupArticleNode( feature ) {
		const popupWrapper = document.createElement( 'div' );
		popupWrapper.innerHTML = this.buildPopupHTML( feature ).trim();
		return popupWrapper.firstElementChild;
	}

	createPopupNavigatorContent( popupFeatures, options = {} ) {
		const totalCount = Number.isFinite( options.totalCount )
			? options.totalCount
			: popupFeatures.length;

		if ( popupFeatures.length === 1 && totalCount === popupFeatures.length ) {
			return this.createPopupArticleNode( popupFeatures[ 0 ] );
		}

		const navigator = document.createElement( 'div' );
		navigator.className = 'jeo-popup-navigator';
		navigator.innerHTML = `
			<div class="jeo-popup-navigator__header">
				<div class="jeo-popup-navigator__header-copy">
					<div class="jeo-popup-navigator__counter"></div>
					<div class="jeo-popup-navigator__meta"></div>
				</div>
				<div class="jeo-popup-navigator__controls">
					<button type="button" class="jeo-popup-navigator__button jeo-popup-navigator__button--previous" aria-label="${ __(
						'Show previous post',
						'jeowp'
					) }">${ chevronLeftSmallIcon }</button>
					<button type="button" class="jeo-popup-navigator__button jeo-popup-navigator__button--next" aria-label="${ __(
						'Show next post',
						'jeowp'
					) }">${ chevronRightSmallIcon }</button>
				</div>
			</div>
			<div class="jeo-popup-navigator__viewport"></div>
		`;

		const counter = navigator.querySelector(
			'.jeo-popup-navigator__counter'
		);
		const meta = navigator.querySelector( '.jeo-popup-navigator__meta' );
		const previousButton = navigator.querySelector(
			'.jeo-popup-navigator__button--previous'
		);
		const nextButton = navigator.querySelector(
			'.jeo-popup-navigator__button--next'
		);
		const viewport = navigator.querySelector(
			'.jeo-popup-navigator__viewport'
		);

		let currentIndex = 0;
		let currentFrame = this.createPopupArticleNode( popupFeatures[ 0 ] );
		let isTransitioning = false;
		currentFrame.classList.add(
			'jeo-popup-navigator__frame',
			'is-current',
			'is-active'
		);
		viewport.appendChild( currentFrame );

		const updateCounter = () => {
			counter.textContent = `${ currentIndex + 1 } / ${ popupFeatures.length }`;
			meta.textContent =
				totalCount !== popupFeatures.length
					? sprintf(
						/* translators: %d: number of markers in the current map area. */
						_n(
							'%d marker in this area',
							'%d markers in this area',
							totalCount,
							'jeowp'
						),
						totalCount
					)
					: '';
			previousButton.disabled = currentIndex === 0 || isTransitioning;
			nextButton.disabled =
				currentIndex === popupFeatures.length - 1 || isTransitioning;
		};

		const transitionToIndex = ( nextIndex ) => {
			if (
				isTransitioning ||
				nextIndex < 0 ||
				nextIndex >= popupFeatures.length ||
				nextIndex === currentIndex
			) {
				return;
			}

			const direction = nextIndex > currentIndex ? 'next' : 'previous';
			isTransitioning = true;
			updateCounter();
			viewport.style.height = `${ currentFrame.offsetHeight }px`;

			const enterNextFrame = () => {
				if ( ! currentFrame?.isConnected ) {
					return;
				}

				const nextFrame = this.createPopupArticleNode(
					popupFeatures[ nextIndex ]
				);
				nextFrame.classList.add(
					'jeo-popup-navigator__frame',
					`is-entering-${ direction }`
				);

				currentFrame.replaceWith( nextFrame );
				currentFrame = nextFrame;
				currentIndex = nextIndex;
				viewport.style.height = `${ nextFrame.offsetHeight }px`;

				const finalizeEnter = () => {
					if ( ! nextFrame?.isConnected ) {
						return;
					}

					nextFrame.classList.remove( `is-entering-${ direction }` );
					nextFrame.classList.add( 'is-current', 'is-active' );
					isTransitioning = false;
					viewport.style.height = '';
					updateCounter();
				};

				window.requestAnimationFrame( () => {
					nextFrame.classList.add( 'is-active' );
				} );

				nextFrame.addEventListener(
					'transitionend',
					( event ) => {
						if ( event.target === nextFrame ) {
							finalizeEnter();
						}
					},
					{ once: true }
				);

				window.setTimeout( finalizeEnter, 240 );
			};

			window.requestAnimationFrame( () => {
				currentFrame.classList.remove( 'is-active', 'is-current' );
				currentFrame.classList.add( `is-exiting-${ direction }` );
			} );

			currentFrame.addEventListener(
				'transitionend',
				( event ) => {
					if ( event.target === currentFrame ) {
						enterNextFrame();
					}
				},
				{ once: true }
			);

			window.setTimeout( enterNextFrame, 240 );
		};

		previousButton.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			event.stopPropagation();
			transitionToIndex( currentIndex - 1 );
		} );

		nextButton.addEventListener( 'click', ( event ) => {
			event.preventDefault();
			event.stopPropagation();
			transitionToIndex( currentIndex + 1 );
		} );

		updateCounter();

		return navigator;
	}

	showPostPopup( featureOrFeatures, lngLat, options = {} ) {
		this.popup?.remove();

		const popupFeatures = this.getPopupFeatures(
			Array.isArray( featureOrFeatures ) ? featureOrFeatures : [ featureOrFeatures ]
		);

		if ( ! popupFeatures.length ) {
			return;
		}

		const popupContent = this.createPopupNavigatorContent(
			popupFeatures,
			options
		);

		this.popup = new mapgl.Popup( { closeOnClick: false } )
			.setLngLat( lngLat )
			.setDOMContent( popupContent )
			.addTo( this.map );
	}

	addPostToMap( post ) {
		if ( post.meta._related_point ) {
			post.meta._related_point.forEach( ( point ) => {
				this.addPointToMap( point, post );
			} );
		}
	}

	addPointToMap( point, post ) {
		const url =
			point.relevance === 'secondary'
				? `url(${ jeoMapVars.images['/js/src/icons/news-marker-hover'].url })`
				: `url(${ jeoMapVars.images['/js/src/icons/news-marker'].url })`;

		const popupHTML = this.popupTemplate( {
			post,
			read_more: window.jeoMapVars.string_read_more,
			show_featured_media: false,
		} );

		const popUp = new mapgl.Popup().setHTML( popupHTML );

		const LngLat = {
			lat: parseFloat( point._geocode_lat ),
			lon: parseFloat( point._geocode_lon ),
		};

		var el = document.createElement( 'div' );
		el.className = 'marker';
		el.style.background = url;
		el.style.width = '27px';
		el.style.height = '36px';
		el.style.backgroundSize = 'cover';

		const marker = new mapgl.Marker( { element: el, anchor: 'bottom' } )
			.setLngLat( LngLat )
			.addTo( this.map );

		this.markers.push( marker );

		marker.getElement().addEventListener( 'click', () => {
			this.activateMarker( marker );
			if (
				! this.options ||
				! this.options.marker_action === 'embed_preview'
			) {
				marker.setPopup( popUp );
			} else {
				this.embedPreviewActive = true;
				this.updateEmbedPreview( post );
			}
			this.map.flyTo( { center: LngLat } );
		} );

		// By default, fly to the first post and centers it
		this.activateMarker( marker );

		if ( ! this.isEmbed ) {
			this.map.flyTo( { center: LngLat, zoom: 4 } );
		}
	}

	activateMarker( activeMarker ) {
		this.markers.map( ( marker ) => {
			const canToggle =
				marker._lngLat.lat === activeMarker._lngLat.lat &&
				marker._lngLat.lon === activeMarker._lngLat.lon;
			return marker.getElement().classList.toggle( 'marker-active', canToggle );
		} );
	}

	/**
	 * Generates the HTML and updates the story box of the Map embed URL
	 *
	 * @param post
	 */
	updateEmbedPreview( post ) {
		const html = this.popupTemplate( {
			post,
			read_more: window.jeoMapVars.string_read_more,
			show_featured_media: true,
		} );

		jQuery( '#embed-post-preview' ).html( html );
	}

	/**
	 * return an array with the index of the layers in the
	 * this.layers list that are marked as toggable.
	 *
	 * If there are no toggable layers, returns an empty array
	 *
	 * @return array
	 */
	getSwitchableLayers() {
		const layers = [];
		this.layersDefinitions.forEach( ( el, index ) => {
			if ( el.use === 'switchable' ) {
				layers.push( index );
			}
		} );
		return layers;
	}

	/**
	 * return an array with the index of the layers in the
	 * this.layers list that are marked as switchable.
	 *
	 * If there are no switchable layers, returns an empty array
	 *
	 * @return array
	 */
	getSwappableLayers() {
		const layers = [];
		this.layersDefinitions.forEach( ( el, index ) => {
			if ( el.use === 'swappable' ) {
				layers.push( index );
			}
		} );
		return layers;
	}

	/**
	 * return the index of the switchable layer marked as default
	 */
	getDefaultSwappableLayer() {
		const layers = [];
		this.layersDefinitions.forEach( ( el, index ) => {
			if ( el.use === 'swappable' && el.default ) {
				layers.push( index );
			}
		} );
		return layers;
	}

	/*
		amountLayers = new parameter
	*/
	addLayersControl( amountLayers ) {
		const switchableLayers = this.getSwitchableLayers();
		const swappableLayers = this.getSwappableLayers();

		const navElement = document.createElement( 'nav' );
		navElement.classList.add( 'layers-selection' );

		if (
			switchableLayers.length + swappableLayers.length !== 0 &&
			amountLayers > 1
		) {
			const layerSelectionTitle = document.createElement( 'div' );
			layerSelectionTitle.classList.add( 'layer-selection-title' );

			const legendsTitle = document.createElement( 'div' );
			legendsTitle.classList.add( 'legends-title' );

			const legendTextIcon = document.createElement( 'div' );
			legendTextIcon.classList.add( 'text-icon' );

			const layerIcon = document.createElement( 'i' );
			layerIcon.classList.add( 'layer-icon' );

			legendTextIcon.appendChild( layerIcon );
			legendTextIcon.innerHTML += `<span class="text"> ${ __(
				'Layers',
				'jeowp'
			) } </span>`;

			legendsTitle.appendChild( legendTextIcon );

			const legendsHideIcon = document.createElement( 'i' );
			legendsHideIcon.classList.add( 'arrow-icon', 'active' );

			legendsTitle.appendChild( legendsHideIcon );
			layerSelectionTitle.appendChild( legendsTitle );

			layerSelectionTitle.addEventListener( 'click', function () {
				if ( legendsHideIcon.classList.contains( 'active' ) ) {
					navElement.classList.add( 'hidden' );
					legendsHideIcon.classList.remove( 'active' );
					jQuery(
						this.parentNode.querySelector( '.layers-wrapper' )
					).slideToggle( 'slow' );
				} else {
					navElement.classList.remove( 'hidden' );
					legendsHideIcon.classList.add( 'active' );
					jQuery(
						this.parentNode.querySelector( '.layers-wrapper' )
					).slideToggle( 'slow' );
				}
			} );

			navElement.appendChild( layerSelectionTitle );
		}

		const layers = document.createElement( 'div' );
		layers.classList.add( 'layers-wrapper' );

		const mapLayersSettings = this.getArg( 'layers' );

		switchableLayers.forEach( ( index ) => {
			if ( this.layers[ index ] ) {
				const link = document.createElement( 'a' );
				link.href = '#';
				if ( this.layersDefinitions[ index ].default ) {
					link.className = 'active';
				}

				const layerName = document.createElement( 'span' );
				layerName.classList.add( 'layer-name' );
				layerName.textContent = decodeHtmlEntity(
					this.layers[ index ].layer_name
				);

				link.setAttribute( 'data-layer_id', this.layers[ index ].layer_id );

				const layerSetting = mapLayersSettings.find(
					( layerSetting ) =>
						layerSetting.id === this.layers[ index ].attributes.layer_post_id
				);

				link.onclick = ( e ) => {
					const clicked = e.currentTarget;
					const clickedLayer = clicked.dataset.layer_id;
					e.preventDefault();
					e.stopPropagation();

					let visibility = false;

					if ( this.hasComposedStyle() ) {
						visibility = getComposedLayerVisibility(
							this.map,
							this.composedManifest,
							clickedLayer
						);
					} else if ( layerSetting.load_as_style ) {
						if (
							layerSetting.style_layers &&
							layerSetting.style_layers.length
						) {
							layerSetting.style_layers.forEach( ( styleLayer ) => {
								if ( this.map.getLayer( styleLayer.id ) ) {
									visibility = this.map.getLayoutProperty(
										styleLayer.id,
										'visibility'
									);
								}
							} );
						}
					} else if ( this.map.getLayer( clickedLayer ) ) {
						visibility = this.map.getLayoutProperty(
							clickedLayer,
							'visibility'
						);
					}

					if ( typeof visibility === 'undefined' || visibility === 'visible' ) {
						this.hideLayer( clickedLayer );
						clicked.className = '';
					} else {
						clicked.className = 'active';
						this.showLayer( clickedLayer );
					}
				};

				link.appendChild( layerName );

				layers.appendChild( link );
			}
		} );

		navElement.appendChild( layers );

		swappableLayers.forEach( ( index ) => {
			if ( this.layers[ index ] ) {
				const link = document.createElement( 'a' );
				link.href = '#';
				link.classList.add( 'swappable' );

				if ( this.getDefaultSwappableLayer() == index ) {
					link.classList.add( 'active' );
				}
				link.textContent = decodeHtmlEntity( this.layers[ index ].layer_name );
				link.setAttribute( 'data-layer_id', this.layers[ index ].layer_id );

				link.onclick = ( e ) => {
					if ( jQuery( e.currentTarget ).hasClass( 'active' ) ) {
						return;
					}
					e.preventDefault();
					e.stopPropagation();

					// hide all
					this.getSwappableLayers().forEach( ( i ) => {
						this.hideLayer( this.layers[ i ].layer_id );
					} );
					jQuery( layers ).children( '.swappable' ).removeClass( 'active' );

					// display current
					const clicked = e.currentTarget;
					const clickedLayer = clicked.dataset.layer_id;
					this.showLayer( clickedLayer );

					clicked.classList.add( 'active' );
				};

				layers.appendChild( link );
			}
		} );

		navElement.appendChild( layers );

		this.element.appendChild( navElement );
	}

	changeLayerVisibitly( layer_id, visibility ) {
		if ( this.hasComposedStyle() ) {
			setComposedLayerVisibility(
				this.map,
				this.composedManifest,
				layer_id,
				visibility
			);
			return;
		}

		const mapLayersSettings = this.getArg( 'layers' );
		const layers = this.layers;

		layers.forEach( ( layer ) => {
			const layerSlug = layer.attributes.layer_id;
			const layerId = layer.attributes.layer_post_id;

			if ( layer_id === layerSlug ) {
				mapLayersSettings.forEach( ( layerSetting ) => {
					if ( layerId === layerSetting.id ) {
						if (
							layerSetting.load_as_style &&
							layerSetting.style_layers &&
							layerSetting.style_layers.length
						) {
							layerSetting.style_layers.forEach( ( styleLayer ) => {
								if ( this.map.getLayer( styleLayer.id ) ) {
									this.map.setLayoutProperty(
										styleLayer.id,
										'visibility',
										visibility
									);
								}
							} );
						} else {
							if ( this.map.getLayer( layer_id ) ) {
								this.map.setLayoutProperty( layer_id, 'visibility', visibility );
							}
						}
					}
				} );
			}
		} );
	}

	checkCustomToken( attributes ) {
		if ( attributes.layer_type_options.access_token ) {
			if ( attributes.layer_type_options.style_id ) {
				const accessToken = attributes.layer_type_options.access_token;

				const styleId = attributes.layer_type_options.style_id.replace( 'mapbox://styles/', '' );
				const mapboxUser = styleId.split( '/' )[0];

				this.customTokens[ mapboxUser ] = accessToken;
			}
		}
	}

	showLayer( layer_id ) {
		this.changeLayerVisibitly( layer_id, 'visible' );
		jQuery( this.element )
			.find( '.legend-for-' + layer_id )
			.show();
	}

	hideLayer( layer_id ) {
		this.changeLayerVisibitly( layer_id, 'none' );
		jQuery( this.element )
			.find( '.legend-for-' + layer_id )
			.hide();
	}

	forceUpdate() {
		this.map.resize();
	}

	transformRequestUrl( url, resourceType ) {
		const tokenPlaceholder = '__JEO_MAPBOX_ACCESS_TOKEN__';
		if ( url.includes( tokenPlaceholder ) ) {
			url = url.replaceAll(
			    tokenPlaceholder,
				encodeURIComponent( jeo_settings.mapbox_key || '' )
			);
		}

		for ( const user of Object.keys( this.customTokens ) ) {
			if ( url.includes( `${user}/` ) || url.includes( `${user}.` ) ) {
				const accessToken = this.customTokens[ user ];

				const parsedUrl = new URL( url );
				const parsedParams = new URLSearchParams( parsedUrl.search );

				if ( parsedParams.get( 'access_token' ) !== accessToken ) {
					parsedParams.set( 'access_token', accessToken );
					parsedUrl.search = '?' + parsedParams.toString();
					return { url: parsedUrl.toString() };
				}
			}
		}

		return { url };
	}
}
