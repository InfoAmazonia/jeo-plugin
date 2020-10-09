import { RichText, InnerBlocks } from "@wordpress/block-editor";

import { __ } from "@wordpress/i18n";
import { Button, SelectControl, TextControl } from "@wordpress/components";
//const {  } = wp.editor;

wp.blocks.registerBlockType("jeo-theme/team-member", {
	title: "Team member",
	icon: "buddicons-buddypress-logo",
	category: "common",
	supports: {
		align: false,
	},
	attributes: {
		
	},

	edit: (props) => {
		const TEMPLATE =  [ 
				[ 'core/image' ],
				[ 'core/column', {}, [
					[ 'core/paragraph', { placeholder: 'Name' } ],
					[ 'core/paragraph', { placeholder: 'Assignment' } ],
				]]
		];
		  
		return (
			<>
				<div className="team-member-item">
					<div>
						<InnerBlocks
							allowedBlocks={[ 'core/image', 'core/paragraph' ]}
							template={TEMPLATE}
						/>
					</div>
				</div>
			</>
		);
	},

	save: (props) => {
		return (
			<>	
				<div className="team-member-item">
					<InnerBlocks.Content/>
				</div>
			</>
		);
	},
});

// [mc4wp_form id="65"]
