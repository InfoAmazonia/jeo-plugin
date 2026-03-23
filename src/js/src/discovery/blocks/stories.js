import { Component } from '@wordpress/element';
import Search from './search';
import LazyImage from './lazy-image';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

import DateRangeFilter, { formatDateRangeValue } from './date-range-filter';
import { getClusterLeaves, loadImage } from '../../lib/mapgl-loader';
import {
	buildRelatedPostsGeoJson,
	getStoryFeatureIds,
	getStoryRelatedCoordinates,
} from '../../shared/story-geojson';
import TagFilterControl from './tag-filter-control';
import {
	mergeUniqueStoriesById,
	resolveStoriesPage,
} from './stories-helpers';

const POSTS_PER_PAGE = 30;
const MEMOIZED_CATEGORIES = {};
const STORIES_SOURCE_ID = 'storiesSource';
const HOVERED_CLUSTER_LAYER_ID = 'hover-cluster-layer';
const HOVERED_CLUSTER_COLOR = '#b1b1b1';
const CLUSTER_INTERACTION_LAYER_IDS = [ 'cluster-layer', 'cluster-count' ];

function getHoveredStoryId( feature ) {
	return feature?.properties?.id ?? feature?.id ?? null;
}

function getUniqueStoryIds( features = [] ) {
	return Array.from(
		new Set(
			( features ?? [] )
				.map( getHoveredStoryId )
				.filter( ( storyId ) => storyId !== null )
		)
	);
}

function getHoveredFeatureIds( feature ) {
	const storyFeatureIds = getStoryFeatureIds( feature?.properties );

	if ( storyFeatureIds.length ) {
		return storyFeatureIds;
	}

	return feature?.id ? [ feature.id ] : [];
}

function buildHoveredClusterFilter( clusterId = -1 ) {
	return [
		'all',
		[ 'has', 'point_count' ],
		[ '==', [ 'get', 'cluster_id' ], clusterId ],
	];
}

function getHoveredClusterFeature( map, event ) {
	if ( event?.features?.length ) {
		return event.features[ 0 ];
	}

	const clusterLayers = CLUSTER_INTERACTION_LAYER_IDS.filter( ( layerId ) =>
		map?.getLayer?.( layerId )
	);

	if ( ! clusterLayers.length ) {
		return null;
	}

	const features = map.queryRenderedFeatures( event.point, {
		layers: clusterLayers,
	} );

	return features?.[ 0 ] ?? null;
}

function getClusterHoverData( map, event ) {
	const hoveredClusterFeature = getHoveredClusterFeature( map, event );
	const clusterId = hoveredClusterFeature?.properties?.cluster_id;
	const pointCount = hoveredClusterFeature?.properties?.point_count;
	const clusterSource = map.getSource( STORIES_SOURCE_ID );

	if ( ! clusterId || ! pointCount || ! clusterSource ) {
		return Promise.resolve( {
			clusterId: null,
			postsIds: [],
		} );
	}

	return getClusterLeaves( clusterSource, clusterId, pointCount, 0 ).then( ( clusterFeatures ) => ( {
		clusterId,
		postsIds: getUniqueStoryIds( clusterFeatures ),
	} ) );
}

function normalizeClusterIds( clusterIds = [] ) {
	return Array.from(
		new Set(
			( Array.isArray( clusterIds ) ? clusterIds : [ clusterIds ] )
				.map( ( clusterId ) => Number.parseInt( clusterId, 10 ) )
				.filter( Number.isFinite )
		)
	).sort( ( firstClusterId, secondClusterId ) => firstClusterId - secondClusterId );
}

function getClusterFeaturesInView( map ) {
	const canvas = map?.getCanvas?.();
	const clusterLayers = CLUSTER_INTERACTION_LAYER_IDS.filter( ( layerId ) =>
		map?.getLayer?.( layerId )
	);

	if ( ! canvas || ! clusterLayers.length ) {
		return [];
	}

	const clusterFeatures = map.queryRenderedFeatures(
		[
			[ 0, 0 ],
			[ canvas.width, canvas.height ],
		],
		{
			layers: clusterLayers,
		}
	);
	const uniqueClusterFeatures = new Map();

	clusterFeatures.forEach( ( clusterFeature ) => {
		const clusterId = Number.parseInt(
			clusterFeature?.properties?.cluster_id,
			10
		);

		if ( Number.isFinite( clusterId ) && ! uniqueClusterFeatures.has( clusterId ) ) {
			uniqueClusterFeatures.set( clusterId, clusterFeature );
		}
	} );

	return Array.from( uniqueClusterFeatures.values() );
}

function buildStoryBounds( coordinates = [] ) {
	if ( ! Array.isArray( coordinates ) || ! coordinates.length ) {
		return [];
	}

	return coordinates.reduce(
		( bounds, [ longitude, latitude ] ) => {
			return [
				[
					Math.min( bounds[ 0 ][ 0 ], longitude ),
					Math.min( bounds[ 0 ][ 1 ], latitude ),
				],
				[
					Math.max( bounds[ 1 ][ 0 ], longitude ),
					Math.max( bounds[ 1 ][ 1 ], latitude ),
				],
			];
		},
		[
			[ coordinates[ 0 ][ 0 ], coordinates[ 0 ][ 1 ] ],
			[ coordinates[ 0 ][ 0 ], coordinates[ 0 ][ 1 ] ],
		]
	);
}

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
		this.hoveredFeatureIds = [];
		this.hoveredClusterIds = [];
		this.listHoveredStoryId = null;
		this.storiesListRef = null;
		this.storyCardElements = new Map();
		this.hoverSuppressedUntil = 0;

		// Story bindings
		this.storyHovered = this.storyHovered.bind( this );
		this.storyUnhover = this.storyUnhover.bind( this );
		this.markListScrolling = this.markListScrolling.bind( this );
		this.clearHoveredFeatureState = this.clearHoveredFeatureState.bind( this );
		this.clearHoveredClusterState = this.clearHoveredClusterState.bind( this );
		this.replaceHoveredFeatureState = this.replaceHoveredFeatureState.bind( this );
		this.replaceHoveredClusterState = this.replaceHoveredClusterState.bind( this );
		this.findStoryClusterIds = this.findStoryClusterIds.bind( this );
		this.syncHoveredStoryClusterState =
			this.syncHoveredStoryClusterState.bind( this );
		this.registerStoriesList = this.registerStoriesList.bind( this );
		this.registerStoryCard = this.registerStoryCard.bind( this );
		this.scrollStoryIntoView = this.scrollStoryIntoView.bind( this );
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
			this.fetchStories( {
				page: 1,
				...this.props.queryParams,
			} ).then( ( stories ) => {
				const sourceData = this.buildPostsGeoJson( stories );
				map.addSource( 'storiesSource', {
					type: 'geojson',
					data: sourceData,
					cluster: true,
					clusterMaxZoom: 17,
					clusterRadius: 40,
				} );

				loadImage( map, 'news-marker', jeoMapVars.jeoUrl + '/js/src/icons/news-marker.png' )
					.then( () => {
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
							},
						} );

						loadImage( map, 'news-marker-hover', jeoMapVars.jeoUrl + '/js/src/icons/news-marker-hover.png' )
							.then( () => {
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


						loadImage( map, 'news-no-marker', jeoMapVars.jeoUrl + '/js/src/icons/news.png' ).then( () => {
							// cluster circle layer
							map.addLayer( {
								id: 'cluster-layer',
								type: 'circle',
								source: 'storiesSource',
								filter: [ 'has', 'point_count' ],
								paint: {
									'circle-color': '#ffffff',
									'circle-radius': 20,
									'circle-stroke-color': '#ffffff',
									'circle-stroke-opacity': 0.4,
									'circle-stroke-width': 9,
								},
							} );

							map.addLayer( {
								id: HOVERED_CLUSTER_LAYER_ID,
								type: 'circle',
								source: 'storiesSource',
								filter: buildHoveredClusterFilter(),
								paint: {
									'circle-color': HOVERED_CLUSTER_COLOR,
									'circle-radius': 20,
									'circle-stroke-color': HOVERED_CLUSTER_COLOR,
									'circle-stroke-opacity': 0.4,
									'circle-stroke-width': 9,
								},
							} );

							// cluster number layer
							map.addLayer( {
								id: 'cluster-count',
								type: 'symbol',
								source: 'storiesSource',
								filter: [ 'has', 'point_count' ],
								layout: {
									'icon-image': 'news-no-marker',
									'icon-size': 0.13,
									'icon-allow-overlap': false,
									'icon-offset': [ 0, -30 ],
									'text-field': '{point_count}',
									'text-font': [ 'Open Sans Bold' ],
									'text-size': 12,
									'text-transform': 'uppercase',
									'text-letter-spacing': 0.05,
									'text-offset': [ 0, 0.8 ],
								},
								paint: {
									'text-color': '#202202',
								},
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
				const hoveredFeature = e.features[0];
				this.replaceHoveredFeatureState( getHoveredFeatureIds( hoveredFeature ) );
				this.setState( {
					hoveredPostId: getHoveredStoryId( hoveredFeature ),
				} );
			}
		});

		map.on('mouseleave', 'unclustered-points', () => {
			if(map.selectedTab.name === "stories"){
				this.clearHoveredFeatureState();
				this.setState( {
					hoveredPostId: null,
				} );
			}
		});

		const handleClusterMouseMove = ( event ) => {
			getClusterHoverData( map, event ).then( ( { clusterId, postsIds } ) => {
				this.replaceHoveredClusterState( clusterId );
				this.setState( {
					hoveredClusterPostsId: postsIds,
				} );
			} );
		};

		const handleClusterMouseLeave = () => {
			this.clearHoveredClusterState();
			this.setState( {
				hoveredClusterPostsId: [],
			} );
		};

		[ 'cluster-layer', 'cluster-count' ].forEach( ( layerId ) => {
			map.on( 'mousemove', layerId, handleClusterMouseMove );
			map.on( 'mouseleave', layerId, handleClusterMouseLeave );
		} );
	}

	componentWillUnmount() {
		this.clearHoveredFeatureState();
		this.clearHoveredClusterState();
	}

	componentDidUpdate( prevProps, prevState ) {
		if ( prevState.hoveredPostId !== this.state.hoveredPostId ) {
			this.scrollStoryIntoView( this.state.hoveredPostId );
			return;
		}

		const clusterHoverChanged =
			prevState.hoveredClusterPostsId.length !==
				this.state.hoveredClusterPostsId.length ||
			prevState.hoveredClusterPostsId.some(
				( storyId, index ) =>
					storyId !== this.state.hoveredClusterPostsId[ index ]
			);

		if ( clusterHoverChanged && this.state.hoveredClusterPostsId.length ) {
			const firstClusterStoryId = this.props.stories.find( ( story ) =>
				this.state.hoveredClusterPostsId.includes( story.id )
			)?.id;

			this.scrollStoryIntoView( firstClusterStoryId ?? null );
		}
	}

	clearHoveredFeatureState() {
		const map = this.props.map;
		const source = map?.getSource?.( STORIES_SOURCE_ID );

		if ( ! source || ! this.hoveredFeatureIds.length ) {
			this.hoveredFeatureIds = [];
			return;
		}

		this.hoveredFeatureIds.forEach( ( featureId ) => {
			map.setFeatureState(
				{ source: STORIES_SOURCE_ID, id: featureId },
				{ hover: false }
			);
		} );

		this.hoveredFeatureIds = [];
	}

	replaceHoveredFeatureState( featureIds = [] ) {
		const nextFeatureIds = Array.from(
			new Set( ( featureIds ?? [] ).filter( Boolean ) )
		);
		const sameFeatureIds =
			nextFeatureIds.length === this.hoveredFeatureIds.length &&
			nextFeatureIds.every(
				( featureId, index ) => featureId === this.hoveredFeatureIds[ index ]
			);

		if ( sameFeatureIds ) {
			return;
		}

		this.clearHoveredFeatureState();

		const map = this.props.map;
		const source = map?.getSource?.( STORIES_SOURCE_ID );

		if ( ! source || ! nextFeatureIds.length ) {
			return;
		}

		nextFeatureIds.forEach( ( featureId ) => {
			map.setFeatureState(
				{ source: STORIES_SOURCE_ID, id: featureId },
				{ hover: true }
			);
		} );

		this.hoveredFeatureIds = nextFeatureIds;
	}

	clearHoveredClusterState() {
		const map = this.props.map;

		if ( ! map?.getLayer?.( HOVERED_CLUSTER_LAYER_ID ) ) {
			this.hoveredClusterIds = [];
			return;
		}

		map.setFilter( HOVERED_CLUSTER_LAYER_ID, buildHoveredClusterFilter() );
		this.hoveredClusterIds = [];
	}

	replaceHoveredClusterState( clusterIds = [] ) {
		const nextClusterIds = normalizeClusterIds( clusterIds );
		const map = this.props.map;
		const sameClusterIds =
			nextClusterIds.length === this.hoveredClusterIds.length &&
			nextClusterIds.every(
				( clusterId, index ) => clusterId === this.hoveredClusterIds[ index ]
			);

		if ( sameClusterIds ) {
			return;
		}

		if ( ! map?.getLayer?.( HOVERED_CLUSTER_LAYER_ID ) ) {
			this.hoveredClusterIds = nextClusterIds;
			return;
		}

		if ( ! nextClusterIds.length ) {
			map.setFilter( HOVERED_CLUSTER_LAYER_ID, buildHoveredClusterFilter() );
			this.hoveredClusterIds = [];
			return;
		}

		map.setFilter( HOVERED_CLUSTER_LAYER_ID, [
			'all',
			[ 'has', 'point_count' ],
			[
				'any',
				...nextClusterIds.map( ( clusterId ) => [
					'==',
					[ 'get', 'cluster_id' ],
					clusterId,
				] ),
			],
		] );
		this.hoveredClusterIds = nextClusterIds;
	}

	findStoryClusterIds( story ) {
		const map = this.props.map;
		const clusterSource = map?.getSource?.( STORIES_SOURCE_ID );

		if ( ! clusterSource || ! map?.queryRenderedFeatures ) {
			return Promise.resolve( [] );
		}

		const clusterFeatures = getClusterFeaturesInView( map );

		if ( ! clusterFeatures.length ) {
			return Promise.resolve( [] );
		}

		return Promise.all(
			clusterFeatures.map( ( clusterFeature ) => {
				const clusterId = Number.parseInt(
					clusterFeature?.properties?.cluster_id,
					10
				);
				const pointCount = Number.parseInt(
					clusterFeature?.properties?.point_count,
					10
				);

				if ( ! Number.isFinite( clusterId ) || ! Number.isFinite( pointCount ) ) {
					return null;
				}

				return getClusterLeaves(
					clusterSource,
					clusterId,
					pointCount,
					0
				).then( ( clusterFeaturesList ) => {
					const hasStory = clusterFeaturesList.some(
						( clusterStoryFeature ) =>
							getHoveredStoryId( clusterStoryFeature ) === story.id
					);

					return hasStory ? clusterId : null;
				} );
			} )
		).then( ( clusterIds ) => normalizeClusterIds( clusterIds.filter( Boolean ) ) );
	}

	syncHoveredStoryClusterState( story ) {
		return this.findStoryClusterIds( story ).then( ( clusterIds ) => {
			if ( this.listHoveredStoryId !== story.id ) {
				return;
			}

			this.replaceHoveredClusterState( clusterIds );
		} );
	}

	registerStoriesList( element ) {
		this.storiesListRef = element;
	}

	registerStoryCard( storyId, element ) {
		if ( ! element ) {
			this.storyCardElements.delete( storyId );
			return;
		}

		this.storyCardElements.set( storyId, element );
	}

	scrollStoryIntoView( storyId ) {
		if ( ! storyId ) {
			return;
		}

		const container =
			this.storiesListRef?.closest?.( '.togable-panel' ) ?? this.storiesListRef;
		const storyElement = this.storyCardElements.get( storyId );

		if ( ! container || ! storyElement ) {
			return;
		}

		const containerRect = container.getBoundingClientRect();
		const storyRect = storyElement.getBoundingClientRect();
		const elementTop =
			storyRect.top - containerRect.top + container.scrollTop;
		const elementBottom = elementTop + storyRect.height;
		const viewportTop = container.scrollTop;
		const viewportBottom = viewportTop + container.clientHeight;

		if ( elementTop < viewportTop ) {
			container.scrollTo( {
				top: elementTop,
				behavior: 'smooth',
			} );
			return;
		}

		if ( elementBottom > viewportBottom ) {
			container.scrollTo( {
				top: elementBottom - container.clientHeight,
				behavior: 'smooth',
			} );
		}
	}

	markListScrolling() {
		this.hoverSuppressedUntil = Date.now() + 600;
	}

	buildPostsGeoJson( stories ) {
		return buildRelatedPostsGeoJson( stories );
	}

	fetchStories( params = {} ) {
		const defaultParams = { cumulative: false };
		const pageInfo = this.props.pageInfo;

		params = { ...defaultParams, ...params };

		// Use constant POSTS_PER_PAGE if param per_page is not set
		if ( ! params.hasOwnProperty( 'per_page' ) )
			params.per_page = POSTS_PER_PAGE;

		// Set or use param page
		params.page = resolveStoriesPage( params, pageInfo );

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

					let storiesCumulative = params.cumulative
						? mergeUniqueStoriesById(
							this.props.stories,
							geolocatedStories
						)
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
							storiesCumulative = params.cumulative
								? mergeUniqueStoriesById(
									this.props.stories,
									geolocatedStories
								)
								: geolocatedStories;

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

	updateStories( params ) {
		const map = this.props.map;
		const prevQueryParams = { ...this.props.queryParams };

		if(params.clearDate) {
			delete prevQueryParams.after;
			delete prevQueryParams.before;
			params.clearDate = false;
		}

		if ( params.clearTag ) {
			delete prevQueryParams.tags;
			delete params.clearTag;
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
		if ( Date.now() < this.hoverSuppressedUntil || ! this.props.storiesLoaded ) {
			return;
		}

		const map = this.props.map;
		const coordinates = getStoryRelatedCoordinates( story );
		const featureIds = getStoryFeatureIds( story );

		if ( ! coordinates.length ) {
			return;
		}

		this.listHoveredStoryId = story.id;
		this.setState( {
			hoveredPostId: story.id,
			hoveredClusterPostsId: [],
		} );
		this.replaceHoveredFeatureState( featureIds );
		this.clearHoveredClusterState();

		if ( coordinates.length === 1 ) {
			map.flyTo( {
				center: {
					lng: coordinates[ 0 ][ 0 ],
					lat: coordinates[ 0 ][ 1 ],
				},
				zoom: 7,
			} );
		} else {
			map.fitBounds( buildStoryBounds( coordinates ), { padding: 100 } );
		}

		window.requestAnimationFrame( () => {
			if ( this.listHoveredStoryId === story.id ) {
				this.syncHoveredStoryClusterState( story );
			}
		} );

		map.once( 'idle', () => {
			if ( this.listHoveredStoryId === story.id ) {
				this.syncHoveredStoryClusterState( story );
			}
		} );
	}

	storyUnhover( story ) {
		if ( this.listHoveredStoryId !== story.id ) {
			return;
		}

		this.listHoveredStoryId = null;
		this.clearHoveredFeatureState();
		this.clearHoveredClusterState();
		this.setState( {
			hoveredPostId: null,
			hoveredClusterPostsId: [],
		} );
	}

	dateRangePickerApply( ev, picker ) {
		this.props.updateState( {
			dateRangeInputValue: formatDateRangeValue(
				picker.startDate.toDate(),
				picker.endDate.toDate()
			),
		} );

		this.updateStories( { cumulative: false, after: picker.startDate.toISOString(), before: picker.endDate.toISOString(), page: 1 } );
	}

	dateRangePickerCancel() {
		this.props.updateState( {
			dateRangeInputValue: '',
		} );

		this.updateStories( { cumulative: false, page: 1, clearDate: true } );
	}

	handleTagChange( value ) {
		const tagId = Number.parseInt( value, 10 );
		const hasValidTag = Number.isFinite( tagId ) && tagId > 0;

		this.props.updateState( {
			selectedTag: hasValidTag ? tagId : -1,
		} );

		if ( ! hasValidTag ) {
			this.updateStories( { cumulative: false, page: 1, clearTag: true } );
			return;
		}

		this.updateStories( { cumulative: false, tags: tagId, page: 1 } );
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
						<DateRangeFilter
							placeholder={ __( 'Date range', 'jeo' ) }
							value={ this.props.dateRangeInputValue }
							startDate={ this.props.queryParams.after }
							endDate={ this.props.queryParams.before }
							localeInfo={ this.localeInfo }
							onApply={ this.dateRangePickerApply }
							onCancel={ this.dateRangePickerCancel }
						/>
							<TagFilterControl
								value={ this.props.selectedTag > 0 ? this.props.selectedTag : '' }
								onChange={ this.handleTagChange }
							/>

						<div></div>
					</div>
				) }

				<div
					className="stories"
					ref={ this.registerStoriesList }
					onWheelCapture={ this.markListScrolling }
					onTouchMove={ this.markListScrolling }
				>
					{ this.props.stories.map( ( story, index ) => {
						return (
							<Storie
								cardRef={ ( element ) =>
									this.registerStoryCard( story.id, element )
								}
								className={ (story.id === this.state.hoveredPostId || this.state.hoveredClusterPostsId.includes(story.id) ? 'active' : '') }
								onHover={ () => this.storyHovered( story ) }
								onUnhover={ () => this.storyUnhover( story ) }
								story={ story }
								key={ story.id }
								map={ this.props.map }
							/>
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
				ref={ this.props.cardRef }
				href={ story.link }
				target="_blank"
				rel="noreferrer"
				onMouseEnter={ this.props.onHover }
				onMouseLeave={ this.props.onUnhover }
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
						<small className="view-in-map">{ __( 'View in map', 'jeo' ) }</small>
					</div>
				</div>
			</a>
		);
	}
}
