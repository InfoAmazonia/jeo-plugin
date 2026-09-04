import { Component } from '@wordpress/element';
import Search from './search';
import LazyImage from './lazy-image';
import LoadingSpinner from './loading-spinner';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf, _n } from '@wordpress/i18n';

import DateRangeFilter, { formatDateRangeValue } from './date-range-filter';
import { getClusterLeaves, loadImage } from '../../lib/mapgl-loader';
import {
	buildRelatedPostsGeoJson,
	getStoryFeatureIds,
	getStoryRelatedCoordinates,
} from '../../shared/story-geojson';
import { chunkRecordIds } from '../../shared/rest-records';
import TagFilterControl from './tag-filter-control';
import {
	mergeUniqueStoriesById,
	normalizeStoriesTagIds,
	resolveStoryDateLocale,
	resolveStoriesPage,
} from './stories-helpers';

const POSTS_PER_PAGE = 30;
const POST_COLLECTION_FIELDS =
	'id,link,title,date_gmt,categories,featured_media,meta._related_point';
const MEDIA_COLLECTION_FIELDS = 'id,source_url,alt_text';
const CATEGORY_COLLECTION_FIELDS = 'id,name';
const MEMOIZED_CATEGORIES = {};
const MEMOIZED_MEDIA = {};
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

function setStoryMapCursor( map, cursor = '' ) {
	const canvas = map?.getCanvas?.();

	if ( ! canvas ) {
		return;
	}

	canvas.style.cursor = cursor;
}

function clearStoryMapCursor( map ) {
	const canvas = map?.getCanvas?.();

	if ( canvas?.style?.cursor === 'pointer' ) {
		canvas.style.cursor = '';
	}
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

	const point = { x: event.point.x, y: event.point.y };
	const features = map.queryRenderedFeatures( point, {
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

function normalizeRecordIds( ids = [] ) {
	return Array.from(
		new Set(
			ids
				.map( ( id ) => Number.parseInt( id, 10 ) )
				.filter( ( id ) => Number.isFinite( id ) && id > 0 )
		)
	);
}

function getStoryMediaIds( stories = [] ) {
	return normalizeRecordIds(
		stories.map( ( story ) => story?.featured_media )
	);
}

function getStoryCategoryIds( stories = [] ) {
	return normalizeRecordIds(
		stories.flatMap( ( story ) =>
			Array.isArray( story?.categories ) ? story.categories : []
		)
	).filter( ( categoryId ) => categoryId !== 1 );
}

function appendLanguageParam( url ) {
	if ( 'jeowpLanguageParams' in window && window.jeowpLanguageParams?.currentLang ) {
		url.searchParams.append( 'lang', window.jeowpLanguageParams.currentLang );
	}
}

function appendGeolocatedPostsQuery( url ) {
	url.searchParams.append( 'meta_query[0][key]', '_related_point' );
	url.searchParams.append( 'meta_query[0][compare]', 'EXISTS' );
}

function mapRecordsById( records = [] ) {
	return new Map(
		records
			.filter( ( record ) =>
				Number.isFinite( Number.parseInt( record?.id, 10 ) )
			)
			.map( ( record ) => [ Number.parseInt( record.id, 10 ), record ] )
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
			selectedTagLabel: '',
		};
		this.hoveredFeatureIds = [];
		this.hoveredClusterIds = [];
		this.hoveredClusterKey = null;
		this.listHoveredStoryId = null;
		this.storiesListRef = null;
		this.storyCardElements = new Map();
		this.hoverSuppressedUntil = 0;

		// Story bindings
		this.storyHovered = this.storyHovered.bind( this );
		this.storyUnhover = this.storyUnhover.bind( this );
		this.viewStoryInMap = this.viewStoryInMap.bind( this );
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
		this.fetchRecordsByIds = this.fetchRecordsByIds.bind( this );
		this.fetchMediaByIds = this.fetchMediaByIds.bind( this );
		this.fetchCategoriesByIds = this.fetchCategoriesByIds.bind( this );
		this.enrichStoriesWithMetadata =
			this.enrichStoriesWithMetadata.bind( this );

		// Filters bind
		// DateRangePicker
		this.dateRangePickerApply = this.dateRangePickerApply.bind( this );
		this.dateRangePickerCancel = this.dateRangePickerCancel.bind( this );

		this.handleTagChange = this.handleTagChange.bind( this );
		this.setSelectedTagLabel = this.setSelectedTagLabel.bind( this );
		this.clearStoryFilters = this.clearStoryFilters.bind( this );
		this.localeInfo = {
			"format": __("MM/DD/YYYY", "jeowp"),
			"separator": __(" - ", "jeowp"),
			"applyLabel": __("Apply", "jeowp"),
			"cancelLabel": __("Cancel", "jeowp"),
			"fromLabel": __("From", "jeowp"),
			"toLabel": __("To", "jeowp"),
			"customRangeLabel": __("Custom", "jeowp"),
			"daysOfWeek": [
				__("Su", "jeowp"),
				__("Mo", "jeowp"),
				__("Tu", "jeowp"),
				__("We", "jeowp"),
				__("Th", "jeowp"),
				__("Fr", "jeowp"),
				__("Sa", "jeowp")
			],
			"monthNames": [
				__("January", "jeowp"),
				__("February", "jeowp"),
				__("March", "jeowp"),
				__("April", "jeowp"),
				__("May", "jeowp"),
				__("June", "jeowp"),
				__("July", "jeowp"),
				__("August", "jeowp"),
				__("September", "jeowp"),
				__("October", "jeowp"),
				__("November", "jeowp"),
				__("December", "jeowp")
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
			if ( e.features.length > 0 && this.isStoriesTabActive() ) {
				setStoryMapCursor( map, 'pointer' );
				const hoveredFeature = e.features[0];
				const hoveredPostId = getHoveredStoryId( hoveredFeature );
				this.replaceHoveredFeatureState( getHoveredFeatureIds( hoveredFeature ) );

				if ( this.state.hoveredPostId !== hoveredPostId ) {
					this.setState( {
						hoveredPostId,
					} );
				}

				return;
			}

			clearStoryMapCursor( map );
		});

		map.on('mouseleave', 'unclustered-points', () => {
			clearStoryMapCursor( map );

			if ( this.isStoriesTabActive() ) {
				this.clearHoveredFeatureState();
				this.setState( {
					hoveredPostId: null,
				} );
			}
		});

		const handleClusterMouseMove = ( event ) => {
			if ( ! this.isStoriesTabActive() ) {
				clearStoryMapCursor( map );
				return;
			}

			setStoryMapCursor( map, 'pointer' );

			const hoveredClusterFeature = getHoveredClusterFeature( map, event );
			const clusterId = hoveredClusterFeature?.properties?.cluster_id;
			const pointCount = hoveredClusterFeature?.properties?.point_count;

			if ( ! clusterId || ! pointCount ) {
				this.hoveredClusterKey = null;
				this.clearHoveredClusterState();

				if ( this.state.hoveredClusterPostsId.length ) {
					this.setState( {
						hoveredClusterPostsId: [],
					} );
				}

				return;
			}

			const hoveredClusterKey = `${ clusterId }:${ pointCount }`;

			if ( this.hoveredClusterKey === hoveredClusterKey ) {
				return;
			}

			this.hoveredClusterKey = hoveredClusterKey;

			getClusterHoverData( map, {
				...event,
				features: hoveredClusterFeature ? [ hoveredClusterFeature ] : [],
			} ).then( ( { clusterId: nextClusterId, postsIds } ) => {
				if ( ! this.isStoriesTabActive() ) {
					clearStoryMapCursor( map );
					return;
				}

				this.replaceHoveredClusterState( nextClusterId );
				this.setState( {
					hoveredClusterPostsId: postsIds,
				} );
			} );
		};

		const handleClusterMouseLeave = () => {
			clearStoryMapCursor( map );
			this.hoveredClusterKey = null;
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
		clearStoryMapCursor( this.props.map );
		this.clearHoveredFeatureState();
		this.clearHoveredClusterState();
	}

	isStoriesTabActive() {
		return this.props.map?.selectedTab?.name === 'stories';
	}

	componentDidUpdate( prevProps, prevState ) {
		if ( ! this.isStoriesTabActive() ) {
			clearStoryMapCursor( this.props.map );
			return;
		}

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
		this.hoveredClusterKey = null;

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
		if ( ! storyId || ! this.isStoriesTabActive() ) {
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

	fetchRecordsByIds( {
		baseUrl,
		ids = [],
		fields = '',
		cache = {},
		includeLanguage = false,
	} ) {
		const normalizedIds = normalizeRecordIds( ids );
		const missingIds = normalizedIds.filter( ( id ) => ! cache[ id ] );

		if ( ! missingIds.length ) {
			return Promise.resolve(
				normalizedIds.map( ( id ) => cache[ id ] ).filter( Boolean )
			);
		}

		const requests = chunkRecordIds( missingIds ).map( ( chunk ) => {
			const recordsUrl = new URL( baseUrl );
			recordsUrl.searchParams.append( 'include', chunk.join( ',' ) );
			recordsUrl.searchParams.append( 'orderby', 'include' );
			recordsUrl.searchParams.append( 'per_page', chunk.length );

			if ( fields ) {
				recordsUrl.searchParams.append( '_fields', fields );
			}

			if ( includeLanguage ) {
				appendLanguageParam( recordsUrl );
			}

			return fetch( recordsUrl )
				.then( ( response ) => response.json() )
				.then( ( records ) => ( Array.isArray( records ) ? records : [] ) );
		} );

		return Promise.all( requests ).then( ( chunkedRecords ) => {
			chunkedRecords.flat().forEach( ( record ) => {
				const recordId = Number.parseInt( record?.id, 10 );

				if ( Number.isFinite( recordId ) ) {
					cache[ recordId ] = record;
				}
			} );

			return normalizedIds.map( ( id ) => cache[ id ] ).filter( Boolean );
		} );
	}

	fetchMediaByIds( mediaIds = [] ) {
		return this.fetchRecordsByIds( {
			baseUrl: jeoMapVars.jsonUrl + 'media/',
			ids: mediaIds,
			fields: MEDIA_COLLECTION_FIELDS,
			cache: MEMOIZED_MEDIA,
		} );
	}

	fetchCategoriesByIds( categoryIds = [] ) {
		return this.fetchRecordsByIds( {
			baseUrl: jeoMapVars.jsonUrl + 'categories/',
			ids: categoryIds,
			fields: CATEGORY_COLLECTION_FIELDS,
			cache: MEMOIZED_CATEGORIES,
			includeLanguage: true,
		} );
	}

	enrichStoriesWithMetadata( stories = [] ) {
		return Promise.all( [
			this.fetchMediaByIds( getStoryMediaIds( stories ) ).catch( () => [] ),
			this.fetchCategoriesByIds( getStoryCategoryIds( stories ) ).catch(
				() => []
			),
		] ).then( ( [ mediaRecords, categoryRecords ] ) => {
			const mediaById = mapRecordsById( mediaRecords );
			const categoryById = mapRecordsById( categoryRecords );

			return stories.map( ( story ) => {
				const featuredMediaId = Number.parseInt( story?.featured_media, 10 );
				const queriedFeaturedImage = mediaById.get( featuredMediaId );
				const queriedCategories = ( story?.categories ?? [] )
					.map( ( categoryId ) =>
						categoryById.get( Number.parseInt( categoryId, 10 ) )
					)
					.filter( Boolean );

				return {
					...story,
					...( queriedFeaturedImage ? { queriedFeaturedImage } : {} ),
					queriedCategories,
				};
			} );
		} );
	}

	fetchStories( params = {} ) {
		const defaultParams = { cumulative: false };
		const pageInfo = this.props.pageInfo;

		params = { ...defaultParams, ...params };

		// Use constant POSTS_PER_PAGE if param per_page is not set
		if ( ! Object.hasOwn( params, 'per_page' ) )
			params.per_page = POSTS_PER_PAGE;

		// Set or use param page
		params.page = resolveStoriesPage( params, pageInfo );

		// Update storiesLoaded to display loading & set current page to param
		this.props.updateState( {
			currentPage: params.page,
			storiesLoaded: false,
		} );

		// Update using cumulative param for stories - infinite scrolling
		if ( Object.hasOwn( params, 'cumulative' ) && params.cumulative ) {
			// Cancel request if page exceed the max page;
			if ( params.page > pageInfo.totalPages ) {
				return Promise.reject();
			}
		}

		const postsUrl = new URL( jeoMapVars.jsonUrl + 'posts/' );
		for ( const key of Object.keys( params ) ) {
			if ( key !== 'cumulative' && params[ key ] ) {
				postsUrl.searchParams.append( key, params[ key ] )
			}
		}

		postsUrl.searchParams.append( '_fields', POST_COLLECTION_FIELDS );
		appendGeolocatedPostsQuery( postsUrl );
		appendLanguageParam( postsUrl );

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
						( story ) =>
							Array.isArray( story?.meta?._related_point ) &&
							story.meta._related_point.length > 0
					);

					let storiesCumulative = params.cumulative
						? mergeUniqueStoriesById(
							this.props.stories,
							geolocatedStories
						)
						: geolocatedStories;

					return this.enrichStoriesWithMetadata( geolocatedStories ).then(
						( enrichedStories ) => {
							storiesCumulative = params.cumulative
								? mergeUniqueStoriesById(
									this.props.stories,
									enrichedStories
								)
								: enrichedStories;

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
						}
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

		return this.fetchStories( { ...params } )
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

		if (
			this.listHoveredStoryId === story.id &&
			this.state.hoveredPostId === story.id
		) {
			return;
		}

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

		window.requestAnimationFrame( () => {
			if ( this.listHoveredStoryId === story.id ) {
				this.syncHoveredStoryClusterState( story );
			}
		} );
	}

	viewStoryInMap( story ) {
		this.storyHovered( story );

		const map = this.props.map;
		const coordinates = getStoryRelatedCoordinates( story );

		if ( ! coordinates.length ) {
			return;
		}

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

	handleTagChange( value, label = '' ) {
		const tagIds = normalizeStoriesTagIds( value );
		const hasValidTags = tagIds.length > 0;

		this.setState( {
			selectedTagLabel: hasValidTags ? label : '',
		} );

		this.props.updateState( {
			selectedTag: tagIds,
		} );

		if ( ! hasValidTags ) {
			this.updateStories( { cumulative: false, page: 1, clearTag: true } );
			return;
		}

		this.updateStories( { cumulative: false, tags: tagIds.join( ',' ), page: 1 } );
	}

	setSelectedTagLabel( label ) {
		if ( label !== this.state.selectedTagLabel ) {
			this.setState( { selectedTagLabel: label } );
		}
	}

	clearStoryFilters() {
		this.setState( { selectedTagLabel: '' } );
		this.props.updateState( {
			dateRangeInputValue: '',
			selectedTag: [],
		} );
		this.updateStories( {
			search: '',
			cumulative: false,
			page: 1,
			clearDate: true,
			clearTag: true,
		} );
	}

	render() {
		const queryParams = this.props.queryParams || {};
		const selectedTagIds = normalizeStoriesTagIds( this.props.selectedTag );
		const currentPage =
			Number.parseInt( this.props.pageInfo?.currentPage, 10 ) || 1;
		const isLoadingMoreStories =
			! this.props.storiesLoaded &&
			this.props.stories.length > 0 &&
			currentPage > 1;
		const hasActiveFilters = Boolean(
			queryParams.search ||
			queryParams.after ||
			queryParams.before ||
			selectedTagIds.length > 0
		);
		const activeFilters = [];
		const hoveredClusterPostsSet = new Set( this.state.hoveredClusterPostsId );
		const storiesCountLabel = sprintf(
			/* translators: %d: number of displayed stories. */
			_n( 'Displayed story: %d', 'Displayed stories: %d', this.props.stories.length, 'jeowp' ),
			this.props.stories.length
		);

		if ( queryParams.search ) {
			activeFilters.push(
				/* translators: %s is the active story search query. */
				sprintf( __( 'Search story: %s', 'jeowp' ), queryParams.search )
			);
		}

		if ( this.props.dateRangeInputValue ) {
			activeFilters.push(
				/* translators: %s is the active story date range. */
				sprintf( __( 'Date range: %s', 'jeowp' ), this.props.dateRangeInputValue )
			);
		}

		if ( this.state.selectedTagLabel ) {
			activeFilters.push(
				/* translators: %s is the list of active story tags. */
				sprintf( __( 'Tags: %s', 'jeowp' ), this.state.selectedTagLabel )
			);
		}

		const loading = ! this.props.storiesLoaded && ! isLoadingMoreStories ? (
			<div
				className="stories-status stories-status--loading"
				role="status"
				aria-live="polite"
				aria-label={ __( 'Loading…', 'jeowp' ) }
			>
				<LoadingSpinner />
			</div>
		) : null;
		const loadingMore = isLoadingMoreStories ? (
			<div
				className="stories-status stories-status--loading stories-status--loading-more"
				role="status"
				aria-live="polite"
				aria-label={ __( 'Loading…', 'jeowp' ) }
			>
				<LoadingSpinner />
			</div>
		) : null;
		const emptyMessage = this.props.storiesLoaded && ! this.props.stories.length ? (
			<div className="stories-status stories-status--empty" role="status">
				{ hasActiveFilters
					? __( 'No stories found for the current filters.', 'jeowp' )
					: __( 'No stories available.', 'jeowp' ) }
			</div>
		) : null;

		return (
			<div className="stories-tab" style={ this.props.style }>
				<Search
					searchPlaceholder={ __( 'Search story', 'jeowp' ) }
					searchButtonLabel={ __( 'Search story', 'jeowp' ) }
					update={ this.updateStories }
					searchField={ this.props.queryParams.search?? "" }
					disabled={ ! this.props.storiesLoaded }
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
						? __( 'Hide filters', 'jeowp' )
						: __( 'Show filters', 'jeowp' ) }
				</button>
				{ this.state.showFilters && (
					<div className="filters">
						<DateRangeFilter
							placeholder={ __( 'Date range', 'jeowp' ) }
							value={ this.props.dateRangeInputValue }
							startDate={ this.props.queryParams.after }
							endDate={ this.props.queryParams.before }
							localeInfo={ this.localeInfo }
							onApply={ this.dateRangePickerApply }
							onCancel={ this.dateRangePickerCancel }
						/>
							<TagFilterControl
								value={ selectedTagIds }
								onChange={ this.handleTagChange }
								onSelectedLabelChange={ this.setSelectedTagLabel }
							/>

						<div></div>
					</div>
				) }
				<div className="stories-results-summary" role="status" aria-live="polite">
					<span>
						{ this.props.storiesLoaded || isLoadingMoreStories
							? storiesCountLabel
							: __( 'Updating stories…', 'jeowp' ) }
					</span>
					{ hasActiveFilters ? (
						<button type="button" onClick={ this.clearStoryFilters }>
							{ __( 'Clear', 'jeowp' ) }
						</button>
					) : null }
				</div>
				{ activeFilters.length ? (
					<div
						className="stories-active-filters"
						aria-label={ __( 'Active filters', 'jeowp' ) }
					>
						{ activeFilters.map( ( filterLabel ) => (
							<span className="stories-active-filters__item" key={ filterLabel }>
								{ filterLabel }
							</span>
						) ) }
					</div>
				) : null }
				{ loading }

				<div
					className="stories"
					ref={ this.registerStoriesList }
					onWheelCapture={ this.markListScrolling }
					onTouchMove={ this.markListScrolling }
					aria-busy={ ! this.props.storiesLoaded }
				>
					{ this.props.stories.map( ( story, index ) => {
						return (
							<Storie
								cardRef={ ( element ) =>
									this.registerStoryCard( story.id, element )
								}
								className={ (story.id === this.state.hoveredPostId || hoveredClusterPostsSet.has(story.id) ? 'active' : '') }
								onHover={ () => this.storyHovered( story ) }
								onUnhover={ () => this.storyUnhover( story ) }
								onViewInMap={ () => this.viewStoryInMap( story ) }
								story={ story }
								key={ story.id }
								map={ this.props.map }
							/>
						);
					} ) }
					{ loadingMore }
				</div>

				{ emptyMessage }
			</div>
		);
	}
}

export default Stories;

class Storie extends Component {
	shouldComponentUpdate( nextProps ) {
		return (
			this.props.story !== nextProps.story ||
			this.props.className !== nextProps.className
		);
	}

	render() {
		const story = this.props.story;
		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const storyDate = new Date( story.date_gmt ).toLocaleDateString(
			resolveStoryDateLocale(),
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
			<article
				ref={ this.props.cardRef }
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

					<a
						className="title"
						href={ story.link }
						target="_blank"
						rel="noreferrer"
					>
						{ decodeEntities(story.title.rendered) }
					</a>

					<div className="date">{ storyDate }</div>
					<div>
						<button
							type="button"
							className="view-in-map"
							onClick={ this.props.onViewInMap }
						>
							{ __( 'View in map', 'jeowp' ) }
						</button>
					</div>
				</div>
			</article>
		);
	}
}
