import { Component } from '@wordpress/element';

// mapboxgl.accessToken = 'MAPBOX_ACCESS_TOKEN';

class Discorevy extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			// map
			map: null,

			// stories
			storiesLoaded: false,
			stories: [],

		};
	}

	componentDidMount() {
		const map = new mapboxgl.Map( {
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			// center: [this.state.lng, this.state.lat],
			// zoom: this.state.zoom
		} );

		this.setState( {
			map,
		} );

		// map.on('move', () => {
		// 	console.log( this.state.map );
		// });

		this.fetchStories().then( ( stories ) => {
			const sourceData = this.buildPostsGeoJson(stories);

			map.on('load', function() {
				// Add a new source from our GeoJSON data and set the
				// 'cluster' option to true.
				map.addSource("storiesSource", {
					type: "geojson",
					// Point to GeoJSON data. This example visualizes all M1.0+ storiesSource
					// from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
					data: sourceData,
					cluster: true,
					clusterMaxZoom: 14, // Max zoom to cluster points on
					clusterRadius: 40 // Radius of each cluster when clustering points (defaults to 50)
				});

				// Use the storiesSource source to create five layers:
				// One for unclustered points, three for each cluster category,
				// and one for cluster labels.
				map.addLayer({
					"id": "unclustered-points",
					"type": "symbol",
					"source": "storiesSource",
					"filter": ["!has", "point_count"],
					"layout": {
						"icon-image": "marker-15"
					}
				});

				// Display the earthquake data in three layers, each filtered to a range of
				// count values. Each range gets a different fill color.
				const layers = [
					[20, '#f28cb1'],
					[10, '#f1f075'],
					[0, '#ffffff']
				];

				layers.forEach(function (layer, i) {
					map.addLayer({
						"id": "cluster-" + i,
						"type": "circle",
						"source": "storiesSource",
						"paint": {
							"circle-color": layer[1],
							"circle-radius": 18 + layer[0]
						},
						"filter": i === 0 ?
							[">=", "point_count", layer[0]] :
							["all",
								[">=", "point_count", layer[0]],
								["<", "point_count", layers[i - 1][0]]]
					});
				});

				// Add a layer for the clusters' count labels
				map.addLayer({
					"id": "cluster-count",
					"type": "symbol",
					"source": "storiesSource",
					"layout": {
						"text-field": "{point_count}",
						"text-font": [
							"DIN Offc Pro Medium",
							"Arial Unicode MS Bold"
						],
						"text-size": 12
					}
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
		} );
	}

	fetchStories() {
		return fetch( jeoMapVars.jsonUrl + 'posts' )
			.then( ( response ) => response.json() )
			.then(
				( stories ) => {
					this.setState( {
						storiesLoaded: true,
						stories,
					} );

					return Promise.resolve( stories );
				},
				( error ) => {
					console.log( error );

					this.setState( {
						storiesLoaded: false,
					} );
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
			'type': 'FeatureCollection',
			'features': []
		};

		stories.map( (storie) => {
			const storieRelatedPoints = storie.meta._related_point?? [];
			const storiePoints = storieRelatedPoints.map(( point ) => {
				return [ point._geocode_lon, point._geocode_lat ]
			});

			finalFeatures.features.push(...storiePoints.map( point => {
				return {
					'type': 'Feature',
					'properties': storie,
					'geometry': {
						'type': 'Point',
						'coordinates': point,
					}
				};
			}));

		} );

		return finalFeatures;
	}

	render() {
		return (
			<div>
				<div className="stories">

				</div>
				<div ref={(el) => (this.mapContainer = el)} style={{ height: 'calc(100vh - 200px)' }} className="" />
			</div>
		);
	}
}

wp.element.render(<Discorevy />, document.getElementById('post-10'));
