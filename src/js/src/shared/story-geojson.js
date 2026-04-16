function toFiniteCoordinate( value ) {
	const coordinate = Number.parseFloat( value );

	return Number.isFinite( coordinate ) ? coordinate : null;
}

function hashFeatureKey( value ) {
	let hash = 2166136261;

	for ( let index = 0; index < value.length; index++ ) {
		hash ^= value.charCodeAt( index );
		hash = Math.imul( hash, 16777619 );
	}

	return hash >>> 0;
}

export function buildRelatedPostFeatureId( story, coordinates ) {
	const storyId = story?.id ?? 'story';
	return hashFeatureKey( `${ storyId }:${ coordinates.join( ':' ) }` );
}

export function getRelatedPointCoordinates( point ) {
	if ( ! point || typeof point !== 'object' ) {
		return null;
	}

	const longitude = toFiniteCoordinate( point._geocode_lon );
	const latitude = toFiniteCoordinate( point._geocode_lat );

	if ( longitude === null || latitude === null ) {
		return null;
	}

	return [ longitude, latitude ];
}

export function getStoryRelatedCoordinates( story ) {
	const relatedPoints = Array.isArray( story?.meta?._related_point )
		? story.meta._related_point
		: [];

	return relatedPoints.map( getRelatedPointCoordinates ).filter( Boolean );
}

export function getStoryFeatureIds( story ) {
	const featureIds = [];
	const seenFeatureIds = new Set();

	getStoryRelatedCoordinates( story ).forEach( ( coordinates ) => {
		const featureId = buildRelatedPostFeatureId( story, coordinates );

		if ( seenFeatureIds.has( featureId ) ) {
			return;
		}

		seenFeatureIds.add( featureId );
		featureIds.push( featureId );
	} );

	return featureIds;
}

export function buildRelatedPostsGeoJson( stories = [] ) {
	const features = [];
	const seenFeatureIds = new Set();

	( stories ?? [] ).forEach( ( story ) => {
		getStoryRelatedCoordinates( story ).forEach( ( coordinates ) => {
			const featureId = buildRelatedPostFeatureId( story, coordinates );

			if ( seenFeatureIds.has( featureId ) ) {
				return;
			}

			seenFeatureIds.add( featureId );

			features.push( {
				id: featureId,
				type: 'Feature',
				properties: story,
				geometry: {
					type: 'Point',
					coordinates,
				},
			} );
		} );
	} );

	return {
		type: 'FeatureCollection',
		features,
	};
}
