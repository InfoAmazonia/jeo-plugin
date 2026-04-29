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
		category,
		tag,
		showThumbnail,
		showCategory,
		showDate,
		showExcerpt,
	} = attributes;

	const [ previewLat, setPreviewLat ] = useState( DEFAULT_LAT );
	const [ previewLng, setPreviewLng ] = useState( DEFAULT_LNG );

	const categories = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'category', {
			per_page: 100,
			hide_empty: true,
		} );
	}, [] );

	const tags = useSelect( ( select ) => {
		return select( 'core' ).getEntityRecords( 'taxonomy', 'post_tag', {
			per_page: 100,
			hide_empty: true,
		} );
	}, [] );

	const categoryOptions = [
		{ label: __( '— None —', 'jeo' ), value: 0 },
		...( categories || [] ).map( ( c ) => ( {
			label: c.name,
			value: c.id,
		} ) ),
	];

	const tagOptions = [
		{ label: __( '— None —', 'jeo' ), value: 0 },
		...( tags || [] ).map( ( t ) => ( {
			label: t.name,
			value: t.id,
		} ) ),
	];

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
					<TextControl
						label={ __( 'Longitude', 'jeo' ) }
						type="number"
						step="any"
						value={ previewLng }
						onChange={ ( val ) => setPreviewLng( Number.parseFloat( val ) || 0 ) }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Query Settings', 'jeo' ) }
					initialOpen={ true }
				>
					<RangeControl
						label={ __( 'Posts per page', 'jeo' ) }
						value={ postsPerPage }
						onChange={ ( val ) =>
							setAttributes( { postsPerPage: val } )
						}
						min={ 1 }
						max={ 50 }
					/>
					<RangeControl
						label={ __( 'Posts per row', 'jeo' ) }
						value={ postsPerRow }
						onChange={ ( val ) =>
							setAttributes( { postsPerRow: val } )
						}
						min={ 1 }
						max={ 6 }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Filters', 'jeo' ) }
					initialOpen={ true }
				>
					<SelectControl
						label={ __( 'Category', 'jeo' ) }
						value={ category || 0 }
						options={ categoryOptions }
						onChange={ ( val ) =>
							setAttributes( {
								category: Number.parseInt( val, 10 ) || 0,
							} )
						}
					/>
					<SelectControl
						label={ __( 'Tag', 'jeo' ) }
						value={ tag || 0 }
						options={ tagOptions }
						onChange={ ( val ) =>
							setAttributes( {
								tag: Number.parseInt( val, 10 ) || 0,
							} )
						}
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Display', 'jeo' ) }
					initialOpen={ true }
				>
					<ToggleControl
						label={ __( 'Show featured image', 'jeo' ) }
						checked={ showThumbnail }
						onChange={ ( val ) =>
							setAttributes( { showThumbnail: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Show category', 'jeo' ) }
						checked={ showCategory }
						onChange={ ( val ) =>
							setAttributes( { showCategory: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Show date', 'jeo' ) }
						checked={ showDate }
						onChange={ ( val ) =>
							setAttributes( { showDate: val } )
						}
					/>
					<ToggleControl
						label={ __( 'Show excerpt', 'jeo' ) }
						checked={ showExcerpt }
						onChange={ ( val ) =>
							setAttributes( { showExcerpt: val } )
						}
					/>
				</PanelBody>
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
