export function formatDate( datetime ) {
	const formatter = new Intl.DateTimeFormat( window.jeoMapVars.currentLang, { year: 'numeric', month: 'long', day: 'numeric' } );
	return formatter.format( datetime );
}

export function formatHour( datetime ) {
	const formatter = new Intl.DateTimeFormat( window.jeoMapVars.currentLang, { hour: '2-digit', minute: '2-digit' } );
	return formatter.format( datetime );
}

export function joinList( array, type = 'conjunction' ) {
	const formatter = new Intl.ListFormat( window.jeoMapVars.currentLang, { style: 'long', type } );
	return formatter.format( array );
}
