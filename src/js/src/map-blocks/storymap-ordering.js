export function reorderList( list, startIndex, endIndex ) {
	const items = Array.isArray( list ) ? Array.from( list ) : [];

	if (
		startIndex === endIndex ||
		startIndex < 0 ||
		endIndex < 0 ||
		startIndex >= items.length ||
		endIndex >= items.length
	) {
		return items;
	}

	const [ removed ] = items.splice( startIndex, 1 );
	items.splice( endIndex, 0, removed );

	return items;
}

export function moveActiveIndex( currentIndex, startIndex, endIndex ) {
	if ( currentIndex === startIndex ) {
		return endIndex;
	}

	if (
		startIndex < endIndex &&
		currentIndex > startIndex &&
		currentIndex <= endIndex
	) {
		return currentIndex - 1;
	}

	if (
		startIndex > endIndex &&
		currentIndex >= endIndex &&
		currentIndex < startIndex
	) {
		return currentIndex + 1;
	}

	return currentIndex;
}

export function reorderSlides( slides, currentSlideIndex, startIndex, endIndex ) {
	return {
		slides: reorderList( slides, startIndex, endIndex ),
		currentSlideIndex: moveActiveIndex( currentSlideIndex, startIndex, endIndex ),
	};
}

export function getLayerId( layer ) {
	const id = Number.parseInt( layer?.id, 10 );
	return Number.isFinite( id ) && id > 0 ? id : null;
}

export function layerIdsMatch( leftLayer, rightLayer ) {
	const leftLayerId = getLayerId( leftLayer );
	return leftLayerId !== null && leftLayerId === getLayerId( rightLayer );
}

export function createLayerIdSet( layers = [] ) {
	return new Set(
		( layers ?? [] )
			.map( getLayerId )
			.filter( ( layerId ) => layerId !== null )
	);
}

export function normalizeLayerReference( layer ) {
	const layerId = getLayerId( layer );
	if ( layerId === null || typeof layer !== 'object' || layer === null ) {
		return null;
	}

	return {
		...layer,
		id: layerId,
	};
}

export function sortSelectedLayersByMapOrder( selectedLayers = [], orderedLayers = [] ) {
	const selectedById = new Map(
		( selectedLayers ?? [] )
			.map( ( layer ) => [ getLayerId( layer ), layer ] )
			.filter( ( [ layerId ] ) => layerId !== null )
	);
	const orderedSelectedLayers = [];

	( orderedLayers ?? [] ).forEach( ( layer ) => {
		const layerId = getLayerId( layer );
		if ( selectedById.has( layerId ) ) {
			orderedSelectedLayers.push( selectedById.get( layerId ) );
			selectedById.delete( layerId );
		}
	} );

	return [ ...orderedSelectedLayers, ...selectedById.values() ];
}

export function reconcileSelectedLayersWithAvailableLayers(
	selectedLayers = [],
	mapLayers = [],
	availableLayers = []
) {
	const mapLayerIds = createLayerIdSet( mapLayers );
	const availableLayerIds = createLayerIdSet( availableLayers );
	const normalizedSelectedLayers = ( selectedLayers ?? [] )
		.map( normalizeLayerReference )
		.filter( Boolean )
		.filter(
			( layer ) =>
				mapLayerIds.has( layer.id ) && availableLayerIds.has( layer.id )
		);

	return sortSelectedLayersByMapOrder( normalizedSelectedLayers, mapLayers );
}

export function reorderStorymapLayers(
	navigateMapLayers,
	slides,
	startIndex,
	endIndex
) {
	const orderedLayers = reorderList( navigateMapLayers, startIndex, endIndex );
	const reorderedSlides = ( slides ?? [] ).map( ( slide ) => ( {
		...slide,
		selectedLayers: sortSelectedLayersByMapOrder(
			slide?.selectedLayers,
			orderedLayers
		),
	} ) );

	return {
		navigateMapLayers: orderedLayers,
		slides: reorderedSlides,
	};
}
