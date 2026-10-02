import {
	mapboxToken,
	transformRequest as defaultTransformRequest,
} from '../lib/mapgl-loader';

function getInlineStyle( options ) {
	const raw = ( options.inline_style || '' ).trim();

	if ( ! raw ) {
		return null;
	}

	try {
		const parsed = JSON.parse( raw );
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch ( error ) {
		console.warn( '[JEO] Invalid inline style JSON.', error );
		return null;
	}
}

/**
 * Resolve a style-json layer's style from its options, without requiring a
 * layer instance. Inline JSON takes precedence over the style URL. Both are
 * valid `mapStyle` inputs for the map preview.
 *
 * @param {Object} options layer_type_options.
 * @return {string|Object|null}
 */
export function getStyleJsonStyle( options = {} ) {
	return getInlineStyle( options ) || ( options.style_url || '' ).trim() || null;
}

/**
 * Resolve the base style of a style-type layer instance (mapbox, style-json,
 * or any future provider following the same conventions).
 *
 * Returns a style URL string or an inline style object — both are valid
 * `map.setStyle()` / `mapStyle` inputs. Resolution order mirrors the
 * geojson layer type: inline JSON takes precedence over the URL.
 *
 * @param {Object} layer  Layer CPT record meta.
 * @param {Object} instance Layer instance settings from the map config.
 * @return {string|Object|null}
 */
export function getStyleLayerStyle( layer, instance ) {
	if ( ! instance?.load_as_style || ! layer ) {
		return null;
	}

	const options = layer.layer_type_options || {};

	const inline = getInlineStyle( options );
	if ( inline ) {
		return inline;
	}

	// Generic style-URL convention: any style-type layer (style-json and
	// future providers) can point directly to a style JSON URL.
	if ( options.style_url ) {
		return options.style_url.trim();
	}

	// Legacy Mapbox style: resolve through the Mapbox Styles API.
	if ( 'mapbox' === layer.type && options.style_id ) {
		const accessToken = options.access_token || mapboxToken;
		const styleId = options.style_id.replace( 'mapbox://styles/', '' );

		if ( styleId && accessToken ) {
			return `https://api.mapbox.com/styles/v1/${ styleId }?access_token=${ accessToken }`;
		}
	}

	return null;
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

		const style = getStyleLayerStyle( record.meta, instance );
		if ( style ) {
			const customTokens = getCustomTokens( record.meta, instance );
			return {
				instance,
				style,
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

	const props = { mapStyle: styleBase.style };
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
