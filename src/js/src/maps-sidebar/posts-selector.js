import { withDispatch, withSelect } from '@wordpress/data';

import PostsSelector from '../posts-selector';

export default withDispatch(
	( dispatch ) => ( {
		setRelatedPosts: ( value ) => {
			dispatch( 'core/editor' ).editPost( { meta: { related_posts: value } } );
		},
	} )
)( withSelect(
	( select ) => ( {
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).related_posts,
	} )
)( PostsSelector ) );
