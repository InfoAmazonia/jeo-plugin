import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import './style/discovery.scss';

const POSTS_PER_PAGE = 4;

class Discovery extends Component {
	constructor(props) {
		super(props);
		// map can't be a state, trust me.
		this.map = null;

		this.state = {
			// component
			firstLoad: true,
			currentPage: 1,
			totalPages: null,
			totalPosts: null,

			// layers
			selectedLayers: [],

			// stories
			storiesLoaded: false,
			stories: [],
		};

		this.updateStories = this.updateStories.bind(this);

	}

	componentDidMount() {
		const map = new mapboxgl.Map({
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			// center: [this.state.lng, this.state.lat],
			// zoom: this.state.zoom
		});

		this.map = map;

		if (this.state.firstLoad) {
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
								// 'text-field': 'story',
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
			});

			this.setState({
				...this.state,
				firstLoad: false
			})
		}
	}

	fetchStories(params = {}) {
		// Use constant POSTS_PER_PAGE if param per_page is not set
		if(!params.hasOwnProperty('per_page')) params.per_page = POSTS_PER_PAGE;

		// Update using cumulative param for stories infinit scrolling
		if(params.hasOwnProperty('cumulative') && params.cumulative) {
			params.page = this.state.currentPage;
			params.page++;

			this.setState(( state ) => ( {
				...state,
				currentPage: params.page,
			} ))
		};

		// Cancel request if page exceed the max page;
		if ( params.page > this.state.totalPages ) {
			return Promise.reject();
		}


		const url = new URL(jeoMapVars.jsonUrl + 'posts/');
		Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

		return fetch(url)
			.then((response) => {
				this.setState(( state ) => ({
					...state,
					totalPages: response.headers.get('X-WP-TotalPages'),
					totalPosts: response.headers.get('X-WP-Total'),
				} ) );

				return response;
			})
			.then((response) => response.json())
			.then((stories) => {
					const geolocatedStories = stories.filter( ( story ) => story.meta._related_point.length > 0);
					const storiesCumulative = params.cumulative? [ ...this.state.stories, ...geolocatedStories ] : geolocatedStories;

					this.setState( ( state ) => ( {
						...state,
						storiesLoaded: true,
						stories: storiesCumulative,
					} ) );

					return Promise.resolve(storiesCumulative);
				},
				(error) => {
					console.log(error);

					this.setState( ( state ) => ({
						...state,
						storiesLoaded: false,
					} ) );
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

		stories.map((story) => {
			const storyRelatedPoints = story.meta._related_point ?? [];
			const storyPoints = storyRelatedPoints.map((point) => {
				return [point._geocode_lon, point._geocode_lat];
			});

			finalFeatures.features.push(
				...storyPoints.map((point) => {
					return {
						type: 'Feature',
						properties: story,
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

	updateStories(params) {
		// console.log('updateStories');

		this.fetchStories({ ...params }).then((stories) => {
			const sourceData = this.buildPostsGeoJson(stories);
			this.map.getSource('storiesSource').setData(sourceData);
		}).catch( () => "")
	}

	render() {
		return (
			<div className="discovery">
				<Sidebar stories={ this.state.stories } updateStories={ this.updateStories } />

				<div
					ref={ (el) => (this.mapContainer = el) }
					style={ { height: 'calc(100vh - 100px)' } }
					className="discovery-map"
				/>
			</div>
		);
	}
}

wp.element.render(<Discovery />, document.getElementById('post-10'));