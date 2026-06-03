import { toFiniteNumber } from './map-numbers';

export function getPanLimitsMaxBounds( panLimits ) {
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

	return [
		[ west, south ],
		[ east, north ],
	];
}
