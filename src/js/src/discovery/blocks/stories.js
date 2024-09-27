import { Component } from '@wordpress/element';
import Search from './search';
import LazyImage from './lazy-image';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

const POSTS_PER_PAGE = 10;
const MEMOIZED_CATEGORIES = {};

class Stories extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			stories: [],
			searchQuery: {},
			showFilters: false,
			dateRangeObject: { after: new Date(), before: new Date() },
			hoveredPostId: null,
			hoveredClusterPostsId: [],
		};

		// Story bindings
		this.storyHovered = this.storyHovered.bind( this );
		this.storyUnhover = this.storyUnhover.bind( this );
		this.updateStories = this.updateStories.bind( this );

		// Filters bind
		// DateRangePicker
		this.dateRangePickerApply = this.dateRangePickerApply.bind( this );
		this.dateRangePickerCancel = this.dateRangePickerCancel.bind( this );

		this.handleTagChange = this.handleTagChange.bind( this );
		this.localeInfo = {
			"format": __("MM/DD/YYYY", "jeo"),
			"separator": __(" - ", "jeo"),
			"applyLabel": __("Apply", "jeo"),
			"cancelLabel": __("Cancel", "jeo"),
			"fromLabel": __("From", "jeo"),
			"toLabel": __("To", "jeo"),
			"customRangeLabel": __("Custom", "jeo"),
			"daysOfWeek": [
				__("Su", "jeo"),
				__("Mo", "jeo"),
				__("Tu", "jeo"),
				__("We", "jeo"),
				__("Th", "jeo"),
				__("Fr", "jeo"),
				__("Sa", "jeo")
			],
			"monthNames": [
				__("January", "jeo"),
				__("February", "jeo"),
				__("March", "jeo"),
				__("April", "jeo"),
				__("May", "jeo"),
				__("June", "jeo"),
				__("July", "jeo"),
				__("August", "jeo"),
				__("September", "jeo"),
				__("October", "jeo"),
				__("November", "jeo"),
				__("December", "jeo")
			],
			"firstDay": 1
		};

		const map = this.props.map;

		if ( this.props.firstLoad && this.props.useStories ) {
			// Future optimization - fetching all categories is faster than getting them one by one
			// this.fetchCategories().then( categories => {
			// 	// console.log(categories);
			// 	this.props.updateState( {
			// 		categories
			// 	} )
			// } );

			this.fetchTags().then( ( tags ) => {
				// console.log(tags);
				this.props.updateState( {
					tags,
				} );
			} );

			this.fetchStories( { page: 1 } ).then( ( stories ) => {
				const sourceData = this.buildPostsGeoJson( stories );
				map.addSource( 'storiesSource', {
					type: 'geojson',
					data: sourceData,
					cluster: true,
					clusterMaxZoom: 40,
					clusterRadius: 40,
				} );

				map.loadImage(
					jeoMapVars.jeoUrl + '/js/src/icons/news-marker.png',
					( error, image ) => {
						if ( error ) throw error;

						map.addImage( 'news-marker', image );
						// Single markers layer
						map.addLayer( {
							id: 'unclustered-points',
							type: 'symbol',
							source: 'storiesSource',
							filter: [ '!', [ 'has', 'point_count' ] ],
							layout: {
								'icon-image': 'news-marker',
								'icon-size': 0.1,
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
						} );

						map.loadImage(
							jeoMapVars.jeoUrl + '/js/src/icons/news-marker-hover.png',
							function ( error, image ) {
								if ( error ) throw error;

								map.addImage( 'news-marker-hover', image );

								map.addLayer( {
									id: 'hover-unclustered-points',
									type: 'symbol',
									source: 'storiesSource',
									filter: [ '!', [ 'has', 'point_count' ] ],
									layout: {
										'icon-image': 'news-marker-hover',
										'icon-size': 0.1,
										'icon-allow-overlap': true,
									},

									paint: {
										'icon-opacity': [
											'case',
											[ 'boolean', [ 'feature-state', 'hover' ], false ],
											1,
											0,
										],
									},
								} );
							}
						);


						map.loadImage( jeoMapVars.jeoUrl + '/js/src/icons/news.png', (
							error,
							image
						) => {
							if ( error ) throw error;

							map.addImage( 'news-no-marker', image );

							const layers = [
								// [6, '#000000'],
								// [5, '#f28cb1'],
								// [2, '#f1f075'],
								[ 0, '#ffffff' ],
							];

							// cluster circle layer
							layers.forEach( ( layer, i ) => {
								map.addLayer( {
									id: 'cluster-' + i,
									type: 'circle',
									source: 'storiesSource',
									paint: {
										'circle-color': layer[ 1 ],
										'circle-radius': 20 + layer[ 0 ],
										'circle-stroke-color': '#ffffff',
										'circle-stroke-opacity': 0.4,
										'circle-stroke-width': 9,
									},
									filter:
										i === 0
											? [ '>=', 'point_count', layer[ 0 ] ]
											: [
													'all',
													[ '>=', 'point_count', layer[ 0 ] ],
													[ '<', 'point_count', layers[ i - 1 ][ 0 ] ],
											  ],
								} );
							} );

							// cluster number layer
							map.addLayer( {
								id: 'cluster-count',
								type: 'symbol',
								source: 'storiesSource',

								layout: {
									'icon-image': 'news-no-marker',
									'icon-size': 0.13,
									'icon-allow-overlap': false,
									'icon-offset': {
										stops: [
											[ 13, [ 0, -30 ] ],
											[ 17, [ 0, -90 ] ],
										],
									},
									'text-field': '{point_count}',
									'text-font': [ 'Open Sans Regular', 'Arial Unicode MS Regular' ],
									'text-size': 12,
									'text-transform': 'uppercase',
									'text-letter-spacing': 0.05,
									'text-offset': [ 0, 0.8 ],
								},

								paint: {
									'text-color': '#202202',
								},

								filter: [ 'has', 'point_count' ],
							} );

						} );
					}
				);
			} );

			this.props.updateState( {
				firstLoad: false,
			} );
		}


		map.on('mousemove', 'unclustered-points', (e) => {
			if (e.features.length > 0 && map.selectedTab.name === "stories") {
				// if (this.state.hoveredPostId) {
				// 	map.setFeatureState(
				// 		{ source: 'storiesSource', id: this.state.hoveredPostId },
				// 		{ hover: false }
				// 	);
				// }
				// console.log( this.state.hoveredPostId,  e.features[0].id  );

				this.setState({
					// ...this.state,
					hoveredPostId: e.features[0].id,
				})

				map.setFeatureState(
					{ source: 'storiesSource', id: e.features[0].id },
					{ hover: true }
				);




			}
		});

		map.on('mouseleave', 'unclustered-points', () => {
			if(map.selectedTab.name === "stories"){
				// console.log("mouseleave", this.state.hoveredPostId);
				if (this.state.hoveredPostId) {
					map.setFeatureState(
						{ source: 'storiesSource', id: this.state.hoveredPostId },
						{ hover: false }
					);
				}

				this.setState({
					...this.state,
					hoveredPostId: null,
				})


			}
		});

		map.on('mousemove', 'cluster-0', (e) => {
			const features = map.queryRenderedFeatures(e.point, { layers: ['cluster-0'] });
			const clusterId = features[0].properties.cluster_id,
			pointCount = features[0].properties.point_count,
			clusterSource = map.getSource('storiesSource');

			// Get all points under a cluster
			clusterSource.getClusterLeaves(clusterId, pointCount, 0, (err, aFeatures) => {
				const postsIds = ( aFeatures ?? [] ).map( ( post ) => post.id)

				this.setState( {
					...this.state,
					hoveredClusterPostsId: postsIds
				} )
			})
		});


		map.on('mouseleave', 'cluster-0', () => {
			this.setState( {
				...this.state,
				hoveredClusterPostsId: []
			} )
		});
	}

	buildPostsGeoJson( stories ) {
		const finalFeatures = {
			type: 'FeatureCollection',
			features: [],
		};

		stories.map( ( story ) => {
			const storyRelatedPoints = story.meta._related_point ?? [];
			const storyPoints = storyRelatedPoints.map( ( point ) => {
				return [ point._geocode_lon, point._geocode_lat ];
			} );

			finalFeatures.features.push(
				...storyPoints.map( ( point ) => {
					return {
						id: story.id,
						type: 'Feature',
						properties: story,
						geometry: {
							type: 'Point',
							coordinates: point,
						},
					};
				} )
			);
		} );

		return finalFeatures;
	}

	fetchStories( params = {} ) {
		const defaultParams = { cumulative: false };
		const pageInfo = this.props.pageInfo;

		params = { ...defaultParams, ...params };

		// Use constant POSTS_PER_PAGE if param per_page is not set
		if ( ! params.hasOwnProperty( 'per_page' ) )
			params.per_page = POSTS_PER_PAGE;

		// Set or use param page
		if ( ! params.hasOwnProperty( 'page' ) ) {
			params.page = pageInfo.currentPage;

			if ( ! ( params.page > pageInfo.totalPages ) ) {
				params.page++;
			}
		} else {
			params.page = 1;
		}

		// Update storiesLoaded to display loading & set current page to param
		this.props.updateState( {
			currentPage: params.page,
			storiesLoaded: false,
		} );

		// Update using cumulative param for stories - infinite scrolling
		if ( params.hasOwnProperty( 'cumulative' ) && params.cumulative ) {
			// Cancel request if page exceed the max page;
			if ( params.page > pageInfo.totalPages ) {
				return Promise.reject();
			}
		}

		const postsUrl = new URL( jeoMapVars.jsonUrl + 'posts/' );
		Object.keys( params ).forEach( ( key ) =>
			postsUrl.searchParams.append( key, params[ key ] )
		);

		if("languageParams" in window){
			postsUrl.searchParams.append( 'lang', languageParams.currentLang );
		}

		return fetch( postsUrl )
			.then( ( response ) => {
				this.props.updateState( {
					totalPages: parseInt( response.headers.get( 'X-WP-TotalPages' ) ),
					totalPosts: parseInt( response.headers.get( 'X-WP-Total' ) ),
				} );

				return response;
			} )
			.then( ( response ) => response.json() )
			.then(
				( stories ) => {
					const geolocatedStories = stories.filter(
						( story ) => story.meta._related_point.length > 0
					);

					// console.log("stories", stories);

					let storiesCumulative = params.cumulative
						? [ ...this.props.stories, ...geolocatedStories ]
						: geolocatedStories;

					// Fetch medias
					const storiesMediasPromises = geolocatedStories.map(
						async ( story ) => {
							const mediaApiUrl = new URL(
								jeoMapVars.jsonUrl + 'media/' + story.featured_media
							);

							// If featured media is not set
							if ( ! story.featured_media ) {
								return;
							}

							return fetch( mediaApiUrl )
								.then( ( data ) => data.json() )
								.then( ( media ) => {
									story.queriedFeaturedImage = media;
									return media;
								} );
						}
					);

					// Fetch categories
					const storiesCategoriesPromises = geolocatedStories.map(
						( story ) => {
							// console.log(MEMOIZED_CATEGORIES);
							return Promise.all(
								story.categories.map( async ( category ) => {
									const categoriesApiUrl = new URL(
										jeoMapVars.jsonUrl + 'categories/' + category
									);

									// If category is not set (remove Uncategorized)
									if( !category || category === 1 ) {
										return;
									}

									const categoryId = category;

									if(MEMOIZED_CATEGORIES[categoryId]) {
										category = await MEMOIZED_CATEGORIES[categoryId];

										if (
											story.queriedCategories &&
											story.queriedCategories.length
										) {
											story.queriedCategories = [
												...story.queriedCategories,
												category,
											];
										} else {
											story.queriedCategories = [ category ];
										}

										return MEMOIZED_CATEGORIES[categoryId];
									}

									const categoryPromisse = fetch( categoriesApiUrl )
										.then( ( data ) => data.json() )
										.then( ( category ) => {
											if (
												story.queriedCategories &&
												story.queriedCategories.length
											) {
												story.queriedCategories = [
													...story.queriedCategories,
													category,
												];
											} else {
												story.queriedCategories = [ category ];
											}

											return category;
									} );

									MEMOIZED_CATEGORIES[categoryId] = categoryPromisse;
									return categoryPromisse;
								} )
							);
						}
					);

					// When its all resolved, update state
					return Promise.all( storiesMediasPromises ).then( () =>
						// Use reduce stategy to force series processing to make memoization possible
						storiesCategoriesPromises.reduce(
							(accumulator, currentValue) =>
								accumulator.then(_ => currentValue),
							Promise.resolve()
						).then( () => {
							storiesCumulative = params.cumulative? [ ...this.props.stories, ...geolocatedStories ] : geolocatedStories;

							const reusableParams = {...params};

							// These params are not reusable, they refer directly to a episodic state
							delete reusableParams.cumulative;
							delete reusableParams.page;
							delete reusableParams.per_page;

							this.props.updateState( {
								storiesLoaded: true,
								stories: storiesCumulative,
								queryParams: reusableParams,
							} );

							return Promise.resolve( storiesCumulative );
						})

						// Promise.all( storiesCategoriesPromises ).then( () => {
						// 	storiesCumulative = params.cumulative? [ ...this.props.stories, ...geolocatedStories ] : geolocatedStories;

						// 	const reusableParams = {...params};

						// 	// These params are not reusable, they refer directly to a episodic state
						// 	delete reusableParams.cumulative;
						// 	delete reusableParams.page;
						// 	delete reusableParams.per_page;

						// 	this.props.updateState( {
						// 		storiesLoaded: true,
						// 		stories: storiesCumulative,
						// 		queryParams: reusableParams,
						// 	} );

						// 	return Promise.resolve( storiesCumulative );
						// } )

					);
				},
				( error ) => {
					this.props.updateState( {
						storiesLoaded: true,
						error,
					} );
				}
			);
	}

	fetchCategories() {
		const categoriesApiUrl = new URL( jeoMapVars.jsonUrl + 'categories/' );

		return fetch( categoriesApiUrl )
			.then( ( data ) => data.json() )
			.then( ( categories ) => {
				return categories;
			} );
	}

	fetchTags() {
		const tagsApiUrl = new URL( jeoMapVars.jsonUrl + 'tags/' );
		tagsApiUrl.searchParams.set('custom_per_page', '1000');
		tagsApiUrl.searchParams.set('orderby', 'count');
		tagsApiUrl.searchParams.set('order', 'desc');

		if("languageParams" in window){
			tagsApiUrl.searchParams.append( 'lang', languageParams.currentLang );
		}

		return fetch( tagsApiUrl )
			.then( ( data ) => data.json() )
			.then( ( tags ) => {
				return tags;
			} );
	}

	updateStories( params ) {
		const map = this.props.map;
		const prevQueryParams = this.props.queryParams;

		if(params.clearDate) {
			delete prevQueryParams.after;
			delete prevQueryParams.before;
			params.clearDate = false;
		}

		params = {
			...prevQueryParams,
			...params,
		}

		this.fetchStories( { ...params } )
			.then( ( stories ) => {
				const sourceData = this.buildPostsGeoJson( stories );
				map.getSource( 'storiesSource' ).setData( sourceData );
			} )
			.catch( () =>
				this.props.updateState( {
					storiesLoaded: true,
				} )
			);
	}

	storyHovered( story ) {
		this.props.storyHovered( story );
	}

	storyUnhover( story ) {
		this.props.storyUnhover( story );
	}

	dateRangePickerApply( ev, picker ) {
		const dateOptions = [ undefined, { year:"2-digit", month:"2-digit", day:"2-digit" } ];

		this.props.updateState( {
			dateRangeInputValue:
				picker.startDate.toDate().toLocaleDateString( ...dateOptions ) +
				' - ' +
				picker.endDate.toDate().toLocaleDateString( ...dateOptions ),
		} );

		this.updateStories( { cumulative: false, after: picker.startDate.toISOString(), before: picker.endDate.toISOString(), page: 1 } );
	}

	dateRangePickerCancel(ev, picker) {
		this.props.updateState( {
			dateRangeInputValue: '',
		} );

		this.updateStories( { cumulative: false, page: 1, clearDate: true } );
	}

	handleTagChange( event ) {
		const value = event.target.value;
		this.props.updateState( {
			selectedTag: value,
		} );
		this.updateStories( { cumulative: false, tags: value, page: 1 } );
	}

	render() {
		const loading = ! this.props.storiesLoaded ? (
			<svg
				aria-hidden="true"
				focusable="false"
				data-prefix="fas"
				data-icon="spinner"
				role="img"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 512 512"
				className="svg-inline--fa fa-spinner fa-w-16 fa-3x"
			>
				<path
					fill="currentColor"
					d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"
				></path>
			</svg>
		) : null;

		return (
			<div className="stories-tab" style={ this.props.style }>
				<Search
					searchPlaceholder={ __("Search story", "jeo") }
					update={ this.updateStories }
					searchField={ this.props.queryParams.search?? "" }
				/>

				<button
					className="toggle-filters"
					onClick={ () => {
							this.setState( {
								...this.state,
								showFilters: ! this.state.showFilters,
							} );
						}
					}
				>
					{ this.state.showFilters ? (
						<svg
							aria-hidden="true"
							focusable="false"
							data-prefix="fas"
							data-icon="times-circle"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
						>
							<path
								fill="currentColor"
								d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"
							></path>
						</svg>
					) : (
						<svg
							aria-hidden="true"
							focusable="false"
							data-prefix="fas"
							data-icon="plus-circle"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 512 512"
						>
							<path
								fill="currentColor"
								d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"
							></path>
						</svg>
					) }

					{ this.state.showFilters
						? __( 'Hide filters', 'jeo' )
						: __( 'Show filters', 'jeo' ) }
				</button>
				{ this.state.showFilters && (
					<div className="filters">
						<DateRangePicker initialSettings={ { autoUpdateInput: false, locale: this.localeInfo } } onApply={ this.dateRangePickerApply } onCancel={ this.dateRangePickerCancel }>
							<input
								placeholder={ __( 'Date range', 'jeo' ) }
								readOnly="true"
								value={ this.props.dateRangeInputValue }
							></input>
						</DateRangePicker>
						<select name="tags" onChange={ this.handleTagChange }>
							<option value="">{ __( 'Tags', 'jeo' ) }</option>
							{ this.props.tags.map( ( tag ) => (
								<option value={ tag.id } key={ tag.id } selected={ this.props.selectedTag == tag.id? "selected" : "" }>
									{ ' ' }
									{ tag.name }{ ' ' }
								</option>
							) ) }
						</select>

						<div></div>
					</div>
				) }

				<div className="stories">
					{ this.props.stories.map( ( story, index ) => {
						return (
							<Storie className={ (story.id === this.state.hoveredPostId || this.state.hoveredClusterPostsId.includes(story.id) ? 'active' : '') } story={ story } key={ index } map={ this.props.map } />
						);
					} ) }
				</div>

				{ loading }
			</div>
		);
	}
}

export default Stories;

class Storie extends Component {
	constructor( props ) {
		super( props );

		this.storyHovered = this.storyHovered.bind( this );
		this.storyUnhover = this.storyUnhover.bind( this );
	}

	componentDidMount() {}

	storyHovered() {
		const map = this.props.map;
		const story = this.props.story;
		const average = { lat: 0, lon: 0 };
		const bounds = [];

		story.meta._related_point.forEach( ( point ) => {
			const LngLat = {
				lat: parseFloat( point._geocode_lat ),
				lon: parseFloat( point._geocode_lon ),
			};

			bounds.push([parseFloat( point._geocode_lon ), parseFloat( point._geocode_lat )])

			// average.lat += LngLat.lat/story.meta._related_point.length
			// average.lon += LngLat.lon/story.meta._related_point.length

			average.lat = LngLat.lat;
			average.lon = LngLat.lon;
		} );


		if(bounds.length === 1){
			map.flyTo( { center: average, zoom: 7 } );
		} else {
			map.fitBounds( bounds, { padding: 100} );
		}

		map.setFeatureState(
			{ source: 'storiesSource', id: story.id },
			{ hover: true }
		);
	}

	storyUnhover() {
		const story = this.props.story;
		const map = this.props.map;

		map.setFeatureState(
			{ source: 'storiesSource', id: story.id },
			{ hover: false }
		);
	}

	render() {
		const story = this.props.story;
		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const storyDate = new Date( story.date_gmt ).toLocaleDateString(
			navigator.language? navigator.language : undefined,
			dateOptions
		);

		let finalCategories = '';

		if ( story.queriedCategories ) {
			const categoriesRender = story.queriedCategories.reduce(
				( accumulator, category, index ) => {
					return index + 1 !== story.queriedCategories.length
						? accumulator + category.name + ', '
						: accumulator + category.name;
				},
				''
			);

			finalCategories = categoriesRender;
		}

		return (
			<a
				href={ story.link }
				target="_blank"
				rel="noreferrer"
				className={
					'card' + ( ! story.queriedFeaturedImage ? ' no-thumb' : '' ) + (this.props.className.length? (' ' + this.props.className) : '')
				}
			>
				{ story.queriedFeaturedImage ? (
					<LazyImage
						src={ story.queriedFeaturedImage.source_url }
						alt={ story.queriedFeaturedImage.alt_text }
					/>
				) : null }

				<div className="sideway">
					<div className="categories">{ finalCategories }</div>

					<div className="title">
						{ decodeEntities(story.title.rendered) }
					</div>

					<div className="date">{ storyDate }</div>
					<div>
						<small onMouseEnter={ this.storyHovered }
							onMouseLeave={ this.storyUnhover }>{ __( 'View in map', 'jeo' ) }</small>
					</div>
				</div>
			</a>
		);
	}
}
