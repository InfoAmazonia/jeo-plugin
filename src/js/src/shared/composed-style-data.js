const DEFAULT_COMPOSITION_UNAVAILABLE_MESSAGE =
	'Mapbox style composition is unavailable.';
const DEFAULT_EMPTY_MANIFEST_MESSAGE =
	'Mapbox style composition did not return renderable layers.';

function getJeoMapVars() {
	return globalThis.jeoMapVars || {};
}

function getJsonHeaders( url ) {
	const { nonce } = getJeoMapVars();

	if ( ! nonce ) {
		return {};
	}

	try {
		const requestOrigin = new URL( url, globalThis.location?.href ).origin;
		const currentOrigin = globalThis.location?.origin;

		return requestOrigin === currentOrigin
			? {
					'X-WP-Nonce': nonce,
			  }
			: {};
	} catch ( error ) {
		return {};
	}
}

function addQueryParams( url, params = {} ) {
	try {
		const nextUrl = new URL( url, globalThis.location?.href );

		Object.entries( params ).forEach( ( [ key, value ] ) => {
			if ( value !== undefined && value !== null && value !== false ) {
				nextUrl.searchParams.set( key, String( value ) );
			}
		} );

		return nextUrl.toString();
	} catch ( error ) {
		return url;
	}
}

export function fetchJson( url, options = {} ) {
	return fetch( url, {
		...options,
		headers: {
			...getJsonHeaders( url ),
			...( options.headers || {} ),
		},
	} ).then( async ( response ) => {
		if ( ! response.ok ) {
			const error = new Error( `${ response.status } ${ response.statusText }` );
			error.status = response.status;
			error.url = url;

			// Preserve the REST error body (when present) so callers can render
			// the humanized { message, action, detail } payload produced by the
			// server-side error translation layer.
			try {
				error.data = await response.clone().json();
			} catch ( parseError ) {
				error.data = null;
			}

			throw error;
		}

		return response.json();
	} );
}

export function postJson( url, data, options = {} ) {
	return fetchJson( url, {
		...options,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...( options.headers || {} ),
		},
		body: JSON.stringify( data ),
	} );
}

export async function loadComposedStyleData( {
	forceRefresh = false,
	includeStyle = false,
	mapId,
	payload,
	signal,
	unavailableMessage = DEFAULT_COMPOSITION_UNAVAILABLE_MESSAGE,
	emptyManifestMessage = DEFAULT_EMPTY_MANIFEST_MESSAGE,
} = {} ) {
	const { composedStyleComposeUrl, composedStyleUrlBase } = getJeoMapVars();

	let metadata;
	if ( payload ) {
		if ( ! composedStyleComposeUrl ) {
			throw new Error( unavailableMessage );
		}

		metadata = await postJson( composedStyleComposeUrl, payload, { signal } );
	} else {
		if ( ! mapId || ! composedStyleUrlBase ) {
			throw new Error( unavailableMessage );
		}

		const metadataUrl = addQueryParams(
			`${ composedStyleUrlBase }${ mapId }`,
			forceRefresh ? { refresh: true } : {}
		);
		metadata = await fetchJson( metadataUrl, { signal } );
	}

	if ( ! metadata?.enabled || ! metadata.style || ! metadata.manifest ) {
		throw new Error( metadata?.error || unavailableMessage );
	}

	const [ manifest, style ] = await Promise.all( [
		fetchJson( metadata.manifest, { signal } ),
		includeStyle ? fetchJson( metadata.style, { signal } ) : Promise.resolve( null ),
	] );

	if ( ! manifest?.layers?.length ) {
		throw new Error( emptyManifestMessage );
	}

	return {
		manifest,
		metadata,
		style,
	};
}
