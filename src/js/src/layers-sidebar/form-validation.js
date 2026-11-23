import { getEditorLayerTypeSchema } from './layer-type-definitions';

/**
 * Single source of truth for "the layer form is incomplete".
 *
 * Pure derivation from the post meta + the layer type schema — never from
 * render/preview success. The same condition must always produce the same
 * result, so the publish lock and the required-fields warning stay
 * deterministic.
 *
 * @param {Object} postMeta Edited post meta (`type`, `layer_type_options`).
 * @return {Object} { complete: boolean, missing: string[] } `missing` holds
 *                  the required option keys left empty.
 */
export function validateLayerFormData( postMeta = {} ) {
	if ( ! postMeta.type ) {
		return { complete: false, missing: [ 'type' ] };
	}

	const schema = getEditorLayerTypeSchema( postMeta );
	if ( ! schema || ! schema.properties ) {
		// Unknown type: nothing client-side to validate against. The
		// server-side validation decides on publish.
		return { complete: true, missing: [] };
	}

	const options = postMeta.layer_type_options || {};
	const missing = ( schema.required || [] ).filter( ( key ) => {
		const value = options[ key ];
		return value === undefined || value === null || value === '';
	} );

	return { complete: missing.length === 0, missing };
}

/**
 * Required numeric map fields (map CPT): when present they must be finite
 * numbers. Fields absent from the meta — or cleared to an empty string by
 * the numeric control ("use the default") — fall back to the map defaults,
 * so only genuinely corrupted values block the publish (Gate 2 — OBS-04).
 *
 * @param {Object} postMeta Edited post meta of the map CPT.
 * @return {Object} { complete: boolean, invalid: string[] }
 */
export function validateMapFormData( postMeta = {} ) {
	const numericFields = [ 'center_lat', 'center_lon', 'initial_zoom' ];
	const invalid = numericFields.filter( ( key ) => {
		const value = postMeta[ key ];
		if ( value === undefined || value === null || value === '' ) {
			return false;
		}
		return ! Number.isFinite( Number( value ) );
	} );

	return { complete: invalid.length === 0, invalid };
}
