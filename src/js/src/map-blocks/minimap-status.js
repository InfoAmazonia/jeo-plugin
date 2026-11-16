/**
 * Minimap status derivation (W2 — item 2.2 / V1 fix).
 *
 * The block never persists transient statuses (`loading`/`error`) in
 * attributes: they live in React state while a request is in flight, and
 * only `ready` is written back (the frontend save renders nothing when a
 * legacy `error` status survives, so successes must clear it). A reload —
 * or an undo landing on an old snapshot — derives the status from the
 * actual content, so a saved block can never boot into a bricked spinner
 * (the V1 undo bug: undo used to revert to a persisted `loading` state).
 */

/**
 * Derive the UI status from persisted attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} 'ready' when the block holds a generated map (explicit
 *                  `ready` status or any generated content), 'idle'
 *                  otherwise. Persisted `loading`/`error` values resolve
 *                  through the same content check.
 */
export function deriveMinimapStatus( attributes = {} ) {
	if ( attributes.status === 'ready' ) {
		return 'ready';
	}
	if (
		( attributes.layers?.length || 0 ) > 0 ||
		Boolean( attributes.base_layer ) ||
		( attributes.conversation?.length || 0 ) > 0
	) {
		return 'ready';
	}
	return 'idle';
}

/**
 * Content fingerprint used by the request race guard (V1): if the map
 * content changes while an AI request is in flight (e.g. the user undid
 * the previous generation), the response must not write attributes over
 * the user's edits.
 *
 * @param {Object} attributes Block attributes.
 * @return {string} Stable JSON fingerprint of the map content.
 */
export function minimapContentKey( attributes = {} ) {
	return JSON.stringify( [
		attributes.layers || [],
		attributes.base_layer || null,
		attributes.pins || [],
		attributes.center_lat ?? null,
		attributes.center_lon ?? null,
		attributes.initial_zoom ?? null,
	] );
}
