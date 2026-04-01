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
