import { useEffect, useState } from '@wordpress/element';

/**
 * Preflight for tile-based layer sources (Gate r3b — R3-G1/GAP-B).
 *
 * GL error semantics cannot be trusted for tile failures: MapLibre swallows
 * 404 tile errors entirely and errored tiles still emit `sourcedata`
 * "content" events, so event-driven guards alone let a dead tilelayer/MVT
 * render as a courtesy base map. A tile URL is therefore verified directly
 * (one request for the z0 tile) before the map renders — a failed layer
 * source always maps to the single preview error state.
 */

/**
 * Resolve a tile URL template into a concrete, fetchable z0 tile URL.
 *
 * @param {string} rawUrl Tile URL template (`{z}/{x}/{y}/{r}/{s}` tokens).
 * @return {string|null} Fetchable URL, or null when the value is not a
 *                       plain HTTP(S) tile URL (e.g. `mapbox://` tilesets
 *                       go through the GL source error path instead).
 */
export function getTilePreflightUrl( rawUrl ) {
	if ( typeof rawUrl !== 'string' || ! rawUrl.trim() ) {
		return null;
	}
	const trimmed = rawUrl.trim();
	if ( trimmed.startsWith( 'mapbox://' ) ) {
		return null;
	}
	const url = trimmed
		.replace( /\{r\}/g, '' )
		.replace( /\{s\}/g, 'a' )
		.replace( /\{z\}/g, '0' )
		.replace( /\{x\}/g, '0' )
		.replace( /\{y\}/g, '0' );
	return /^https?:\/\//i.test( url ) ? url : null;
}

/**
 * Collect the fetchable tile URLs of a layer meta (post meta of a
 * `map-layer`: `{ type, layer_type_options }`).
 *
 * @param {Object} layerMeta Layer meta.
 * @return {string[]} URLs to preflight (empty when the layer is not a
 *                    tile-based direct type).
 */
export function getTileLayerPreflightUrls( layerMeta ) {
	const type = layerMeta?.type;
	const options = layerMeta?.layer_type_options || {};
	if ( type === 'tilelayer' || type === 'mvt' ) {
		const url = getTilePreflightUrl( options.url );
		return url ? [ url ] : [];
	}
	return [];
}

/**
 * Content-based attempt key for the preview error lifecycle (R3B-G1).
 *
 * The layer editor clears the preview error when the form data changes —
 * but the debounced `layer_type_options` can arrive as a NEW REFERENCE with
 * identical content (SchemaForm re-normalization). The key compares content,
 * never reference, so a no-change commit never erases a live error state.
 *
 * @param {Object} postMeta   Debounced post meta (`type`, `layer_type_options`).
 * @param {number} retryCount Retry counter ("Try again" forces a new attempt).
 * @return {string} Stable content key.
 */
export function getPreviewAttemptKey( postMeta, retryCount = 0 ) {
	return JSON.stringify( [
		postMeta?.layer_type_options || {},
		postMeta?.type || null,
		retryCount,
	] );
}

/**
 * Decide what a data commit does to the preview error lifecycle
 * (Gate r3b-final — R3B-G1 (c)).
 *
 * - 'keep': nothing actually changed (reference-only commit) — preserve.
 * - 'redecide': the data really changed while a SOURCE error shows — the
 *   error must not be silently cleared (that resurrects the courtesy map);
 *   the surface auto-retries so the error comes back honestly if the
 *   source is still bad.
 * - 'clear': the data really changed with no source error pending.
 *
 * @param {Object}  args
 * @param {boolean} args.dataChanged    Whether the content key changed.
 * @param {boolean} args.hasSourceError Whether a kind:'source' error shows.
 * @return {string} 'keep' | 'redecide' | 'clear'
 */
export function resolveAttemptTransition( { dataChanged, hasSourceError } ) {
	if ( ! dataChanged ) {
		return 'keep';
	}
	if ( hasSourceError ) {
		return 'redecide';
	}
	return 'clear';
}

/**
 * Preflight a set of tile URLs. The first failure wins; the error object
 * carries `status`/`url`/`message` so `getPreviewErrorInfo` classifies it
 * exactly like a fetch failure (network errors → "server unreachable",
 * HTTP errors → status-based messages).
 *
 * @param {string[]} urls       Tile URLs to verify.
 * @param {*}        refreshKey Bump to re-run (retry).
 * @return {Object} { checking: boolean, error: Object|null }
 */
export function useTileLayerPreflight( urls, refreshKey = 0 ) {
	const [ state, setState ] = useState( { checking: false, error: null } );
	const urlsKey = JSON.stringify( urls );

	useEffect( () => {
		if ( ! urls.length ) {
			setState( { checking: false, error: null } );
			return undefined;
		}

		let cancelled = false;
		const controller = new AbortController();
		setState( { checking: true, error: null } );

		( async () => {
			for ( const url of urls ) {
				try {
					const response = await fetch( url, {
						signal: controller.signal,
						credentials: 'omit',
					} );
					if ( ! response.ok ) {
						if ( ! cancelled ) {
							setState( {
								checking: false,
								error: {
									status: response.status,
									url,
									message: `HTTP ${ response.status }`,
								},
							} );
						}
						return;
					}
				} catch ( error ) {
					if ( controller.signal.aborted ) {
						return;
					}
					if ( ! cancelled ) {
						setState( {
							checking: false,
							error: {
								url,
								name: error?.name,
								message: error?.message || 'Failed to fetch',
							},
						} );
					}
					return;
				}
			}
			if ( ! cancelled ) {
				setState( { checking: false, error: null } );
			}
		} )();

		return () => {
			cancelled = true;
			controller.abort();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the URL list
	}, [ urlsKey, refreshKey ] );

	return state;
}
