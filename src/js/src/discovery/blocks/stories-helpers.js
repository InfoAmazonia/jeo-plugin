import { normalizeLocaleCode } from '../../shared/locale';

export function mergeUniqueStoriesById( currentStories = [], nextStories = [] ) {
	const storiesById = new Map();

	[ ...currentStories, ...nextStories ].forEach( ( story ) => {
		const storyId = Number.parseInt( story?.id, 10 );

		if ( Number.isFinite( storyId ) ) {
			storiesById.set( storyId, story );
		}
	} );

	return Array.from( storiesById.values() );
}

export function resolveStoriesPage( params = {}, pageInfo = {} ) {
	if ( Object.hasOwn( params, 'page' ) ) {
		const explicitPage = Number.parseInt( params.page, 10 );
		return Number.isFinite( explicitPage ) && explicitPage > 0
			? explicitPage
			: 1;
	}

	const currentPage = Number.parseInt( pageInfo.currentPage, 10 );
	return Number.isFinite( currentPage ) && currentPage > 0
		? currentPage + 1
		: 1;
}

export function normalizeStoriesTagIds( value ) {
	const values = Array.isArray( value )
		? value
		: String( value ?? '' ).split( ',' );

	return Array.from(
		new Set(
			values
				.map( ( tagId ) => Number.parseInt( tagId, 10 ) )
				.filter( ( tagId ) => Number.isFinite( tagId ) && tagId > 0 )
		)
	);
}

export function resolveStoryDateLocale( {
	siteLocale = typeof window !== 'undefined'
		? window.languageParams?.currentLang
		: '',
	documentLocale = typeof document !== 'undefined'
		? document.documentElement?.lang
		: '',
	browserLocale = typeof navigator !== 'undefined' ? navigator.language : '',
} = {} ) {
	return normalizeLocaleCode(
		siteLocale || documentLocale || browserLocale || 'en-US'
	);
}
