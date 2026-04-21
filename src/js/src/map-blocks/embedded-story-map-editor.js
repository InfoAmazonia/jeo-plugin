import { useBlockProps } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import JeoAutosuggest from './jeo-autosuggest';

function EmbeddedStorymapEditor ({ attributes, loadedStory, setAttributes }) {
	const blockProps = useBlockProps();
	const instanceId = useId();
	const inputId = `jeo-storymap-autosuggest-${ instanceId }`

	return (
		<div { ...blockProps }>
			<label htmlFor={ inputId }>
				{ __( 'Insert a story map from the library', 'jeo' ) + ':' }
			</label>
			<JeoAutosuggest
				inputProps={ {
					id: inputId,
					placeholder: loadedStory ? loadedStory.title.raw : __( 'Type a story name', 'jeo' ),
				} }
				postType="storymap"
				onSuggestionSelected={ ( e, { suggestion } ) => {
					setAttributes({ ...attributes, storyID: suggestion.id })
				} }
			/>
		</div>
	);
}

const applyWithSelect = withSelect( ( select, { attributes } ) => ( {
	loadedStory: attributes.storyID && select( 'core' ).getEntityRecord( 'postType', 'storymap', attributes.storyID ),
} ) );

export default compose( applyWithSelect )( EmbeddedStorymapEditor );
