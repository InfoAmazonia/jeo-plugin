import { Component } from '@wordpress/element';

// mapboxgl.accessToken = 'MAPBOX_ACCESS_TOKEN';

class Discorevy extends Component {
	constructor(props) {
		super(props);
		this.state = {
			map: null,
			itens: [],
		};
	}

	componentDidMount() {
		const map = new mapboxgl.Map( {
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			// center: [this.state.lng, this.state.lat],
			// zoom: this.state.zoom
		} );

		// this.setState({
		// 	map,
		// });

		// map.on('move', () => {
		// 	console.log( this.state.map );
		// });

		this.fetchStories();
	}

	fetchStories() {
		fetch( jeoMapVars.jsonUrl + 'posts' )
			.then( ( response ) => response.json() )
			.then(
				( stories ) => {
					this.setState( {
						storiesLoaded: true,
						items: stories,
					} );
				},
				( error ) => {
					console.log( error );

					this.setState( {
						storiesLoaded: false,
					} );
				}
			);
	}

	// addPostToMap(post) {
	// 	if (post.meta._related_point) {
	// 		post.meta._related_point.forEach((point) => {
	// 			this.addPointToMap(point, post);
	// 		});
	// 	}
	// }

	// addPointToMap(point, post) {
	// 	const color = point.relevance === 'secondary' ? '#CCCCCC' : '#3FB1CE';
	// 	const marker = new mapboxgl.Marker({ color });
	// 	marker.getElement().classList.add('marker');

	// 	const popupHTML = this.popupTemplate({
	// 		post,
	// 		read_more: window.jeoMapVars.string_read_more,
	// 		show_featured_media: false,
	// 	});

	// 	const popUp = new mapboxgl.Popup().setHTML(popupHTML);

	// 	const LngLat = {
	// 		lat: parseFloat(point._geocode_lat),
	// 		lon: parseFloat(point._geocode_lon),
	// 	};

	// 	marker.setLngLat(LngLat);
	// 	marker.addTo(this.map);
	// 	this.markers.push(marker);

	// 	marker.getElement().addEventListener('click', () => {
	// 		this.activateMarker(marker);
	// 		if (
	// 			!this.options ||
	// 			!this.options.marker_action === 'embed_preview'
	// 		) {
	// 			marker.setPopup(popUp);
	// 		} else {
	// 			this.embedPreviewActive = true;
	// 			this.updateEmbedPreview(post);
	// 		}
	// 		this.map.flyTo({ center: LngLat });
	// 	});

	// 	// By default, fly to the first post and centers it
	// 	this.activateMarker(marker);
	// 	this.map.flyTo({ center: LngLat, zoom: 4 });
	// }

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
