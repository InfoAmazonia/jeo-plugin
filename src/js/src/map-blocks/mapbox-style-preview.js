import { useEffect, useMemo, useState } from '@wordpress/element';

import {
	mapboxToken,
	transformRequest as baseTransformRequest,
} from '../lib/mapgl-loader';
import {
	fetchJson,
	loadComposedStyleData,
} from '../shared/composed-style-data';

const TOKEN_PLACEHOLDER = '__JEO_MAPBOX_ACCESS_TOKEN__';

function normalizeStyleId( styleId = '' ) {
	return String( styleId ).replace( 'mapbox://styles/', '' ).replace( /^\/+/, '' );
}

function getLayerMeta( layer ) {
	return layer?.meta || layer || {};
}

function getLayerTypeOptions( layer ) {
	return getLayerMeta( layer )?.layer_type_options || {};
}

function getLayerId( layer ) {
	return Number.parseInt( layer?.id ?? layer?.layerPostId, 10 );
}

function getLayerSettingId( layer ) {
	return Number.parseInt( layer?.id ?? layer?.layer_post_id, 10 );
}

function shouldDisplayLayerInstance( instance ) {
	return ! (
		[ 'swappable', 'switchable' ].includes( instance?.use ) &&
		! instance?.default
	);
}

function getMapInstance( map ) {
	if ( typeof map?.getMap === 'function' ) {
		return map.getMap();
	}

	return map;
}

function getMapboxOwner( layer ) {
	const options = getLayerTypeOptions( layer );
	const styleId = normalizeStyleId( options.style_id || '' );
	const tilesetId = String( options.tileset_id || '' ).replace(
		'mapbox://',
		''
	);

	return styleId.split( '/' )[ 0 ] || tilesetId.split( '.' )[ 0 ] || '';
}

function prepareEditorStyle( style ) {
	if ( ! style || typeof style !== 'object' ) {
		return style;
	}

	const { projection, ...preparedStyle } = style;

	return {
		...preparedStyle,
	};
}

function getAccessTokenFromStyleUrl( styleUrl ) {
	try {
		return new URL( styleUrl ).searchParams.get( 'access_token' ) || mapboxToken || '';
	} catch ( error ) {
		return mapboxToken || '';
	}
}

function getViewStateFromCenter( center, fallbackZoom = null ) {
	if ( ! Array.isArray( center ) || center.length < 2 ) {
		return null;
	}

	const longitude = Number.parseFloat( center[ 0 ] );
	const latitude = Number.parseFloat( center[ 1 ] );
	const zoom = Number.parseFloat( center[ 2 ] ?? fallbackZoom );

	if ( ! Number.isFinite( longitude ) || ! Number.isFinite( latitude ) ) {
		return null;
	}

	return {
		longitude,
		latitude,
		zoom: Number.isFinite( zoom ) ? zoom : undefined,
	};
}

function getViewStateFromBounds( bounds, fallbackZoom = null ) {
	if ( ! Array.isArray( bounds ) || bounds.length < 4 ) {
		return null;
	}

	const west = Number.parseFloat( bounds[ 0 ] );
	const south = Number.parseFloat( bounds[ 1 ] );
	const east = Number.parseFloat( bounds[ 2 ] );
	const north = Number.parseFloat( bounds[ 3 ] );

	if (
		! Number.isFinite( west ) ||
		! Number.isFinite( south ) ||
		! Number.isFinite( east ) ||
		! Number.isFinite( north )
	) {
		return null;
	}

	return {
		longitude: ( west + east ) / 2,
		latitude: ( south + north ) / 2,
		zoom: Number.isFinite( Number.parseFloat( fallbackZoom ) )
			? Number.parseFloat( fallbackZoom )
			: undefined,
	};
}

function getStyleViewState( style ) {
	return getViewStateFromCenter( style?.center, style?.zoom );
}

function getSourceTilesetIds( source ) {
	const sourceUrl = String( source?.url || '' );

	if ( ! sourceUrl.startsWith( 'mapbox://' ) ) {
		return [];
	}

	return sourceUrl
		.replace( 'mapbox://', '' )
		.split( ',' )
		.map( ( tilesetId ) => tilesetId.trim() )
		.filter( Boolean );
}

async function getTileJsonViewState( style, styleUrl ) {
	const sourceTilesets = Object.values( style?.sources || {} )
		.flatMap( getSourceTilesetIds );
	const preferredTilesets =
		sourceTilesets.filter( ( tilesetId ) => ! tilesetId.startsWith( 'mapbox.' ) );
	const tilesets = preferredTilesets.length ? preferredTilesets : sourceTilesets;
	const accessToken = getAccessTokenFromStyleUrl( styleUrl );

	for ( const tilesetId of tilesets ) {
		if ( ! accessToken ) {
			continue;
		}

		const url = new URL(
			`https://api.mapbox.com/v4/${ tilesetId }.json`
		);
		url.searchParams.set( 'access_token', accessToken );

		try {
			const tileJson = await fetchJson( url.toString() );
			const viewState =
				getViewStateFromCenter( tileJson.center ) ||
				getViewStateFromBounds(
					tileJson.bounds,
					tileJson.center?.[ 2 ] || tileJson.minzoom
				);

			if ( viewState ) {
				return viewState;
			}
		} catch ( error ) {
			// Try the next tileset; the style itself can still render without this.
		}
	}

	return null;
}

export function isAbortError( error ) {
	const message = String( error?.message || error || '' );

	return /aborted|aborterror/i.test( message );
}

export function handleEditorMapPreviewError( event ) {
	const error = event?.error || event;

	if ( isAbortError( error ) ) {
		return;
	}

	console.warn( 'Map preview error.', error );
}

export function getMapboxStyleUrl( options = {} ) {
	const styleId = normalizeStyleId( options.style_id || '' );

	if ( ! styleId ) {
		return null;
	}

	const url = new URL( `https://api.mapbox.com/styles/v1/${ styleId }` );
	const accessToken = options.access_token || mapboxToken || '';

	if ( accessToken ) {
		url.searchParams.set( 'access_token', accessToken );
	}

	return url.toString();
}

export function hasMapboxStyleLayers( layers = [] ) {
	return layers.some( ( layer ) => getLayerMeta( layer )?.type === 'mapbox' );
}

export function getVisibleMapboxStyleUrl( layerSettings = [], loadedLayers = [] ) {
	for ( const instance of layerSettings ) {
		if ( ! shouldDisplayLayerInstance( instance ) ) {
			continue;
		}

		const layer = loadedLayers.find(
			( loadedLayer ) => getLayerId( loadedLayer ) === getLayerSettingId( instance )
		);

		if ( getLayerMeta( layer )?.type !== 'mapbox' ) {
			continue;
		}

		return getMapboxStyleUrl( getLayerTypeOptions( layer ) );
	}

	return null;
}

export function useEditorMapboxTransformRequest( layers = [] ) {
	const customTokens = useMemo( () => {
		const tokens = {};

		layers.forEach( ( layer ) => {
			const options = getLayerTypeOptions( layer );
			const accessToken = options.access_token;
			const owner = getMapboxOwner( layer );

			if ( accessToken && owner ) {
				tokens[ owner ] = accessToken;
			}
		} );

		return tokens;
	}, [ JSON.stringify( layers.map( ( layer ) => {
		const options = getLayerTypeOptions( layer );
		return {
			id: getLayerId( layer ),
			type: getLayerMeta( layer )?.type,
			styleId: options.style_id,
			tilesetId: options.tileset_id,
			accessToken: options.access_token,
		};
	} ) ) ] );

	return useMemo( () => {
		return ( url, resourceType ) => {
			let nextUrl = String( url || '' );
			let transformed = { url: nextUrl };

			if ( nextUrl.includes( TOKEN_PLACEHOLDER ) ) {
				nextUrl = nextUrl.replaceAll(
				    TOKEN_PLACEHOLDER,
					encodeURIComponent( mapboxToken || '' )
				);
			}

			if ( typeof baseTransformRequest === 'function' ) {
				transformed = baseTransformRequest( nextUrl, resourceType ) || {
					url: nextUrl,
				};
				nextUrl = transformed.url || nextUrl;
			}

			for ( const owner of Object.keys( customTokens ) ) {
				if (
					! nextUrl.includes( `${ owner }/` ) &&
					! nextUrl.includes( `${ owner }.` )
				) {
					continue;
				}

				try {
					const parsedUrl = new URL( nextUrl );
					parsedUrl.searchParams.set(
						'access_token',
						customTokens[ owner ]
					);
					nextUrl = parsedUrl.toString();
				} catch ( error ) {
					// Keep the URL produced by the base transformer.
				}
			}

			return {
				...transformed,
				url: nextUrl,
			};
		};
	}, [ customTokens ] );
}

export function useComposedMapPreviewStyle( {
	enabled = true,
	forceRefresh = false,
	mapId,
	refreshKey = '',
} ) {
	return useComposedPreviewStyle( {
		dependencies: [ enabled, forceRefresh, mapId, refreshKey ],
		enabled:
			enabled &&
			Boolean( mapId ) &&
			Boolean( window.jeoMapVars?.composedStyleUrlBase ),
		loadPreview: () => loadComposedStyleData( {
			forceRefresh,
			includeStyle: true,
			mapId,
		} ),
		warningMessage:
			'Unable to load composed Mapbox style in the editor preview.',
	} );
}

export function useComposedPayloadPreviewStyle( {
	enabled = true,
	payload,
	refreshKey = '',
} ) {
	const payloadKey = useMemo( () => JSON.stringify( payload || null ), [ payload ] );

	return useComposedPreviewStyle( {
		dependencies: [ enabled, payloadKey, refreshKey ],
		enabled:
			enabled &&
			Boolean( payload ) &&
			Boolean( window.jeoMapVars?.composedStyleComposeUrl ),
		loadPreview: () => loadComposedStyleData( {
			includeStyle: true,
			payload,
		} ),
		warningMessage:
			'Unable to load composed Mapbox style payload in the editor preview.',
	} );
}

function useComposedPreviewStyle( {
	dependencies,
	enabled,
	loadPreview,
	warningMessage,
} ) {
	const [ state, setState ] = useState( {
		error: null,
		isLoading: false,
		manifest: null,
		metadata: null,
		style: null,
	} );

	useEffect( () => {
		if ( ! enabled ) {
			setState( {
				error: null,
				isLoading: false,
				manifest: null,
				metadata: null,
				style: null,
			} );
			return undefined;
		}

		let didCancel = false;
		setState( ( currentState ) => ( {
			...currentState,
			error: null,
			isLoading: true,
		} ) );

		loadPreview()
			.then( ( { manifest, metadata, style } ) => {
				if ( didCancel ) {
					return;
				}

				setState( {
					error: null,
					isLoading: false,
					manifest,
					metadata,
					style: prepareEditorStyle( style ),
				} );
			} )
			.catch( ( error ) => {
				if ( didCancel ) {
					return;
				}

				console.warn( warningMessage, error );
				setState( {
					error,
					isLoading: false,
					manifest: null,
					metadata: null,
					style: null,
				} );
			} );

		return () => {
			didCancel = true;
		};
	}, dependencies );

	return state;
}

export function useMapboxStylePreview( styleUrl ) {
	const [ state, setState ] = useState( {
		error: null,
		isLoading: false,
		style: null,
		viewState: null,
	} );

	useEffect( () => {
		if ( ! styleUrl ) {
			setState( {
				error: null,
				isLoading: false,
				style: null,
				viewState: null,
			} );
			return undefined;
		}

		let didCancel = false;

		setState( ( currentState ) => ( {
			...currentState,
			error: null,
			isLoading: true,
		} ) );

		fetchJson( styleUrl )
			.then( async ( style ) => {
				const viewState =
					getStyleViewState( style ) ||
					( await getTileJsonViewState( style, styleUrl ) );

				if ( didCancel ) {
					return;
				}

				setState( {
					error: null,
					isLoading: false,
					style: prepareEditorStyle( style ),
					viewState,
				} );
			} )
			.catch( ( error ) => {
				if ( didCancel ) {
					return;
				}

				if ( ! isAbortError( error ) ) {
					console.warn( 'Unable to load Mapbox style preview.', error );
				}

				setState( {
					error,
					isLoading: false,
					style: null,
					viewState: null,
				} );
			} );

		return () => {
			didCancel = true;
		};
	}, [ styleUrl ] );

	return state;
}

export function applyComposedVisibilityFromSettings(
	map,
	manifest,
	layerSettings = []
) {
	const mapInstance = getMapInstance( map );

	if ( ! mapInstance || ! manifest?.layers ) {
		return;
	}

	const settingsByLayerId = new Map(
		layerSettings.map( ( layer ) => [ String( getLayerSettingId( layer ) ), layer ] )
	);

	manifest.layers.forEach( ( manifestLayer ) => {
		const setting = settingsByLayerId.get(
			String( manifestLayer.layerPostId )
		);
		const visible = setting
			? shouldDisplayLayerInstance( setting )
			: manifestLayer.initialVisible;

		( manifestLayer.compositeLayers || [] ).forEach( ( compositeLayer ) => {
			if ( ! mapInstance.getLayer( compositeLayer.compositeId ) ) {
				return;
			}

			mapInstance.setLayoutProperty(
				compositeLayer.compositeId,
				'visibility',
				visible && compositeLayer.visibleWhenLayerOn !== false
					? 'visible'
					: 'none'
			);
		} );
	} );
}

export function applyComposedVisibilityFromSelection(
	map,
	manifest,
	selectedLayers = []
) {
	const mapInstance = getMapInstance( map );

	if ( ! mapInstance || ! manifest?.layers ) {
		return;
	}

	const selectedLayerIds = new Set(
		selectedLayers
			.map( ( layer ) => getLayerSettingId( layer ) )
			.filter( Number.isFinite )
			.map( String )
	);

	manifest.layers.forEach( ( manifestLayer ) => {
		const visible = selectedLayerIds.has( String( manifestLayer.layerPostId ) );

		( manifestLayer.compositeLayers || [] ).forEach( ( compositeLayer ) => {
			if ( ! mapInstance.getLayer( compositeLayer.compositeId ) ) {
				return;
			}

			mapInstance.setLayoutProperty(
				compositeLayer.compositeId,
				'visibility',
				visible && compositeLayer.visibleWhenLayerOn !== false
					? 'visible'
					: 'none'
			);
		} );
	} );
}
