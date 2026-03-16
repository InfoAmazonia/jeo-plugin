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

export function sortSelectedLayersByMapOrder( selectedLayers = [], orderedLayers = [] ) {
	const selectedById = new Map(
		( selectedLayers ?? [] ).map( ( layer ) => [ layer.id, layer ] )
	);
	const orderedSelectedLayers = [];

	( orderedLayers ?? [] ).forEach( ( layer ) => {
		if ( selectedById.has( layer.id ) ) {
			orderedSelectedLayers.push( selectedById.get( layer.id ) );
			selectedById.delete( layer.id );
		}
	} );

	return [ ...orderedSelectedLayers, ...selectedById.values() ];
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
