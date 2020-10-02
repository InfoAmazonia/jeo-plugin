import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import './style/discovery.scss';



class Discovery extends Component {
	constructor(props) {
		super(props);

		// map can't be a state, trust me.
		this.map = null;

		// general state
		this.state = {
			// component
			firstLoad: true,
			currentPage: 1,
			totalPages: null,
			totalPosts: null,
			mapLoaded: false,

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

		// methods bindings
		this.updateState = this.updateState.bind(this);

	}

	componentDidMount() {
		const map = new mapboxgl.Map({
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			// center: [this.state.lng, this.state.lat],
			// zoom: this.state.zoom
		});

		this.map = map;
		this.map.on('load', () => {
			this.setState({ ...this.state, mapLoaded: true } )
		})
	}

	updateState( state ) {
		this.setState( ( currentState ) => ( {
			...currentState,
			...state,
		} ))
	}

	render() {
		console.log(JSON.stringify(this.state));

		const props = {
			map: this.map,
			stories: this.state.stories,
			storiesLoaded: this.state.storiesLoaded,
			firstLoad: this.state.firstLoad,
			updateStories: this.updateStories,

			mapsLoaded: this.state.mapsLoaded,
			maps: this.state.maps,
			selectedLayers: this.state.selectedLayers,
			appliedLayers: this.state.appliedLayers,
			layersQueue: this.state.layersQueue,
			applyLayersChanges: this.applyLayersChanges,

			updateState: this.updateState,
			pageInfo: {
				currentPage: this.state.currentPage,
				totalPages: this.state.totalPages,
				totalPosts: this.state.totalPosts,
			}
		}

		//console.log(this.state.selectedLayers);

		return (
			<div className="discovery">
				{ this.state.mapLoaded? <Sidebar  { ...props } /> : '' }

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
