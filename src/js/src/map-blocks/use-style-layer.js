import {
	mapboxToken,
	transformRequest as defaultTransformRequest,
} from '../lib/mapgl-loader';

export function getMapboxStyleUrl( layer, instance ) {
	if ( ! instance?.load_as_style ) {
		return null;
	}
	if ( layer?.type !== 'mapbox' ) {
		return null;
	}

	const options = layer.layer_type_options || {};
	if ( ! options.style_id ) {
		return null;
	}

	const accessToken = options.access_token || mapboxToken;
	const styleId = options.style_id.replace( 'mapbox://styles/', '' );

	return `https://api.mapbox.com/styles/v1/${ styleId }?access_token=${ accessToken }`;
}

function getCustomTokens( layer, instance ) {
	if ( ! instance?.load_as_style || layer?.type !== 'mapbox' ) {
		return null;
	}

	const options = layer.layer_type_options || {};
	if ( ! options.access_token || ! options.style_id ) {
		return null;
	}

	const styleId = options.style_id.replace( 'mapbox://styles/', '' );
	const mapboxUser = styleId.split( '/' )[ 0 ];

	return { [ mapboxUser ]: options.access_token };
}

function createTokenAwareTransformRequest( customTokens ) {
	if ( ! customTokens ) {
		return null;
	}

	const users = Object.keys( customTokens );

	return ( url, resourceType ) => {
		let resolvedUrl = url;

		for ( const user of users ) {
			if (
				url.includes( `${ user }/` ) ||
				url.includes( `${ user }.` )
			) {
				const accessToken = customTokens[ user ];
				try {
					const parsedUrl = new URL( url );
					const parsedParams = new URLSearchParams(
						parsedUrl.search
					);
					if (
						parsedParams.get( 'access_token' ) !== accessToken
					) {
						parsedParams.set( 'access_token', accessToken );
						parsedUrl.search =
							'?' + parsedParams.toString();
						resolvedUrl = parsedUrl.toString();
					}
				} catch ( e ) {
					// URL parsing may fail for non-standard protocols
				}
				break;
			}
		}

		if ( defaultTransformRequest ) {
			return defaultTransformRequest( resolvedUrl, resourceType );
		}
		return { url: resolvedUrl };
	};
}

export function findStyleLayer( loadedLayers, instances ) {
	if ( ! loadedLayers || ! instances ) {
		return null;
	}

	for ( const instance of instances ) {
		const record = loadedLayers.find( ( r ) => r.id === instance.id );
		if ( ! record?.meta ) {
			continue;
		}

		const url = getMapboxStyleUrl( record.meta, instance );
		if ( url ) {
			const customTokens = getCustomTokens( record.meta, instance );
			return {
				instance,
				url,
				transformRequest: createTokenAwareTransformRequest(
					customTokens
				),
			};
		}
	}

	return null;
}

export function styleLayerMapProps( styleBase ) {
	if ( ! styleBase ) {
		return {};
	}

	const props = { mapStyle: styleBase.url };
	if ( styleBase.transformRequest ) {
		props.transformRequest = styleBase.transformRequest;
	}
	return props;
}

function hasMapLayer( map, layerId ) {
	return typeof map.getLayer === 'function' && map.getLayer( layerId );
}

export function applyStyleLayerFiltering( map, instance ) {
	if ( ! map || ! instance?.style_layers?.length ) {
		return;
	}

	instance.style_layers.forEach( ( styleLayer ) => {
		const layerId = styleLayer.id;

		if ( ! styleLayer.show ) {
			if ( hasMapLayer( map, layerId ) ) {
				map.removeLayer( layerId );
			}
			return;
		}

		if ( ! instance.default ) {
			if ( hasMapLayer( map, layerId ) ) {
				map.setLayoutProperty( layerId, 'visibility', 'none' );
			}
		}
	} );
}
