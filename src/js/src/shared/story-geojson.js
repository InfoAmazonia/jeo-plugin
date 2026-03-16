function toFiniteCoordinate( value ) {
	const coordinate = Number.parseFloat( value );

	return Number.isFinite( coordinate ) ? coordinate : null;
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

export function buildRelatedPostsGeoJson( stories = [] ) {
	const features = [];
	const seenFeatureKeys = new Set();

	( stories ?? [] ).forEach( ( story ) => {
		getStoryRelatedCoordinates( story ).forEach( ( coordinates ) => {
			const featureKey = `${ story?.id ?? 'story' }:${ coordinates.join( ':' ) }`;

			if ( seenFeatureKeys.has( featureKey ) ) {
				return;
			}

			seenFeatureKeys.add( featureKey );

			features.push( {
				id: story.id,
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
