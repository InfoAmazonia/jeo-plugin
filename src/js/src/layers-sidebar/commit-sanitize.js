import { isEqual } from 'lodash-es';

/**
 * Schema-default injection sanitizer (Gate r3b-final — R3B-G1 (a)).
 *
 * The SchemaForm (RJSF) writes schema defaults into the form data when a
 * layer is loaded (e.g. `scheme: 'xyz'` on a tilelayer created outside the
 * UI). Left alone, that injection is committed to the post meta seconds
 * after mount — dirtying the post without any user input and producing a
 * REAL content commit that races the preview error lifecycle.
 *
 * The sanitizer works on the COMMIT boundary only: keys that were absent
 * from the server meta at mount and carry exactly the schema default are
 * learned once (mount normalization) and stripped from the meta commit
 * while their value stays untouched. Render state keeps the defaults (the
 * UI needs them). Required keys are never stripped — the publish lock
 * (validateLayerFormData) and renderers depend on them (W1 1.3).
 */

/**
 * Learn which option keys the SchemaForm auto-injected at mount: absent
 * from the server meta, non-required, and carrying exactly the schema
 * default. Runs once, on the first commit after mount.
 *
 * @param {Object}      args
 * @param {Object}      args.formData         Current form data.
 * @param {Object}      args.initialFormData  Server meta captured at mount.
 * @param {Object}      args.schema           Layer type schema (`required`,
 *                                            `properties`).
 * @param {Set<string>} args.injectedKeys     Set to fill (mutated).
 */
export function learnInjectedDefaults( {
	formData,
	initialFormData,
	schema,
	injectedKeys,
} ) {
	const required = new Set( schema?.required || [] );
	const properties = schema?.properties || {};
	const options = formData?.layer_type_options || {};
	const initialOptions = initialFormData?.layer_type_options || {};

	Object.entries( properties ).forEach( ( [ key, property ] ) => {
		if ( required.has( key ) || property?.default === undefined ) {
			return;
		}
		if ( key in initialOptions ) {
			return;
		}
		if ( isEqual( options[ key ], property.default ) ) {
			injectedKeys.add( key );
		}
	} );
}

/**
 * Strip untouched injected defaults from a form-data object before it is
 * committed to the post meta. A key the user actually changed (value no
 * longer equals the schema default) stops being treated as injected and is
 * persisted normally.
 *
 * @param {Object}      args
 * @param {Object}      args.formData     Form data to commit.
 * @param {Object}      args.schema       Layer type schema.
 * @param {Set<string>} args.injectedKeys Learned injected keys (mutated on
 *                                        unlearn).
 * @return {Object} Form data safe to persist.
 */
export function stripInjectedDefaults( { formData, schema, injectedKeys } ) {
	const required = new Set( schema?.required || [] );
	const properties = schema?.properties || {};
	const options = formData?.layer_type_options || {};
	const committed = {};

	Object.entries( options ).forEach( ( [ key, value ] ) => {
		if ( injectedKeys.has( key ) && ! required.has( key ) ) {
			const schemaDefault = properties[ key ]?.default;
			if (
				schemaDefault !== undefined &&
				isEqual( value, schemaDefault )
			) {
				// Still an untouched injected default — never persist.
				return;
			}
			// The user changed it: persist and stop treating as injected.
			injectedKeys.delete( key );
		}
		committed[ key ] = value;
	} );

	return { ...formData, layer_type_options: committed };
}
