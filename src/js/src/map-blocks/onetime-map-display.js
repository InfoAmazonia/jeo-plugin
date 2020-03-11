export default ( { attributes } ) => {
	let hasRelatedPosts;

	if ( ! attributes.related_posts ) {
		hasRelatedPosts = false;
	} else {
		hasRelatedPosts = [
			'categories',
			'tags',
			'before',
			'after',
			'meta_query',
		].some( ( key ) => attributes.related_posts[ key ] );
	}

	return (
		<div
			className="jeomap"
			data-center_lat={ attributes.center_lat }
			data-center_lon={ attributes.center_lon }
			data-initial_zoom={ attributes.initial_zoom }
			data-min_zoom={ attributes.min_zoom }
			data-max_zoom={ attributes.max_zoom }
			data-layers={ JSON.stringify( attributes.layers ) }
			data-related_posts={
				hasRelatedPosts ? JSON.stringify( attributes.related_posts ) : undefined
			}
			style={ {
				height: attributes.height,
				width: attributes.width,
			} }
		/>
	);
};
