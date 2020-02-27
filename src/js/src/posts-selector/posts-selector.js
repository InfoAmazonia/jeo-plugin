import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { IntervalSelector } from './interval-selector';
import { TokensSelector } from './tokens-selector';

const PostsSelector = ( {
	loadedCategories,
	loadingCategories,
	loadedTags,
	loadingTags,
	relatedPosts,
	setRelatedPosts,
} ) => {
	useEffect( () => {
		/* relatedPosts is often nullish if schema doesn't match */
		if ( relatedPosts == null ) {
			setRelatedPosts( {} );
		}
	}, [ relatedPosts, setRelatedPosts ] );

	return (
		<Fragment>
			{ loadedCategories && (
				<TokensSelector
					label={ __( 'Categories' ) }
					collection={ loadedCategories }
					loadingCollection={ loadingCategories }
					value={ relatedPosts.categories }
					onChange={ ( tokens ) => {
						setRelatedPosts( { ...relatedPosts, categories: tokens } );
					} }
				/>
			) }

			{ loadedTags && (
				<TokensSelector
					label={ __( 'Tags' ) }
					collection={ loadedTags }
					loadingCollection={ loadingTags }
					value={ relatedPosts.tags }
					onChange={ ( tokens ) => {
						setRelatedPosts( { ...relatedPosts, tags: tokens } );
					} }
				/>
			) }

			<IntervalSelector
				startDate={ relatedPosts.after }
				endDate={ relatedPosts.before }
				startLabel={ __( 'Start date', 'jeo' ) }
				endLabel={ __( 'End date', 'jeo' ) }
				onStartChange={ ( date ) => {
					setRelatedPosts( { ...relatedPosts, after: date ? date.toISOString() : undefined } );
				} }
				onEndChange={ ( date ) => {
					setRelatedPosts( { ...relatedPosts, before: date ? date.toISOString() : undefined } );
				} }
			/>
		</Fragment>
	);
};

export default withDispatch(
	( dispatch ) => ( {
		setRelatedPosts: ( value ) => {
			dispatch( 'core/editor' ).editPost( { meta: { related_posts: value } } );
		},
	} )
)( withSelect(
	( select ) => ( {
		loadedCategories: select( 'core' ).getEntityRecords( 'taxonomy', 'category' ),
		loadingCategories: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'taxonomy',
			'category',
		] ),
		loadedTags: select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag' ),
		loadingTags: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'taxonomy',
			'post_tag',
		] ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).related_posts,
	} )
)( PostsSelector ) );
