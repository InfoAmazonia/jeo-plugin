/**
 * Content detection helpers (K-6).
 *
 * The "Inserted" state of a suggested paragraph is derived from the article
 * itself — never from a blind flag — so that:
 *  - the state survives page reloads (the paragraph is still in the article);
 *  - a paragraph the user deliberately removed goes back to "Insert into article".
 *
 * Matching is done on normalized plain text (tags stripped, whitespace
 * collapsed) so that formatting differences between the sanitized suggestion
 * and the serialized block content do not matter.
 */

/**
 * Strip HTML tags and decode entities, returning plain text. Line-breaking
 * markup (`<br>`, closing block tags) becomes a real newline first — the
 * repaired suggestion inserted into the article serializes `\n\n` as
 * `<br><br>`, and `textContent` alone would glue those words together.
 *
 * @param {string} html HTML string.
 * @return {string} Plain text.
 */
export function htmlToPlainText( html ) {
	if ( typeof html !== 'string' || html === '' ) {
		return '';
	}
	const withBreaks = html
		.replace( /<br\s*\/?>/gi, '\n' )
		.replace( /<\/(p|div|li|h[1-6]|blockquote|ul|ol)>/gi, '\n' );
	const div = document.createElement( 'div' );
	div.innerHTML = withBreaks;
	return div.textContent || div.innerText || '';
}

/**
 * Normalize text for containment matching: collapse all whitespace runs to a
 * single space, trim and casefold.
 *
 * @param {string} text Plain text.
 * @return {string} Normalized text.
 */
export function normalizeForMatch( text ) {
	return ( text || '' ).replace( /\s+/g, ' ' ).trim().toLowerCase();
}

/**
 * Anchor length (characters) for the tolerant match. Anchors are compared
 * against the casefolded, whitespace-normalized text.
 */
const ANCHOR_LENGTH = 24;

/**
 * Check whether a suggested paragraph is already present in the post content.
 *
 * Two-tier strategy, deliberately conservative:
 *
 *  1. Exact containment of the full normalized text — the common case.
 *  2. Tolerant anchor match (BUG-B1): when the user edited the inserted
 *     paragraph, an exact match fails and the button would revert to
 *     "Insert into article", re-opening the duplicate-insertion risk K-6
 *     eliminates. To mitigate, a long paragraph (≥ 2× ANCHOR_LENGTH) is also
 *     considered inserted when BOTH its normalized prefix AND suffix anchors
 *     are present in the article. Requiring both anchors keeps false
 *     positives out (two distinct paragraphs sharing the same 24-char start
 *     AND end is implausible in a real article), while edits to the middle
 *     of the text — the common case — no longer break detection. Edits to
 *     the very beginning or end still revert the button (conservative by
 *     design: a false "Inserted" is worse than a false "Insert").
 *
 * The needle must be the SAME text that reaches the article — callers pass
 * the repaired suggestion (text-repair), not the raw stored one (BUG-B2).
 *
 * @param {string} suggestionHtml Suggested paragraph HTML (repaired).
 * @param {string} postContent    Post content (HTML or plain text).
 * @return {boolean} Whether the paragraph text exists in the article.
 */
export function isTextInContent( suggestionHtml, postContent ) {
	const needle = normalizeForMatch( htmlToPlainText( suggestionHtml ) );
	if ( needle === '' ) {
		return false;
	}
	const haystack = normalizeForMatch( htmlToPlainText( postContent || '' ) );
	if ( haystack === '' ) {
		return false;
	}

	if ( haystack.includes( needle ) ) {
		return true;
	}

	// Tolerant anchor match for paragraphs long enough to have distinct
	// anchors (shorter texts fall back to exact-only, avoiding weak matches).
	if ( needle.length >= ANCHOR_LENGTH * 2 ) {
		const prefix = needle.slice( 0, ANCHOR_LENGTH );
		const suffix = needle.slice( -ANCHOR_LENGTH );
		return haystack.includes( prefix ) && haystack.includes( suffix );
	}

	return false;
}
