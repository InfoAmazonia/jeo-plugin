import { toFiniteNumber } from './map-numbers';

function hasValidLatitudes( south, north ) {
	return (
		south >= -90 &&
		south <= 90 &&
		north >= -90 &&
		north <= 90 &&
		south <= north
	);
}

function containsCenter( west, south, east, north, center ) {
	const [ longitude, latitude ] = center || [];
	const containsLongitude = west <= east ?
		longitude >= west && longitude <= east :
		longitude >= west || longitude <= east;

	return (
		containsLongitude &&
		latitude >= south &&
		latitude <= north
	);
}

export function getPanLimitsMaxBounds( panLimits, center = null ) {
	if ( ! panLimits ) {
		return null;
	}

	const east = toFiniteNumber( panLimits.east );
	const north = toFiniteNumber( panLimits.north );
	const south = toFiniteNumber( panLimits.south );
	const west = toFiniteNumber( panLimits.west );

	if ( [ east, north, south, west ].includes( null ) ) {
		return null;
	}

	const standardIsValid = hasValidLatitudes( south, north );
	const legacyIsValid = hasValidLatitudes( west, east );

	if (
		legacyIsValid &&
		(
			! standardIsValid ||
			(
				containsCenter( south, west, north, east, center ) &&
				! containsCenter( west, south, east, north, center )
			)
		)
	) {
		return [
			[ south, west ],
			[ north, east ],
		];
	}

	return standardIsValid ? [
		[ west, south ],
		[ east, north ],
	] : null;
}
