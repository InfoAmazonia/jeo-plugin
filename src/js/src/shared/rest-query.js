export function appendRestQueryParams( searchParams, params, prefix = '' ) {
	Object.entries( params || {} ).forEach( ( [ key, value ] ) => {
		const paramKey = prefix ? `${ prefix }[${ key }]` : key;

		if ( value === undefined || value === null || value === '' ) {
			return;
		}

		if ( Array.isArray( value ) ) {
			value.forEach( ( item, index ) => {
				appendRestQueryParams( searchParams, { [ index ]: item }, paramKey );
			} );
			return;
		}

		if ( typeof value === 'object' ) {
			appendRestQueryParams( searchParams, value, paramKey );
			return;
		}

		searchParams.append( paramKey, String( value ) );
	} );
}
