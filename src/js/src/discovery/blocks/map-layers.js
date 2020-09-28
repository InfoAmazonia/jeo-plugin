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
					<div className="status">
						<div className="status-icon">
							{/* <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512" class="svg-inline--fa fa-times fa-w-11 fa-3x"><path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" class=""></path></svg> */}
							<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-check fa-w-16 fa-3x"><path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z" class=""></path></svg>
						</div>

						<div className="status-message">
							All changes applied
						</div>
					</div>
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
