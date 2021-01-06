import { withSelect, withDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

import { IntervalSelector } from './interval-selector';
import { MetaSelector } from './meta-selector';
import { TokensSelector } from './tokens-selector';

import './index.css';

const PostsSelector = ( {
	loadedCategories,
	loadingCategories,
	loadedTags,
	loadingTags,
	relatedPosts,
	setRelatedPosts,
	renderPanel: Panel,
	postMeta,
	setPostMeta,
} ) => {

	return (
		<Panel name="related-posts" title={ __( 'Related posts', 'jeo' ) }>
			<CheckboxControl
				className="related-posts-checkbox"
				label={ __( 'Use related posts' ) }
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
							setRelatedPosts( {
								...relatedPosts,
								after: date ? date.toISOString() : undefined,
							} );
						} }
						onEndChange={ ( date ) => {
							setRelatedPosts( {
								...relatedPosts,
								before: date ? date.toISOString() : undefined,
							} );
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

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		//console.log("setPostMeta", meta);
		dispatch( 'core/editor' ).editPost( { meta } );
	},
} ) )(
	withSelect( ( select ) => ( {
		loadedCategories: select( 'core' ).getEntityRecords(
			'taxonomy',
			'category'
		),
		loadingCategories: select( 'core/data' ).isResolving(
			'core',
			'getEntityRecords',
			[ 'taxonomy', 'category' ]
		),
		loadedTags: select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag' ),
		loadingTags: select( 'core/data' ).isResolving(
			'core',
			'getEntityRecords',
			[ 'taxonomy', 'post_tag' ]
		),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} ) )( PostsSelector )
);
