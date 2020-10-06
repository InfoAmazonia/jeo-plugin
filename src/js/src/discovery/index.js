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
			embedUrl: "",
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

			// filter data
			categories: [],
			tags: [],
		};

		// methods bindings
		this.updateState = this.updateState.bind(this);

	}

	componentDidMount() {
		const map = new mapboxgl.Map({
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
		});

		this.map = map;
		this.map.on('load', () => {
			this.setState({ ...this.state, mapLoaded: true } )
		})
	}

	buildUrlParamsString(params) {
		const url = new URL(`${ jeo_settings.site_url }/embed/?discovery=true`);
		const searchParams = url.searchParams;
		let newUrl = "";

		Object.keys(params).forEach( paramKey => {
			const paramValue = params[paramKey];
			searchParams.set(paramKey, JSON.stringify(paramValue));
		})

		url.search = searchParams.toString();
		newUrl = url.toString();
		return newUrl;
	}

	updateState( state ) {
		this.setState( ( currentState ) => ( {
			...currentState,
			...state,
		} ))
	}

	render() {
		// console.log(JSON.stringify(this.state));

		const props = {
			map: this.map,
			stories: this.state.stories,
			storiesLoaded: this.state.storiesLoaded,
			firstLoad: this.state.firstLoad,
			categories: this.state.categories,
			tags: this.state.tags,
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
			},

			isEmbed: this.props.embed,
			useStories: this.props.useStories,
		}

		const generatedUrl = this.buildUrlParamsString({
			'selected-layers': this.state.appliedLayers.map( layer => layer.id ),
		});

		// console.log(generatedUrl);

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


if(document.querySelector('.discovery-embed')) {
	document.querySelectorAll('.discovery-embed').forEach(element => {
		wp.element.render(<Discovery embed={ true } useStories={ false } />, element);
	});
} else {
	wp.element.render(<Discovery useStories={ true } />, document.getElementById('post-10'));
}

