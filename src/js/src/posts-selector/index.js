import { select, useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '../shared/wp-form-controls';

import { updateRelatedPostsDate } from './date-range';
import { normalizeRelatedPosts } from './defaults';
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
		( select ) =>
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {},
		[]
	);
	const normalizedRelatedPosts = normalizeRelatedPosts( relatedPosts );
	const { editPost } = useDispatch( 'core/editor' );
	const setPostMeta = ( meta ) => {
		const currentMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};

		editPost( {
			meta: {
				...currentMeta,
				...meta,
			},
		} );
	};

	return (
		<Panel name="related-posts" title={ __( 'Related posts', 'jeowp' ) }>
			<CheckboxControl
				className="related-posts-checkbox"
				label={ __( 'Use related posts', 'jeowp' ) }
				checked={ postMeta.relate_posts }
				onChange={ () => {
					setPostMeta( {
						relate_posts: ! postMeta.relate_posts,
						related_posts: normalizedRelatedPosts,
					} );
				} }
			/>

			{ postMeta.relate_posts && (
				<>
					<AsyncTokensSelector
						path="/wp/v2/categories"
						label={ __( 'Categories', 'jeowp' ) }
						value={ normalizedRelatedPosts.categories }
						onChange={ ( tokens ) => {
							setRelatedPosts( {
								...normalizedRelatedPosts,
								categories: tokens,
							} );
						} }
					/>

					<AsyncTokensSelector
						path="/wp/v2/tags"
						label={ __( 'Tags', 'jeowp' ) }
						value={ normalizedRelatedPosts.tags }
						onChange={ ( tokens ) => {
							setRelatedPosts( {
								...normalizedRelatedPosts,
								tags: tokens,
							} );
						} }
					/>

					<IntervalSelector
						startDate={ normalizedRelatedPosts.after }
						endDate={ normalizedRelatedPosts.before }
						startLabel={ __( 'Start date', 'jeowp' ) }
						endLabel={ __( 'End date', 'jeowp' ) }
						onStartChange={ ( date ) => {
							setRelatedPosts(
								updateRelatedPostsDate(
									normalizedRelatedPosts,
									'after',
									date
								)
							);
						} }
						onEndChange={ ( date ) => {
							setRelatedPosts(
								updateRelatedPostsDate(
									normalizedRelatedPosts,
									'before',
									date
								)
							);
						} }
					/>

					<MetaSelector
						label={ __( 'Meta queries', 'jeowp' ) }
						value={ normalizedRelatedPosts.meta_query }
						onChange={ ( queries ) => {
							setRelatedPosts( {
								...normalizedRelatedPosts,
								meta_query: queries,
							} );
						} }
					/>
				</>
			) }
		</Panel>
	);
};

export default PostsSelector;
