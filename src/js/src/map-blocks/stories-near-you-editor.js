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
		radiusKm,
		orderBy,
		maxAgeDays,
		distanceWeight,
		dateWeight,
	} = attributes;

	const [ previewLat, setPreviewLat ] = useState(
		attributes.lat ? Number.parseFloat( attributes.lat ) : DEFAULT_LAT
	);
	const [ previewLng, setPreviewLng ] = useState(
		attributes.lng ? Number.parseFloat( attributes.lng ) : DEFAULT_LNG
	);

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
		{ label: __( '— None —', 'jeowp' ), value: '' },
		...( categoryList || [] ).map( ( c ) => ( {
			label: c.name,
			value: String( c.id ),
		} ) ),
	];

	const tagOptions = [
		{ label: __( '— None —', 'jeowp' ), value: '' },
		...( tagList || [] ).map( ( t ) => ( {
			label: t.name,
			value: String( t.id ),
		} ) ),
	];

	const postTypeOptions = [
		{ label: __( 'All geo-enabled types', 'jeowp' ), value: '' },
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
					title={ __( 'Location Preview', 'jeowp' ) }
					initialOpen={ true }
				>
					<TextControl
						label={ __( 'Latitude', 'jeowp' ) }
						type="number"
						step="any"
						min={ -90 }
						max={ 90 }
						value={ previewLat }
						onChange={ ( val ) => {
							const lat = Number.parseFloat( val ) || 0;
							setPreviewLat( lat );
							setAttributes( { lat } );
						} }
					/>
					<TextControl
						label={ __( 'Longitude', 'jeowp' ) }
						type="number"
						step="any"
						min={ -180 }
						max={ 180 }
						value={ previewLng }
						onChange={ ( val ) => {
							const lng = Number.parseFloat( val ) || 0;
							setPreviewLng( lng );
							setAttributes( { lng } );
						} }
					/>
					<RangeControl
						label={ __( 'Maximum radius (km)', 'jeowp' ) }
						value={ radiusKm || 100 }
						min={ 1 }
						max={ 2000 }
						onChange={ ( val ) => setAttributes( { radiusKm: val } ) }
					/>
					<SelectControl
						label={ __( 'Order by', 'jeowp' ) }
						value={ orderBy || 'recent' }
						options={ [
							{ label: __( 'Most recent nearby', 'jeowp' ), value: 'recent' },
							{ label: __( 'Nearest first', 'jeowp' ), value: 'nearest' },
							{ label: __( 'Relevance (distance + date)', 'jeowp' ), value: 'relevance' },
						] }
						onChange={ ( val ) => setAttributes( { orderBy: val } ) }
					/>
					<RangeControl
						label={ __( 'Max age (days, 0 = no limit)', 'jeowp' ) }
						value={ maxAgeDays || 0 }
						onChange={ ( val ) => setAttributes( { maxAgeDays: val } ) }
						min={ 0 }
						max={ 3650 }
					/>
					{ orderBy === 'relevance' && (
						<>
							<RangeControl
								label={ __( 'Distance weight', 'jeowp' ) }
								value={ distanceWeight || 1 }
								onChange={ ( val ) => setAttributes( { distanceWeight: val } ) }
								min={ 0 }
								max={ 10 }
								step={ 0.1 }
							/>
							<RangeControl
								label={ __( 'Date weight', 'jeowp' ) }
								value={ dateWeight || 1 }
								onChange={ ( val ) => setAttributes( { dateWeight: val } ) }
								min={ 0 }
								max={ 10 }
								step={ 0.1 }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Post Card', 'jeowp' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Layout', 'jeowp' ) }
						value={ postLayout }
						options={ [
							{ label: __( 'Grid', 'jeowp' ), value: 'grid' },
							{ label: __( 'List', 'jeowp' ), value: 'list' },
						] }
						onChange={ ( val ) => setAttributes( { postLayout: val } ) }
					/>
					{ postLayout === 'grid' && (
						<RangeControl
							label={ __( 'Columns', 'jeowp' ) }
							value={ postsPerRow }
							onChange={ ( val ) => setAttributes( { postsPerRow: val } ) }
							min={ 1 }
							max={ 6 }
						/>
					) }
					{ hasNewspack && (
						<>
							<SelectControl
								label={ __( 'Media position', 'jeowp' ) }
								value={ mediaPosition }
								options={ [
									{ label: __( 'Top', 'jeowp' ), value: 'top' },
									{ label: __( 'Left', 'jeowp' ), value: 'left' },
									{ label: __( 'Right', 'jeowp' ), value: 'right' },
									{ label: __( 'Behind', 'jeowp' ), value: 'behind' },
								] }
								onChange={ ( val ) => setAttributes( { mediaPosition: val } ) }
							/>
							<SelectControl
								label={ __( 'Image shape', 'jeowp' ) }
								value={ imageShape }
								options={ [
									{ label: __( 'Landscape', 'jeowp' ), value: 'landscape' },
									{ label: __( 'Portrait', 'jeowp' ), value: 'portrait' },
									{ label: __( 'Square', 'jeowp' ), value: 'square' },
									{ label: __( 'Uncropped', 'jeowp' ), value: 'uncropped' },
								] }
								onChange={ ( val ) => setAttributes( { imageShape: val } ) }
							/>
						</>
					) }
					{ ! hasNewspack && (
						<>
							<SelectControl
								label={ __( 'Image size', 'jeowp' ) }
								value={ imageSize }
								options={ imageSizeOptions }
								onChange={ ( val ) => setAttributes( { imageSize: val } ) }
							/>
							<ToggleControl
								label={ __( 'Link featured image', 'jeowp' ) }
								checked={ imageAsLink }
								onChange={ ( val ) => setAttributes( { imageAsLink: val } ) }
							/>
						</>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Query Settings', 'jeowp' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Posts per page', 'jeowp' ) }
						value={ postsPerPage }
						onChange={ ( val ) => setAttributes( { postsPerPage: val } ) }
						min={ 1 }
						max={ 36 }
					/>
					{ enabledPostTypes.length > 1 && (
						<SelectControl
							label={ __( 'Post type', 'jeowp' ) }
							value={ postType || '' }
							options={ postTypeOptions }
							onChange={ ( val ) => setAttributes( { postType: val } ) }
						/>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Filters', 'jeowp' ) }
					initialOpen={ false }
				>
					<SelectControl
						label={ __( 'Categories', 'jeowp' ) }
						multiple
						value={ selectedCategories }
						options={ categoryOptions }
						onChange={ ( val ) => setAttributes( { categories: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Tags', 'jeowp' ) }
						multiple
						value={ selectedTags }
						options={ tagOptions }
						onChange={ ( val ) => setAttributes( { tags: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Exclude categories', 'jeowp' ) }
						multiple
						value={ selectedCatExcl }
						options={ categoryOptions }
						onChange={ ( val ) => setAttributes( { categoryExclusions: parseMultiSelect( val ) } ) }
					/>
					<SelectControl
						label={ __( 'Exclude tags', 'jeowp' ) }
						multiple
						value={ selectedTagExcl }
						options={ tagOptions }
						onChange={ ( val ) => setAttributes( { tagExclusions: parseMultiSelect( val ) } ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Display', 'jeowp' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Show featured image', 'jeowp' ) }
						checked={ showThumbnail }
						onChange={ ( val ) => setAttributes( { showThumbnail: val } ) }
					/>
					{ hasNewspack && (
						<ToggleControl
							label={ __( 'Show category', 'jeowp' ) }
							checked={ showCategory }
							onChange={ ( val ) => setAttributes( { showCategory: val } ) }
						/>
					) }
					<ToggleControl
						label={ __( 'Show date', 'jeowp' ) }
						checked={ showDate }
						onChange={ ( val ) => setAttributes( { showDate: val } ) }
					/>
					<ToggleControl
						label={ __( 'Show excerpt', 'jeowp' ) }
						checked={ showExcerpt }
						onChange={ ( val ) => setAttributes( { showExcerpt: val } ) }
					/>
					{ showExcerpt && (
						<RangeControl
							label={ __( 'Excerpt length', 'jeowp' ) }
							value={ excerptLength }
							onChange={ ( val ) => setAttributes( { excerptLength: val } ) }
							min={ 5 }
							max={ 200 }
						/>
					) }
					<ToggleControl
						label={ __( 'Show author', 'jeowp' ) }
						checked={ showAuthor }
						onChange={ ( val ) => setAttributes( { showAuthor: val } ) }
					/>
					{ hasNewspack && showAuthor && (
						<ToggleControl
							label={ __( 'Show avatar', 'jeowp' ) }
							checked={ showAvatar }
							onChange={ ( val ) => setAttributes( { showAvatar: val } ) }
						/>
					) }
					{ hasNewspack && (
						<>
							<ToggleControl
								label={ __( 'Show read more link', 'jeowp' ) }
								checked={ showReadMore }
								onChange={ ( val ) => setAttributes( { showReadMore: val } ) }
							/>
							{ showReadMore && (
								<TextControl
									label={ __( 'Read more label', 'jeowp' ) }
									type="text"
									value={ readMoreLabel }
									placeholder={ __( 'Read more', 'jeowp' ) }
									onChange={ ( val ) => setAttributes( { readMoreLabel: val } ) }
								/>
							) }
						</>
					) }
				</PanelBody>

				{ hasNewspack && (
					<PanelBody
						title={ __( 'Typography & Spacing', 'jeowp' ) }
						initialOpen={ false }
					>
						<RangeControl
							label={ __( 'Type scale', 'jeowp' ) }
							value={ typeScale }
							onChange={ ( val ) => setAttributes( { typeScale: val } ) }
							min={ 1 }
							max={ 10 }
						/>
						<RangeControl
							label={ __( 'Image scale', 'jeowp' ) }
							value={ imageScale }
							onChange={ ( val ) => setAttributes( { imageScale: val } ) }
							min={ 1 }
							max={ 4 }
						/>
						<RangeControl
							label={ __( 'Column gap', 'jeowp' ) }
							value={ colGap }
							onChange={ ( val ) => setAttributes( { colGap: val } ) }
							min={ 1 }
							max={ 3 }
						/>
						<RangeControl
							label={ __( 'Min height (vh)', 'jeowp' ) }
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
