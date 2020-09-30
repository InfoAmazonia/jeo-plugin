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

			// maps
			maps: [],
			mapsLoaded: false,

			// markers
			markers: [],

			// layers
			selectedLayers: {},
			appliedLayers: [],
			layersQueue: [],

			// stories
			storiesLoaded: false,
			stories: [],
		};

		this.updateStories = this.updateStories.bind(this);
		this.storyHovered = this.storyHovered.bind(this);
		this.storyUnhover = this.storyUnhover.bind(this);
		this.setMapsState = this.setMapsState.bind(this);
		this.toggleLayer = this.toggleLayer.bind(this);
		this.applyLayersChanges = this.applyLayersChanges.bind(this);

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
			this.fetchStories({ page: 1 }).then((stories) => {
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
						// Single markers layer
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
								// 'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
								// 'text-size': 11,
								// 'text-transform': 'uppercase',
								// 'text-letter-spacing': 0.05,
								// 'text-offset': [0, 3],
							},

							// paint : {
							// 	'icon-opacity': 1,
							// }
						});
					});

					map.loadImage(jeoMapVars.jeoUrl + '/js/src/icons/news-marker-hover.png', function (error, image) {
						if (error) throw error;

						map.addImage('news-marker-hover', image);

						map.addLayer({
							id: 'hover-unclustered-points',
							type: 'symbol',
							source: 'storiesSource',
							filter: ['!', ['has', 'point_count']],
							layout: {
								'icon-image': 'news-marker-hover',
								'icon-size': 0.10,
								'icon-allow-overlap': true,
							},

							paint : {
								'icon-opacity': [
									'case',
									['boolean', ['feature-state', 'hover'], false],
									1,
									0
								],
							}


						});

					});

					map.loadImage(jeoMapVars.jeoUrl + '/js/src/icons/news.png', function (error, image) {
						if (error) throw error;

						map.addImage('news-no-marker', image);

						const layers = [
							// [6, '#000000'],
							// [5, '#f28cb1'],
							// [2, '#f1f075'],
							[0, '#ffffff'],
						];

						// cluster circle layer
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

						// cluster number layer
						map.addLayer({
							id: 'cluster-count',
							type: 'symbol',
							source: 'storiesSource',

							layout: {
								'icon-image': 'news-no-marker',
								'icon-size': 0.13,
								'icon-allow-overlap': false,
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
								'text-color': '#202202',
							},

							filter: ['has', 'point_count'],
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
		const defaultParams = { cumulative: false };
		params = { ...defaultParams, ...params }

		// Use constant POSTS_PER_PAGE if param per_page is not set
		if(!params.hasOwnProperty('per_page')) params.per_page = POSTS_PER_PAGE;

		// Set or use param page
		if( !params.hasOwnProperty('page') ) {
			params.page = this.state.currentPage;

			if ( !( params.page > this.state.totalPages ) ) {
				params.page++;
			}
		} else {
			params.page = 1;
		}

		// Update storiesLoaded to display loading & set current page to param
		this.setState(( state ) => ( {
			...state,
			currentPage: params.page,
			storiesLoaded: false,

		} ))

		// Update using cumulative param for stories - infinite scrolling
		if(params.hasOwnProperty('cumulative') && params.cumulative) {
			// console.log( params.page, this.state.totalPages );

			// Cancel request if page exceed the max page;
			if ( params.page > this.state.totalPages ) {
				return Promise.reject();
			}
		};

		const postsUrl = new URL(jeoMapVars.jsonUrl + 'posts/');
		Object.keys(params).forEach(key => postsUrl.searchParams.append(key, params[key]))

		return fetch(postsUrl)
			.then((response) => {
				this.setState(( state ) => ({
					...state,
					totalPages: parseInt(response.headers.get('X-WP-TotalPages')),
					totalPosts: parseInt(response.headers.get('X-WP-Total')),
				} ) );

				return response;
			})
			.then((response) => response.json())
			.then((stories) => {
					const geolocatedStories = stories.filter( ( story ) => story.meta._related_point.length > 0);
					let storiesCumulative = params.cumulative? [ ...this.state.stories, ...geolocatedStories ] : geolocatedStories;

					// Fetch medias
					const storiesMediasPromises = geolocatedStories.map( async ( story ) => {
						const mediaApiUrl = new URL(jeoMapVars.jsonUrl + 'media/' + story.featured_media);

						// If featured media is not set
						if(!story.featured_media) {
							return;
						}

						return fetch(mediaApiUrl).then( data => data.json() ).then( ( media ) => {
							story.queriedFeaturedImage = media;
							return media;
						});
					} )

					// Fetch categories
					const storiesCategoriesPromises = geolocatedStories.map( ( story ) => {
						return Promise.all(story.categories.map ( async ( category ) => {
							const categoriesApiUrl = new URL(jeoMapVars.jsonUrl + 'categories/' + category);

							// If category is not set (remove Uncategorized)
							// if( !category ) {
							// 	return;
							// }

							return fetch(categoriesApiUrl).then( data => data.json()).then( ( category ) => {
								if ( story.queriedCategories && story.queriedCategories.length ) {
									story.queriedCategories = [ ...story.queriedCategories, category];
								} else {
									story.queriedCategories = [ category ];
								}

								return category;
							});
						}))
					} )


					// When its all resolved, update state
					return Promise.all(storiesMediasPromises)
						.then( () => Promise.all(storiesCategoriesPromises)
						.then( () => {
							storiesCumulative = params.cumulative? [ ...this.state.stories, ...geolocatedStories ] : geolocatedStories;

							this.setState( ( state ) => ( {
								...state,
								storiesLoaded: true,
								stories: storiesCumulative,
							} ) );

							return Promise.resolve(storiesCumulative);
						} ) );


				},
				(error) => {
					console.log(error);

					this.setState( ( state ) => ({
						...state,
						storiesLoaded: true,
					} ) );
				}
			);
	}

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
						id: story.id,
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
		}).catch( () =>
			this.setState( ( state ) => ( {
				...state,
				storiesLoaded: true,
		} ) ) )
	}

	storyHovered(story) {
		const average = { lat: 0, lon: 0 };

		story.meta._related_point.forEach( point => {
			const LngLat = {
				lat: parseFloat( point._geocode_lat ),
				lon: parseFloat( point._geocode_lon ),
			};

			// average.lat += LngLat.lat/story.meta._related_point.length
			// average.lon += LngLat.lon/story.meta._related_point.length

			average.lat = LngLat.lat;
			average.lon = LngLat.lon;
		})

		this.map.flyTo( { center: average, zoom: 7 } );

		this.map.setFeatureState(
			{ source: 'storiesSource', id: story.id },
			{ hover: true }
		);
	}

	storyUnhover(story) {
		this.map.setFeatureState(
			{ source: 'storiesSource', id: story.id },
			{ hover: false }
		);
	}

	setMapsState(maps) {
		// console.log("Set maps");
		// console.log(maps);

		this.setState( ( state ) => ( {
			...state,
			maps,
			mapsLoaded: true,
		} ))
	}

	applyLayersChanges() {
		const batch = this.state.layersQueue;
		let appliedLayers = this.state.appliedLayers;

		appliedLayers.forEach( layer => {
			const layerId = String(layer.id);
			// If layer is not requested
			if(!batch.includes(layer.id)) {
				if( this.map.getLayer( layerId ) ) {
					this.map.removeLayer( layerId );
				}
			}
		} )

		batch.forEach( layerID => {
			const layerId = String( layerID );
			const layer = this.state.selectedLayers[ layerId ];

			console.log(layer.meta.type);

			if(layer.meta.type === "tilelayer") {
				if(!this.map.getSource( layerId ) ) {
					this.map.addSource( layerId, {
						type: 'raster',
						tiles: [ layer.meta.layer_type_options.url ],
						tileSize: 256,
					});
				}

				if(this.map.getLayer( layerId ) === undefined) {
					this.map.addLayer( {
						id: layerId,
						type: 'raster',
						source: layerId,
						layout: {
							'visibility': 'visible',
						}
					} );

					this.map.moveLayer(layerId, 'unclustered-points');
				}
			} else if(layer.meta.type === "mapbox") {
				if(this.map.getLayer( layerId ) === undefined) {
					if(!this.map.getSource( layerId ) ) {
						this.map.addSource( layerId, {
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

					this.map.addLayer(newLayer);
					this.map.moveLayer(layerId, 'unclustered-points');
				}
			}
		} );




		appliedLayers = batch.map( layerId => {
			return this.state.selectedLayers[layerId];
		});

		this.setState( ( state ) => ( {
			...state,
			appliedLayers,
		} ) )
	}

	toggleLayer(layer) {
		const selectedLayers = Object.assign({}, this.state.selectedLayers);
		let layersQueue = [...this.state.layersQueue];

		// If layer does not exist
		if(!selectedLayers.hasOwnProperty(layer.id)) {
			selectedLayers[ layer.id ] = layer;
			layersQueue = [ ...layersQueue, layer.id ];

			this.setState( ( state ) => ( {
				...state,
				selectedLayers,
				layersQueue,
			} ) );

			// push to layers queue

		} else {
			layersQueue = layersQueue.filter( id => id !== layer.id)
			delete selectedLayers[ layer.id ];

			this.setState( ( state ) => ( {
				...state,
				selectedLayers,
				layersQueue ,
			} ) );
		}

	}

	render() {
		const props = {
			stories: this.state.stories,
			storiesLoaded: this.state.storiesLoaded,
			updateStories: this.updateStories,
			storyHovered: this.storyHovered,
			storyUnhover: this.storyUnhover,

			mapsLoaded: this.state.mapsLoaded,
			maps: this.state.maps,
			selectedLayers: this.state.selectedLayers,
			layersQueue: this.state.layersQueue,
			setMapsState: this.setMapsState,
			toggleLayer: this.toggleLayer,
			applyLayersChanges: this.applyLayersChanges,
		}

		//console.log(this.state.selectedLayers);

		return (
			<div className="discovery">
				<Sidebar  { ...props } />

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
