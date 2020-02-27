import { FormTokenField } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { Fragment, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

	const categorySuggestions = useMemo( () => {
		if ( loadingCategories ) {
			return [];
		}
		return loadedCategories.map( ( cat ) => cat.name );
	}, [ loadedCategories, loadingCategories ] );

	const tagSuggestions = useMemo( () => {
		if ( loadingTags ) {
			return [];
		}
		return loadedTags.map( ( tag ) => tag.name );
	}, [ loadedTags, loadingTags ] );

	const displayTransform = ( set ) => ( item ) => {
		const found = set.find( ( x ) => x.id === item );
		return found ? found.name : item;
	};

	const saveTransform = ( set ) => ( item ) => {
		const found = set.find( ( x ) => x.name === item.trim() );
		return found ? found.id : item;
	};

	return (
		<Fragment>
			{ loadedCategories && (
				<FormTokenField
					label={ __( 'Categories' ) }
					value={ relatedPosts.categories }
					suggestions={ categorySuggestions }
					displayTransform={ displayTransform( loadedCategories ) }
					saveTransform={ saveTransform( loadedCategories ) }
					onChange={ ( tokens ) => {
						setRelatedPosts( { ...relatedPosts, categories: tokens } );
					} }
				/>
			) }
			{ loadedTags && (
				<FormTokenField
					label={ __( 'Tags' ) }
					value={ relatedPosts.tags }
					suggestions={ tagSuggestions }
					displayTransform={ displayTransform( loadedTags ) }
					saveTransform={ saveTransform( loadedTags ) }
					onChange={ ( tokens ) => {
						setRelatedPosts( { ...relatedPosts, tags: tokens } );
					} }
				/>
			) }
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
