window.JeoLayerTypes.registerLayerType( 'mapbox', {
	label: 'Mapbox Style',

	addStyle( map, attributes ) {
		const styleUrl = this.getStyleUrl( attributes );

		if ( styleUrl ) {
			return map.setStyle( styleUrl );
		}
	},

	addLayer( map, attributes, addLayerParams ) {
		const layerId = attributes.layer_id;

		if ( ! map.getSource( layerId ) ) {
			const accessToken = attributes.layer_type_options.access_token || globalThis.mapglLoader.mapboxToken;

			const styleId = attributes.layer_type_options.style_id?.replace( 'mapbox://styles/', '' );

			map.addSource( layerId, {
				type: 'raster',
				tiles: [
					`https://api.mapbox.com/styles/v1/${ styleId }/tiles/512/{z}/{x}/{y}@2x?access_token=${ accessToken }`,
				],
			} );
		}

		const layer = {
			id: layerId,
			source: layerId,
			type: 'raster',
		};

		if ( ! attributes.visible ) {
			layer.layout = {
				visibility: 'none',
			};
		}

		if ( addLayerParams ) {
			return map.addLayer( layer, ...addLayerParams );
		}

		return map.addLayer( layer );
	},

	_groupInteractionsByEventType( interactions ) {
		const groups = {};
		for ( const interaction of interactions ) {
			const interactionType = interaction.on === 'click' || interaction.on === 'mouseover' ? interaction.on : 'click';
			if ( groups[ interactionType ] ) {
				groups[ interactionType ].push( interaction );
			} else {
				groups[ interactionType ] = [ interaction ];
			}
		}
		return groups;
	},

	addInteractions( map, attributes ) {
		if ( attributes.layer_type_options.interactions ) {
			const interactions = attributes.layer_type_options.interactions;
			const interactionsGroups = this._groupInteractionsByEventType( interactions );

			const allLayers = map.getStyle().layers;

			for ( const [ interactionType, interactionsGroup ] of Object.entries( interactionsGroups ) ) {
				const interactionsIds = interactionsGroup.map( i => i.id );

				const filteredLayers = allLayers.filter( layer => interactionsIds.includes( layer.id ) );

				if ( filteredLayers.length > 0 ) {
					const popUp = new globalThis.mapgl.Popup( {
						className: interactionType === 'mouseover' ? 'jeo-popup__mouseover' : '',
						closeButton: interactionType === 'click',
						closeOnClick: interactionType === 'click',
						maxWidth: '300px',
						// anchor: 'right' // parameter to anchor direction 'bottom' default
					} );

					const eventType = interactionType === 'mouseover' ? 'mousemove' : interactionType;

					map.on( eventType, interactionsIds, function( e ) {
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

						for ( const interaction of interactionsGroup ) {
							if ( feature.properties.hasOwnProperty( interaction.title ) ) {
								html += '<h3>' + feature.properties[ interaction.title ] + '</h3>';
								break;
							}
						}

						const fieldsSet = new Set();
						for ( const interaction of interactionsGroup ) {
							interaction.fields.forEach( ( { field, label } ) => {
								if ( ! fieldsSet.has( field ) && feature.properties.hasOwnProperty( field ) ) {
									fieldsSet.add( field );
									html += '<p><strong>' + label + ': </strong>' + feature.properties[ field ] + '</p>';
								}
							} );
						}

						// Populate the popup and set its coordinates
						// based on the feature found.
						popUp.setLngLat( [ e.lngLat.lng, e.lngLat.lat ] )
							.setHTML( html )
							.addTo( map );
					} );

					map.on( 'mousemove', function ( e ) {
						const features = map.queryRenderedFeatures( e.point );
						const isOverlapping = features.some( f => interactionsIds.includes( f.layer.id ) );
						if ( isOverlapping ) {
							map.getCanvas().style.cursor = 'pointer';
						} else {
							map.getCanvas().style.cursor = '';
							if( eventType === 'mousemove' ) {
								popUp.remove();
							}
						}
					} );
				}
			}
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
					description:
						'The mapbox Style ID includes the user name and id. Example: username/id or mapbox://styles/username/id',
				},
				access_token: {
					type: 'string',
					title: 'Access token',
					description:
						'Optional. If this layer needs a different access token from the one set in Settings, inform it here.',
				},
			},
		};

		return new Promise( function ( resolve ) {
			resolve( baseSchema );
		} );
	},

	getStyleUrl( attributes ) {
		const accessToken = attributes.layer_type_options.access_token || globalThis.mapglLoader.mapboxToken;

		const styleId = attributes.layer_type_options.style_id?.replace( 'mapbox://styles/', '' );

		if ( styleId ) {
			return `https://api.mapbox.com/styles/v1/${ styleId }?access_token=${ accessToken }`;
		}
	},

	getStyleLayers( attributes ) {
		return new Promise( ( resolve, reject ) => {
			if ( ! attributes ) {
				resolve( null );
			}

			let formLayers = [];

			this._getStyleLayers( attributes )
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
				} )
				.catch( ( error ) => {
					reject( error );
				} );
		} );
	},

	_styleDefinitions: [],
	_styleLayers: [],

	_getStyleDefinition( attributes ) {
		const self = this;

		return new Promise( function ( resolve ) {
			// cache
			if ( self._styleDefinitions[ attributes.layer_id ] ) {
				resolve( self._styleDefinitions[ attributes.layer_id ] );
			}

			const accessToken = attributes.layer_type_options.access_token || globalThis.mapglLoader.mapboxToken;

			if ( accessToken && attributes.layer_type_options.style_id ) {
				const styleId = attributes.layer_type_options.style_id?.replace( 'mapbox://styles/', '' );

				jQuery.get(
					`https://api.mapbox.com/styles/v1/${ styleId }?access_token=${ accessToken }`,
					function ( data ) {
						self._styleDefinitions[ attributes.layer_id ] = data;
						resolve( data );
					}
				);
			}
		} );
	},

	_getStyleLayers( attributes ) {
		const self = this;

		return new Promise( function ( resolve, reject ) {
			// cache
			if ( self._styleLayers[ attributes.layer_id ] ) {
				resolve( self._styleLayers[ attributes.layer_id ] );
			}

			const accessToken = attributes.layer_type_options.access_token || globalThis.mapglLoader.mapboxToken;

			self
				._getStyleDefinition( attributes )
				.then( function ( styleDefinition ) {
					const composite =
						self._styleDefinitions[ attributes.layer_id ].sources.composite;

					if ( typeof composite === 'object' ) {
						const layers = composite.url.replace( 'mapbox://', '' );
						if ( layers && accessToken ) {
							jQuery.get(
								`https://api.mapbox.com/v4/${ layers }.json?secure&access_token=${ accessToken }`,
								function ( data ) {
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
