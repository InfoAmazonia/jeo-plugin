import { es, pt, ptBR } from 'date-fns/locale';

export function getDocumentLocale() {
	if ( typeof document === 'undefined' ) {
		return 'en-US';
	}

	return document.documentElement?.lang || 'en-US';
}

export function normalizeLocaleCode( locale = getDocumentLocale() ) {
	return String( locale ).replace( /_/g, '-' ).trim();
}

export function getCKEditorLanguage( locale = getDocumentLocale() ) {
	const normalizedLocale = normalizeLocaleCode( locale ).toLowerCase();

	if ( normalizedLocale === 'pt-br' ) {
		return 'pt-br';
	}

	if ( normalizedLocale.startsWith( 'pt' ) ) {
		return 'pt';
	}

	if ( normalizedLocale === 'es-co' ) {
		return 'es-co';
	}

	if ( normalizedLocale.startsWith( 'es' ) ) {
		return 'es';
	}

	return 'en';
}

export function getDateFnsLocale( locale = getDocumentLocale() ) {
	const normalizedLocale = normalizeLocaleCode( locale ).toLowerCase();

	if ( normalizedLocale === 'pt-br' ) {
		return ptBR;
	}

	if ( normalizedLocale.startsWith( 'pt' ) ) {
		return pt;
	}

	if ( normalizedLocale.startsWith( 'es' ) ) {
		return es;
	}

	return undefined;
}

