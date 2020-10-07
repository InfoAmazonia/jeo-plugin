import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import parse from 'html-react-parser';
import './style/discovery.scss';
import { __ } from '@wordpress/i18n';

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

			// toggles
			showLegends: false,
			showShareOptions: false,
			showEmbedTooltip: false,

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
			queryParams: {},
			tags: [],
			categories: [], // future api improvement (single api call)
		};

		// methods bindings
		this.updateState = this.updateState.bind(this);

	}

	componentDidMount() {
		let adicionalMapOptions = {};

		if(this.getParamFromUrl('discovery')) {
			adicionalMapOptions = {
				...adicionalMapOptions,
				center: this.getParamFromUrl('center'),
				zoom: this.getParamFromUrl('zoom'),
			}
		}

		const map = new mapboxgl.Map({
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			...adicionalMapOptions,
		});

		this.map = map;
		this.map.on('load', () => {
			this.map.addControl(
				new mapboxgl.NavigationControl( { showCompass: false } ),
				'top-left'
			);

			this.map.addControl(new mapboxgl.FullscreenControl(), 'top-left');

			this.setState({ ...this.state, mapLoaded: true } )
		})
	}

	getParamFromUrl(paramKey) {
		const urlParams = new URLSearchParams(window.location.search);
		const value = JSON.parse(urlParams.get(paramKey));
		return  value?? false;
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
			queryParams: this.state.queryParams,
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


		const generatedUrl = this.buildUrlParamsString({
			'selected-layers': this.state.appliedLayers.map( layer => layer.id ),
			'zoom': this.state.mapLoaded? this.map.getZoom() : 0,
			'center': this.state.mapLoaded? this.map.getCenter() : 0,
		});

		console.log(generatedUrl);


		return (
			<div className={ "discovery" + (this.props.embed? ' embed' : '' ) } >
				{ !this.state.mapLoaded && !this.props.embed? <div className="placeholder animated-background" /> : '' }
				{ this.state.mapLoaded? <Sidebar  { ...props } /> : '' }

				<div ref={ (el) => (this.mapContainer = el) } className="discovery-map">
					{	!this.props.embed &&
						<div className={ "share-toolbar" + (this.state.showShareOptions? ' active' : '' ) } >
							<div className="options">
								<button onClick={ () => this.setState( { ...this.state, showEmbedTooltip: !this.state.showEmbedTooltip } ) }>
									{ __("embed") }
								</button>

								{
									this.state.showEmbedTooltip  &&
									<div className="embed-tooltip">
										<textarea disabled readOnly>
											{ `<iframe src="${ generatedUrl }" frameborder="0"></iframe>` }
										</textarea>
									</div>
								}
							</div>

							<button className="share" onClick={ () => this.setState( { ...this.state,  showShareOptions: !this.state.showShareOptions } ) }>
								<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="share-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="share-icon"><path fill="currentColor" d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z" class=""></path></svg>
							</button>

						</div>
					}
				</div>

				{
					renderedLegends.length?
						<div className={ "legend-container" + (this.state.showLegends? ' active' : '' ) }>
							<div className="legends-title">
								<span className="text">
									{ __("Legend") }
								</span>
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

