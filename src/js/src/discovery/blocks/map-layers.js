import { Component } from '@wordpress/element';
import Search from './search';

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
		let testMapLayers = "";

		this.props.maps.forEach( map => {
			testMapLayers = map.queriedLayers.map( layer => {
				return ( <div> { layer.meta.attribution } <br/><br/></div> )
			});
		} )
		return (
			<div className="stories-tab">
				{ testMapLayers }
				<Search searchPlaceholder="Search map" updateStories={ this.props.updateStories } />
			</div>
		)
	}

}

export default MapLayers;
