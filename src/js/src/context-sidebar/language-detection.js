import { htmlToPlainText, normalizeForMatch } from './content-detection';

/**
 * Lightweight language detection for the Insert warning (3.4).
 *
 * Method: stopword-frequency scoring over three languages (Portuguese,
 * English, Spanish) plus a diacritics bonus for Portuguese (ã/õ/ç and accented
 * vowels are strong PT signals in this plugin's editorial corpus). A language
 * wins only with a minimum score and a margin over the runner-up; otherwise
 * the result is 'unknown' and no warning is shown — the warning must never
 * block or nag without confidence.
 *
 * Documented limitation: this is a heuristic, not a classifier. Short texts
 * (< MIN_WORDS words) return 'unknown'.
 */

const STOPWORDS = {
	pt: [
		'de',
		'da',
		'do',
		'das',
		'dos',
		'que',
		'não',
		'uma',
		'um',
		'com',
		'para',
		'está',
		'estão',
		'por',
		'mais',
		'como',
		'os',
		'as',
		'ao',
		'à',
		'em',
		'seu',
		'sua',
		'seus',
		'suas',
		'também',
		'sobre',
		'entre',
		'foi',
		'ser',
		'são',
		'pelo',
		'pela',
		'neste',
		'nesta',
		'esse',
		'essa',
		'isso',
		'quando',
		'onde',
		'muito',
		'já',
		'ainda',
	],
	en: [
		'the',
		'and',
		'of',
		'to',
		'in',
		'is',
		'are',
		'was',
		'were',
		'with',
		'for',
		'on',
		'that',
		'this',
		'it',
		'as',
		'at',
		'by',
		'an',
		'be',
		'from',
		'or',
		'not',
		'have',
		'has',
		'their',
		'they',
		'which',
		'will',
		'would',
		'about',
		'into',
		'than',
		'them',
		'then',
		'these',
		'those',
	],
	es: [
		'el',
		'la',
		'los',
		'las',
		'un',
		'una',
		'y',
		'en',
		'es',
		'por',
		'con',
		'para',
		'del',
		'se',
		'su',
		'al',
		'lo',
		'como',
		'más',
		'pero',
		'sus',
		'le',
		'ya',
		'o',
		'este',
		'esta',
		'esto',
		'son',
		'entre',
		'cuando',
		'muy',
		'sin',
		'sobre',
		'también',
		'hasta',
		'desde',
	],
};

const MIN_WORDS = 6;
const MIN_SCORE = 3;
const MIN_MARGIN = 2;

/**
 * Detect the language of a text sample.
 *
 * @param {string} text Plain text sample.
 * @return {string} 'pt' | 'en' | 'es' | 'unknown'.
 */
export function detectLanguage( text ) {
	const plain = normalizeForMatch( text ).toLowerCase();
	if ( plain === '' ) {
		return 'unknown';
	}

	const words = plain.split( ' ' );
	if ( words.length < MIN_WORDS ) {
		return 'unknown';
	}

	const scores = { pt: 0, en: 0, es: 0 };
	const stopwordSets = {
		pt: new Set( STOPWORDS.pt ),
		en: new Set( STOPWORDS.en ),
		es: new Set( STOPWORDS.es ),
	};

	for ( const word of words ) {
		// Strip surrounding punctuation for the stopword lookup.
		const token = word.replace( /^[^a-zà-öø-þ]+|[^a-zà-öø-þ]+$/g, '' );
		if ( token === '' ) {
			continue;
		}
		for ( const lang of Object.keys( stopwordSets ) ) {
			if ( stopwordSets[ lang ].has( token ) ) {
				scores[ lang ] += 1;
			}
		}
	}

	// Portuguese diacritics are a strong disambiguator against English.
	const ptDiacritics = ( plain.match( /[ãõçáéíóúâêôà]/g ) || [] ).length;
	scores.pt += Math.min( ptDiacritics, 4 );

	const ranked = Object.entries( scores ).sort( ( a, b ) => b[ 1 ] - a[ 1 ] );
	const [ bestLang, bestScore ] = ranked[ 0 ];
	const [ , secondScore ] = ranked[ 1 ];

	if ( bestScore < MIN_SCORE || bestScore - secondScore < MIN_MARGIN ) {
		return 'unknown';
	}
	return bestLang;
}

/**
 * Normalize a configured/locale language value to a detection code.
 *
 * Accepts values like 'en', 'pt', 'es', 'pt-BR', 'pt_BR', 'en_US' and the
 * special 'site' (falls back to the provided site locale).
 *
 * @param {string} value      Configured value.
 * @param {string} siteLocale Site locale fallback (e.g. 'pt_BR').
 * @return {string|null} 'pt' | 'en' | 'es' | null when not resolvable.
 */
export function normalizeLanguageCode( value, siteLocale = '' ) {
	let raw = ( value || '' ).toString().trim().toLowerCase();
	if ( raw === '' || raw === 'site' ) {
		raw = ( siteLocale || '' ).toString().trim().toLowerCase();
	}
	if ( raw === '' ) {
		return null;
	}
	const short = raw.replace( '_', '-' ).split( '-' )[ 0 ];
	return [ 'pt', 'en', 'es' ].includes( short ) ? short : null;
}

/**
 * Read the configured AI output language localized by the backend
 * (Contract H). Reads defensively across the known localize objects because
 * the backend track lands in parallel — the first defined key wins.
 *
 * @return {string} Raw configured value ('' when absent).
 */
export function getConfiguredOutputLanguage() {
	const sources = [
		globalThis.jeo,
		globalThis.jeoMapVars,
		globalThis.jeoContext,
	];
	for ( const source of sources ) {
		if ( ! source ) {
			continue;
		}
		const value =
			source.ai_output_language ??
			source.ai_language ??
			source.output_language ??
			null;
		if ( value !== null && value !== undefined && value !== '' ) {
			return value;
		}
	}
	return '';
}

/**
 * Read the site/editor locale exposed by the plugin localizes.
 *
 * @return {string} Locale string ('' when absent).
 */
export function getSiteLocale() {
	return (
		globalThis.jeoMapVars?.currentLang ??
		globalThis.jeo?.currentLang ??
		globalThis.jeoContext?.currentLang ??
		''
	);
}

/**
 * Resolve the article language: direct detection on the post content first,
 * then the configured output language / site locale as the tie-breaker
 * (Contract H: configuration takes precedence over guessing).
 *
 * @param {string} postContent Post content (HTML or plain text).
 * @return {string} 'pt' | 'en' | 'es' | 'unknown'.
 */
export function resolveArticleLanguage( postContent ) {
	const detected = detectLanguage( htmlToPlainText( postContent || '' ) );
	if ( detected !== 'unknown' ) {
		return detected;
	}
	const configured = normalizeLanguageCode(
		getConfiguredOutputLanguage(),
		getSiteLocale()
	);
	return configured || 'unknown';
}

/**
 * Determine whether inserting a paragraph would mix languages with the
 * article. Returns null (no warning) when either side is unknown — the
 * warning is informational and never blocking.
 *
 * @param {string} paragraphHtml Suggested paragraph HTML.
 * @param {string} postContent   Post content (HTML or plain text).
 * @return {{paragraphLang: string, articleLang: string}|null} Mismatch pair, or null when no warning applies.
 */
export function getLanguageMismatch( paragraphHtml, postContent ) {
	const paragraphLang = detectLanguage(
		htmlToPlainText( paragraphHtml || '' )
	);
	if ( paragraphLang === 'unknown' ) {
		return null;
	}
	const articleLang = resolveArticleLanguage( postContent );
	if ( articleLang === 'unknown' || articleLang === paragraphLang ) {
		return null;
	}
	return { paragraphLang, articleLang };
}
