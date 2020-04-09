import template from 'lodash.template';

class JeoMap {
	constructor( element ) {
		this.element = element;
		this.args = element.attributes;

		this.layers = [];
		this.legends = [];

		const map = new window.mapboxgl.Map( {
			container: element,
			attributionControl: false,
		} );

		this.map = map;
		this.options = jQuery( this.element ).data( 'options' );

		this.moreInfoTemplate = template( window.jeoMapVars.templates.moreInfo );

		this.popupTemplate = template(
			`<article class="popup">${
				window.jeoMapVars.templates.postPopup
			}</article>`,
		);

		this.initMap()
			.then( () => {
				map.setZoom( this.getArg( 'initial_zoom' ) );

				map.setCenter( [ this.getArg( 'center_lon' ), this.getArg( 'center_lat' ) ] );

				map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );

				if ( this.getArg( 'disable_scroll_zoom' ) ) {
					map.scrollZoom.disable();
				}

				if ( this.getArg( 'disable_drag_rotate' ) ) {
					map.dragRotate.disable();
					map.touchZoomRotate.disableRotation();
				}

				if (
					this.getArg( 'max_bounds_ne' ) &&
					this.getArg( 'max_bounds_sw' ) &&
					this.getArg( 'max_bounds_ne' ).length === 2 &&
					this.getArg( 'max_bounds_sw' ).length === 2

				) {
					map.setMaxBounds(
						[
							this.getArg( 'max_bounds_sw' ),
							this.getArg( 'max_bounds_ne' ),
						]
					);
				}

				if ( this.getArg( 'min_zoom' ) ) {
					map.setMinZoom( this.getArg( 'min_zoom' ) );
				}
				if ( this.getArg( 'max_zoom' ) ) {
					map.setMaxZoom( this.getArg( 'max_zoom' ) );
				}
			} )
			.then( () => {
				this.getLayers().then( ( layers ) => {
					const baseLayer = layers[ 0 ];
					baseLayer.addStyle( map );

					const customAttribution = [];

					map.on( 'load', () => {
						layers.forEach( ( layer, i ) => {
							if ( layer.attribution ) {
								customAttribution.push( `<a href="${ layer.attribution }">${ layer.attribution }</a>` );
							}

							if ( i > 0 ) {
								layer.addLayer( map );
							}

							layer.addInteractions( map );
						} );
					} );

					this.addLayersControl();

					map.addControl(
						new mapboxgl.AttributionControl( {
							customAttribution,
						} ),
						'bottom-left'
					);

					this.addMoreButtonAndLegends();
				} );

				this.getRelatedPosts();
			} );

		window.map = map;
	}

	initMap() {
		if ( this.getArg( 'map_id' ) ) {
			return jQuery.get(
				jeoMapVars.jsonUrl + 'map/' + this.getArg( 'map_id' )
			).then( ( data ) => {
				this.map_post_object = data;
			} );
		}
		return Promise.resolve();
	}

	/**
	 * Adds the "More" button that will open the Content of the Map post in an overlayer
	 *
	 * This will only work for maps stored in the database and not for one-time use maps
	 */
	addMoreButtonAndLegends() {
		if ( ! this.map_post_object ) {
			return;
		}

		const container = document.createElement( 'div' );
		container.classList.add( 'legend-container' );

		const hideableContent = document.createElement( 'div' );
		hideableContent.classList.add( 'hideable-content' );

		const legendsTitle = document.createElement( 'div' );
		legendsTitle.classList.add( 'legends-title' );
		legendsTitle.innerHTML = '<span class="text"> Legend </span>';

		const legendsHideIcon = document.createElement( 'i' );
		legendsHideIcon.classList.add( 'arrow-icon', 'active' );

		legendsTitle.appendChild( legendsHideIcon );
		container.appendChild( legendsTitle );

		legendsHideIcon.addEventListener( 'click', ( ) => {
			if ( legendsHideIcon.classList.contains( 'active' ) ) {
				legendsHideIcon.classList.remove( 'active' );
				jQuery( '.hideable-content' ).slideToggle( 'slow' );
			} else {
				legendsHideIcon.classList.add( 'active' );
				jQuery( '.hideable-content' ).slideToggle( 'slow' );
			}
		} );

		const legendsWrapper = document.createElement( 'div' );
		legendsWrapper.classList.add( 'legends-wrapper' );
		hideableContent.appendChild( legendsWrapper );

		if ( this.legends.length > 0 ) {
			this.legends.forEach( ( legend ) => {
				const legendContainer = document.createElement( 'div' );
				legendContainer.classList.add( 'legend-for-' + legend.layer_id );
				legendContainer.appendChild( legend.render() );
				legendsWrapper.appendChild( legendContainer );
			} );
		}

		if ( this.map_post_object ) {
			const moreDiv = document.createElement( 'div' );

			moreDiv.classList.add( 'more-info-overlayer' );
			moreDiv.innerHTML = this.moreInfoTemplate( {
				map: this.map_post_object,
			} );

			const closeButton = document.createElement( 'div' );
			closeButton.classList.add( 'more-info-close' );
			closeButton.innerHTML = '<button class="mapboxgl-popup-close-button" type="button" aria-label="Close popup"><span>×</span></button>';

			closeButton.click( function( e ) {

			} );

			closeButton.onclick = ( e ) => {
				e.preventDefault();
				e.stopPropagation();

				jQuery( e.currentTarget ).parent().hide();
			};

			moreDiv.appendChild( closeButton );

			const moreButton = document.createElement( 'a' );
			moreButton.classList.add( 'more-info-button' );
			moreButton.innerHTML = 'Info';

			moreButton.onclick = ( e ) => {
				e.preventDefault();
				e.stopPropagation();
				jQuery( e.currentTarget ).parent().parent().siblings( '.more-info-overlayer' ).show();
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
				jQuery( this.element ).find( '.legend-for-' + l.layer_id ).hide();
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
			const layersIds = layersDefinitions.map( ( el ) => el.id );

			jQuery.get(
				jeoMapVars.jsonUrl + 'map-layer',
				{
					include: layersIds,
					orderby: 'include',
				},
				( data ) => {
					const returnLayers = [];
					const returnLegends = [];
					const ordered = [];
					layersIds.forEach( ( el, index ) => {
						ordered[ index ] = data.find( ( l ) => l.id == el );
					} );

					ordered.forEach( ( layerObject, i ) => {
						returnLayers.push(
							new window.JeoLayer( layerObject.meta.type, {
								layer_id: layerObject.slug,
								layer_name: layerObject.title.rendered,
								attribution: layerObject.meta.attribution,
								visible: layersDefinitions[ i ].default,
								layer_type_options: layerObject.meta.layer_type_options,
							} )
						);

						if ( layerObject.meta.legend_type !== 'none' && layersDefinitions[ i ].show_legend ) {
							returnLegends.push(
								new window.JeoLegend( layerObject.meta.legend_type, {
									layer_id: layerObject.slug,
									legend_type_options: layerObject.meta.legend_type_options,
								} )
							);
						}
					} );

					this.layers = returnLayers;
					this.legends = returnLegends;
					resolve( returnLayers );
				}
			);
		} );
	}

	getRelatedPosts() {
		return new Promise( ( resolve, reject ) => {
			const relatedPostsCriteria = this.getArg( 'related_posts' );
			this.relatedPostsCriteria = relatedPostsCriteria;
			const query = {};
			query.per_page = 100; // TODO handle limit of posts per query

			const keys = Object.keys( relatedPostsCriteria );

			for ( const i in keys ) {
				query[ keys[ i ] ] = relatedPostsCriteria[ keys[ i ] ];
			}

			if ( keys.length < 1 ) {
				resolve( [] );
			}

			query._embed = 1;

			jQuery.get(
				jeoMapVars.jsonUrl + 'posts',
				query,
				( data ) => {
					if ( data.length ) {
						data.forEach( ( post ) => {
							this.addPostToMap( post );
						} );
					}
				}
			);
		} );
	}

	addPostToMap( post ) {
		if ( post.meta._related_point ) {
			post.meta._related_point.forEach( ( point ) => {
				this.addPointToMap( point, post );
			} );
		}
	}

	addPointToMap( point, post ) {
		const color = point.relevance === 'secondary' ? '#CCCCCC' : '#3FB1CE';
		const marker = new mapboxgl.Marker( { color } );

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

		marker.setLngLat( LngLat );

		if ( ! this.options || this.options.marker_action !== 'embed_preview' ) {
			marker.setPopup( popUp );
		}

		marker.addTo( this.map );

		if ( this.options && this.options.marker_action === 'embed_preview' ) {
			marker.getElement().addEventListener( 'click', () => {
				this.updateEmbedPreview( post );
			} );

			// By default, activate the first post
			if ( ! this.embedPreviewActive ) {
				this.updateEmbedPreview( post );
				this.embedPreviewActive = true;
			}
		}
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

	addLayersControl() {
		const layerSelectionTitle = document.createElement( 'div' );
		layerSelectionTitle.classList.add( 'layer-selection-title' );

		const legendsTitle = document.createElement( 'div' );
		legendsTitle.classList.add( 'legends-title' );

		const legendTextIcon = document.createElement( 'div' );
		legendTextIcon.classList.add( 'text-icon' );

		const layerIcon = document.createElement( 'i' );
		layerIcon.classList.add( 'layer-icon' );

		legendTextIcon.appendChild( layerIcon );
		legendTextIcon.innerHTML += '<span class="text"> Layers </span>';

		legendsTitle.appendChild( legendTextIcon );

		const legendsHideIcon = document.createElement( 'i' );
		legendsHideIcon.classList.add( 'arrow-icon', 'active' );

		legendsTitle.appendChild( legendsHideIcon );
		layerSelectionTitle.appendChild( legendsTitle );

		const navElement = document.createElement( 'nav' );
		navElement.classList.add( 'layers-selection' );
		navElement.appendChild( layerSelectionTitle );

		legendsHideIcon.addEventListener( 'click', ( ) => {
			if ( legendsHideIcon.classList.contains( 'active' ) ) {
				legendsHideIcon.classList.remove( 'active' );
				jQuery( '.layers-wrapper' ).slideToggle( 'slow' );
			} else {
				legendsHideIcon.classList.add( 'active' );
				jQuery( '.layers-wrapper' ).slideToggle( 'slow' );
			}
		} );

		const layers = document.createElement( 'div' );
		layers.classList.add( 'layers-wrapper' );

		this.getSwitchableLayers().forEach( ( index ) => {
			const link = document.createElement( 'a' );
			link.href = '#';
			if ( this.layersDefinitions[ index ].default ) {
				link.className = 'active';
			}

			link.textContent = this.layers[ index ].layer_name;
			link.setAttribute( 'data-layer_id', this.layers[ index ].layer_id );

			link.onclick = ( e ) => {
				const clicked = e.currentTarget;
				const clickedLayer = clicked.dataset.layer_id;
				e.preventDefault();
				e.stopPropagation();

				const visibility = this.map.getLayoutProperty( clickedLayer, 'visibility' );

				if ( typeof ( visibility ) === 'undefined' || visibility === 'visible' ) {
					this.hideLayer( clickedLayer );
					clicked.className = '';
				} else {
					clicked.className = 'active';
					this.showLayer( clickedLayer );
				}
			};

			layers.appendChild( link );
		} );

		navElement.appendChild( layers );

		this.getSwappableLayers().forEach( ( index ) => {
			const link = document.createElement( 'a' );
			link.href = '#';
			link.classList.add( 'switchable' );

			if ( this.getDefaultSwappableLayer() == index ) {
				link.classList.add( 'active' );
			}
			link.textContent = this.layers[ index ].layer_name;
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
				jQuery( layers ).children( '.switchable' ).removeClass( 'active' );

				// display current
				const clicked = e.currentTarget;
				const clickedLayer = clicked.dataset.layer_id;
				this.showLayer( clickedLayer );

				clicked.classList.add( 'active' );
			};

			layers.appendChild( link );
		} );

		navElement.appendChild( layers );

		this.element.appendChild( navElement );
	}

	changeLayerVisibitly( layer_id, visibility ) {
		this.map.getStyle().layers.forEach( ( layer ) => {
			if ( layer.id == layer_id ) {
				this.map.setLayoutProperty( layer.id, 'visibility', visibility );
			}
		} );
	}

	showLayer( layer_id ) {
		this.changeLayerVisibitly( layer_id, 'visible' );
		jQuery( this.element ).find( '.legend-for-' + layer_id ).show();
	}

	hideLayer( layer_id ) {
		this.changeLayerVisibitly( layer_id, 'none' );
		jQuery( this.element ).find( '.legend-for-' + layer_id ).hide();
	}
}

( function( $ ) {
	$( function() {
		$( '.jeomap' ).each( function( i ) {
			new JeoMap( this );
		} );
	} );
}( jQuery ) );
