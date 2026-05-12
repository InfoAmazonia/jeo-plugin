export function decodeHtmlEntity ( str ) {
	return str.replaceAll( /&#(\d+);/g, ( match, dec ) => {
		return String.fromCodePoint( dec );
	} );
}
