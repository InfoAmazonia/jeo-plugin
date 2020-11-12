import { Component } from '@wordpress/element';
import Sidebar from './blocks/sidebar';
import parse from 'html-react-parser';
import './style/discovery.scss';
import { __ } from '@wordpress/i18n';

class Discovery extends Component {
	constructor( props ) {
		super( props );

		// map can't be a state, trust me.
		this.map = null;

		// general state
		this.state = {
			// component
			embedUrl: '',
			firstLoad: true,
			currentPage: 1,
			totalPages: null,
			totalPosts: null,
			mapLoaded: false,

			// toggles
			showLegends: false,
			showShareOptions: false,
			showEmbedTooltip: false,
			showSidebar: true,

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
			hoveredPostId: null,
			hoveredClusterPostsId: [],

			// filter data
			queryParams: {},
			dateRangeInputValue: "",
			searchField: { searchStorie: "", searchMap: ""},
			selectedTag: -1,
			tags: [],
			categories: [], // future api improvement (single api call)
		};

		// methods bindings
		this.updateState = this.updateState.bind( this );
	}

	componentDidMount() {
		let adicionalMapOptions = {};

		if ( this.getParamFromUrl( 'discovery' ) ) {
			adicionalMapOptions = {
				...adicionalMapOptions,
				center: this.getParamFromUrl( 'center' ),
				zoom: this.getParamFromUrl( 'zoom' ),
			};
		}

		const map = new mapboxgl.Map( {
			container: this.mapContainer,
			style: 'mapbox://styles/mapbox/streets-v11',
			...adicionalMapOptions,
		} );

		this.map = map;
		this.map.on( 'load', () => {
			this.map.addControl(
				new mapboxgl.NavigationControl( { showCompass: false } ),
				'top-left'
			);

			this.map.addControl( new mapboxgl.FullscreenControl(), 'top-left' );
			this.setState( { ...this.state, mapLoaded: true } );
		} );

		this.map.on( 'move', () => {
			this.setState( { ...this.state } );
		} );

		this.map.on( 'zoom', () => {
			this.setState( { ...this.state } );
		} );
	}

	getParamFromUrl( paramKey ) {
		const urlParams = new URLSearchParams( window.location.search );
		const value = JSON.parse( urlParams.get( paramKey ) );
		return value ?? false;
	}

	buildUrlParamsString( params, encodeParamsToURL = true ) {
		const url = new URL( `${ jeo_settings.site_url }/embed/?discovery=true` );
		const searchParams = url.searchParams;
		let newUrl = '';

		Object.keys( params ).forEach( ( paramKey ) => {
			const paramValue = params[ paramKey ];
			searchParams.set( paramKey, JSON.stringify( paramValue ) );
		} );

		url.search = encodeParamsToURL? encodeURIComponent(searchParams.toString()) : searchParams.toString();

		newUrl = url.toString();
		return newUrl;
	}

	updateState( state ) {
		this.setState( ( currentState ) => ( {
			...currentState,
			...state,
		} ) );
	}

	render() {
		const props = {
			map: this.map,
			stories: this.state.stories,
			storiesLoaded: this.state.storiesLoaded,
			firstLoad: this.state.firstLoad,
			categories: this.state.categories,
			tags: this.state.tags,
			dateRangeInputValue: this.state.dateRangeInputValue,
			selectedTag: this.state.selectedTag,
			queryParams: this.state.queryParams,
			searchField: this.state.searchField,
			showSidebar: this.state.showSidebar,
			// hoveredClusterPostsId: this.state.hoveredClusterPostsId,
			// hoveredPostId: this.state.hoveredPostId,
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
		};

		const legends = this.state.appliedLayers.filter(layer => layer.meta.use_legend).map( ( layer ) => {
			return new window.JeoLegend( layer.meta.legend_type, {
				layer_id: layer.slug,
				legend_type_options: layer.meta.legend_type_options,
				use_legend: layer.meta.use_legend,
				legend_title: layer.meta.legend_title,
			} );
		} );

		let renderedLegends = legends.map( ( legendObj ) => legendObj.render() );
		renderedLegends = renderedLegends.map( ( legendRender, index ) => {
				console.log(legends[index]);
				return (
					<>
						<div className="legend-single-title">
							{ legends[index].attributes.legend_title }
						</div>
						{ parse( legendRender.outerHTML ) }
					</>
				);
			}
		);

		const buildURLParams = {
			'selected-layers': this.state.appliedLayers.map( ( layer ) => layer.id ),
			zoom: this.state.mapLoaded ? this.map.getZoom() : 0,
			center: this.state.mapLoaded ? this.map.getCenter() : 0,
		};

		const generatedUrl = this.buildUrlParamsString(buildURLParams);
		const notEncodedUrl = this.buildUrlParamsString(buildURLParams, false);



		return (
			<div className={ 'discovery-block' + ( this.props.embed ? ' embed' : '' ) + ( this.state.showSidebar ? ' active' : '' ) }>
				{ ! this.state.mapLoaded && ! this.props.embed ? (
					<div className="placeholder animated-background" />
				) : (
					''
				) }
				{ this.state.mapLoaded ? <Sidebar { ...props } /> : '' }

				<div
					ref={ ( el ) => ( this.mapContainer = el ) }
					className="discovery-map"
				>
					{ ! this.props.embed && (
						<div
							className={
								'share-toolbar' +
								( this.state.showShareOptions ? ' active' : '' )
							}
						>
							<div className="options">
								<a href={ "https://twitter.com/intent/tweet?text=" + generatedUrl } target="_blank" rel="noreferrer">
									<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="twitter" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z" class=""></path></svg>
								</a>

								<a href={ "https://www.facebook.com/sharer/sharer.php?u=" + generatedUrl }  target="_blank" rel="noreferrer">
									<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="facebook-f" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"></path></svg>
								</a>

								<a href={ "weixin://dl/moments" }  target="_blank" rel="noreferrer">
									<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="weixin" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M385.2 167.6c6.4 0 12.6.3 18.8 1.1C387.4 90.3 303.3 32 207.7 32 100.5 32 13 104.8 13 197.4c0 53.4 29.3 97.5 77.9 131.6l-19.3 58.6 68-34.1c24.4 4.8 43.8 9.7 68.2 9.7 6.2 0 12.1-.3 18.3-.8-4-12.9-6.2-26.6-6.2-40.8-.1-84.9 72.9-154 165.3-154zm-104.5-52.9c14.5 0 24.2 9.7 24.2 24.4 0 14.5-9.7 24.2-24.2 24.2-14.8 0-29.3-9.7-29.3-24.2.1-14.7 14.6-24.4 29.3-24.4zm-136.4 48.6c-14.5 0-29.3-9.7-29.3-24.2 0-14.8 14.8-24.4 29.3-24.4 14.8 0 24.4 9.7 24.4 24.4 0 14.6-9.6 24.2-24.4 24.2zM563 319.4c0-77.9-77.9-141.3-165.4-141.3-92.7 0-165.4 63.4-165.4 141.3S305 460.7 397.6 460.7c19.3 0 38.9-5.1 58.6-9.9l53.4 29.3-14.8-48.6C534 402.1 563 363.2 563 319.4zm-219.1-24.5c-9.7 0-19.3-9.7-19.3-19.6 0-9.7 9.7-19.3 19.3-19.3 14.8 0 24.4 9.7 24.4 19.3 0 10-9.7 19.6-24.4 19.6zm107.1 0c-9.7 0-19.3-9.7-19.3-19.6 0-9.7 9.7-19.3 19.3-19.3 14.5 0 24.4 9.7 24.4 19.3.1 10-9.9 19.6-24.4 19.6z"></path></svg>
								</a>

								<a href={ notEncodedUrl }  target="_blank" rel="noreferrer">
									<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="link" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M326.612 185.391c59.747 59.809 58.927 155.698.36 214.59-.11.12-.24.25-.36.37l-67.2 67.2c-59.27 59.27-155.699 59.262-214.96 0-59.27-59.26-59.27-155.7 0-214.96l37.106-37.106c9.84-9.84 26.786-3.3 27.294 10.606.648 17.722 3.826 35.527 9.69 52.721 1.986 5.822.567 12.262-3.783 16.612l-13.087 13.087c-28.026 28.026-28.905 73.66-1.155 101.96 28.024 28.579 74.086 28.749 102.325.51l67.2-67.19c28.191-28.191 28.073-73.757 0-101.83-3.701-3.694-7.429-6.564-10.341-8.569a16.037 16.037 0 0 1-6.947-12.606c-.396-10.567 3.348-21.456 11.698-29.806l21.054-21.055c5.521-5.521 14.182-6.199 20.584-1.731a152.482 152.482 0 0 1 20.522 17.197zM467.547 44.449c-59.261-59.262-155.69-59.27-214.96 0l-67.2 67.2c-.12.12-.25.25-.36.37-58.566 58.892-59.387 154.781.36 214.59a152.454 152.454 0 0 0 20.521 17.196c6.402 4.468 15.064 3.789 20.584-1.731l21.054-21.055c8.35-8.35 12.094-19.239 11.698-29.806a16.037 16.037 0 0 0-6.947-12.606c-2.912-2.005-6.64-4.875-10.341-8.569-28.073-28.073-28.191-73.639 0-101.83l67.2-67.19c28.239-28.239 74.3-28.069 102.325.51 27.75 28.3 26.872 73.934-1.155 101.96l-13.087 13.087c-4.35 4.35-5.769 10.79-3.783 16.612 5.864 17.194 9.042 34.999 9.69 52.721.509 13.906 17.454 20.446 27.294 10.606l37.106-37.106c59.271-59.259 59.271-155.699.001-214.959z"></path></svg>
								</a>

								<a href={ "mailto:?subject=Discovery&body=" + generatedUrl }  target="_blank" rel="noreferrer">
									<svg aria-hidden="true" focusable="false" data-prefix="fab" data-icon="envelope" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm0 48v40.805c-22.422 18.259-58.168 46.651-134.587 106.49-16.841 13.247-50.201 45.072-73.413 44.701-23.208.375-56.579-31.459-73.413-44.701C106.18 199.465 70.425 171.067 48 152.805V112h416zM48 400V214.398c22.914 18.251 55.409 43.862 104.938 82.646 21.857 17.205 60.134 55.186 103.062 54.955 42.717.231 80.509-37.199 103.053-54.947 49.528-38.783 82.032-64.401 104.947-82.653V400H48z"></path></svg>
								</a>

								<button
									onClick={ () =>
										this.setState( {
											...this.state,
											showEmbedTooltip: ! this.state.showEmbedTooltip,
										} )
									}
								>
									{ __( 'embed' ) }
								</button>

								{ this.state.showEmbedTooltip && (
									<div className="embed-tooltip">
										<textarea disabled readOnly>
											{ `<iframe src="${ notEncodedUrl }" frameborder="0"></iframe>` }
										</textarea>
									</div>
								) }
							</div>

							<button
								className="share"
								onClick={ () =>
									this.setState( {
										...this.state,
										showShareOptions: ! this.state.showShareOptions,
									} )
								}
							>
								<svg
									aria-hidden="true"
									focusable="false"
									data-prefix="fas"
									data-icon="share-alt"
									role="img"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 448 512"
									className="share-icon"
								>
									<path
										fill="currentColor"
										d="M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"
									></path>
								</svg>
							</button>
						</div>
					) }
				</div>

				{ renderedLegends.length ? (
					<div
						className={
							'legend-container' + ( this.state.showLegends ? ' active' : '' )
						}
					>
						<div className="legends-title">
							<span className="text">{ __( 'Legend' ) }</span>
							<i
								onClick={ () =>
									this.setState( {
										...this.state,
										showLegends: ! this.state.showLegends,
									} )
								}
								className={
									'arrow-icon' + ( this.state.showLegends ? ' active' : '' )
								}
							>
								<svg
									aria-hidden="true"
									focusable="false"
									data-prefix="fas"
									data-icon="chevron-down"
									role="img"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 448 512"
								>
									<path
										fill="currentColor"
										d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"
									></path>
								</svg>
							</i>
						</div>
						<div className="hideable-content">
							<div className="legends-wrapper">{ renderedLegends }</div>
						</div>
					</div>
				) : (
					''
				) }
			</div>
		);
	}
}

if ( document.querySelector( '.discovery-embed' ) ) {
	document.querySelectorAll( '.discovery-embed' ).forEach( ( element ) => {
		wp.element.render(
			<Discovery embed={ true } useStories={ false } />,
			element
		);
	} );
} else if( document.getElementById( 'discovery' )) {
	wp.element.render(
		<Discovery useStories={ true } />,
		document.getElementById( 'discovery' )
	);
}
