/**
 * Display-boundary repair for corrupted escape sequences in AI-generated text.
 *
 * Some stored conversation/paragraph payloads contain broken `\n` escapes —
 * either the literal two-character sequence `\n` (backslash + n) or the
 * stripped-backslash artifact captured in the usability audit ("support.nnAll",
 * where `\n\n` lost its backslashes and only the `n`s survived between a
 * sentence-ending punctuation mark and an uppercase letter).
 *
 * This repair runs ONLY at the display/insert/copy boundary. The stored
 * content is never modified (regression guard: sanitization on the frontier,
 * never on storage).
 *
 * @param {string} input Raw text (possibly corrupted).
 * @return {string} Repaired text for display/insertion.
 */
export function repairCorruptedText( input ) {
	if ( typeof input !== 'string' || input === '' ) {
		return input;
	}

	let text = input;

	// 1. Literal escape sequences that survived JSON processing: "\r\n", "\n", "\r".
	text = text.replace( /\\r\\n|\\n|\\r/g, '\n' );

	// 2. Stripped-backslash artifact: sentence-ending punctuation, 1–3 bare
	// "n"s, then an uppercase letter — e.g. "support.nnAll" → "support.\n\nAll".
	// The punctuation anchor keeps legitimate words ("running", "Pennsylvania")
	// untouched: their n's are never preceded by sentence punctuation.
	text = text.replace(
		/([.!?…:;)\]"'”’])n{1,3}(?=\s?[A-ZÀ-ÖØ-Þ])/g,
		'$1\n\n'
	);

	return text;
}
