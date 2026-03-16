const URL_PATTERN =
	/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/i;

export function normalizeOptionalUrl( value ) {
	if ( ! value ) {
		return '';
	}

	if ( value.includes( 'http' ) ) {
		return value;
	}

	return URL_PATTERN.test( value ) ? `https://${ value }` : value;
}
