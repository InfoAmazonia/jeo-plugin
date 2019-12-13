//import { __ } from "@wordpress/i18n";
/**
 * to test this, add the following div in the singular.php template of the twentytwenty theme
 * <div class="jeomap" data_center_lat="0" data_center_lon="0" data_initial_zoom="1" data_layers="[2,3,4]" style="width:600px; height: 600px;"></div>
 *
 * then visit any page in your site
 */


class JeoMap {

	constructor(element) {

		this.element = element;
		this.args = element.attributes;

		let map = new window.mapboxgl.Map({
			container: element
		});

		this.map = map;

		map.setZoom( this.getArg('initial_zoom') );

		map.setCenter( [this.getArg('center_lon'), this.getArg('center_lat')] );

		this.getLayers().then( layers => {

			const baseLayer = layers[0];
			baseLayer.addStyle(map);

			map.on('load', () => {
				layers.forEach( (layer, i) => {
					if ( i === 0 ) {
						return;
					} else {
						layer.addLayer(map);
					}
				});
			});

			this.addLayersControl();

		} );

		window.map = map;

	}

	getArg(argName) {
		return jQuery(this.element).data(argName);
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










