import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { List, arrayMove } from 'react-movable';
import { addQueryArgs } from '@wordpress/url';

import {
	chunkRecordIds,
	mergeRecordsByIdOrder,
} from '../../shared/rest-records';
import { addComposedInteractions } from '../../shared/composed-style-layers';
import LoadingSpinner from './loading-spinner';
import MapItem from './map-item';
import Search from './search';

const MAPS_PER_PAGE = 20;
const MAP_COLLECTION_FIELDS = 'id,title,excerpt,meta';
const STATIC_IMAGE_EXPRESSION_OPS = new Set( [
	'step',
	'case',
	'match',
	'coalesce',
	'image',
	'interpolate',
	'interpolate-hcl',
	'interpolate-lab',
] );
const STORY_INTERACTION_LAYER_IDS = [
	'unclustered-points',
	'hover-unclustered-points',
	'cluster-layer',
	'cluster-count',
	'hover-cluster-layer',
];

const normalizeMaps = ( maps = [] ) =>
	( Array.isArray( maps ) ? maps : [] )
		.filter( ( map ) => ! map?.meta?.hide_in_discovery )
		.map( ( singleMap ) => ( {
			...singleMap,
			meta: {
				...singleMap.meta,
				layers: Array.isArray( singleMap?.meta?.layers )
					? singleMap.meta.layers
					: [],
			},
			queriedLayers: Array.isArray( singleMap.queriedLayers )
				? singleMap.queriedLayers
				: Array.isArray( singleMap?.meta?.layers ) &&
				  singleMap.meta.layers.length
				? null
				: [],
		} ) );

const mergeMapsById = ( currentMaps = [], nextMaps = [] ) => {
	const mapsById = new Map();

	[ ...currentMaps, ...nextMaps ].forEach( ( map ) => {
		if ( Number.isFinite( Number.parseInt( map?.id, 10 ) ) ) {
			mapsById.set( Number.parseInt( map.id, 10 ), map );
		}
	} );

	return Array.from( mapsById.values() );
};

class MapLayers extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			loadingMapLayerIds: {},
			mapsError: null,
			isLoadingMaps: false,
			mapsPage: 1,
			mapsTotalPages: 1,
			currentSearch: '',
		};
		this.pendingLayerRequests = new Map();
		this.composedMapRequests = new Map();
		this.composedLayerState = new Map();
		this.spriteAtlasRequests = new Map();
		this.spriteAtlases = new Map();
		this.styleImageMissingHandlerRegistered = false;
		this.applyLayersSequence = 0;

		this.toggleLayer = this.toggleLayer.bind( this );
		this.applyLayersChanges = this.applyLayersChanges.bind( this );
		this.updateMaps = this.updateMaps.bind( this );
		this.toggleLayersBatch = this.toggleLayersBatch.bind( this );
		this.buildSelectionState = this.buildSelectionState.bind( this );
		this.loadMapLayers = this.loadMapLayers.bind( this );
		this.fetchMapsByIds = this.fetchMapsByIds.bind( this );
		this.canLoadMoreMaps = this.canLoadMoreMaps.bind( this );
		this.loadMoreMaps = this.loadMoreMaps.bind( this );
		this.fetchComposedMap = this.fetchComposedMap.bind( this );
		this.addComposedMapboxLayer = this.addComposedMapboxLayer.bind( this );
		this.registerStyleImageMissingHandler =
			this.registerStyleImageMissingHandler.bind( this );

		if ( ! this.props.mapsLoaded ) {
			if ( this.props.isEmbed ) {
				const requestedLayers = this.getLayerIdsFromUrl();
				const requestedLayerIds = requestedLayers.map(
					( data ) => data[ 0 ]
				);
				const requestedMapIds = [
					...new Set(
						requestedLayers
							.map( ( data ) => data[ 1 ] )
							.filter( ( mapId ) =>
								Number.isFinite( Number.parseInt( mapId, 10 ) )
							)
					),
				];

				if ( requestedMapIds.length ) {
					this.fetchMapsByIds( requestedMapIds ).then(
						async ( maps ) => {
							const layersByMap = new Map();

							for ( const mapId of requestedMapIds ) {
								layersByMap.set(
									mapId,
									await this.loadMapLayers(
										maps.find(
											( singleMap ) =>
												singleMap.id === mapId
										) || null,
										maps
									)
								);
							}

							const sortedLayerBatch = requestedLayers
								.map( ( item ) =>
									layersByMap
										.get( item[ 1 ] )
										?.find(
											( layer ) => layer.id === item[ 0 ]
										)
								)
								.filter( Boolean );
							const { selectedLayers, layersQueue } =
								this.buildSelectionState(
									sortedLayerBatch.reverse()
								);

							this.props.updateState( {
								maps,
								mapsLoaded: true,
								selectedLayers,
								layersQueue,
							} );
							this.applyLayersChanges(
								layersQueue,
								selectedLayers
							);
						}
					);
				} else {
					this.fetchLayers( requestedLayerIds ).then( ( layers ) => {
						const { selectedLayers, layersQueue } =
							this.buildSelectionState( layers.reverse() );

						this.props.updateState( {
							selectedLayers,
							layersQueue,
						} );
						this.applyLayersChanges( layersQueue, selectedLayers );
					} );
				}
			} else {
				const urlParams = new URLSearchParams( window.location.search );
				const isShare = urlParams.get( 'share' );

				if ( isShare ) {
					this.fetchMaps().then( async ( maps ) => {
						const requestedLayerIds = this.getLayerIdsFromUrl().map(
							( item ) => ( { id: item[ 0 ], map: item[ 1 ] } )
						);
						const missingMapIds = [
							...new Set(
								requestedLayerIds
									.map( ( item ) => item.map )
									.filter(
										( mapId ) =>
											! maps.some(
												( singleMap ) =>
													singleMap.id === mapId
											)
									)
							),
						];
						const allMaps = missingMapIds.length
							? mergeMapsById(
									maps,
									await this.fetchMapsByIds( missingMapIds )
							  )
							: maps;
						const layersByMap = new Map();

						for ( const mapId of [
							...new Set(
								requestedLayerIds.map( ( item ) => item.map )
							),
						] ) {
							layersByMap.set(
								mapId,
								await this.loadMapLayers(
									allMaps.find(
										( singleMap ) => singleMap.id === mapId
									) || null,
									allMaps
								)
							);
						}

						const sortedLayerBatch = requestedLayerIds
							.map( ( item ) =>
								layersByMap
									.get( item.map )
									?.find( ( layer ) => layer.id === item.id )
							)
							.filter( Boolean );
						const { selectedLayers, layersQueue } =
							this.buildSelectionState(
								sortedLayerBatch.reverse()
							);

						this.props.updateState( {
							selectedLayers,
							layersQueue,
						} );
						this.applyLayersChanges( layersQueue, selectedLayers );
					} );
				} else {
					this.fetchMaps();
				}
			}
		}
	}

	fetchMaps( params = {} ) {
		const defaultParams = {
			per_page: MAPS_PER_PAGE,
			page: 1,
			search: '',
			_fields: MAP_COLLECTION_FIELDS,
			cumulative: false,
		};
		params = { ...defaultParams, ...params };

		const mapsUrl = new URL( jeoMapVars.jsonUrl + 'map/' );
		const { cumulative, ...requestParams } = params;

		this.setState( { isLoadingMaps: true } );

		Object.keys( requestParams ).forEach( ( key ) =>
			mapsUrl.searchParams.append( key, requestParams[ key ] )
		);

		if ( window.jeowpLanguageParams?.currentLang ) {
			mapsUrl.searchParams.append(
				'lang',
				window.jeowpLanguageParams.currentLang
			);
		}

		return fetch( mapsUrl )
			.then( async ( response ) => ( {
				maps: await response.json(),
				totalPages: Number.parseInt(
					response.headers.get( 'X-WP-TotalPages' ) || '1',
					10
				),
			} ) )
			.then( ( { maps, totalPages } ) => {
				const nextMaps = normalizeMaps( maps );
				const mergedMaps = cumulative
					? mergeMapsById( this.props.maps, nextMaps )
					: nextMaps;

				this.props.updateState( {
					maps: mergedMaps,
					mapsLoaded: true,
				} );
				this.setState( {
					mapsError: null,
					isLoadingMaps: false,
					mapsPage: requestParams.page,
					mapsTotalPages: totalPages,
					currentSearch: requestParams.search || '',
				} );

				return mergedMaps;
			} )
			.catch( ( error ) => {
				this.setState( {
					isLoadingMaps: false,
					mapsError: __(
						'Unable to load map layers right now.',
						'jeowp'
					),
				} );

				throw error;
			} );
	}

	fetchMapsByIds( mapIds = [] ) {
		const mapChunks = chunkRecordIds( mapIds );
		const requests = mapChunks.map( ( chunk ) => {
			const path = addQueryArgs( jeoMapVars.jsonUrl + 'map/', {
				include: chunk,
				orderby: 'include',
				per_page: chunk.length,
				_fields: MAP_COLLECTION_FIELDS,
				...( 'jeowpLanguageParams' in window &&
				window.jeowpLanguageParams?.currentLang
					? { lang: window.jeowpLanguageParams.currentLang }
					: {} ),
			} );

			return fetch( path )
				.then( ( response ) => response.json() )
				.then( ( response ) =>
					Array.isArray( response ) ? response : []
				);
		} );

		return Promise.all( requests ).then( ( maps ) =>
			normalizeMaps( mergeRecordsByIdOrder( mapIds, maps.flat() ) )
		);
	}

	fetchLayers( layersIds ) {
		const layerChunks = chunkRecordIds( layersIds );
		const requests = layerChunks.map( ( chunk ) => {
			const path = addQueryArgs( jeoMapVars.layersUrl, {
				include: chunk,
				context: 'view',
				...( 'jeowpLanguageParams' in window &&
				window.jeowpLanguageParams?.currentLang
					? { lang: window.jeowpLanguageParams.currentLang }
					: {} ),
			} );

			return fetch( path )
				.then( ( response ) => response.json() )
				.then( ( response ) =>
					Array.isArray( response ) ? response : []
				);
		} );

		return Promise.all( requests ).then( ( layers ) =>
			mergeRecordsByIdOrder( layersIds, layers.flat() )
		);
	}

	loadMapLayers( map, maps = this.props.maps ) {
		if ( ! map ) {
			return Promise.resolve( [] );
		}

		if (
			! Array.isArray( map?.meta?.layers ) ||
			map.meta.layers.length === 0
		) {
			return Promise.resolve( [] );
		}

		if ( Array.isArray( map.queriedLayers ) ) {
			return Promise.resolve( map.queriedLayers );
		}

		if ( this.pendingLayerRequests.has( map.id ) ) {
			return this.pendingLayerRequests.get( map.id );
		}

		this.setState( ( currentState ) => ( {
			loadingMapLayerIds: {
				...currentState.loadingMapLayerIds,
				[ map.id ]: true,
			},
		} ) );

		const request = this.fetchLayers(
			map.meta.layers.map( ( layer ) => layer.id )
		)
			.then( ( layers ) => {
				const queriedLayers = layers.map( ( layer ) => ( {
					...layer,
					map,
				} ) );
				const nextMaps = maps.map( ( currentMap ) =>
					currentMap.id === map.id
						? { ...currentMap, queriedLayers }
						: currentMap
				);

				this.props.updateState( { maps: nextMaps } );
				return queriedLayers;
			} )
			.finally( () => {
				this.pendingLayerRequests.delete( map.id );
				this.setState( ( currentState ) => {
					const loadingMapLayerIds = {
						...currentState.loadingMapLayerIds,
					};
					delete loadingMapLayerIds[ map.id ];
					return { loadingMapLayerIds };
				} );
			} );

		this.pendingLayerRequests.set( map.id, request );

		return request;
	}

	getLayerIdsFromUrl() {
		const urlParams = new URLSearchParams( window.location.search );
		const layerIds = urlParams.get( 'selected-layers' );

		if ( ! layerIds ) {
			return [];
		}

		try {
			return JSON.parse( layerIds )
				.map( ( item ) => {
					if ( ! Array.isArray( item ) ) {
						return null;
					}

					const layerId = Number.parseInt( item[ 0 ], 10 );
					const mapId = Number.parseInt( item[ 1 ], 10 );

					if ( ! Number.isFinite( layerId ) ) {
						return null;
					}

					return Number.isFinite( mapId )
						? [ layerId, mapId ]
						: [ layerId ];
				} )
				.filter( Boolean );
		} catch ( error ) {
			return [];
		}
	}

	fetchJson( url ) {
		return fetch( url, {
			headers: jeoMapVars?.nonce
				? {
						'X-WP-Nonce': jeoMapVars.nonce,
				  }
				: {},
		} ).then( ( response ) => {
			if ( ! response.ok ) {
				throw new Error(
					`${ response.status } ${ response.statusText }`
				);
			}

			return response.json();
		} );
	}

	fetchComposedMap( mapId ) {
		if ( ! mapId || ! window.jeoMapVars?.composedStyleUrlBase ) {
			return Promise.reject(
				new Error(
					__( 'Mapbox style composition is unavailable.', 'jeowp' )
				)
			);
		}

		if ( this.composedMapRequests.has( mapId ) ) {
			return this.composedMapRequests.get( mapId );
		}

		const request = this.fetchJson(
			`${ jeoMapVars.composedStyleUrlBase }${ mapId }`
		)
			.then( async ( metadata ) => {
				if (
					! metadata?.enabled ||
					! metadata.style ||
					! metadata.manifest
				) {
					throw new Error(
						metadata?.error ||
							__(
								'Mapbox style composition is unavailable for this map.',
								'jeowp'
							)
					);
				}

				const [ style, manifest ] = await Promise.all( [
					this.fetchJson( metadata.style ),
					this.fetchJson( metadata.manifest ),
				] );

				return { metadata, style, manifest };
			} )
			.catch( ( error ) => {
				this.composedMapRequests.delete( mapId );
				throw error;
			} );

		this.composedMapRequests.set( mapId, request );
		return request;
	}

	cloneJson( value ) {
		if ( value === undefined || value === null ) {
			return value;
		}

		return JSON.parse( JSON.stringify( value ) );
	}

	collectLiteralImageNames( value ) {
		if ( typeof value === 'string' ) {
			return value ? new Set( [ value ] ) : new Set();
		}

		if ( ! Array.isArray( value ) || ! value.length ) {
			return new Set();
		}

		const op = typeof value[ 0 ] === 'string' ? value[ 0 ] : null;
		const names = new Set();
		let indexes = [];

		if ( op === 'step' ) {
			indexes = [ 2 ];
			for ( let index = 4; index < value.length; index += 2 ) {
				indexes.push( index );
			}
		} else if (
			[ 'interpolate', 'interpolate-hcl', 'interpolate-lab' ].includes(
				op
			)
		) {
			for ( let index = 4; index < value.length; index += 2 ) {
				indexes.push( index );
			}
		} else if ( op === 'case' ) {
			for ( let index = 2; index < value.length - 1; index += 2 ) {
				indexes.push( index );
			}
			indexes.push( value.length - 1 );
		} else if ( op === 'match' ) {
			for ( let index = 3; index < value.length - 1; index += 2 ) {
				indexes.push( index );
			}
			indexes.push( value.length - 1 );
		} else if ( op === 'coalesce' ) {
			for ( let index = 1; index < value.length; index += 1 ) {
				indexes.push( index );
			}
		} else if ( op === 'image' ) {
			indexes = [ 1 ];
		} else if ( STATIC_IMAGE_EXPRESSION_OPS.has( op ) ) {
			for ( let index = 1; index < value.length; index += 1 ) {
				indexes.push( index );
			}
		}

		indexes.forEach( ( index ) => {
			this.collectLiteralImageNames( value[ index ] ).forEach(
				( imageId ) => {
					names.add( imageId );
				}
			);
		} );

		return names;
	}

	collectLayerImageNames( layer ) {
		const names = new Set();
		const layout = layer?.layout || {};
		const paint = layer?.paint || {};

		if ( layout[ 'icon-image' ] !== undefined ) {
			this.collectLiteralImageNames( layout[ 'icon-image' ] ).forEach(
				( imageId ) => {
					names.add( imageId );
				}
			);
		}

		[ layout, paint ].forEach( ( section ) => {
			Object.entries( section ).forEach( ( [ key, value ] ) => {
				if ( key.endsWith( '-pattern' ) ) {
					this.collectLiteralImageNames( value ).forEach(
						( imageId ) => {
							names.add( imageId );
						}
					);
				}
			} );
		} );

		return names;
	}

	loadImageElement( url ) {
		return new Promise( ( resolve, reject ) => {
			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.onload = () => resolve( image );
			image.onerror = reject;
			image.src = url;
		} );
	}

	loadSpriteAtlas( spriteRoot ) {
		if ( ! spriteRoot ) {
			return Promise.resolve( null );
		}

		if ( this.spriteAtlasRequests.has( spriteRoot ) ) {
			return this.spriteAtlasRequests.get( spriteRoot );
		}

		const ratio = window.devicePixelRatio >= 1.5 ? 2 : 1;
		const load = async ( requestedRatio ) => {
			const suffix = requestedRatio === 2 ? '@2x' : '';
			const [ metadata, image ] = await Promise.all( [
				this.fetchJson( `${ spriteRoot }${ suffix }.json` ),
				this.loadImageElement( `${ spriteRoot }${ suffix }.png` ),
			] );

			return {
				metadata,
				image,
				ratio: requestedRatio,
				added: new Set(),
			};
		};

		const request = load( ratio )
			.catch( () => ( ratio === 2 ? load( 1 ) : null ) )
			.then( ( atlas ) => {
				if ( atlas ) {
					this.spriteAtlases.set( spriteRoot, atlas );
				}

				return atlas;
			} )
			.catch( ( error ) => {
				this.spriteAtlasRequests.delete( spriteRoot );
				throw error;
			} );

		this.spriteAtlasRequests.set( spriteRoot, request );
		return request;
	}

	addImageFromAtlas( atlas, imageId ) {
		const map = this.props.map;
		const item = atlas?.metadata?.[ imageId ];

		if ( ! item || ! map || map.hasImage( imageId ) ) {
			return false;
		}

		const width = Number.parseInt( item.width, 10 );
		const height = Number.parseInt( item.height, 10 );
		const x = Number.parseInt( item.x, 10 );
		const y = Number.parseInt( item.y, 10 );

		if ( ! width || ! height ) {
			return false;
		}

		const canvas = document.createElement( 'canvas' );
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext( '2d' );
		context.drawImage(
			atlas.image,
			x,
			y,
			width,
			height,
			0,
			0,
			width,
			height
		);
		const imageData = context.getImageData( 0, 0, width, height );
		const options = {
			pixelRatio: item.pixelRatio || atlas.ratio || 1,
			sdf: Boolean( item.sdf ),
		};

		if ( Array.isArray( item.content ) ) {
			options.content = item.content;
		}
		if ( Array.isArray( item.stretchX ) ) {
			options.stretchX = item.stretchX;
		}
		if ( Array.isArray( item.stretchY ) ) {
			options.stretchY = item.stretchY;
		}

		map.addImage( imageId, imageData, options );
		atlas.added.add( imageId );
		return true;
	}

	registerStyleImageMissingHandler() {
		const map = this.props.map;

		if ( ! map || this.styleImageMissingHandlerRegistered ) {
			return;
		}

		this.styleImageMissingHandlerRegistered = true;
		map.on( 'styleimagemissing', ( event ) => {
			const imageId = event?.id;
			if ( typeof imageId !== 'string' || map.hasImage( imageId ) ) {
				return;
			}

			for ( const atlas of this.spriteAtlases.values() ) {
				if ( this.addImageFromAtlas( atlas, imageId ) ) {
					map.triggerRepaint?.();
					return;
				}
			}
		} );
	}

	async preloadStyleImages( spriteRoot, imageIds ) {
		if ( ! spriteRoot || ! imageIds.size ) {
			return;
		}

		const atlas = await this.loadSpriteAtlas( spriteRoot );
		if ( ! atlas ) {
			return;
		}

		imageIds.forEach( ( imageId ) => {
			this.addImageFromAtlas( atlas, imageId );
		} );
	}

	ensureMapGlyphs( glyphs ) {
		const map = this.props.map;
		if ( ! map ) {
			return;
		}

		if ( map.getStyle?.()?.glyphs ) {
			return;
		}

		const defaultGlyphs = window.jeoMapVars?.composedStyleDefaultGlyphs || '';

		if ( map.style?.stylesheet ) {
			if ( glyphs || defaultGlyphs ) {
				map.style.stylesheet.glyphs = glyphs || defaultGlyphs;
			}
		}
	}

	getComposedLayerDefinition( style, layerId ) {
		return ( style?.layers || [] ).find( ( item ) => item?.id === layerId );
	}

	getComposedLayerSourceIds( style, compositeLayers ) {
		const sourceIds = new Set();

		compositeLayers.forEach( ( compositeLayer ) => {
			const layerDefinition = this.getComposedLayerDefinition(
				style,
				compositeLayer.compositeId
			);

			if ( layerDefinition?.source ) {
				sourceIds.add( layerDefinition.source );
			}
		} );

		return sourceIds;
	}

	addComposedSources( style, sourceIds ) {
		const map = this.props.map;
		const sources = style?.sources || {};

		sourceIds.forEach( ( sourceId ) => {
			if ( map.getSource( sourceId ) || ! sources[ sourceId ] ) {
				return;
			}

			map.addSource( sourceId, this.cloneJson( sources[ sourceId ] ) );
		} );
	}

	getBeforeLayerId() {
		return this.props.map.getLayer( 'unclustered-points' )
			? 'unclustered-points'
			: undefined;
	}

	moveLayerGroup( layerIds ) {
		const map = this.props.map;
		const beforeId = this.getBeforeLayerId();

		layerIds.forEach( ( layerId ) => {
			if ( ! map.getLayer( layerId ) ) {
				return;
			}

			if ( beforeId ) {
				map.moveLayer( layerId, beforeId );
			} else {
				map.moveLayer( layerId );
			}
		} );
	}

	cleanupUnusedSources( sourceIds ) {
		const map = this.props.map;
		const style = map.getStyle?.();
		const usedSources = new Set(
			( style?.layers || [] )
				.map( ( layer ) => layer.source )
				.filter( Boolean )
		);

		sourceIds.forEach( ( sourceId ) => {
			if ( ! usedSources.has( sourceId ) && map.getSource( sourceId ) ) {
				map.removeSource( sourceId );
			}
		} );
	}

	getStoryInteractionLayerIds() {
		const map = this.props.map;

		if ( ! map?.getLayer ) {
			return [];
		}

		return STORY_INTERACTION_LAYER_IDS.filter( ( layerId ) =>
			map.getLayer( layerId )
		);
	}

	hasStoryFeatureAtPoint( point ) {
		const map = this.props.map;
		const storyLayerIds = this.getStoryInteractionLayerIds();

		if ( ! point || ! storyLayerIds.length || ! map?.queryRenderedFeatures ) {
			return false;
		}

		try {
			return (
				map.queryRenderedFeatures( point, {
					layers: storyLayerIds,
				} ).length > 0
			);
		} catch ( error ) {
			return false;
		}
	}

	addComposedLayerInteractions( manifestLayer, compositeLayerIds ) {
		return addComposedInteractions(
			this.props.map,
			[ manifestLayer ],
			{
				shouldIgnoreEvent: ( event ) =>
					this.hasStoryFeatureAtPoint( event?.point ),
				visibleLayerIds: compositeLayerIds,
			}
		);
	}

	removeComposedMapboxLayer( layer ) {
		const state = this.composedLayerState.get( String( layer.id ) );
		const map = this.props.map;

		if ( ! state ) {
			return;
		}

		( state.interactionCleanups || [] ).forEach( ( cleanup ) => {
			cleanup();
		} );

		[ ...state.compositeLayerIds ].reverse().forEach( ( layerId ) => {
			if ( map.getLayer( layerId ) ) {
				map.removeLayer( layerId );
			}
		} );

		this.cleanupUnusedSources( state.sourceIds );
		this.composedLayerState.delete( String( layer.id ) );
	}

	async addComposedMapboxLayer( layer ) {
		const map = this.props.map;
		const mapId = layer?.map?.id;
		const layerId = String( layer.id );

		if ( this.composedLayerState.has( layerId ) ) {
			this.moveLayerGroup(
				this.composedLayerState.get( layerId ).compositeLayerIds
			);
			return;
		}

		if ( ! mapId ) {
			console.warn(
				'Skipping Mapbox layer in Discovery because its source map is unknown.',
				layer
			);
			return;
		}

		this.props.registerLayerCustomToken?.( layer );
		this.registerStyleImageMissingHandler();

		try {
			const { style, manifest } = await this.fetchComposedMap( mapId );
			const manifestLayer = ( manifest?.layers || [] ).find(
				( item ) =>
					Number.parseInt( item.layerPostId, 10 ) ===
					Number.parseInt( layer.id, 10 )
			);

			if ( ! manifestLayer || manifestLayer.directLayer ) {
				console.warn(
					'Skipping Mapbox layer in Discovery because the composed manifest does not contain it.',
					layer
				);
				return;
			}

			const compositeLayers = (
				manifestLayer.compositeLayers || []
			).filter(
				( compositeLayer ) =>
					compositeLayer.visibleWhenLayerOn !== false
			);
			const sourceIds = this.getComposedLayerSourceIds(
				style,
				compositeLayers
			);
			const imageIds = new Set();
			const layerDefinitions = [];

			compositeLayers.forEach( ( compositeLayer ) => {
				const layerDefinition = this.getComposedLayerDefinition(
					style,
					compositeLayer.compositeId
				);

				if ( ! layerDefinition ) {
					return;
				}

				const nextLayer = this.cloneJson( layerDefinition );
				nextLayer.layout = {
					...( nextLayer.layout || {} ),
					visibility: 'visible',
				};

				this.collectLayerImageNames( nextLayer ).forEach(
					( imageId ) => {
						imageIds.add( imageId );
					}
				);
				layerDefinitions.push( nextLayer );
			} );

			this.ensureMapGlyphs( style.glyphs );
			this.addComposedSources( style, sourceIds );
			await this.preloadStyleImages( style.sprite, imageIds );

			const beforeId = this.getBeforeLayerId();
			const compositeLayerIds = [];

			layerDefinitions.forEach( ( layerDefinition ) => {
				if ( ! map.getLayer( layerDefinition.id ) ) {
					map.addLayer( layerDefinition, beforeId );
					}
					compositeLayerIds.push( layerDefinition.id );
				} );

				const interactionCleanups = this.addComposedLayerInteractions(
					manifestLayer,
					compositeLayerIds
				);

				this.composedLayerState.set( layerId, {
					mapId,
					compositeLayerIds,
					sourceIds,
					interactionCleanups,
				} );
				this.moveLayerGroup( compositeLayerIds );
			} catch ( error ) {
			console.warn(
				'Unable to load composed Mapbox layer in Discovery.',
				error,
				layer
			);
		}
	}

	toggleLayer( layer ) {
		const selectedLayers = Object.assign( {}, this.props.selectedLayers );
		let layersQueue = [ ...this.props.layersQueue ];

		// If layer does not exist
		if ( ! Object.hasOwn( selectedLayers, layer.id ) ) {
			selectedLayers[ layer.id ] = layer;
			layersQueue = [ layer.id, ...layersQueue ];
		} else {
			layersQueue = layersQueue.filter( ( id ) => id !== layer.id );
			delete selectedLayers[ layer.id ];
		}

		this.props.updateState( {
			selectedLayers,
			layersQueue,
		} );
	}

	buildSelectionState(
		layers,
		baseSelectedLayers = this.props.selectedLayers,
		baseLayersQueue = this.props.layersQueue
	) {
		const selectedLayers = Object.assign( {}, baseSelectedLayers );
		let layersQueue = [ ...baseLayersQueue ];

		layers.forEach( ( layer ) => {
			if ( ! Object.hasOwn( selectedLayers, layer.id ) ) {
				selectedLayers[ layer.id ] = layer;
				layersQueue = [ layer.id, ...layersQueue ];
			} else {
				layersQueue = layersQueue.filter( ( id ) => id !== layer.id );
				delete selectedLayers[ layer.id ];
			}
		} );

		return {
			selectedLayers,
			layersQueue,
		};
	}

	toggleLayersBatch( layers ) {
		const { selectedLayers, layersQueue } =
			this.buildSelectionState( layers );

		this.props.updateState( {
			selectedLayers,
			layersQueue,
		} );
	}

	async applyLayersChanges(
		batch = this.props.layersQueue,
		selectedLayers = this.props.selectedLayers,
		appliedLayers = this.props.appliedLayers
	) {
		const sequence = ++this.applyLayersSequence;

		if ( batch?.preventDefault ) {
			batch.preventDefault();
			batch = this.props.layersQueue;
			selectedLayers = this.props.selectedLayers;
			appliedLayers = this.props.appliedLayers;
		}

		if ( ! Array.isArray( batch ) ) {
			batch = this.props.layersQueue;
		}

		const map = this.props.map;
		const batchIds = batch.map( ( layerId ) => String( layerId ) );

		appliedLayers.forEach( ( layer ) => {
			const layerId = String( layer.id );
			// If layer is not requested
			if ( ! batchIds.includes( layerId ) ) {
				if ( layer.meta.type === 'mapbox' ) {
					this.removeComposedMapboxLayer( layer );
					return;
				}

				if ( map.getLayer( layerId ) ) {
					map.removeLayer( layerId );
				}
			}
		} );

		const reverseBatch = [ ...batch ].reverse();
		for ( const layerID of reverseBatch ) {
			const layerId = String( layerID );
			const layer = selectedLayers[ layerId ];
			if ( ! layer ) {
				continue;
			}
			const attributes = layer.meta;

			if ( layer.meta.type === 'tilelayer' ) {
				if ( ! map.getSource( layerId ) ) {
					map.addSource( layerId, {
						type: 'raster',
						tiles: [ attributes.layer_type_options.url ],
						tileSize: 256,
					} );
				}

				if ( map.getLayer( layerId ) === undefined ) {
					map.addLayer( {
						id: layerId,
						type: 'raster',
						source: layerId,
						layout: {
							visibility: 'visible',
						},
					} );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			} else if ( layer.meta.type === 'mapbox' ) {
				await this.addComposedMapboxLayer( layer );
				if ( sequence !== this.applyLayersSequence ) {
					return;
				}
			} else if ( layer.meta.type === 'mvt' ) {
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: 'vector',
							tiles: [ attributes.layer_type_options.url ],
						} );
					}

					const newLayer = {
						id: layerId,
						type: attributes.layer_type_options.type,
						source: layerId,
						'source-layer':
							attributes.layer_type_options.source_layer,
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			} else if ( layer.meta.type === 'mapbox-tileset-vector' ) {
				this.props.registerLayerCustomToken?.( layer );
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: attributes.layer_type_options
								.style_source_type,
							url:
								'mapbox://' +
								attributes.layer_type_options.tileset_id,
						} );
					}

					const newLayer = {
						id: layerId,
						type: attributes.layer_type_options.type,
						source: layerId,
						'source-layer':
							attributes.layer_type_options.source_layer,
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			} else if ( layer.meta.type === 'mapbox-tileset-raster' ) {
				this.props.registerLayerCustomToken?.( layer );
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: attributes.layer_type_options
								.style_source_type,
							url:
								'mapbox://' +
								attributes.layer_type_options.tileset_id,
						} );
					}

					const newLayer = {
						id: layerId,
						type: attributes.layer_type_options.type,
						source: layerId,
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			}
		}

		if ( sequence !== this.applyLayersSequence ) {
			return;
		}

		const nextAppliedLayers = batch
			.map( ( layerId ) => selectedLayers[ String( layerId ) ] )
			.filter( Boolean );

		this.props.updateState( {
			appliedLayers: nextAppliedLayers,
		} );
	}

	updateMaps( params ) {
		this.fetchMaps( { ...params } ).catch( () => {} );
	}

	canLoadMoreMaps() {
		return (
			this.props.mapsLoaded &&
			! this.state.isLoadingMaps &&
			this.state.mapsPage < this.state.mapsTotalPages
		);
	}

	loadMoreMaps() {
		if ( ! this.canLoadMoreMaps() ) {
			return Promise.resolve();
		}

		return this.fetchMaps( {
			page: this.state.mapsPage + 1,
			search: this.state.currentSearch,
			cumulative: true,
		} ).catch( () => {} );
	}

	render() {
		if ( this.props.isEmbed ) {
			return <div></div>;
		}

		const mapItens = this.props.maps.map( ( map, index ) => {
			return (
				<MapItem
					map={ map }
					key={ index }
					toggleLayer={ this.toggleLayer }
					selectedLayers={ this.props.selectedLayers }
					toggleLayersBatch={ this.toggleLayersBatch }
					loadMapLayers={ this.loadMapLayers }
					loadingMapLayers={ Boolean(
						this.state.loadingMapLayerIds[ map.id ]
					) }
				/>
			);
		} );

		const selectedLayersRender = (
			<List
				values={ this.props.layersQueue }
				onChange={ ( { oldIndex, newIndex } ) => {
					// if(newIndex < 0) {
					// 	this.props.updateState( { layersQueue: arrayRemove( [ ...this.props.layersQueue ], oldIndex ) })
					// 	return;
					// }

					this.props.updateState( {
						layersQueue: arrayMove(
							[ ...this.props.layersQueue ],
							oldIndex,
							newIndex
						),
					} );
				} }
				renderList={ ( { children, props } ) => (
					<div { ...props }>{ children }</div>
				) }
				lockVertically
				// removableByMove
				renderItem={ ( { value, props, isDragged } ) => {
					const layer = this.props.selectedLayers[ value ];

					return (
						<div
							{ ...props }
							className={
								'layer-item' + ( isDragged ? ' dragged' : '' )
							}
						>
							<svg
								aria-hidden="true"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 320 512"
								className="drag-icon"
							>
								<path
									fill="currentColor"
									d="M96 32H32C14.33 32 0 46.33 0 64v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zM288 32h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32z"
								></path>
							</svg>
							<div className="layer-item--content">
								<div className="layer-item--map">
									{ decodeEntities(
										layer.map.title.rendered
									) }
								</div>
								<div className="layer-item--layer">
									{ decodeEntities( layer.title.rendered ) }
								</div>
							</div>
							<button
								onClick={ () => this.toggleLayer( layer ) }
								className="remove-layer"
							>
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 352 512"
								>
									<path
										fill="currentColor"
										d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
									></path>
								</svg>
							</button>
						</div>
					);
				} }
			/>
		);

		function arrayEquals( a, b ) {
			return (
				Array.isArray( a ) &&
				Array.isArray( b ) &&
				a.length === b.length &&
				a.every( ( val, index ) => val === b[ index ] )
			);
		}

		const isApplied = arrayEquals(
			this.props.appliedLayers.map( ( layer ) => layer.id ),
			this.props.layersQueue
		);

		const loading = ! this.props.mapsLoaded ? (
			<div
				className="maps-loading"
				role="status"
				aria-live="polite"
				aria-label={ __( 'Loading…', 'jeowp' ) }
			>
				<LoadingSpinner />
			</div>
		) : null;

		return (
			<div className="maps-tab" style={ this.props.style }>
				<Search
					searchPlaceholder={ __( 'Search map', 'jeowp' ) }
					searchButtonLabel={ __( 'Search map', 'jeowp' ) }
					update={ this.updateMaps }
					searchField={ this.state.currentSearch }
					disabled={ this.state.isLoadingMaps }
				/>

				<div className="selected-layers">
					<div className="status">
						<div className="status-icon">
							{ ! isApplied ? (
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 352 512"
								>
									<path
										fill="currentColor"
										d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
									></path>
								</svg>
							) : (
								<svg
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 512 512"
								>
									<path
										fill="currentColor"
										d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"
									></path>
								</svg>
							) }
						</div>

						<div className="status-message">
							{ isApplied
								? __( 'Changes applied', 'jeowp' )
								: __( 'Not applied', 'jeowp' ) }
						</div>
					</div>

					<div className="selected-layers--title">
						{ ' ' }
						{ __( 'Selected layers', 'jeowp' ) }{ ' ' }
					</div>
					<div className="selected-layers--content">
						{ Object.keys( this.props.selectedLayers ).length > 0
							? selectedLayersRender
							: __( 'No layers selected', 'jeowp' ) }
					</div>
				</div>

				{ isApplied ? (
					<button
						className="apply-changes disabled"
						disabled
						aria-disabled="true"
					>
						{ __( 'Changes applied', 'jeowp' ) }
					</button>
				) : (
					<button
						className="apply-changes"
						onClick={ () => this.applyLayersChanges() }
					>
						{ __( 'Apply changes', 'jeowp' ) }
					</button>
				) }
				{ loading }
				{ this.state.mapsError ? (
					<div className="maps-error">{ this.state.mapsError }</div>
				) : null }
				<div className="map-itens">{ mapItens }</div>
				{ this.state.isLoadingMaps && this.props.mapsLoaded ? (
					<div
						className="maps-loading"
						role="status"
						aria-live="polite"
						aria-label={ __( 'Loading…', 'jeowp' ) }
					>
						<LoadingSpinner />
					</div>
				) : null }
			</div>
		);
	}
}

export default MapLayers;
