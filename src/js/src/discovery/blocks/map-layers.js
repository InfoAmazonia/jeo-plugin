import { Component } from '@wordpress/element';
import Search from './search';
import MapItem from './map-item';
import { __ } from '@wordpress/i18n';

class MapLayers extends Component {
	constructor(props) {
		super(props);

		this.state = {
			maps: [],
		}

		if (!this.props.mapsLoaded) {
			this.fetchMaps()
		}
	}

	fetchMaps(params = {}) {
		const defaultParams = { posts_per_page: -1 };
		params = { ...defaultParams, ...params }

		const mapsUrl = new URL(jeoMapVars.jsonUrl + 'map/');
		Object.keys(params).forEach(key => mapsUrl.searchParams.append(key, params[key]))

		return fetch(mapsUrl)
			.then( ( response ) => response.json() )
			.then( ( maps ) => {

				// Fetch layers
				const mapsLayersPromises = maps.map( ( singleMap ) => {
					return Promise.all(singleMap.meta.layers.map ( async ( layer ) => {
						const mapLayerApiUrl = new URL(jeoMapVars.jsonUrl + 'map-layer/' + layer.id);

						return fetch(mapLayerApiUrl).then( data => data.json()).then( ( layer ) => {
							if ( singleMap.queriedLayers && singleMap.queriedLayers.length ) {
								singleMap.queriedLayers = [ ...singleMap.queriedLayers, layer];
							} else {
								singleMap.queriedLayers = [ layer ];
							}

							return layer;
						});
					}))
				} )

				return Promise.all(mapsLayersPromises)
					.then( ( ) => {
						// this.setState( ( state ) => ({
						// 	...state,
						// 	maps,
						// }) )

						this.props.setMapsState( maps );
					})


				// Build layers legends using legacy strategy (based on active layers)
			} )

	}

	render() {
		const mapItens = this.props.maps.map( ( map, index ) => {
			return <MapItem map={ map } key={ index } toggleLayer={ this.props.toggleLayer } selectedLayers={ this.props.selectedLayers } />;
		} )

		const selectedLayersRender = Object.keys(this.props.selectedLayers).map( ( key, index ) => {
			const layer = this.props.selectedLayers[key];

			return (
				<div className="layer-item" key={ index }>
					<span>
						{ layer.title.rendered }
					</span>
				</div>
			)
		} )


		return (
			<div className="maps-tab">
				<Search searchPlaceholder="Search map" updateStories={ this.props.updateStories } />

				<div className="selected-layers">
					<div className="selected-layers--title"> { __("Selected layers") } </div>
					<div className="selected-layers--content">
						{ Object.keys(this.props.selectedLayers).length > 0?
						selectedLayersRender : __("There are no selected layers")
						}
					</div>

				</div>

				<div className="map-itens">
					{ mapItens }
				</div>
			</div>
		)
	}

}

export default MapLayers;
