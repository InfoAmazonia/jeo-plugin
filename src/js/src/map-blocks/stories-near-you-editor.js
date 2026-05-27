import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
	RangeControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { TextControl } from '../shared/wp-form-controls';
import ServerSideRender from '@wordpress/server-side-render';

const DEFAULT_LAT = globalThis.jeo_settings?.map_defaults?.lat
	? Number.parseFloat( globalThis.jeo_settings.map_defaults.lat )
	: -23.549985;
const DEFAULT_LNG = globalThis.jeo_settings?.map_defaults?.lon
	? Number.parseFloat( globalThis.jeo_settings.map_defaults.lon )
	: -46.633519;

export default function StoriesNearYouEditor( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const {
		postsPerPage,
		postsPerRow,
		postLayout,
		mediaPosition,
		imageShape,
		showThumbnail,
		showCategory,
		showDate,
		showExcerpt,
		showAuthor,
		showAvatar,
		excerptLength,
		showReadMore,
		readMoreLabel,
		typeScale,
		imageScale,
		colGap,
		minHeight,
		categories,
		tags,
		categoryExclusions,
		tagExclusions,
		postType,
		imageSize,
		imageAsLink,
	} = attributes;

	const [ previewLat, setPreviewLat ] = useState( DEFAULT_LAT );
	const [ previewLng, setPreviewLng ] = useState( DEFAULT_LNG );

	const hasNewspack = useSelect( ( select ) => {
		return !! select( 'core/blocks' ).getBlockType( 'newspack-blocks/homepage-articles' );
	}, [] );

	const categoryList = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'category', {
			per_page: 100,
			hide_empty: true,
		} );
	}, [] );

	const tagList = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag', {
			per_page: 100,
			hide_empty: true,
		} );
	}, [] );

	const enabledPostTypes = useSelect( ( select ) => {
		const types = select( 'core' ).getPostTypes( { per_page: -1 } );
		if ( ! types ) {
			return [];
		}
		const jeoTypes = globalThis.jeo_settings?.enabled_post_types || [ 'post' ];
		return types.filter(
			( t ) => jeoTypes.includes( t.slug ) && t.rest_base
		);
	}, [] );

	const imageSizeOptions = useSelect( ( select ) => {
		return ( select( 'core/block-editor' ).getSettings().imageSizes || [] ).map(
			( s ) => ( { label: s.name, value: s.slug } )
		);
	}, [] );

	const categoryOptions = [
		{ label: __( '— None —', 'jeo' ), value: '' },
		...( categoryList || [] ).map( ( c ) => ( {
			label: c.name,
			value: String( c.id ),
		} ) ),
	];

	const tagOptions = [
		{ label: __( '— None —', 'jeo' ), value: '' },
		...( tagList || [] ).map( ( t ) => ( {
			label: t.name,
			value: String( t.id ),
		} ) ),
	];

	const postTypeOptions = [
		{ label: __( 'All geo-enabled types', 'jeo' ), value: '' },
		...enabledPostTypes.map( ( t ) => ( {
			label: t.labels?.name || t.slug,
			value: t.slug,
		} ) ),
	];

	const parseMultiSelect = ( val ) => {
		if ( ! val || ! val.length ) {
			return '';
		}
		return val.map( ( v ) => String( v ) ).join( ',' );
	};

	const selectedCategories = categories
		? categories.split( ',' ).filter( Boolean )
		: [];
	const selectedTags = tags
		? tags.split( ',' ).filter( Boolean )
		: [];
	const selectedCatExcl = categoryExclusions
		? categoryExclusions.split( ',' ).filter( Boolean )
		: [];
	const selectedTagExcl = tagExclusions
		? tagExclusions.split( ',' ).filter( Boolean )
		: [];

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody
					title={ __( 'Location Preview', 'jeo' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Latitude', 'jeo' ) }
						type="number"
						step="any"
						min={ -90 }
						max={ 90 }
						value={ previewLat }
						onChange={ ( val ) => setPreviewLat( Number.parseFloat( val ) || 0 ) }
					/>
					<TextControl
						label={ __( 'Longitude', 'jeo' ) }
						type="number"
						step="any"
						min={ -180 }
						max={ 180 }
						value={ previewLng }
						onChange={ ( val ) => setPreviewLng( Number.parseFloat( val ) || 0 ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Post Card', 'jeo' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Layout', 'jeo' ) }
						value={ postLayout }
						options={ [
							{ label: __( 'Grid', 'jeo' ), value: 'grid' },
							{ label: __( 'List', 'jeo' ), value: 'list' },
						] }
						onChange={ ( val ) => setAttributes( { postLayout: val } ) }
					/>
					{ postLayout === 'grid' && (
						<RangeControl
							label={ __( 'Columns', 'jeo' ) }
							value={ postsPerRow }
							onChange={ ( val ) => setAttributes( { postsPerRow: val } ) }
							min={ 1 }
							max={ 6 }
						/>
					) }
					{ hasNewspack && (
						<>
							<SelectControl
								label={ __( 'Media position', 'jeo' ) }
								value={ mediaPosition }
								options={ [
									{ label: __( 'Top', 'jeo' ), value: 'top' },
									{ label: __( 'Left', 'jeo' ), value: 'left' },
									{ label: __( 'Right', 'jeo' ), value: 'right' },
									{ label: __( 'Behind', 'jeo' ), value: 'behind' },
								] }
								onChange={ ( val ) => setAttributes( { mediaPosition: val } ) }
							/>
							<SelectControl
								label={ __( 'Image shape', 'jeo' ) }
								value={ imageShape }
								options={ [
									{ label: __( 'Landscape', 'jeo' ), value: 'landscape' },
									{ label: __( 'Portrait', 'jeo' ), value: 'portrait' },
									{ label: __( 'Square', 'jeo' ), value: 'square' },
									{ label: __( 'Uncropped', 'jeo' ), value: 'uncropped' },
								] }
								onChange={ ( val ) => setAttributes( { imageShape: val } ) }
							/>
						</>
					) }
					{ ! hasNewspack && (
						<>
							<SelectControl
								label={ __( 'Image size', 'jeo' ) }
								value={ imageSize }
								options={ imageSizeOptions }
								onChange={ ( val ) => setAttributes( { imageSize: val } ) }
							/>
							<ToggleControl
								label={ __( 'Link featured image', 'jeo' ) }
								checked={ imageAsLink }
								onChange={ ( val ) => setAttributes( { imageAsLink: val } ) }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Query Settings', 'jeo' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Posts per page', 'jeo' ) }
						value={ postsPerPage }
						onChange={ ( val ) => setAttributes( { postsPerPage: val } ) }
						min={ 1 }
						max={ 36 }
					/>
					{ enabledPostTypes.length > 1 && (
						<SelectControl
							label={ __( 'Post type', 'jeo' ) }
							value={ postType || '' }
							options={ postTypeOptions }
							onChange={ ( val ) => setAttributes( { postType: val } ) }
						/>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Filters', 'jeo' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Categories', 'jeo' ) }
						multiple
						value={ selectedCategories }
						options={ categoryOptions }
						onChange={ ( val ) => setAttributes( { categories: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Tags', 'jeo' ) }
						multiple
						value={ selectedTags }
						options={ tagOptions }
						onChange={ ( val ) => setAttributes( { tags: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Exclude categories', 'jeo' ) }
						multiple
						value={ selectedCatExcl }
						options={ categoryOptions }
						onChange={ ( val ) => setAttributes( { categoryExclusions: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Exclude tags', 'jeo' ) }
						multiple
						value={ selectedTagExcl }
						options={ tagOptions }
						onChange={ ( val ) => setAttributes( { tagExclusions: parseMultiSelect( val ) } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Display', 'jeo' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Show featured image', 'jeo' ) }
						checked={ showThumbnail }
						onChange={ ( val ) => setAttributes( { showThumbnail: val } ) }
					/>
					{ hasNewspack && (
						<ToggleControl
							label={ __( 'Show category', 'jeo' ) }
							checked={ showCategory }
							onChange={ ( val ) => setAttributes( { showCategory: val } ) }
						/>
					) }
					<ToggleControl
						label={ __( 'Show date', 'jeo' ) }
						checked={ showDate }
						onChange={ ( val ) => setAttributes( { showDate: val } ) }
					/>
					<ToggleControl
						label={ __( 'Show excerpt', 'jeo' ) }
						checked={ showExcerpt }
						onChange={ ( val ) => setAttributes( { showExcerpt: val } ) }
					/>
					{ showExcerpt && (
						<RangeControl
							label={ __( 'Excerpt length', 'jeo' ) }
							value={ excerptLength }
							onChange={ ( val ) => setAttributes( { excerptLength: val } ) }
							min={ 5 }
							max={ 200 }
						/>
					) }
					<ToggleControl
						label={ __( 'Show author', 'jeo' ) }
						checked={ showAuthor }
						onChange={ ( val ) => setAttributes( { showAuthor: val } ) }
					/>
					{ hasNewspack && showAuthor && (
						<ToggleControl
							label={ __( 'Show avatar', 'jeo' ) }
							checked={ showAvatar }
							onChange={ ( val ) => setAttributes( { showAvatar: val } ) }
						/>
					) }
					{ hasNewspack && (
						<>
							<ToggleControl
								label={ __( 'Show read more link', 'jeo' ) }
								checked={ showReadMore }
								onChange={ ( val ) => setAttributes( { showReadMore: val } ) }
							/>
							{ showReadMore && (
								<TextControl
									label={ __( 'Read more label', 'jeo' ) }
									type="text"
									value={ readMoreLabel }
									placeholder={ __( 'Read more', 'jeo' ) }
									onChange={ ( val ) => setAttributes( { readMoreLabel: val } ) }
								/>
							) }
						</>
					) }
				</PanelBody>

				{ hasNewspack && (
					<PanelBody
						title={ __( 'Typography & Spacing', 'jeo' ) }
						initialOpen={ false }
					>
						<RangeControl
							label={ __( 'Type scale', 'jeo' ) }
							value={ typeScale }
							onChange={ ( val ) => setAttributes( { typeScale: val } ) }
							min={ 1 }
							max={ 10 }
						/>
						<RangeControl
							label={ __( 'Image scale', 'jeo' ) }
							value={ imageScale }
							onChange={ ( val ) => setAttributes( { imageScale: val } ) }
							min={ 1 }
							max={ 4 }
						/>
						<RangeControl
							label={ __( 'Column gap', 'jeo' ) }
							value={ colGap }
							onChange={ ( val ) => setAttributes( { colGap: val } ) }
							min={ 1 }
							max={ 3 }
						/>
						<RangeControl
							label={ __( 'Min height (vh)', 'jeo' ) }
							value={ minHeight }
							onChange={ ( val ) => setAttributes( { minHeight: val } ) }
							min={ 0 }
							max={ 100 }
						/>
					</PanelBody>
				) }
			</InspectorControls>

			<ServerSideRender
				block="jeo/stories-near-you"
				attributes={ {
					...attributes,
					lat: previewLat,
					lng: previewLng,
				} }
			/>
		</div>
	);
}
