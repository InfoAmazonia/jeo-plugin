/**
 * Generate a UUID v4 string.
 *
 * Prefers the native crypto.randomUUID() when available (requires a secure
 * context — HTTPS).  Falls back to crypto.getRandomValues() which works in
 * any modern browser regardless of the transport protocol.
 *
 * @return {string} A UUID v4 string, e.g. "110ec58a-a0f2-4ac4-8393-c866d813b8d1".
 */
export default function generateUUID() {
	if ( typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ) {
		return crypto.randomUUID();
	}

	// Fallback: works in both secure and insecure contexts.
	if ( typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function' ) {
		return ( '10000000-1000-4000-8000-100000000000' ).replace( /[018]/g, ( c ) =>
			( +c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> +c / 4 ).toString( 16 )
		);
	}

	// Last-resort fallback for environments without crypto.
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c ) => {
		const r = Math.random() * 16 | 0;
		const v = c === 'x' ? r : ( r & 0x3 | 0x8 );
		return v.toString( 16 );
	} );
}
