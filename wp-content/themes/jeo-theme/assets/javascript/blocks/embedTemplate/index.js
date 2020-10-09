import { RichText, InnerBlocks } from "@wordpress/block-editor";

import { __ } from "@wordpress/i18n";
import { Button, SelectControl, TextControl } from "@wordpress/components";
//const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/embed-template", {
	title: "Embed Template",
	icon: "format-video",
	category: "common",
	supports: {
		align: false,
	},
	attributes: {
		
	},

	edit: (props) => {
		const {
			className,
			isSelected,
			attributes: {
			},
			setAttributes,
		} = props;
		
		const TEMPLATE =  [ 
				[ 'core/paragraph', { placeholder: 'Embed title' }],
				[ 'core/paragraph', { placeholder: 'Author' } ],
				[ 'core/embed' ],
		];
		  
		return (
			<>
				<div className="embed-item-template" key="container">
					<div>
						<InnerBlocks
							allowedBlocks={[ 'core/embed', 'core/paragraph' ]}
							template={TEMPLATE}
							templateLock="all"
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
			<>	
				<div className="embed-template-block">
					<InnerBlocks.Content/>
				</div>
			</>
		);
	},
});

// [mc4wp_form id="65"]
