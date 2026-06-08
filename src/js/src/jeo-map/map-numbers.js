export function toFiniteNumber( value ) {
	if ( value === '' || value === undefined || value === null || value === false ) {
		return null;
	}

	const numberValue = Number( value );
	return Number.isFinite( numberValue ) ? numberValue : null;
}
