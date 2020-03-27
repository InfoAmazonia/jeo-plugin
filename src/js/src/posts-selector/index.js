import { withSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CheckboxControl, Button } from '@wordpress/components';

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
} ) => {
	const [ relatedPostsData, setRelatedPostsData ] = useState( [] );
	const [ showRelatedPosts, setShowRelatedPosts ] = useState( false );

	const [ showDateInterval, setShowDateInterval ] = useState( true );
	const [ intervalButtonMessage, setIntervalButtonMessage ] = useState( __( 'Remove Date Interval' ) );

	useEffect( () => {
		/* relatedPosts is often nullish if schema doesn't match */
		if ( ! relatedPosts ) {
			setRelatedPosts( {} );
		}
	}, [ relatedPosts, setRelatedPosts ] );

	useEffect( () => {
		const { categories, after, before, tags } = relatedPosts;
		const data = { categories, after, before, tags };
		for ( let item in data ) {
			if ( ! data[ `${ item }` ] || data[ `${ item }` ].length === 0 ) {
				delete data[ `${ item }` ];
			}
		}

		if ( ! showDateInterval ) {
			delete data[ 'after' ];
			delete data[ 'before' ];
		}

		if ( Object.keys( data ).length === 0 ) {
			setRelatedPostsData( [] );
		} else {
			jQuery.get(
				'/wp-json/wp/v2/posts',
				data,
				( response ) => setRelatedPostsData( response )
			);
		}
	}, [ showDateInterval, showRelatedPosts, relatedPosts ] );

	return (
		<Panel name="related-posts" title={ __( 'Related posts', 'jeo' ) }>
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

			{ showDateInterval && (
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
			) }
			<Button
				className="date-interval-button"
				isPrimary
				isLarge
				onClick={ () => {
					if ( showDateInterval ) {
						setIntervalButtonMessage( __( 'Add Date Interval' ) );
					} else {
						setIntervalButtonMessage( __( 'Remove Date Interval' ) );
					}
					setShowDateInterval( ! showDateInterval );
				} }
			>
				{ intervalButtonMessage }
			</Button>

			<MetaSelector
				label={ __( 'Meta queries', 'jeo' ) }
				value={ relatedPosts.meta_query }
				onChange={ ( queries ) => {
					setRelatedPosts( { ...relatedPosts, meta_query: queries } );
				} }
			/>
			<CheckboxControl
				className="related-posts-checkbox"
				label={ __( 'Show related posts' ) }
				checked={ showRelatedPosts }
				onChange={ () => {
					setShowRelatedPosts( ! showRelatedPosts );
				} }
			/>

			{ showRelatedPosts && (
				<ol>
					{ relatedPostsData.map( ( relatedPost ) => {
						return (
							<li className="jeo-setting-related-post" key={ relatedPost.id }>
								<h2>
									<a href={ relatedPost.link } rel="noopener noreferrer" target="_blank">{ relatedPost.title.rendered }</a>
								</h2>
							</li>
						);
					} ) }
				</ol>
			) }
		</Panel>
	);
};

export default withSelect(
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
	} )
)( PostsSelector );
