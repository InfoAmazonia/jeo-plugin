import { __ } from '@wordpress/i18n';
import { Eta } from 'eta';

import { computeInlineEnd, computeInlineStart } from '../shared/direction';
import { onFirstIntersection } from '../shared/intersect';
import { waitMapEvent } from '../shared/wait';

const decodeHtmlEntity = function ( str ) {
	return str.replace( /&#(\d+);/g, ( match, dec ) => {
		return String.fromCharCode( dec );
	} );
};

function compileTemplate ( template, config = {} ) {
	const eta = new Eta( config );
	return eta.compile( template ).bind( eta );
}

export default class JeoMap {
	constructor( element ) {
		this.element = element;
		this.args = element.attributes;
		this.customTokens = {};
		this.markers = [];
		this.layers = [];
		this.legends = [];
		this.initialized = false;

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
				const map = new mapboxgl.Map( {
					container: this.element,
					projection: 'equirectangular',
					attributionControl: false,
					style: this.getStyleLayer(),
					transformRequest: this.transformRequestUrl.bind( this ),
				} );

				this.map = map;
				this.mapLoaded = waitMapEvent( map, 'load' );
				this.styleLoaded = waitMapEvent( map, 'style.load' );

				this.spiderifier = new MapboxglSpiderifier(this.map, {
					initializeLeg: (spiderLeg) => {
						let post = {
							date: spiderLeg.feature.date,
							link: spiderLeg.feature.link,
							title: {
								rendered: spiderLeg.feature.title.rendered,
							}
						}
						//adicionando comentario
						const popupHTML = this.popupTemplate( {
							post,
							read_more: window.jeoMapVars.string_read_more,
							show_featured_media: false,
						} )
						let popUp = new mapboxgl.Popup({
							closeOnClick: false,
							offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
						})
						.setLngLat(spiderLeg.mapboxMarker._lngLat)
						.setHTML( popupHTML )
						const jeoOpenSpiderifierPinEvent = new CustomEvent('jeo-open-spiderifier-pin', { detail: spiderLeg.feature })

						spiderLeg.elements.pin.style.backgroundImage = `url("${jeoMapVars.images['/js/src/icons/news-marker'].url})"`
						spiderLeg.elements.container.addEventListener( 'click', () => {
							popUp.addTo( this.map )
							document.body.dispatchEvent( jeoOpenSpiderifierPinEvent )
						} )

					}
				});

				if ( this.getArg( 'layers' ) && this.getArg( 'layers' ).length > 0 ) {
					map.setZoom( this.getArg( 'initial_zoom' ) );
					map.setCenter( [
						this.getArg( 'center_lon' ),
						this.getArg( 'center_lat' ),
					] );

					map.addControl(
						new mapboxgl.NavigationControl( { showCompass: false } ),
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
						map.addControl( new mapboxgl.FullscreenControl(), `top-${inlineStart}` );
					}

					if (
						this.getArg( 'pan_limits' ) &&
						this.getArg( 'pan_limits' ).east &&
						this.getArg( 'pan_limits' ).north &&
						this.getArg( 'pan_limits' ).south &&
						this.getArg( 'pan_limits' ).west
					) {
						map.setMaxBounds( [
							[this.getArg( 'pan_limits' ).south, this.getArg( 'pan_limits' ).west], // Southwest coordinates
							[this.getArg( 'pan_limits' ).north, this.getArg( 'pan_limits' ).east] // Northeast coordinates
						] );
					}

					if ( this.getArg( 'min_zoom' ) ) {
						map.setMinZoom( this.getArg( 'min_zoom' ) );
					}
					if ( this.getArg( 'max_zoom' ) ) {
						map.setMaxZoom( this.getArg( 'max_zoom' ) );
					}

					// Only used for manipulating the map from outside Jeo
					window.map = map;
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
						const mapLayersSettings = this.getArg( 'layers' );

						let firstStyleLayerId;
						let styleLayerIndex;

						layers.forEach( ( layer, index ) => {
							const currentLayerSettings = mapLayersSettings.find(
								( item ) => item.id === layer.attributes.layer_post_id
							);

							// Register custom accessTokens, if found, to request transformer
							this.checkCustomToken( layer.attributes );

							if ( currentLayerSettings.load_as_style ) {
								layer.addStyle( map );
								styleLayerIndex = index;
							}
						} );

						// When style is done loading (don't try to add layers before style is ready)
						this.mapLoaded.then(() => {
							// Remove not selected layers and toggle visibility
							mapLayersSettings.forEach( ( layer ) => {
								if ( layer.load_as_style ) {
									const styleLayers = layer.style_layers;

									styleLayers.forEach( ( styleLayer ) => {
										if ( ! styleLayer.show ) {
											if ( map.getLayer( styleLayer.id ) ) {
												map.removeLayer( styleLayer.id );
											}
										}

										// In the future individual style layers will have their own toggles/swaps
										if ( ! layer.default ) {
											if ( map.getLayer( styleLayer.id ) ) {
												map.setLayoutProperty(
													styleLayer.id,
													'visibility',
													'none'
												);
											}
										}
									} );
								}
							} );

							// Select reference pointers
							firstStyleLayerId = map.style._order[ 0 ];

							this.styleLoaded.then( () => {
								layers.forEach( ( layer, index ) => {
									if ( index === styleLayerIndex ) {
										layer.addInteractions( map );
									} else {
										// If the current layer is below the style, add using first syle layer reference
										if ( index < styleLayerIndex ) {
											layer.addLayer( map, [ firstStyleLayerId ] );
										} else {
											layer.addLayer( map );
										}
									}
								} );
							} );

							// Add attributions
							const customAttribution = [];
							layers.forEach( ( layer ) => {
								if ( layer.attribution ) {
									let attributionLink = layer.attribution;
									const attributionName = layer.attribution_name;

									const regex = new RegExp(
										/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
									);

									if (
										layer.attribution &&
										! layer.attribution.includes( 'http' )
									) {
										if ( layer.attribution.match( regex ) ) {
											attributionLink = `https://${ layer.attribution }`;
										}
									}
									const attributionLabel = attributionName.replace(
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

							let controlPostion = `bottom-${inlineEnd}`;

							let attributionControl = new mapboxgl.AttributionControl( {
								compact: false,
								customAttribution,
							} );

							if(window.innerWidth < 600) {
								attributionControl = new mapboxgl.AttributionControl( {
									compact: true,
									customAttribution,
								} )

								controlPostion = `bottom-${inlineStart}`;
							}

							map.addControl(
								attributionControl,
								controlPostion
							);

							this.getRelatedPosts();
						});

						this.addLayersControl( amountLayers );
						this.addMoreButtonAndLegends();
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
					'.jeomap.wp-block-jeo-map.mapboxgl-map:not([data-map_id])'
				).remove();
			} );
	}

	async fetchMapData() {
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
		}
	}

	addMapWithoutLayersMessage() {
		const layers = document.createElement( 'div' );
		layers.innerHTML +=
			'<p class="jeomap-no-layers__text">This map doesn\'t have layers</p>';
		this.element.appendChild( layers );
		jQuery( this.element ).addClass( 'jeo-without-layers' );
		jQuery( this.element ).find( '.mapboxgl-control-container' ).remove();
		jQuery( this.element ).find( '.mapboxgl-canvas-container' ).remove();
	}

	/**
	 * Adds the "More" button that will open the Content of the Map post in an overlayer
	 *
	 * This will only work for maps stored in the database and not for one-time use maps
	 */
	addMoreButtonAndLegends() {
		const container = document.createElement( 'div' );
		container.classList.add( 'legend-container' );

		const hideableContent = document.createElement( 'div' );
		hideableContent.classList.add( 'hideable-content' );

		let appearingLegends = 0;

		this.legends.forEach( ( legend ) => {
			if ( ! legend.attributes.use_legend ) {
				return;
			}
			appearingLegends++;
		} );

		if ( this.legends.length > 0 && appearingLegends > 0 ) {
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
				'jeo'
			) } </span>`;

			legendsTitle.appendChild( legendTextIcon );

			const legendsHideIcon = document.createElement( 'i' );
			legendsHideIcon.classList.add( 'arrow-icon', 'active' );

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

				// console.log( legend );

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

		const moreDiv = document.createElement( 'div' );

		moreDiv.classList.add( 'more-info-overlayer' );
		if ( this.map_post_object ) {
			moreDiv.innerHTML = this.moreInfoTemplate( {
				map: this.map_post_object,
			} );
		} else {
			let innerHTML = '';
			this.layers.forEach( ( layer ) => {
				innerHTML += `<h3>${ layer.attributes.layer_name }</h1>`;

				const regex = new RegExp(
					/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi
				);

				let attributionLink = layer.attributes.attribution;
				const attributionName = layer.attributes.attribution_name;

				let sourceLink = layer.source_url;

				if (
					layer.attributes.attribution &&
					! layer.attributes.attribution.includes( 'http' )
				) {
					if ( layer.attributes.attribution.match( regex ) ) {
						attributionLink = `https://${ layer.attributes.attribution }`;
					}
				}

				if ( layer.source_url && ! layer.source_url.includes( 'http' ) ) {
					if ( layer.source_url.match( regex ) ) {
						sourceLink = `https://${ layer.source_url }`;
					}
				}

				if ( attributionLink ) {
					innerHTML += `<p>Attribution: <a href="${ attributionLink }">${ attributionName }</a></p>`;
				}
				if ( sourceLink ) {
					innerHTML += `<a
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
									href="${ sourceLink }" class="download-source">Download from source
								  </a>`;
				}
			} );
			moreDiv.innerHTML = innerHTML;
		}

		const closeButton = document.createElement( 'div' );
		closeButton.classList.add( 'more-info-close' );
		closeButton.innerHTML =
			'<button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup"><span>×</span></button>';

		closeButton.click( function ( e ) {} );

		closeButton.onclick = ( e ) => {
			e.preventDefault();
			e.stopPropagation();

			jQuery( e.currentTarget ).parent().hide();
		};

		moreDiv.appendChild( closeButton );

		const moreButton = document.createElement( 'a' );
		moreButton.classList.add( 'more-info-button' );
		moreButton.innerHTML = __( 'Info', 'jeo' );

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

			if ( layersDefinitions ) {
				const layersIds = layersDefinitions.map( ( el ) => el.id );
				const urlRoutes = window.location.pathname.split( '/' );
				const lang = urlRoutes[ 1 ];

				jQuery.get(
					jeoMapVars.jsonUrl + 'map-layer',
					{
						include: layersIds,
						orderby: 'include',
						per_page: 100,
						// lang: lang ? lang : '',
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
									layersDefinitions[ i ].show_legend
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

	getStyleLayer() {
		const mapLayersSettings = this.getArg( 'layers' );
		const layers = this.layers;

		for ( const layerSettings of mapLayersSettings ) {
			if ( layerSettings.load_as_style ) {
				const layer = layers.find(
					( layer ) => layer.attributes.layer_post_id === layerSettings.id
				);

				const styleUrl = layer.getStyleUrl();
				if ( styleUrl ) {
					return styleUrl;
				}
			}
		}

		return 'mapbox://styles/mapbox/empty-v9';
	}

	getRelatedPosts() {
		return new Promise( ( resolve, reject ) => {
			const self = this;
			const relatedPostsCriteria = this.getArg( 'related_posts' );
			this.relatedPostsCriteria = relatedPostsCriteria;

			const relatePosts = this.getArg( 'relate_posts' );

			// console.log("relatedPostsCriteria", relatedPostsCriteria);
			// console.log("relate_posts", this.getArg( 'relate_posts' ));

			if ( ! relatePosts ) {
				resolve( [] );
				return;
			}

			const query = {};
			query.per_page = 100; // TODO handle limit of posts per query

			if (
				this.relatedPostsCriteria.after ||
				this.relatedPostsCriteria.before
			) {
				query.orderby = 'date';
				query.order = 'desc';
			}

			const keys = Object.keys( relatedPostsCriteria );

			for ( const i in keys ) {
				query[ keys[ i ] ] = relatedPostsCriteria[ keys[ i ] ];
			}

			if ( keys.length < 1 ) {
				resolve( [] );
			}

			query._fields = ['id', 'meta', 'title', 'link', 'date'];

			const targetURL = new URL(jeoMapVars.jsonUrl + 'posts');
			Object.keys(query).forEach(key => targetURL.searchParams.append(key, query[key]));
			targetURL.searchParams.append('lang', jeoMapVars.currentLang);

			fetch(targetURL)
				.then(async (response) => {
					const jsonResponse = await response.json();
					return { data: jsonResponse, totalPages: response.headers.get("x-wp-totalpages") };
				})
				.then(({ data, totalPages }) => {
					// Save first page results
					let cumulativePosts = data;

					const buildRelatedPosts = (map) => {
						const sourceData = this.buildPostsGeoJson(cumulativePosts);

						map.addSource( 'storiesSource', {
							type: 'geojson',
							data: sourceData,
							cluster: true,
							clusterMaxZoom: 30,
							clusterRadius: 40,
						} );
						map.loadImage(
							jeoMapVars.images['/js/src/icons/news-marker'].url,
							( error, image ) => {
								if ( error ) throw error;

								map.addImage( 'news-marker', image );
								// Single markers layer
								map.addLayer( {
									id: 'unclustered-points',
									type: 'symbol',
									source: 'storiesSource',
									filter: [ '!', [ 'has', 'point_count' ] ],
									layout: {
										'icon-image': 'news-marker',
										'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news-marker'].icon_size ),
										'icon-allow-overlap': true,
										// 'text-field': 'story',
										// 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
										// 'text-size': 11,
										// 'text-transform': 'uppercase',
										// 'text-letter-spacing': 0.05,
										// 'text-offset': [0, 3],
									},

									// paint : {
									// 	'icon-opacity': 1,
									// }
								} );

								map.on('click', 'unclustered-points', (e) => {
									const post = {
										date: e.features[0].properties.date,
										link: e.features[0].properties.link,
										title: {
											rendered: JSON.parse(e.features[0].properties.title)?.rendered,
										}
									}

									const popupHTML = this.popupTemplate( {
										post,
										read_more: window.jeoMapVars.string_read_more,
										show_featured_media: false,
									} );

									new mapboxgl.Popup()
										.setLngLat(e.lngLat)
										.setHTML( popupHTML )
										.addTo(map);
								});
								map.loadImage(
									jeoMapVars.images['/js/src/icons/news-marker-hover'].url,
									function ( error, image ) {
										if ( error ) throw error;

										map.addImage( 'news-marker-hover', image );

										map.addLayer( {
											id: 'hover-unclustered-points',
											type: 'symbol',
											source: 'storiesSource',
											filter: [ '!', [ 'has', 'point_count' ] ],
											layout: {
												'icon-image': 'news-marker-hover',
												'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news-marker-hover'].icon_size ),
												'icon-allow-overlap': true,
											},

											paint: {
												'icon-opacity': [
													'case',
													[ 'boolean', [ 'feature-state', 'hover' ], false ],
													1,
													0,
												],
											},
										} );
									}
								);

								map.loadImage( jeoMapVars.images['/js/src/icons/news'].url, (
									error,
									image
								) => {
									if ( error ) throw error;

									map.addImage( 'news-no-marker', image );

									const layers = [
										// [6, '#000000'],
										// [5, '#f28cb1'],
										// [2, '#f1f075'],
										[ 0, jeoMapVars.cluster.circle_color ],
									];

									// cluster circle layer
									layers.forEach( ( layer, i ) => {
										map.addLayer( {
											id: 'cluster-layer',
											type: 'circle',
											source: 'storiesSource',
											paint: {
												'circle-color': layer[ 1 ],
												'circle-radius': 20 + layer[ 0 ],
												'circle-stroke-color': '#ffffff',
												'circle-stroke-opacity': 0.4,
												'circle-stroke-width': 9,
											},
											filter:
												i === 0
													? [ '>=', 'point_count', layer[ 0 ] ]
													: [
															'all',
															[ '>=', 'point_count', layer[ 0 ] ],
															[ '<', 'point_count', layers[ i - 1 ][ 0 ] ],
													],
										} );
									} );

									const flyIntoCluster = (map, coordinates) => {
										const maxZoom = 13;

										map.flyTo({
											center: coordinates,
											zoom: maxZoom,
											bearing: 0,
											speed: 1,
											curve: 1,
										});
									}

									map.on('click', 'cluster-layer', function (e) {
										const features = map.queryRenderedFeatures(e.point, { layers: ['cluster-layer'] });
										const clusterId = features[0].properties.cluster_id
										const pointCount = features[0].properties.point_count
										const clusterSource = map.getSource('storiesSource');
										//const self = this;
										self.spiderifier.unspiderfy();

										function multiDimensionalUnique(arr) {
											var uniques = [];
											var itemsFound = {};
											for(var i = 0, l = arr.length; i < l; i++) {
												var stringified = JSON.stringify(arr[i]);
												if(itemsFound[stringified]) { continue; }
												uniques.push(arr[i]);
												itemsFound[stringified] = true;
											}
											return uniques;
										}

										function getMarkers ( features ) {
											return features.map( ( feature ) => feature.properties );
										}

										// Get all points under a cluster
										clusterSource.getClusterLeaves(clusterId, pointCount, 0, (err, aFeatures) => {
											const nextFeatures = multiDimensionalUnique(aFeatures.map( ( post ) => post.geometry.coordinates.map(val => parseFloat(val)) ));
											if (nextFeatures.length >= 2) {
												clusterSource.getClusterExpansionZoom( clusterId, (err, zoom) => {
													if (!err) {
														if (zoom > self.getArg('max_zoom')) {
															self.spiderifier.spiderfy(features[0].geometry.coordinates, getMarkers(aFeatures));
														} else {
															map.easeTo({
																center: features[0].geometry.coordinates,
																zoom
															});
														}
													}
												});
											} else {
												self.spiderifier.spiderfy(features[0].geometry.coordinates, getMarkers(aFeatures));
											}
										})

										// flyIntoCluster(map, coordinates, currentZoom);

									})

									// cluster number layer
									map.addLayer( {
										id: 'cluster-count',
										type: 'symbol',
										source: 'storiesSource',

										layout: {
											'icon-image': 'news-no-marker',
											'icon-size': parseFloat( jeoMapVars.images['/js/src/icons/news'].icon_size ),
											'icon-allow-overlap': false,
											'icon-offset': {
												stops: [
													[ 13, [ 0, -30 ] ],
													[ 17, [ 0, -90 ] ],
												],
											},
											'text-field': '{point_count}',
											'text-font': [ 'Open Sans Regular', 'Arial Unicode MS Regular' ],
											'text-size': 12,
											'text-transform': 'uppercase',
											'text-letter-spacing': 0.05,
											'text-offset': [ 0, 0.8 ],
										},

										paint: {
											'text-color': jeoMapVars.images['/js/src/icons/news'].text_color,
										},

										filter: [ 'has', 'point_count' ],
									} );

								} );
							}
						);
						map.on('mouseenter', 'cluster-layer', () => {
							map.getCanvas().style.cursor = 'pointer'
						})
						map.on('mouseleave', 'cluster-layer', () => {
							map.getCanvas().style.cursor = ''
						})
						map.on('mouseenter', 'unclustered-points', () => {
							map.getCanvas().style.cursor = 'pointer'
						})
						map.on('mouseleave', 'unclustered-points', () => {
							map.getCanvas().style.cursor = ''
						})
						map.on('mouseenter', 'cluster-count', () => {
							map.getCanvas().style.cursor = 'pointer'
						})
						map.on('mouseleave', 'cluster-count', () => {
							map.getCanvas().style.cursor = ''
						})


						// Keep requesting to get to the last page
						for (let i = 2; i <= totalPages; i++) {
							// Break to avoid respect page limiting
							if (i >= 100) {
								break;
							}

							targetURL.searchParams.set('page', i);

							fetch(targetURL)
								.then(response => { return response.json() })
								.then(moreresults => {
									cumulativePosts = [...cumulativePosts, ...moreresults];

									const sourceData = this.buildPostsGeoJson(cumulativePosts);
									map.getSource('storiesSource').setData(sourceData);
								});
						}

					}

					// if(this.map.loaded()) {
					buildRelatedPosts(this.map)
					// } else {
						// console.log("Load event")
						// this.map.on( 'load', () => {
							// console.log("Load event confirmed")
							// buildRelatedPosts(this.map)
						// })
					// }
				})
				.catch(err => {
					// Remove: Too noisy
					// alert("Error while loading posts check console");
					// console.log(err);
				})
				.then(() => {
					// Add ready state (animation flag)
					// Set done status anyway error or success ()

				});
		} );
	}

	buildPostsGeoJson( stories ) {
		const finalFeatures = {
			type: 'FeatureCollection',
			features: [],
		};

		stories.map( ( story ) => {
			const storyRelatedPoints = story.meta._related_point ?? [];
			const storyPoints = storyRelatedPoints.map( ( point ) => {
				return [ point._geocode_lon, point._geocode_lat ];
			} );

			finalFeatures.features.push(
				...storyPoints.map( ( point ) => {
					return {
						id: story.id,
						type: 'Feature',
						properties: story,
						geometry: {
							type: 'Point',
							coordinates: point,
						},
					};
				} )
			);
		} );

		return finalFeatures;
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
				? `url(${ jeoMapVars.jeoUrl }/js/src/icons/news-marker-hover.png`
				: `url(${ jeoMapVars.jeoUrl }/js/src/icons/news-marker.png`;

		const popupHTML = this.popupTemplate( {
			post,
			read_more: window.jeoMapVars.string_read_more,
			show_featured_media: false,
		} );

		const popUp = new mapboxgl.Popup().setHTML( popupHTML );

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

		const marker = new mapboxgl.Marker( { element: el, anchor: 'bottom' } )
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
				'jeo'
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

					if ( layerSetting.load_as_style ) {
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
					} else {
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
							this.map.setLayoutProperty( layer_id, 'visibility', visibility );
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
