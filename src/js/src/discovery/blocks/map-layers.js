import { Component } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { List, arrayMove } from 'react-movable';
import { addQueryArgs } from '@wordpress/url';

import { mapboxToken } from '../../lib/mapgl-loader';
import { chunkRecordIds, mergeRecordsByIdOrder } from '../../shared/rest-records';
import MapItem from './map-item';
import Search from './search';

const MAPS_PER_PAGE = 20;

const normalizeMaps = ( maps = [] ) =>
	maps
		.filter( ( map ) => ! map.meta.hide_in_discovery )
		.map( ( singleMap ) => ( {
			...singleMap,
			queriedLayers: Array.isArray( singleMap.queriedLayers ) ?
				singleMap.queriedLayers :
				singleMap.meta.layers.length ? null : [],
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

		this.toggleLayer = this.toggleLayer.bind( this );
		this.applyLayersChanges = this.applyLayersChanges.bind( this );
		this.updateMaps = this.updateMaps.bind( this );
		this.toggleLayersBatch = this.toggleLayersBatch.bind( this );
		this.buildSelectionState = this.buildSelectionState.bind( this );
		this.loadMapLayers = this.loadMapLayers.bind( this );
		this.fetchMapsByIds = this.fetchMapsByIds.bind( this );
		this.loadMoreMaps = this.loadMoreMaps.bind( this );

		if ( ! this.props.mapsLoaded ) {
			if ( this.props.isEmbed ) {
				const requestedLayerIds = this.getLayerIdsFromUrl().map(
					( data ) => data[ 0 ]
				);
				this.fetchLayers( requestedLayerIds ).then( ( layers ) => {
					this.toggleLayersBatch( layers.reverse() );
					this.applyLayersChanges();
				} );
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
											! maps.some( ( singleMap ) => singleMap.id === mapId )
									)
							),
						];
						const allMaps = missingMapIds.length ?
							mergeMapsById( maps, await this.fetchMapsByIds( missingMapIds ) ) :
							maps;
						const layersByMap = new Map();

						for ( const mapId of [ ...new Set( requestedLayerIds.map( ( item ) => item.map ) ) ] ) {
							layersByMap.set(
								mapId,
								await this.loadMapLayers(
									allMaps.find( ( singleMap ) => singleMap.id === mapId ) || null,
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
							this.buildSelectionState( sortedLayerBatch.reverse() );

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
			cumulative: false,
		};
		params = { ...defaultParams, ...params };

		const mapsUrl = new URL( jeoMapVars.jsonUrl + 'map/' );
		const { cumulative, ...requestParams } = params;

		this.setState( { isLoadingMaps: true } );

		Object.keys( requestParams ).forEach( ( key ) =>
			mapsUrl.searchParams.append( key, requestParams[ key ] )
		);

		if ( 'languageParams' in window ) {
			mapsUrl.searchParams.append( 'lang', languageParams.currentLang );
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
				const mergedMaps = cumulative ?
					mergeMapsById( this.props.maps, nextMaps ) :
					nextMaps;

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
					mapsError: __( 'Unable to load map layers right now.', 'jeo' ),
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
				...( 'languageParams' in window && window.languageParams?.currentLang
					? { lang: languageParams.currentLang }
					: {} ),
			} );

			return fetch( path )
				.then( ( response ) => response.json() )
				.then( ( response ) => Array.isArray( response ) ? response : [] );
		} );

		return Promise.all( requests ).then( ( maps ) =>
			normalizeMaps( mergeRecordsByIdOrder( mapIds, maps.flat() ) )
		);
	}

	fetchLayers( layersIds ) {
		const layerChunks = chunkRecordIds( layersIds );
		const requests = layerChunks.map( ( chunk ) => {
			const path = addQueryArgs( jeoMapVars.jsonUrl + 'map-layer/', {
				include: chunk,
				orderby: 'include',
				per_page: chunk.length,
				...( "languageParams" in window && window.languageParams?.currentLang
					? { lang: languageParams.currentLang }
					: {} ),
			} );

			return fetch( path )
				.then( ( response ) => response.json() )
				.then( ( response ) => Array.isArray( response ) ? response : [] );
		} );

		return Promise.all( requests ).then( ( layers ) =>
			mergeRecordsByIdOrder( layersIds, layers.flat() )
		);
	}

	loadMapLayers( map, maps = this.props.maps ) {
		if ( ! map ) {
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

		const request = this.fetchLayers( map.meta.layers.map( ( layer ) => layer.id ) )
			.then( ( layers ) => {
				const queriedLayers = layers.map( ( layer ) => ( { ...layer, map } ) );
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
					const loadingMapLayerIds = { ...currentState.loadingMapLayerIds };
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
			return JSON.parse( layerIds );
		} catch ( error ) {
			return [];
		}
	}

	toggleLayer( layer ) {
		const selectedLayers = Object.assign( {}, this.props.selectedLayers );
		let layersQueue = [ ...this.props.layersQueue ];

		// If layer does not exist
		if ( ! selectedLayers.hasOwnProperty( layer.id ) ) {
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
			if ( ! selectedLayers.hasOwnProperty( layer.id ) ) {
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
		const { selectedLayers, layersQueue } = this.buildSelectionState( layers );

		this.props.updateState( {
			selectedLayers,
			layersQueue,
		} );
	}

	applyLayersChanges(
		batch = this.props.layersQueue,
		selectedLayers = this.props.selectedLayers,
		appliedLayers = this.props.appliedLayers
	) {
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
		let nextAppliedLayers = appliedLayers;

		nextAppliedLayers.forEach( ( layer ) => {
			const layerId = String( layer.id );
			// If layer is not requested
			if ( ! batch.includes( layer.id ) ) {
				if ( map.getLayer( layerId ) ) {
					map.removeLayer( layerId );
				}
			}
		} );

		const reverseBatch = [ ...batch ].reverse();
		reverseBatch.forEach( ( layerID ) => {
			const layerId = String( layerID );
			const layer = selectedLayers[ layerId ];
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
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						const accessToken = attributes.layer_type_options.access_token || mapboxToken;

						const styleId = attributes.layer_type_options.style_id?.replace( 'mapbox://styles/', '' );

						map.addSource( layerId, {
							type: 'raster',
							tiles: [
								`https://api.mapbox.com/styles/v1/${ styleId }/tiles/512/{z}/{x}/{y}@2x?access_token=${ accessToken }`,
							],
						} );
					}

					const newLayer = {
						id: layerId,
						source: layerId,
						type: 'raster',
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
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
						'source-layer': attributes.layer_type_options.source_layer,
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			} else if ( layer.meta.type === 'mapbox-tileset-vector' ) {
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: attributes.layer_type_options.style_source_type,
							url: 'mapbox://' + attributes.layer_type_options.tileset_id,
						} );
					}

					const newLayer = {
						id: layerId,
						type: attributes.layer_type_options.type,
						source: layerId,
						'source-layer': attributes.layer_type_options.source_layer,
					};

					map.addLayer( newLayer );
				}

				if ( map.getLayer( 'unclustered-points' ) ) {
					map.moveLayer( layerId, 'unclustered-points' );
				}
			} else if ( layer.meta.type === 'mapbox-tileset-raster' ) {
				if ( map.getLayer( layerId ) === undefined ) {
					if ( ! map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: attributes.layer_type_options.style_source_type,
							url: 'mapbox://' + attributes.layer_type_options.tileset_id,
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
		} );

		nextAppliedLayers = batch.map( ( layerId ) => {
			return selectedLayers[ layerId ];
		} );

		this.props.updateState( {
			appliedLayers: nextAppliedLayers,
		} );
	}

	updateMaps( params ) {
		this.fetchMaps( { ...params } ).catch( () => {} );
	}

	loadMoreMaps() {
		if ( this.state.mapsPage >= this.state.mapsTotalPages ) {
			return;
		}

		this.fetchMaps( {
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
						loadingMapLayers={ Boolean( this.state.loadingMapLayerIds[ map.id ] ) }
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
							className={ 'layer-item' + ( isDragged ? ' dragged' : '' ) }
						>
							<svg
								aria-hidden="true"
								focusable="false"
								data-prefix="fas"
								data-icon="grip-vertical"
								role="img"
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
									{ decodeEntities( layer.map.title.rendered ) }
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
									focusable="false"
									data-prefix="fas"
									data-icon="times"
									role="img"
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
			<svg
				aria-hidden="true"
				focusable="false"
				data-prefix="fas"
				data-icon="spinner"
				role="img"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 512 512"
				className="svg-inline--fa fa-spinner fa-w-16 fa-3x"
			>
				<path
					fill="currentColor"
					d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"
				></path>
			</svg>
		) : null;

		return (
			<div className="maps-tab" style={ this.props.style }>
				<Search searchPlaceholder={ __( 'Search map', 'jeo' ) } update={ this.updateMaps } />

				<div className="selected-layers">
					<div className="status">
						<div className="status-icon">
							{ ! isApplied ? (
								<svg
									aria-hidden="true"
									focusable="false"
									data-prefix="fas"
									data-icon="times"
									role="img"
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
									focusable="false"
									data-prefix="fas"
									data-icon="check"
									role="img"
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
							{ isApplied ? __( 'Changes applied', 'jeo' ) : __( 'Not applied', 'jeo' ) }
						</div>
					</div>

					<div className="selected-layers--title">
						{ ' ' }
						{ __( 'Selected layers', 'jeo' ) }{ ' ' }
					</div>
					<div className="selected-layers--content">
						{ Object.keys( this.props.selectedLayers ).length > 0
							? selectedLayersRender
							: __( 'No layers selected', 'jeo' ) }
					</div>
				</div>

				{ isApplied ? (
					<button className="apply-changes disabled">
						{ __( 'Changes applied', 'jeo' ) }
					</button>
				) : (
					<button
						className="apply-changes"
						onClick={ () => this.applyLayersChanges() }
					>
						{ __( 'Apply changes', 'jeo' ) }
					</button>
				) }
				{ loading }
				{ this.state.mapsError ? (
					<div className="maps-error">{ this.state.mapsError }</div>
				) : null }
				<div className="map-itens">{ mapItens }</div>
				{ this.state.isLoadingMaps && this.props.mapsLoaded ? (
					<div className="maps-loading">{ __( 'Loading more maps…', 'jeo' ) }</div>
				) : null }
				{ this.state.mapsPage < this.state.mapsTotalPages ? (
					<button className="load-more-maps" onClick={ this.loadMoreMaps }>
						{ __( 'Load more maps', 'jeo' ) }
					</button>
				) : null }
			</div>
		);
	}
}

export default MapLayers;
