window.JeoLayerTypes.registerLayerType( 'mapbox', {
	addStyle( map, attributes ) {
		if ( attributes.layer_type_options.style_id && attributes.layer_type_options.style_id.includes( 'mapbox://styles/' ) ) {
			return map.setStyle(
				attributes.layer_type_options.style_id
			);
		}
		return map.setStyle(
			'mapbox://styles/' + attributes.layer_type_options.style_id
		);
	},

	addLayer( map, attributes ) {
		let style_id = attributes.layer_type_options.style_id;
		if ( style_id ) {
			style_id = style_id.replace( 'mapbox://styles/', '' );
		}
		const accessToken =
			typeof attributes.layer_type_options.access_token !== 'undefined' ?
				attributes.layer_type_options.access_token :
				window.mapboxgl.accessToken;
		const layer = {
			id: attributes.layer_id,
			source: {
				type: 'raster',
				tiles: [
					'https://api.mapbox.com/styles/v1/' +
						style_id +
						'/tiles/256/{z}/{x}/{y}@2x?access_token=' +
						accessToken,
				],
			},
			type: 'raster',
		};
		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}
		return map.addLayer( layer );
	},

	addInteractions( map, attributes ) {
		if ( attributes.layer_type_options.interactions ) {
			const int = attributes.layer_type_options.interactions;
			const interactionsIds = int.map( i => i.id );

			int.forEach( ( interaction ) => {
				const vLayers = map.getSource( 'composite' ).vectorLayers;
				const vLayer = vLayers.find( ( el ) => {
					return el.id == interaction.id;
				} );
				let parentLayer = false;

				// find layer
				Object.keys( map.style._layers ).forEach( ( key ) => {
					if ( map.style._layers[ key ].sourceLayer == interaction.id ) {
						parentLayer = map.style._layers[ key ];
					}
				} );

				if ( vLayer && parentLayer ) {
					const type = interaction.on === 'click' || interaction.on === 'mouseover' ? interaction.on : 'click';
					const popUp = new mapboxgl.Popup( {
						className: type === 'mouseover' ? 'jeo-popup__mouseover' : '',
						closeButton: type === 'click',
						closeOnClick: true,
						maxWidth: '300px',
						// anchor: 'right' // parameter to anchor direction 'bottom' default
					} );

					map.on( type, parentLayer.id, function( e ) {
						// Change the cursor style as a UI indicator.
						map.getCanvas().style.cursor = 'pointer';

						const feature = e.features[ 0 ];

						const coordinates = feature.geometry.coordinates.slice();

						// Ensure that if the map is zoomed out such that multiple
						// copies of the feature are visible, the popup appears
						// over the copy being pointed to.
						while ( Math.abs( e.lngLat.lng - coordinates[ 0 ] ) > 180 ) {
							coordinates[ 0 ] += e.lngLat.lng > coordinates[ 0 ] ? 360 : -360;
						}

						let html = '';

						// title
						if ( feature.properties.hasOwnProperty( interaction.title ) ) {
							html += '<h3>' + feature.properties[ interaction.title ] + '</h3>';
						}

						interaction.fields.forEach( ( field ) => {
							if ( feature.properties.hasOwnProperty( field.field ) ) {
								html += '<p><strong>' + field.label + ': </strong>' + feature.properties[ field.field ] + '</p>';
							}
						} );

						// Populate the popup and set its coordinates
						// based on the feature found.
						popUp.setLngLat( [ e.lngLat.lng, e.lngLat.lat ] )
							.setHTML( html )
							.addTo( map );
					} );
					let isOverlapping = false;
					map.on( 'mouseenter', parentLayer.id, function ( e ) {
						const features = map.queryRenderedFeatures( e.point );
						isOverlapping = features.some( 
							f => interactionsIds.includes( f.sourceLayer ) && 
							f.sourceLayer != interaction.id );
						map.getCanvas().style.cursor = 'pointer';
					} );
					map.on( 'mouseleave', parentLayer.id, function() {
						if ( ! isOverlapping ) {
							map.getCanvas().style.cursor = '';
						}
						if( type === 'mouseover' ) {
							popUp.remove();
						}
					} );
				}
			} );
		}
	},

	getSchema( attributes ) {
		const baseSchema = {
			type: 'object',
			required: [ 'style_id' ],
			properties: {
				style_id: {
					type: 'string',
					title: 'Style ID',
					description: 'The mapbox Style ID includes the user name and id. Example: username/id or mapbox://styles/username/id',
				},
				access_token: {
					type: 'string',
					title: 'Access token',
					description:
						'Optional. If this layer needs a different access token from the one set in Settings, inform it here.',
				},
			},
		};

		return new Promise( function( resolve ) {
			resolve( baseSchema );
		} );
	},

	getStyleLayers( attributes ) {
		return new Promise( ( resolve, reject ) => {
			if ( ! attributes ) {
				resolve( null );
			}

			let formLayers = [];

			this
				._getStyleLayers( attributes )
				.then( ( layers ) => {
					if ( layers.vector_layers ) {
						formLayers = layers.vector_layers.map( ( layer ) => {
							return {
								id: layer.id,
								fields: layer.fields,
								source: layer.source,
								sourceName: layer.source_name,
							};
						} );
					}

					resolve( formLayers );
				} ).catch( ( error ) => {
					reject( error );
				} );
		} );
	},

	_styleDefinitions: [],
	_styleLayers: [],

	_getStyleDefinition( attributes ) {
		const self = this;

		return new Promise( function( resolve ) {
			// cache
			if ( self._styleDefinitions[ attributes.layer_id ] ) {
				resolve( self._styleDefinitions[ attributes.layer_id ] );
			}

			const accessToken =
				typeof attributes.layer_type_options.access_token !== 'undefined' ?
					attributes.layer_type_options.access_token :
					window.mapboxgl.accessToken;

			if ( accessToken && attributes.layer_type_options.style_id ) {
				let style_id = attributes.layer_type_options.style_id;
				if ( style_id ) {
					style_id = style_id.replace( 'mapbox://styles/', '' );
				}

				jQuery.get(
					'https://api.mapbox.com/styles/v1/' +
						style_id +
						'?access_token=' +
						accessToken,
					function( data ) {
						self._styleDefinitions[ attributes.layer_id ] = data;
						resolve( data );
					}
				);
			}
		} );
	},

	_getStyleLayers( attributes ) {
		const self = this;

		return new Promise( function( resolve, reject ) {
			// cache
			if ( self._styleLayers[ attributes.layer_id ] ) {
				resolve( self._styleLayers[ attributes.layer_id ] );
			}

			const accessToken =
				typeof attributes.layer_type_options.access_token !== 'undefined' ?
					attributes.layer_type_options.access_token :
					window.mapboxgl.accessToken;

			self._getStyleDefinition( attributes ).then( function( styleDefinition ) {
				const composite =
					self._styleDefinitions[ attributes.layer_id ].sources.composite;

				if ( typeof composite === 'object' ) {
					const layers = composite.url.replace( 'mapbox://', '' );
					if ( layers && accessToken ) {
						jQuery.get(
							'https://api.mapbox.com/v4/' +
								layers +
								'.json?secure&access_token=' +
								accessToken,
							function( data ) {
								self._styleLayers[ attributes.layer_id ] = data;
								resolve( data );
							}
						);
					}
				} else {
					reject( 'No composite source' );
				}
			} );
		} );
	},
} );
