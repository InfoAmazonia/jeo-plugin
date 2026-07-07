export function hasComposedStyle( metadata, manifest ) {
	return Boolean(
		metadata?.style &&
		manifest?.layers?.length
	);
}

export function findComposedManifestLayer( manifest, layerId ) {
	if ( ! manifest?.layers ) {
		return null;
	}

	return manifest.layers.find(
		( layer ) =>
			layer.slug === layerId ||
			String( layer.layerPostId ) === String( layerId )
	) || null;
}

export function getComposedLayerVisibility( map, manifest, layerId ) {
	const manifestLayer = findComposedManifestLayer( manifest, layerId );

	if ( ! manifestLayer ) {
		return undefined;
	}

	for ( const compositeLayer of manifestLayer.compositeLayers || [] ) {
		if (
			compositeLayer.visibleWhenLayerOn === false ||
			! map.getLayer( compositeLayer.compositeId )
		) {
			continue;
		}

		const visibility = map.getLayoutProperty(
			compositeLayer.compositeId,
			'visibility'
		);

		if ( typeof visibility === 'undefined' || visibility === 'visible' ) {
			return 'visible';
		}
	}

	return 'none';
}

export function setComposedLayerVisibility( map, manifest, layerId, visibility ) {
	const manifestLayer = findComposedManifestLayer( manifest, layerId );

	if ( ! manifestLayer ) {
		return;
	}

	( manifestLayer.compositeLayers || [] ).forEach( ( compositeLayer ) => {
		if ( ! map.getLayer( compositeLayer.compositeId ) ) {
			return;
		}

		const nextVisibility =
			visibility === 'visible' && compositeLayer.visibleWhenLayerOn !== false
				? 'visible'
				: 'none';

		map.setLayoutProperty(
			compositeLayer.compositeId,
			'visibility',
			nextVisibility
		);
	} );
}

export function buildComposedInteractionPopupHtml( feature, interactions ) {
	const properties = feature?.properties || {};
	let html = '';

	for ( const interaction of interactions ) {
		if (
			interaction.title &&
			Object.prototype.hasOwnProperty.call( properties, interaction.title )
		) {
			html += '<h3>' + properties[ interaction.title ] + '</h3>';
			break;
		}
	}

	const fieldsSet = new Set();
	for ( const interaction of interactions ) {
		( interaction.fields || [] ).forEach( ( { field, label } ) => {
			if (
				! field ||
				fieldsSet.has( field ) ||
				! Object.prototype.hasOwnProperty.call( properties, field )
			) {
				return;
			}

			fieldsSet.add( field );
			html +=
				'<p><strong>' +
				( label || field ) +
				': </strong>' +
				properties[ field ] +
				'</p>';
		} );
	}

	return html;
}

function groupComposedInteractions( map, manifestLayers, visibleLayerIds ) {
	const groups = {};
	const visibleLayerIdSet = visibleLayerIds ? new Set( visibleLayerIds ) : null;

	( manifestLayers || [] ).forEach( ( layer ) => {
		( layer.interactions || [] ).forEach( ( interaction ) => {
			if (
				! interaction.compositeId ||
				( visibleLayerIdSet &&
					! visibleLayerIdSet.has( interaction.compositeId ) ) ||
				! map.getLayer( interaction.compositeId )
			) {
				return;
			}

			const interactionType =
				interaction.on === 'mouseover' ? 'mouseover' : 'click';

			if ( groups[ interactionType ] ) {
				groups[ interactionType ].push( interaction );
			} else {
				groups[ interactionType ] = [ interaction ];
			}
		} );
	} );

	return groups;
}

export function addComposedInteractions(
	map,
	manifestOrLayers,
	{ shouldIgnoreEvent = () => false, visibleLayerIds = null } = {}
) {
	if ( ! map || ! globalThis.mapboxgl?.Popup ) {
		return [];
	}

	const manifestLayers = Array.isArray( manifestOrLayers )
		? manifestOrLayers
		: manifestOrLayers?.layers || [];
	const groups = groupComposedInteractions(
		map,
		manifestLayers,
		visibleLayerIds
	);

	return Object.entries( groups ).flatMap(
		( [ interactionType, interactions ] ) => {
			const layerIds = [
				...new Set(
					interactions
						.map( ( interaction ) => interaction.compositeId )
						.filter( ( layerId ) => map.getLayer( layerId ) )
				),
			];

			if ( ! layerIds.length ) {
				return [];
			}

			const popUp = new globalThis.mapboxgl.Popup( {
				className:
					interactionType === 'mouseover'
						? 'jeo-popup__mouseover'
						: '',
				closeButton: interactionType === 'click',
				closeOnClick: interactionType === 'click',
				maxWidth: '300px',
			} );
			const showInteractionPopup = ( feature, lngLat ) => {
				map.getCanvas().style.cursor = 'pointer';

				if ( ! feature || ! lngLat ) {
					return;
				}

				const featureInteractions = interactions.filter(
					( interaction ) =>
						interaction.compositeId === feature.layer?.id
				);
				const html = buildComposedInteractionPopupHtml(
					feature,
					featureInteractions.length
						? featureInteractions
						: interactions
				);

				if ( ! html ) {
					return;
				}

				popUp
					.setLngLat( [ lngLat.lng, lngLat.lat ] )
					.setHTML( html )
					.addTo( map );
			};

			if ( interactionType === 'mouseover' ) {
				const handleMouseMove = ( e ) => {
					if ( ! e?.point || ! e?.lngLat ) {
						return;
					}

					if ( shouldIgnoreEvent( e ) ) {
						popUp.remove();
						return;
					}

					const features = map.queryRenderedFeatures( e.point, {
						layers: layerIds,
					} );

					if ( features.length ) {
						showInteractionPopup( features[ 0 ], e.lngLat );
					} else {
						map.getCanvas().style.cursor = '';
						popUp.remove();
					}
				};

				map.on( 'mousemove', handleMouseMove );
				return [
					() => {
						map.off( 'mousemove', handleMouseMove );
						popUp.remove();
					},
				];
			}

			const handleClick = ( e ) => {
				if ( shouldIgnoreEvent( e ) ) {
					popUp.remove();
					return;
				}

				showInteractionPopup( e?.features?.[ 0 ], e?.lngLat );
			};

			map.on( 'click', layerIds, handleClick );
			return [
				() => {
					try {
						map.off( 'click', layerIds, handleClick );
					} catch ( error ) {
						layerIds.forEach( ( layerId ) => {
							map.off( 'click', layerId, handleClick );
						} );
					}
					popUp.remove();
				},
			];
		}
	);
}
