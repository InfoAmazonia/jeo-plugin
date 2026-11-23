/**
 * Geographic value display formatting (W4 — spec §6.2).
 *
 * Display-only: at most 6 decimal places, trailing zeros stripped, never
 * scientific notation. The stored value is never touched (internal
 * precision intact) — this is presentation-only humanization, and it
 * applies equally to freshly typed and previously saved values.
 */

import { useState } from '@wordpress/element';

import { TextControl } from './wp-form-controls';

/**
 * Format a coordinate/zoom for display.
 *
 * @param {*}      value Raw value (number, numeric string, '').
 * @return {*} Formatted number, or the input unchanged when not finite
 *             (e.g. '' while the user clears a field).
 */
export function formatGeoNumber( value ) {
	if ( value === '' || value === undefined || value === null ) {
		return value;
	}
	const num = Number( value );
	if ( ! Number.isFinite( num ) ) {
		return value;
	}
	// toFixed kills scientific notation; parseFloat strips trailing zeros.
	return parseFloat( num.toFixed( 6 ) );
}

/**
 * Number input that displays the humanized value but never reformats while
 * the user is typing (focus keeps the raw text; blur returns to the
 * formatted display). Commits the raw typed value on every change.
 *
 * @param {Object}   props          TextControl props.
 * @param {*}        props.value    Stored numeric value.
 * @param {Function} props.onChange Called with the raw input string.
 */
export function GeoNumberControl( { value, onChange, ...props } ) {
	const [ editing, setEditing ] = useState( null );

	return (
		<TextControl
			type="number"
			{ ...props }
			value={
				editing !== null
					? editing
					: formatGeoNumber( value ) ?? ''
			}
			onFocus={ () =>
				setEditing(
					value === '' || value === undefined || value === null
						? ''
						: String( value )
				)
			}
			onChange={ ( next ) => {
				setEditing( next );
				onChange( next );
			} }
			onBlur={ () => setEditing( null ) }
		/>
	);
}
