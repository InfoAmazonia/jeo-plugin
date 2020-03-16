import classNames from 'classnames';

export default ( { attributes, className } ) => {
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
			className={ classNames( [ 'jeomap', className ] ) }
			data-center_lat={ attributes.center_lat }
			data-center_lon={ attributes.center_lon }
			data-initial_zoom={ attributes.initial_zoom }
			data-min_zoom={ attributes.min_zoom }
			data-max_zoom={ attributes.max_zoom }
			data-layers={ JSON.stringify( attributes.layers ) }
			data-related_posts={
				hasRelatedPosts ? JSON.stringify( attributes.related_posts ) : undefined
			}

			onMoveEnd={ ( map ) => {
				if ( ! editingMap.current ) {
					const center = map.getCenter();
					const zoom = Math.round( map.getZoom() * 10 ) / 10;

					setPostMeta( {
						center_lat: center.lat,
						center_lon: center.lng,
						initial_zoom: zoom,
					} );
				}
			} }
			style={ {
				height: attributes.height,
				width: attributes.width,
			} }
		/>
	);
};
