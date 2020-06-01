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
	const [ relatedPostsData, setRelatedPostsData ] = useState( relatedPosts );

	useEffect( () => {
		const { categories, tags, meta_query, before, after } = relatedPosts;

		if ( relatedPostsData.before == '0001-01-01T03:06:28.000Z' ) {
			delete relatedPostsData.before;
		}

		if ( ! postMeta.show_all_posts && ( ! categories || categories.length == 0 ) && ( ! tags || tags.length == 0 ) && ( ! meta_query || meta_query.length == 0 ) && ( ! after ) ) {
			if ( ! before ) {
				setRelatedPosts( { before: '0001-01-01T03:06:28.000Z' } );
			}
		} else if ( ! postMeta.show_all_posts ) {
			const filters = relatedPosts;
			if ( before == '0001-01-01T03:06:28.000Z' ) {
				delete filters.before;
			}
			if ( relatedPosts != filters ) {
				setRelatedPosts( filters );
			}
		}
	}, [ relatedPosts ] );

	return (
		<Panel name="related-posts" title={ __( 'Related posts', 'jeo' ) }>
			<CheckboxControl
				className="related-posts-checkbox"
				label={ __( 'Relate all posts' ) }
				checked={ postMeta.show_all_posts }
				onChange={ () => {
					setPostMeta( {
						...postMeta,
						show_all_posts: ! postMeta.show_all_posts,
					} );

					if ( ! postMeta.show_all_posts ) {
						setRelatedPosts( {} );
					} else {
						setRelatedPosts( relatedPostsData );
					}
				} }
			/>

			{ ! postMeta.show_all_posts && (
				<>
					{ loadedCategories && (
						<TokensSelector
							label={ __( 'Categories' ) }
							collection={ loadedCategories }
							loadingCollection={ loadingCategories }
							value={ relatedPostsData.categories }
							onChange={ ( tokens ) => {
								if ( ! postMeta.show_all_posts ) {
									setRelatedPosts( { ...relatedPosts, categories: tokens } );
								}
								setRelatedPostsData( { ...relatedPostsData, categories: tokens } );
							} }
						/>
					) }

					{ loadedTags && (
						<TokensSelector
							label={ __( 'Tags' ) }
							collection={ loadedTags }
							loadingCollection={ loadingTags }
							value={ relatedPostsData.tags }
							onChange={ ( tokens ) => {
								if ( ! postMeta.show_all_posts ) {
									setRelatedPosts( { ...relatedPosts, tags: tokens } );
								}
								setRelatedPostsData( { ...relatedPostsData, tags: tokens } );
							} }
						/>
					) }

					<IntervalSelector
						startDate={ relatedPostsData.after }
						endDate={ relatedPostsData.before }
						startLabel={ __( 'Start date', 'jeo' ) }
						endLabel={ __( 'End date', 'jeo' ) }
						onStartChange={ ( date ) => {
							if ( ! postMeta.show_all_posts ) {
								setRelatedPosts( { ...relatedPosts, after: date ? date.toISOString() : undefined } );
							}
							setRelatedPostsData( { ...relatedPostsData, after: date ? date.toISOString() : undefined } );
						} }
						onEndChange={ ( date ) => {
							if ( ! postMeta.show_all_posts ) {
								setRelatedPosts( { ...relatedPosts, before: date ? date.toISOString() : undefined } );
							}
							setRelatedPostsData( { ...relatedPostsData, before: date ? date.toISOString() : undefined } );
						} }
					/>

					<MetaSelector
						label={ __( 'Meta queries', 'jeo' ) }
						value={ relatedPostsData.meta_query }
						onChange={ ( queries ) => {
							if ( ! postMeta.show_all_posts ) {
								setRelatedPosts( { ...relatedPosts, meta_query: queries } );
							}
							setRelatedPostsData( { ...relatedPostsData, meta_query: queries } );
						} }
					/>
				</>
			) }
		</Panel>
	);
};

export default withDispatch(
	( dispatch ) => ( {
		setPostMeta: ( meta ) => {
			dispatch( 'core/editor' ).editPost( { meta } );
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
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
	} )
)( PostsSelector ) );
