import { dateI18n, getSettings } from '@wordpress/date';

/**
 * Single datetime format for JS-rendered timestamps (W4 — spec §6.1):
 * the site's own Settings → General datetime format, localized. Falls back
 * to the raw stored value when it cannot be parsed (never renders
 * "Invalid date" garbage).
 *
 * @param {string|number|Date} timestamp Stored timestamp (mysql string, ISO
 *                                       or epoch — anything dateI18n parses).
 * @return {string} Localized datetime or the raw value.
 */
export function formatSiteDateTime( timestamp ) {
	const raw = String( timestamp || '' ).trim();
	if ( ! raw ) {
		return '';
	}
	try {
		const formats = getSettings()?.formats || {};
		const formatted = dateI18n(
			formats.datetime || 'F j, Y g:i a',
			raw
		);
		if ( formatted && ! /Invalid|NaN/.test( formatted ) ) {
			return formatted;
		}
	} catch ( error ) {
		// Fall through to the raw value.
	}
	return raw;
}
