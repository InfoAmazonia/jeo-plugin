import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '../shared/wp-form-controls';

import { updateRelatedPostsDate } from './date-range';
import { IntervalSelector } from './interval-selector';
import { MetaSelector } from './meta-selector';
import { AsyncTokensSelector } from './async-tokens-selector';

import './index.css';

const PostsSelector = ( {
	relatedPosts,
	setRelatedPosts,
	renderPanel: Panel,
} ) => {
	const postMeta = useSelect(
		( select ) => select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		[]
	);
	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = ( meta ) => editPost( { meta } );

	return (
		<Panel name="related-posts" title={ __( 'Related posts', 'jeo' ) }>
			<CheckboxControl
				className="related-posts-checkbox"
				label={ __( 'Use related posts', 'jeo' ) }
				checked={ postMeta.relate_posts }
				onChange={ () => {
					setPostMeta( {
						...postMeta,
						relate_posts: ! postMeta.relate_posts,
					} );
				} }
			/>

			{ postMeta.relate_posts && (
				<>
					<AsyncTokensSelector
						path="/wp/v2/categories"
						label={ __( 'Categories', 'jeo' ) }
						value={ relatedPosts.categories }
						onChange={ ( tokens ) => {
							setRelatedPosts( { ...relatedPosts, categories: tokens } );
						} }
					/>

					<AsyncTokensSelector
						path="/wp/v2/tags"
						label={ __( 'Tags', 'jeo' ) }
						value={ relatedPosts.tags }
						onChange={ ( tokens ) => {
							setRelatedPosts( { ...relatedPosts, tags: tokens } );
						} }
					/>

					<IntervalSelector
						startDate={ relatedPosts.after }
						endDate={ relatedPosts.before }
						startLabel={ __( 'Start date', 'jeo' ) }
						endLabel={ __( 'End date', 'jeo' ) }
						onStartChange={ ( date ) => {
							setRelatedPosts(
								updateRelatedPostsDate( relatedPosts, 'after', date )
							);
						} }
						onEndChange={ ( date ) => {
							setRelatedPosts(
								updateRelatedPostsDate( relatedPosts, 'before', date )
							);
						} }
					/>

					<MetaSelector
						label={ __( 'Meta queries', 'jeo' ) }
						value={ relatedPosts.meta_query }
						onChange={ ( queries ) => {
							setRelatedPosts( { ...relatedPosts, meta_query: queries } );
						} }
					/>
				</>
			) }
		</Panel>
	);
};

export default PostsSelector;
