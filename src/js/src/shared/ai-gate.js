import { __, sprintf } from '@wordpress/i18n';

/**
 * Unified AI gate (W4 — spec §1): the SINGLE source of flags, settings URL,
 * copy and navigation behavior for every "AI provider not configured"
 * surface. Shells per context (block Placeholder, panel card, wp-admin PHP
 * gate) consume this module and stay idiomatic — they are never unified.
 *
 * Acceptance (spec §1.5): the gate strings live here exactly once; no other
 * module defines `toBool`/`readLocalized` or the gate copy.
 */

/**
 * Loose boolean coercion for wp_localize_script values, which may arrive as
 * booleans, numbers or strings depending on the PHP source.
 *
 * @param {*} value Localized value.
 * @return {boolean} Whether the value is truthy in the loose localized sense.
 */
export function toBool( value ) {
	return value === true || value === 1 || value === '1';
}

/**
 * Read a flag across the known localize objects, first defined value wins.
 *
 * @param {string} key      Flag key.
 * @param {*}      fallback Default when absent everywhere.
 * @return {*} The localized value or the fallback.
 */
export function readLocalized( key, fallback ) {
	const sources = [
		globalThis.jeo,
		globalThis.jeoMapVars,
		globalThis.jeoContext,
	];
	for ( const source of sources ) {
		if ( source && source[ key ] !== undefined && source[ key ] !== null ) {
			return source[ key ];
		}
	}
	return fallback;
}

/**
 * Read the AI gate flags (Contract D). Defensive default: `false` for both —
 * when the flags are absent (older backend), surfaces fall back to the
 * "ask the administrator" text instead of offering a button the user may
 * not be allowed to use.
 *
 * @return {{aiConfigured: boolean, canConfigureAi: boolean}} Gate flags.
 */
export function getAiGateFlags() {
	return {
		aiConfigured: toBool( readLocalized( 'ai_configured', false ) ),
		canConfigureAi: toBool( readLocalized( 'can_configure_ai', false ) ),
	};
}

/**
 * AI settings URL (Provider tab): prefers an explicitly localized URL, then
 * derives it from `ajax_url`, then from the current origin.
 *
 * @return {string} AI settings URL.
 */
export function getAiSettingsUrl() {
	const explicit = readLocalized( 'ai_settings_url', '' );
	if ( explicit ) {
		return explicit;
	}
	const ajaxUrl = readLocalized( 'ajax_url', '' );
	if ( ajaxUrl && ajaxUrl.includes( 'admin-ajax.php' ) ) {
		return (
			ajaxUrl.replace( /admin-ajax\.php.*$/, 'admin.php' ) +
			'?page=jeo-ai-settings&tab=provider'
		);
	}
	const origin = globalThis.location?.origin || '';
	return `${ origin }/wp-admin/admin.php?page=jeo-ai-settings&tab=provider`;
}

/**
 * The gate copy — ONE msgid per variant, with the feature name as the only
 * per-surface data (always translated by the caller).
 *
 * @param {string} feature Feature name (e.g. "the AI-Assisted Map block").
 * @return {{title: string, messageAdmin: string, messageNonAdmin: string, ctaLabel: string}}
 */
export function getGateCopy( feature ) {
	return {
		title: __( 'AI Provider Required', 'jeowp' ),
		messageAdmin: sprintf(
			/* translators: %s: feature name (e.g. "the AI-Assisted Map block"). */
			__(
				'You need to configure an AI Provider before you can use %s.',
				'jeowp'
			),
			feature
		),
		messageNonAdmin: sprintf(
			/* translators: %s: feature name (e.g. "the AI-Assisted Map block"). */
			__(
				'%s needs an AI Provider configured by a site administrator. Ask the site administrator to set up an API key in the AI Settings.',
				'jeowp'
			),
			feature
		),
		ctaLabel: __( 'Configure AI Provider', 'jeowp' ),
	};
}

/**
 * Navigate to the AI settings, optionally saving the draft first so no
 * unsaved editor content is lost. On any save failure (or when
 * `saveFirst` is false) the settings open in a new tab instead, leaving
 * the editor untouched. The gate never blocks saving the post.
 *
 * @param {Object}   args
 * @param {boolean}  args.saveFirst Save the draft before navigating.
 * @param {Object}   args.deps      Injectable dependencies (testing).
 * @return {Promise<{navigated: boolean, viaNewTab: boolean}>} Result.
 */
export async function goToAiSettings( { saveFirst = false, deps = {} } = {} ) {
	const url = getAiSettingsUrl();
	const openNewTab =
		deps.openNewTab ||
		( ( target ) => window.open( target, '_blank', 'noopener' ) );
	const navigate =
		deps.navigate || ( ( target ) => window.location.assign( target ) );

	if ( saveFirst ) {
		const save =
			deps.save ||
			( () => wp.data.dispatch( 'core/editor' ).savePost() );
		const hasSaveFailed =
			deps.hasSaveFailed ||
			( () =>
				wp.data.select( 'core/editor' ).didPostSaveRequestFail?.() ??
				false );
		try {
			await save();
			if ( ! hasSaveFailed() ) {
				navigate( url );
				return { navigated: true, viaNewTab: false };
			}
		} catch ( error ) {
			// Fall through to the new-tab path.
		}
	}

	openNewTab( url );
	return { navigated: true, viaNewTab: true };
}
