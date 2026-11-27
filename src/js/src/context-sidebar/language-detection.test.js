import {
	detectLanguage,
	normalizeLanguageCode,
	getConfiguredOutputLanguage,
	resolveArticleLanguage,
	getLanguageMismatch,
} from './language-detection';

const PT_TEXT =
	'A Amazônia enfrenta novas pressões neste ano, e os municípios que mais sofrem são os que não têm recursos para fiscalização, segundo os dados do relatório publicado também em português.';

const EN_TEXT =
	'The Amazon faces new pressures this year, and the municipalities that suffer the most are those that do not have the resources for enforcement, according to the report that was published.';

const ES_TEXT =
	'La Amazonía enfrenta nuevas presiones este año, y los municipios que más sufren son los que no tienen recursos para la fiscalización, según el informe que fue publicado en el país.';

describe( 'detectLanguage', () => {
	it( 'detects Portuguese', () => {
		expect( detectLanguage( PT_TEXT ) ).toBe( 'pt' );
	} );

	it( 'detects English', () => {
		expect( detectLanguage( EN_TEXT ) ).toBe( 'en' );
	} );

	it( 'detects Spanish', () => {
		expect( detectLanguage( ES_TEXT ) ).toBe( 'es' );
	} );

	it( 'returns unknown for short texts', () => {
		expect( detectLanguage( 'The end.' ) ).toBe( 'unknown' );
		expect( detectLanguage( '' ) ).toBe( 'unknown' );
	} );
} );

describe( 'normalizeLanguageCode', () => {
	it( 'normalizes locale-shaped values', () => {
		expect( normalizeLanguageCode( 'pt-BR' ) ).toBe( 'pt' );
		expect( normalizeLanguageCode( 'pt_BR' ) ).toBe( 'pt' );
		expect( normalizeLanguageCode( 'en_US' ) ).toBe( 'en' );
		expect( normalizeLanguageCode( 'es' ) ).toBe( 'es' );
	} );

	it( 'resolves the special site value via the site locale', () => {
		expect( normalizeLanguageCode( 'site', 'pt_BR' ) ).toBe( 'pt' );
	} );

	it( 'returns null for unresolvable values', () => {
		expect( normalizeLanguageCode( '' ) ).toBe( null );
		expect( normalizeLanguageCode( 'fr' ) ).toBe( null );
	} );
} );

describe( 'getConfiguredOutputLanguage (Contract H, defensive read)', () => {
	afterEach( () => {
		delete globalThis.jeo;
		delete globalThis.jeoMapVars;
		delete globalThis.jeoContext;
	} );

	it( 'reads from jeo first', () => {
		globalThis.jeo = { ai_output_language: 'en' };
		globalThis.jeoMapVars = { ai_output_language: 'pt' };
		expect( getConfiguredOutputLanguage() ).toBe( 'en' );
	} );

	it( 'falls back to jeoMapVars and legacy key candidates', () => {
		globalThis.jeoMapVars = { ai_language: 'pt-BR' };
		expect( getConfiguredOutputLanguage() ).toBe( 'pt-BR' );
	} );

	it( 'returns empty string when nothing is localized', () => {
		expect( getConfiguredOutputLanguage() ).toBe( '' );
	} );
} );

describe( 'resolveArticleLanguage (Contract H precedence)', () => {
	afterEach( () => {
		delete globalThis.jeo;
	} );

	it( 'prefers direct detection on the article content', () => {
		globalThis.jeo = { ai_output_language: 'en' };
		expect( resolveArticleLanguage( `<p>${ PT_TEXT }</p>` ) ).toBe( 'pt' );
	} );

	it( 'falls back to the configured language when detection is inconclusive', () => {
		globalThis.jeo = { ai_output_language: 'en' };
		expect( resolveArticleLanguage( '<p>Olá.</p>' ) ).toBe( 'en' );
	} );

	it( 'returns unknown when nothing is available', () => {
		expect( resolveArticleLanguage( '<p>Olá.</p>' ) ).toBe( 'unknown' );
	} );
} );

describe( 'getLanguageMismatch (3.4 non-blocking insert warning)', () => {
	it( 'flags an English suggestion in a Portuguese article', () => {
		const mismatch = getLanguageMismatch(
			`<p>${ EN_TEXT }</p>`,
			`<p>${ PT_TEXT }</p>`
		);
		expect( mismatch ).toEqual( {
			paragraphLang: 'en',
			articleLang: 'pt',
		} );
	} );

	it( 'does not flag matching languages', () => {
		expect(
			getLanguageMismatch( `<p>${ PT_TEXT }</p>`, `<p>${ PT_TEXT }</p>` )
		).toBe( null );
	} );

	it( 'never warns when a side is unknown', () => {
		expect(
			getLanguageMismatch( '<p>Hi.</p>', `<p>${ PT_TEXT }</p>` )
		).toBe( null );
		expect( getLanguageMismatch( `<p>${ EN_TEXT }</p>`, '' ) ).toBe( null );
	} );
} );
