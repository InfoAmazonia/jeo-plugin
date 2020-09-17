import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import './style/discovery.scss';

// mapboxgl.accessToken = 'MAPBOX_ACCESS_TOKEN';

class Discorevy extends Component {
	constructor(props) {
		super(props);

		this.state = {
			// map
			map: null,

			// layers
			selectedLayers: [],
			// stories
			storiesLoaded: false,
			stories: [],
		};
	}

	componentDidMount() {
		const map = new mapboxgl.Map({
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			// style: 'mapbox://styles/mapbox/light-v9',
			// center: [this.state.lng, this.state.lat],
			// zoom: this.state.zoom
		});

		this.setState({
			map,
		});

		this.fetchStories().then((stories) => {
			const sourceData = this.buildPostsGeoJson(stories);

			map.on('load', function () {
				map.addSource('storiesSource', {
					type: 'geojson',
					data: sourceData,
					cluster: true,
					clusterMaxZoom: 40,
					clusterRadius: 40,
				});

				map.loadImage(jeoMapVars.jeoUrl + '/js/src/icons/news-marker.png', function (error, image) {
					if (error) throw error;

					map.addImage('news-marker', image);
					map.addLayer({
						id: 'unclustered-points',
						type: 'symbol',
						source: 'storiesSource',
						filter: ['!', ['has', 'point_count']],
						layout: {
							'icon-image': 'news-marker',
							'icon-size': 0.10,
							'icon-allow-overlap': true,
							// 'text-field': 'storie',
							'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
							'text-size': 11,
							'text-transform': 'uppercase',
							'text-letter-spacing': 0.05,
							'text-offset': [0, 3],
						},
						paint: {
							'text-color': '#202',
							'text-halo-color': '#fff',
							'text-halo-width': 2,
						},
					});
				});

				map.loadImage(jeoMapVars.jeoUrl + '/js/src/icons/news.png', function (error, image) {
					if (error) throw error;

					map.addImage('news', image);

					map.addLayer({
						id: 'cluster-count',
						type: 'symbol',
						source: 'storiesSource',

						layout: {
							'icon-image': 'news',
							'icon-size': 0.13,
							'icon-allow-overlap': true,
							'icon-offset':  { stops: [
								[13, [0, -30]],
								[17, [0, -90]]
							]},
							'text-field': '{point_count}',
							'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
							'text-size': 12,
							'text-transform': 'uppercase',
							'text-letter-spacing': 0.05,
							'text-offset': [0, 0.8],
						},

						paint: {
							'text-color': '#202',
						},

						filter: ['has', 'point_count'],
					});
				});

				const layers = [
					// [6, '#000000'],
					// [5, '#f28cb1'],
					// [2, '#f1f075'],
					[0, '#ffffff'],
				];

				layers.forEach(function (layer, i) {
					map.addLayer({
						id: 'cluster-' + i,
						type: 'circle',
						source: 'storiesSource',
						paint: {
							'circle-color': layer[1],
							'circle-radius': 20 + layer[0],
							'circle-stroke-color': '#ffffff',
							'circle-stroke-opacity': 0.4,
							'circle-stroke-width': 9,
						},
						filter:
							i === 0
								? ['>=', 'point_count', layer[0]]
								: [
									'all',
									['>=', 'point_count', layer[0]],
									['<', 'point_count', layers[i - 1][0]],
								],
					});
				});
			});

			// stories.forEach( ( story ) => {
			// 	const storyPoints = story.meta._related_point;

			// 	if ( storyPoints.length ) {
			// 		storyPoints.forEach( ( point ) => {
			// 			this.addMarkerToMap( point );
			// 		} );
			// 	}
			// } );
		});
	}

	fetchStories() {
		return fetch(jeoMapVars.jsonUrl + 'posts')
			.then((response) => response.json())
			.then(
				(stories) => {
					this.setState({
						storiesLoaded: true,
						stories,
					});

					return Promise.resolve(stories);
				},
				(error) => {
					console.log(error);

					this.setState({
						storiesLoaded: false,
					});
				}
			);
	}

	// addMarkerToMap( point ) {
	// 	const color = point.relevance === 'secondary' ? '#CCCCCC' : '#3FB1CE';
	// 	const marker = new mapboxgl.Marker( { color } );

	// 	// marker.getElement().classList.add( 'marker' );
	// 	// const popupHTML = this.popupTemplate( {
	// 	// 	post,
	// 	// 	read_more: window.jeoMapVars.string_read_more,
	// 	// 	show_featured_media: false,
	// 	// } );

	// 	//const popUp = new mapboxgl.Popup().setHTML(popupHTML);

	// 	const LngLat = {
	// 		lat: parseFloat( point._geocode_lat ),
	// 		lon: parseFloat( point._geocode_lon ),
	// 	};

	// 	marker.setLngLat( LngLat );
	// 	marker.addTo( this.state.map );
	// 	this.state.map.flyTo( { center: LngLat, zoom: 4 } );
	// }

	buildPostsGeoJson(stories) {
		const finalFeatures = {
			type: 'FeatureCollection',
			features: [],
		};

		stories.map((storie) => {
			const storieRelatedPoints = storie.meta._related_point ?? [];
			const storiePoints = storieRelatedPoints.map((point) => {
				return [point._geocode_lon, point._geocode_lat];
			});

			finalFeatures.features.push(
				...storiePoints.map((point) => {
					return {
						type: 'Feature',
						properties: storie,
						geometry: {
							type: 'Point',
							coordinates: point,
						},
					};
				})
			);
		});

		return finalFeatures;
	}

	render() {
		return (
			<div className="discovery">
				<Sidebar />
				<div
					ref={ (el) => (this.mapContainer = el) }
					style={ { height: 'calc(100vh - 200px)' } }
					className="discovery-map"
				/>
			</div>
		);
	}
}

wp.element.render(<Discorevy />, document.getElementById('post-10'));
