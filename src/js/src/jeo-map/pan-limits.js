import { toFiniteNumber } from './map-numbers';

const LATITUDE_MAX = 90;
const LATITUDE_MIN = -90;
const LONGITUDE_MAX = 180;
const LONGITUDE_MIN = -180;

function isWithinRange( value, min, max ) {
	return value >= min && value <= max;
}

function isValidCoordinatePair( longitude, latitude ) {
	return (
		isWithinRange( longitude, LONGITUDE_MIN, LONGITUDE_MAX ) &&
		isWithinRange( latitude, LATITUDE_MIN, LATITUDE_MAX )
	);
}

function isValidBounds( bounds ) {
	if ( ! Array.isArray( bounds ) || bounds.length !== 2 ) {
		return false;
	}

	const [ southWest, northEast ] = bounds;

	if ( ! Array.isArray( southWest ) || ! Array.isArray( northEast ) ) {
		return false;
	}

	const [ west, south ] = southWest;
	const [ east, north ] = northEast;

	return (
		isValidCoordinatePair( west, south ) &&
		isValidCoordinatePair( east, north ) &&
		south <= north
	);
}

function boundsContainCenter( bounds, center ) {
	if ( ! Array.isArray( center ) || center.length !== 2 ) {
		return false;
	}

	const [ longitude, latitude ] = center;

	if ( ! isValidCoordinatePair( longitude, latitude ) ) {
		return false;
	}

	const [ [ west, south ], [ east, north ] ] = bounds;
	const containsLongitude = west <= east ?
		longitude >= west && longitude <= east :
		longitude >= west || longitude <= east;

	return containsLongitude && latitude >= south && latitude <= north;
}

export function getPanLimitsMaxBounds( panLimits, options = {} ) {
	if ( ! panLimits || typeof panLimits !== 'object' ) {
		return null;
	}

	const east = toFiniteNumber( panLimits.east );
	const north = toFiniteNumber( panLimits.north );
	const south = toFiniteNumber( panLimits.south );
	const west = toFiniteNumber( panLimits.west );

	if ( [ east, north, south, west ].some( ( value ) => value === null ) ) {
		return null;
	}

	const standardBounds = [
		[ west, south ],
		[ east, north ],
	];
	const legacyBounds = [
		[ south, west ],
		[ north, east ],
	];
	const standardIsValid = isValidBounds( standardBounds );
	const legacyIsValid = isValidBounds( legacyBounds );

	if ( ! standardIsValid && ! legacyIsValid ) {
		return null;
	}

	if ( standardIsValid && ! legacyIsValid ) {
		return standardBounds;
	}

	if ( ! standardIsValid && legacyIsValid ) {
		return legacyBounds;
	}

	const center = options.center;
	const standardContainsCenter = boundsContainCenter( standardBounds, center );
	const legacyContainsCenter = boundsContainCenter( legacyBounds, center );

	if ( legacyContainsCenter && ! standardContainsCenter ) {
		return legacyBounds;
	}

	return standardBounds;
}
