export function waitMapEvent( target, event ) {
	return new Promise( ( resolve ) => {
		target.once( event, resolve );
	} );
}

export function waitUntil ( condition, callback, intervalMs = 50, timeoutMs = 30_000 ) {
	const initialValue = condition();
	if ( initialValue ) {
		return callback( initialValue );
	}

	let elapsed = 0;
	let interval = window.setInterval( () => {
		const value = condition();
		if ( value ) {
			callback( value );
			return window.clearInterval( interval );
		}

		elapsed += intervalMs;
		if ( elapsed >= timeoutMs ) {
			window.clearInterval( interval );
		}
	}, intervalMs );
}
