//import { __ } from "@wordpress/i18n";

class JeoMap {

	constructor(element) {

		this.element = element;
		this.args = element.attributes;

		let map = new window.mapboxgl.Map({
			container: element,
			attributionControl: false
		});

		this.map = map;

		this.initMap()
		.then( () => {

			map.setZoom( this.getArg('initial_zoom') );

			map.setCenter( [this.getArg('center_lon'), this.getArg('center_lat')] );

			if ( this.getArg('disable_scroll_zoom') ) {
				map.scrollZoom.disable();
			}

		})
		.then( () => {

			this.getLayers().then( layers => {

				const baseLayer = layers[0];
				baseLayer.addStyle(map);

				let custom_attributions = [];

				map.on('load', () => {
					layers.forEach( (layer, i) => {

						if( layer.attribution ) {
							custom_attributions.push( layer.attribution );
						}

						if ( i === 0 ) {
							return;
						} else {
							layer.addLayer(map);
						}
					});
				});

				this.addLayersControl();

				map.addControl(
					new mapboxgl.AttributionControl({
						customAttribution: custom_attributions
					}),
					'bottom-left'
				);

			} );

			this.getRelatedPosts();

		});

		window.map = map;

	}

	initMap() {
		if ( this.getArg('map_id') ) {

			return jQuery.get(
				jeoMapVars.jsonUrl + 'map/' + this.getArg('map_id')
			).then( data => {

				this.map_post_object = data;

			});

		} else {
			return Promise.resolve();
		}
	}

	getArg(argName) {
		let value;
		if ( this.map_post_object ) {
			value = this.map_post_object.meta[argName];
		} else {
			value = jQuery(this.element).data(argName);
		}

		if ( value ) {
			return value;
		} else {
			return false;
		}
	}

	getLayers() {

		return new Promise( (resolve, reject) => {

			const layersDefinitions = this.getArg('layers');
			this.layersDefinitions = layersDefinitions;
			const layersIds = layersDefinitions.map( el => el.id );

			jQuery.get(
				jeoMapVars.jsonUrl + 'map-layer',
				{
					include: layersIds
				},
				data => {
					let returnLayers = [];
					let ordered = [];
					layersIds.forEach( (el, index) => {
						ordered[index] = data.find( l => l.id == el )
					});

					ordered.forEach( (layerObject, i) => {
						returnLayers.push(
							new window.JeoLayer(layerObject.meta.type, {
									layer_id: layerObject.slug,
									layer_name: layerObject.title.rendered,
									attribution: layerObject.meta.attribution,
									visible: layersDefinitions[i].default,
									layer_type_options: layerObject.meta.layer_type_options
							})
						);
					} );

					this.layers = returnLayers;
					resolve(returnLayers);


				}
			);

		});

	}

	getRelatedPosts() {
		return new Promise( (resolve, reject) => {

			const relatedPostsCriteria = this.getArg('related_posts');
			this.relatedPostsCriteria = relatedPostsCriteria;
			var query = [];
			query['per_page'] = 100; // TODO handle limit of posts per query
			if ( relatedPostsCriteria.cat ) {
				query['categories'] = relatedPostsCriteria.cat
			} else {
				resolve( [] );
			}
			jQuery.get(
				jeoMapVars.jsonUrl + 'posts',
				query,
				data => {

					if ( data.length ) {

						data.forEach( post => {
							this.addPostToMap(post);
						})

					}


				}
			);

		});
	}

	addPostToMap(post) {
		if ( post.meta._primary_point ) {

			post.meta._primary_point.forEach( point => {
				this.addPointToMap(point, post, 'primary')
			});

		}

		if ( post.meta._secondary_point ) {

			post.meta._secondary_point.forEach( point => {
				this.addPointToMap(point, post, 'secondary')
			});

		}

	}

	addPointToMap(point, post, type) {
		const color = type == 'secondary' ? '#CCCCCC' : '#3FB1CE';

		let marker = new mapboxgl.Marker( {color: color } );

		// TODO use a template file
		const popupHTML = '<h1><a href="' + post.link + '">' + post.title.rendered + '</a></h1>' + post.excerpt.rendered;

		let popUp = new mapboxgl.Popup().setHTML( popupHTML );

		const LngLat = {
			lat: parseFloat( point._geocode_lat.replace(',', '.') ),
			lon: parseFloat( point._geocode_lon.replace(',', '.') )
		}

		marker.setLngLat( LngLat )
		.setPopup( popUp )
		.addTo( this.map );

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
		let layers = [];
		this.layersDefinitions.forEach( (el, index) => {
			if (el.use == 'switchable') {
				layers.push(index);
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
		let layers = [];
		this.layersDefinitions.forEach( (el, index) => {
			if (el.use == 'swappable') {
				layers.push(index);
			}
		} );
		return layers;
	}

	/**
	 * return the index of the switchable layer marked as default
	 */
	getDefaultSwappableLayer() {
		let layers = [];
		this.layersDefinitions.forEach( (el, index) => {
			if (el.use == 'swappable' && el.default) {
				layers.push(index);
			}
		} );
		return layers;
	}

	addLayersControl() {
		let navElement = document.createElement('nav');

		this.getSwitchableLayers().forEach(index => {
			let link = document.createElement('a');
			link.href = '#';
			if (this.layersDefinitions[index].default) {
				link.className = 'active';
			}

			link.textContent = this.layers[index].layer_name;
			link.setAttribute('data-layer_id', this.layers[index].layer_id);

			link.onclick = e => {
				let clicked = e.currentTarget;
				const clickedLayer = clicked.dataset.layer_id;
				e.preventDefault();
				e.stopPropagation();

				var visibility = this.map.getLayoutProperty(clickedLayer, 'visibility');

				if (typeof(visibility) == 'undefined' || visibility === 'visible') {
					this.map.setLayoutProperty(clickedLayer, 'visibility', 'none');
					clicked.className = '';
				} else {
					clicked.className = 'active';
					this.map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
				}
			};

			navElement.appendChild(link);

		});

		this.getSwappableLayers().forEach(index => {
			let link = document.createElement('a');
			link.href = '#';
			link.classList.add('switchable');

			if ( this.getDefaultSwappableLayer() == index ) {
				link.classList.add('active');
			}
			link.textContent = this.layers[index].layer_name;
			link.setAttribute('data-layer_id', this.layers[index].layer_id);

			link.onclick = e => {
				if ( jQuery(e.currentTarget).hasClass('active') ) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();

				// hide all
				this.getSwappableLayers().forEach(i => {
					this.map.setLayoutProperty(this.layers[i].layer_id, 'visibility', 'none');
				});
				jQuery(navElement).children('.switchable').removeClass('active');

				// display current
				let clicked = e.currentTarget;
				const clickedLayer = clicked.dataset.layer_id;
				this.map.setLayoutProperty(clickedLayer, 'visibility', 'visible');

				var visibility = this.map.getLayoutProperty(clickedLayer, 'visibility');
				clicked.classList.add('active');

			};

			navElement.appendChild(link);

		});

		this.element.appendChild(navElement);
	}

}


(function($) {
	$(function(){
		$('.jeomap').each(function(i) {
			new JeoMap(this);
		});
	});
})(jQuery);










