import { Component } from '@wordpress/element';
import Search from './search';
import MapItem from './map-item';
import { __ } from '@wordpress/i18n';
import { List, arrayMove } from 'react-movable';

class MapLayers extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			maps: [],
			testItens: [ 1, 2, 3, 4 ]
		};

		this.toggleLayer = this.toggleLayer.bind(this);
		this.applyLayersChanges = this.applyLayersChanges.bind(this);
		this.updateMaps = this.updateMaps.bind(this);


		if ( ! this.props.mapsLoaded ) {
			this.fetchMaps();
		}
	}

	fetchMaps( params = {} ) {
		const defaultParams = { posts_per_page: -1 };
		params = { ...defaultParams, ...params };

		const mapsUrl = new URL( jeoMapVars.jsonUrl + 'map/' );

		Object.keys( params ).forEach( ( key ) =>
			mapsUrl.searchParams.append( key, params[ key ] )
		);

		return fetch( mapsUrl )
			.then( ( response ) => response.json() )
			.then( ( maps ) => {
				// Fetch layers
				const mapsLayersPromises = maps.map( ( singleMap ) => {
					return Promise.all(
						singleMap.meta.layers.map( async ( layer ) => {
							const mapLayerApiUrl = new URL(
								jeoMapVars.jsonUrl + 'map-layer/' + layer.id
							);

							return fetch( mapLayerApiUrl )
								.then( ( data ) => data.json() )
								.then( ( layer ) => {
									if (
										singleMap.queriedLayers &&
										singleMap.queriedLayers.length
									) {
										singleMap.queriedLayers = [
											...singleMap.queriedLayers,
											{ ...layer, map: singleMap },
										];
									} else {
										singleMap.queriedLayers = [ { ...layer, map: singleMap } ];
									}

									return layer;
								} );
						} )
					);
				} );

				return Promise.all( mapsLayersPromises ).then( () => {
					this.props.updateState( { maps } );
				} );

				// Build layers legends using legacy strategy (based on active layers)
			} );
	}

	toggleLayer(layer) {
		const selectedLayers = Object.assign({}, this.props.selectedLayers);
		let layersQueue = [...this.props.layersQueue];

		// If layer does not exist
		if(!selectedLayers.hasOwnProperty(layer.id)) {
			selectedLayers[ layer.id ] = layer;
			layersQueue = [ layer.id, ...layersQueue ];

		} else {
			layersQueue = layersQueue.filter( id => id !== layer.id)
			delete selectedLayers[ layer.id ];
		}

		this.props.updateState( {
			selectedLayers,
			layersQueue,
		} );

	}

	applyLayersChanges() {
		const batch = this.props.layersQueue;
		const map = this.props.map;
		let appliedLayers = this.props.appliedLayers;

		appliedLayers.forEach( layer => {
			const layerId = String(layer.id);
			// If layer is not requested
			if(!batch.includes(layer.id)) {
				if( map.getLayer( layerId ) ) {
					map.removeLayer( layerId );
				}
			}
		} )

		const reverseBatch = [ ...batch ].reverse();
		reverseBatch.forEach( layerID => {
			const layerId = String( layerID );
			const layer = this.props.selectedLayers[ layerId ];

			// console.log(layer.meta.type);

			if(layer.meta.type === "tilelayer") {
				if(!map.getSource( layerId ) ) {
					map.addSource( layerId, {
						type: 'raster',
						tiles: [ layer.meta.layer_type_options.url ],
						tileSize: 256,
					});
				}

				if(map.getLayer( layerId ) === undefined) {
					map.addLayer( {
						id: layerId,
						type: 'raster',
						source: layerId,
						layout: {
							'visibility': 'visible',
						}
					} );
				}

				map.moveLayer(layerId, 'unclustered-points');
			} else if(layer.meta.type === "mapbox") {
				if(map.getLayer( layerId ) === undefined) {
					if(!map.getSource( layerId ) ) {
						map.addSource( layerId, {
							type: 'raster',
							tiles: [
								'https://api.mapbox.com/styles/v1/' +
									layer.meta.layer_type_options.style_id +
									'/tiles/256/{z}/{x}/{y}@2x?access_token=' +
									window.mapboxgl.accessToken,
							],
						});
					}

					const newLayer = {
						id: layerId,
						source: layerId,
						type: 'raster',
					};

					map.addLayer(newLayer);
				}

				map.moveLayer(layerId, 'unclustered-points');
			}
		} );

		appliedLayers = batch.map( layerId => {
			return this.props.selectedLayers[layerId];
		});

		this.props.updateState( {
			appliedLayers
		} )
	}

	updateMaps(params) {
		this.fetchMaps({ ...params }).catch( (err) => console.log( err ));
	}


	render() {
		const mapItens = this.props.maps.map( ( map, index ) => {
			return (
				<MapItem
					map={ map }
					key={ index }
					toggleLayer={ this.toggleLayer }
					selectedLayers={ this.props.selectedLayers }
				/>
			);
		} );

		const selectedLayersRender = (
			<List
				values={ this.props.layersQueue }
				onChange={ ( { oldIndex, newIndex } ) => this.props.updateState( { layersQueue: arrayMove( [ ...this.props.layersQueue ], oldIndex, newIndex ) } ) }
				renderList={ ( { children, props } ) => (
					<div { ...props }>{ children }</div>
				) }
				lockVertically="true"
				renderItem={ ( { value, props, isDragged } ) => {
					const layer = this.props.selectedLayers[ value ];

					return (
						<div { ...props } className={ "layer-item" + (isDragged? " dragged" : "") } >
							<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="grip-vertical" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="svg-inline--fa fa-grip-vertical fa-w-10 fa-3x"><path fill="currentColor" d="M96 32H32C14.33 32 0 46.33 0 64v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160H32c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zM288 32h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32zm0 160h-64c-17.67 0-32 14.33-32 32v64c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32v-64c0-17.67-14.33-32-32-32z"></path></svg>
							<div className="layer-item--content">
								<div className="layer-item--map">
									{ layer.map.title.rendered }
								</div>
								<div className="layer-item--layer">
									{ layer.title.rendered }
								</div>
							</div>
						</div>
					);
					}
				}
			/>
		)

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

		return (
			<div className="maps-tab">
				<Search
					searchPlaceholder="Search map"
					update={ this.updateMaps }
				/>

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
									class="svg-inline--fa fa-times fa-w-11 fa-3x"
								>
									<path
										fill="currentColor"
										d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
										class=""
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
									class="svg-inline--fa fa-check fa-w-16 fa-3x"
								>
									<path
										fill="currentColor"
										d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"
										class=""
									></path>
								</svg>
							) }
						</div>

						<div className="status-message">
							{ isApplied ? __( 'Changes applied' ) : __( 'Not applied' ) }
						</div>
					</div>

					<div className="selected-layers--title">
						{ ' ' }
						{ __( 'Selected layers' ) }{ ' ' }
					</div>
					<div className="selected-layers--content">
						{ Object.keys( this.props.selectedLayers ).length > 0
							? selectedLayersRender
							: __( 'No layers selected' ) }
					</div>
				</div>

				{ isApplied ? (
					<button className="apply-changes disabled">
						{ __( 'Changes applied' ) }
					</button>
				) : (
					<button
						className="apply-changes"
						onClick={ this.applyLayersChanges }
					>
						{ __( 'Apply changes' ) }
					</button>
				) }

				<div className="map-itens">{ mapItens }</div>
			</div>
		);
	}
}

export default MapLayers;
