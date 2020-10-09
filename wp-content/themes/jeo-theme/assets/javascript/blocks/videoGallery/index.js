import { RichText, InnerBlocks } from "@wordpress/block-editor";

import { __ } from "@wordpress/i18n";
import { Button, SelectControl, TextControl } from "@wordpress/components";
//const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/custom-video-gallery", {
	title: "Video Gallery",
	icon: "format-video",
	category: "common",
	supports: {
		align: true,
	},
	attributes: {
		title: {
			type: "string",
		},
	},

	edit: (props) => {
		const {
			className,
			isSelected,
			attributes: {
			  title,
			},
			setAttributes,
		} = props;
		
		const TEMPLATE =  [['jeo-theme/embed-template']];
		return (
			<>
				<div className="video-gallery-wrapper" key="container">
					<div>
						<RichText
							tagName="h2"
							className="gallery-title"
							value={ title }
							onChange={ ( title ) => {
								setAttributes( { title } )
							} }
							placeholder={ __( 'Type a title' ) } 
						/>
						<InnerBlocks
							allowedBlocks={[ 'jeo-theme/embed-template' ]}
							template={TEMPLATE}
						/>

					</div>
				</div>
			</>
		);
	},

	save: (props) => {
		const {
			className,
			isSelected,
			attributes: {
			  title,
			},
			setAttributes,
		  } = props;
	  

		return (
			<>	<div className="video-gallery-block">
					<RichText.Content tagName="h2" value={ title } />
					<div className="video-gallery-wrapper" key="container">
						<InnerBlocks.Content/>
					</div>
				</div>
			</>
		);
	},
});

// [mc4wp_form id="65"]
