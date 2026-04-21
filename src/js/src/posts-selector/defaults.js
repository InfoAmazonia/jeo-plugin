export function createDefaultRelatedPosts() {
	return {
		categories: [],
		tags: [],
		meta_query: [],
	};
}

export function normalizeRelatedPosts( relatedPosts ) {
	if (
		! relatedPosts ||
		typeof relatedPosts !== 'object' ||
		Array.isArray( relatedPosts )
	) {
		return createDefaultRelatedPosts();
	}

	return {
		...createDefaultRelatedPosts(),
		...relatedPosts,
		categories: Array.isArray( relatedPosts.categories )
			? relatedPosts.categories
			: [],
		tags: Array.isArray( relatedPosts.tags ) ? relatedPosts.tags : [],
		meta_query: Array.isArray( relatedPosts.meta_query )
			? relatedPosts.meta_query
			: [],
	};
}
