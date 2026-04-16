import {
	buildRelatedPostFeatureId,
	buildRelatedPostsGeoJson,
	getRelatedPointCoordinates,
	getStoryFeatureIds,
	getStoryRelatedCoordinates,
} from './story-geojson';

describe( 'story GeoJSON helpers', () => {
	it( 'parses valid coordinates and rejects empty related points', () => {
		expect( getRelatedPointCoordinates( null ) ).toBeNull();
		expect( getRelatedPointCoordinates( { _geocode_lon: 'x', _geocode_lat: '-23.5' } ) ).toBeNull();
		expect(
			getRelatedPointCoordinates( {
				_geocode_lon: '-46.6333',
				_geocode_lat: '-23.5505',
			} )
		).toEqual( [ -46.6333, -23.5505 ] );
	} );

	it( 'keeps only valid related points for a story', () => {
		expect(
			getStoryRelatedCoordinates( {
				meta: {
					_related_point: [
						null,
						{
							_geocode_lon: '-46.6333',
							_geocode_lat: '-23.5505',
						},
						{
							_geocode_lon: 'invalid',
							_geocode_lat: '-23.5505',
						},
					],
				},
			} )
		).toEqual( [ [ -46.6333, -23.5505 ] ] );
	} );

	it( 'builds stable feature ids per story point', () => {
		const story = {
			id: 10,
			meta: {
				_related_point: [
					{
						_geocode_lon: '-46.6333',
						_geocode_lat: '-23.5505',
					},
					{
						_geocode_lon: '-46.6333',
						_geocode_lat: '-23.5505',
					},
					{
						_geocode_lon: '-43.1729',
						_geocode_lat: '-22.9068',
					},
				],
			},
		};

		const firstFeatureId = buildRelatedPostFeatureId( story, [
			-46.6333,
			-23.5505,
		] );
		const secondFeatureId = buildRelatedPostFeatureId( story, [
			-43.1729,
			-22.9068,
		] );

		expect( Number.isInteger( firstFeatureId ) ).toBe( true );
		expect( Number.isInteger( secondFeatureId ) ).toBe( true );
		expect( firstFeatureId ).not.toBe( secondFeatureId );
		expect( getStoryFeatureIds( story ) ).toEqual( [
			firstFeatureId,
			secondFeatureId,
		] );
	} );

	it( 'builds a feature collection without invalid geocoded points', () => {
		const stories = [
			{
				id: 10,
				meta: {
					_related_point: [
						{
							_geocode_lon: '-46.6333',
							_geocode_lat: '-23.5505',
						},
						{
							_geocode_lon: '-46.6333',
							_geocode_lat: '-23.5505',
						},
						{
							_geocode_lon: '-43.1729',
							_geocode_lat: '-22.9068',
						},
						{
							_geocode_lon: null,
							_geocode_lat: '-22.9068',
						},
					],
				},
			},
			{
				id: 11,
				meta: {
					_related_point: [ null ],
				},
			},
		];

		expect( buildRelatedPostsGeoJson( stories ) ).toEqual( {
			type: 'FeatureCollection',
			features: [
				{
					id: buildRelatedPostFeatureId( stories[ 0 ], [
						-46.6333,
						-23.5505,
					] ),
					type: 'Feature',
					properties: stories[ 0 ],
					geometry: {
						type: 'Point',
						coordinates: [ -46.6333, -23.5505 ],
					},
				},
				{
					id: buildRelatedPostFeatureId( stories[ 0 ], [
						-43.1729,
						-22.9068,
					] ),
					type: 'Feature',
					properties: stories[ 0 ],
					geometry: {
						type: 'Point',
						coordinates: [ -43.1729, -22.9068 ],
					},
				},
			],
		} );
	} );

	it( 'keeps distinct stories separate when they share the same coordinates', () => {
		const stories = [
			{
				id: 10,
				meta: {
					_related_point: [
						{
							_geocode_lon: '-46.6333',
							_geocode_lat: '-23.5505',
						},
					],
				},
			},
			{
				id: 11,
				meta: {
					_related_point: [
						{
							_geocode_lon: '-46.6333',
							_geocode_lat: '-23.5505',
						},
					],
				},
			},
		];

		expect(
			buildRelatedPostsGeoJson( stories ).features.map( ( feature ) => feature.id )
		).toEqual( [
			buildRelatedPostFeatureId( stories[ 0 ], [ -46.6333, -23.5505 ] ),
			buildRelatedPostFeatureId( stories[ 1 ], [ -46.6333, -23.5505 ] ),
		] );
		expect(
			buildRelatedPostsGeoJson( stories ).features.map(
				( feature ) => feature.properties.id
			)
		).toEqual( [ 10, 11 ] );
	} );
} );
