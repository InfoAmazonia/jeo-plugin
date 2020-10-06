import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import parse from 'html-react-parser';
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
			showLegends: false,

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
			this.map.addControl(
				new mapboxgl.NavigationControl( { showCompass: false } ),
				'top-left'
			);
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

		const legends = this.state.appliedLayers.map( layer => {
			return new window.JeoLegend( layer.meta.legend_type, {
				layer_id: layer.slug,
				legend_type_options: layer.meta.legend_type_options,
				use_legend: layer.meta.use_legend,
			} )
		} );

		let renderedLegends = legends.map( legendObj => legendObj.render());
		renderedLegends = renderedLegends.map(legendRender => parse(legendRender.outerHTML));


		// const generatedUrl = this.buildUrlParamsString({
		// 	'selected-layers': this.state.appliedLayers.map( layer => layer.id ),
		// });


		return (
			<div className="discovery">
				{ this.state.mapLoaded? <Sidebar  { ...props } /> : '' }

				<div
					ref={ (el) => (this.mapContainer = el) }
					style={ { height: 'calc(100vh - 100px)' } }
					className="discovery-map">
				</div>

				{
					renderedLegends.length?
						<div className={ "legend-container" + (this.state.showLegends? ' active' : '' ) }>
							<div className="legends-title">
								<span className="text"> Legend </span>
								<i onClick={ () => this.setState({ ...this.state, showLegends: !this.state.showLegends }) } className={ "arrow-icon" + (this.state.showLegends? ' active' : '' ) }>
									<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="chevron-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="svg-inline--fa fa-chevron-down fa-w-14 fa-3x"><path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z" class=""></path></svg>
								</i>
							</div>
							<div className="hideable-content">
								<div className="legends-wrapper">
									{ renderedLegends }
								</div>
							</div>
						</div>
					: ""
				}
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

