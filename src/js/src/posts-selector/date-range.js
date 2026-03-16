export function toPickerDate( storedValue ) {
	if ( ! storedValue ) {
		return null;
	}

	const date = new Date( storedValue );

	return Number.isNaN( date.getTime() ) ? null : date;
}

export function toStoredDateValue( date ) {
	if ( ! date || Number.isNaN( date.getTime?.() ) ) {
		return undefined;
	}

	return date.toISOString();
}

export function updateRelatedPostsDate( relatedPosts, key, date ) {
	return {
		...relatedPosts,
		[ key ]: toStoredDateValue( date ),
	};
}
