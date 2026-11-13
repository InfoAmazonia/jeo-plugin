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
	} ).then( ( response ) => {
		if ( ! response.ok ) {
			throw new Error( `${ response.status } ${ response.statusText }` );
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
	forStorymap = 0,
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

		const queryParams = {};
		if ( forceRefresh ) {
			queryParams.refresh = true;
		}
		if ( forStorymap ) {
			// Grants access to the composed style of a non-published map when
			// the current visitor may view the story map that uses it.
			queryParams.for_storymap = forStorymap;
		}

		const metadataUrl = addQueryParams(
			`${ composedStyleUrlBase }${ mapId }`,
			queryParams
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

/**
 * Load composed style data from pre-resolved URLs.
 *
 * Used when the server-rendered payload already carries content-addressed
 * static URLs (e.g. the story map payload, for anonymous visitors), skipping
 * the REST metadata endpoint entirely.
 *
 * @param {Object} args               Load arguments.
 * @param {string} args.manifestUrl   Manifest JSON URL.
 * @param {string} args.styleUrl      Style JSON URL.
 * @param {Object} [args.signal]      Optional AbortSignal.
 * @param {boolean} [args.includeStyle]
 *                                      Whether to also fetch and return the
 *                                      style JSON (default false — the URL is
 *                                      returned either way, and GL runtimes
 *                                      fetch the style themselves).
 * @param {string} [args.emptyManifestMessage]
 *                                      Error message for empty manifests.
 * @return {Promise<Object>} Promise resolving `{ manifest, metadata, style }`.
 */
export async function loadComposedStyleDataFromUrls( {
	manifestUrl,
	signal,
	styleUrl,
	includeStyle = false,
	emptyManifestMessage = DEFAULT_EMPTY_MANIFEST_MESSAGE,
} = {} ) {
	if ( ! styleUrl || ! manifestUrl ) {
		throw new Error( DEFAULT_COMPOSITION_UNAVAILABLE_MESSAGE );
	}

	const [ manifest, style ] = await Promise.all( [
		fetchJson( manifestUrl, { signal } ),
		includeStyle ? fetchJson( styleUrl, { signal } ) : Promise.resolve( null ),
	] );

	if ( ! manifest?.layers?.length ) {
		throw new Error( emptyManifestMessage );
	}

	return {
		manifest,
		metadata: {
			style: styleUrl,
		},
		style,
	};
}
